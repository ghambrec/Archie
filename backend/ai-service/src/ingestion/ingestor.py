from __future__ import annotations

import logging
import asyncpg
import urllib3.exceptions
from minio.error import MinioException
from pydantic_ai import UnexpectedModelBehavior

from uuid import UUID

from src.storage.minio import MinioDocumentStore
from src.chunking.chunker import chunk_text
from src.embedding.embedder import embed
from src.chunks_storage import ai_chunks
from src.ingestion import status
from src.ingestion.language import detect_language
from src.generation.analyzer import analyze_doc
from src.generation.analyzer import DocumentInfos
from src.ingestion.extraction import extract_text

logger = logging.getLogger(__name__)


async def get_object_key(pool: asyncpg.Pool, doc_id: UUID) -> str | None:
    select = "select object_key from documents where id = $1 and deleted_at is null"
    return await pool.fetchval(select, doc_id)


async def get_tags(pool: asyncpg.Pool) -> list[dict]:
    select = """
                select t.id, t.name, t.label, t.description, t.facet, p.name as parent_name
                from tags t
                left join tags p
                    on p.id = t.parent_id
                order by t.facet, t.name
            """
    rows = await pool.fetch(select)
    return [dict(row) for row in rows]


async def write_llm_data(pool: asyncpg.Pool, doc_id: UUID, data: DocumentInfos, existing_tags: list[dict]) -> None:
    # SUMMARY
    update_summary = "update ai_documents set ai_summary = $2 where id = $1"
    await pool.execute(update_summary, doc_id, data.summary)

    # TAGS
    await pool.execute("delete from ai_document_tags where ai_document_id = $1", doc_id)
    lookup_map = {tag["name"].strip().lower(): tag["id"] for tag in existing_tags}
    for ai_tag in data.tags:
        name = ai_tag.name.strip().lower()
        tag_id = lookup_map.get(name)

        if tag_id is None:
            # tag not exist, insert into proposed_ fields
            parent_id = lookup_map.get(ai_tag.parent.strip().lower()) if ai_tag.parent else None
            insert_proposed_tag = """
                                    insert into ai_document_tags (ai_document_id, proposed_name, proposed_facet, proposed_description, proposed_parent_id, confidence)
                                    values ($1, $2, $3, $4, $5, $6)
                                """
            await pool.execute(insert_proposed_tag, doc_id, ai_tag.name, ai_tag.facet, ai_tag.description, parent_id, ai_tag.confidence)
        else:
            # tag exist, write as normal tag
            insert_doc_tag = "insert into ai_document_tags (ai_document_id, ai_tag_id, confidence) values ($1, $2, $3)"
            await pool.execute(insert_doc_tag, doc_id, tag_id, ai_tag.confidence)


async def ingest_doc(
    pool: asyncpg.Pool,
    minio: MinioDocumentStore,
    doc_id: UUID
) -> None:
    try:
        await status.mark_as_processing(pool, doc_id)

        obj_key = await get_object_key(pool, doc_id)
        if obj_key is None:
            raise ValueError(f"no object key found for doc_id {doc_id}")

        doc_raw = await minio.GetDocumentBytes(obj_key)
        doc_text = extract_text(doc_raw)

        language = detect_language(doc_text)

        tags = await get_tags(pool)
        doc_infos = await analyze_doc(doc_text, language, tags)
        await write_llm_data(pool, doc_id, doc_infos, tags)

        chunks = chunk_text(doc_text)
        results: list[dict] = []
        for index, content in enumerate(chunks):
            embedding = await embed(content)
            results.append({
                "chunk_index": index,
                "content": content,
                "embedding": embedding
            })
            logger.debug("chunk %s embedded (%s chars, %s dimensions)", index, len(content), len(embedding))

        await ai_chunks.save_chunks(pool, doc_id, results)
        await status.mark_as_finished(pool, doc_id, language)
        logger.info("ingestion finished for doc: %s", doc_id)

    except ValueError as e:
        logger.exception(str(e))
        await status.write_error(pool, doc_id, "not_found", str(e))

    except MinioException as e:
        logger.exception("error calling minio api for doc %s", doc_id)
        await status.write_error(pool, doc_id, "minio_error", str(e))

    except (urllib3.exceptions.MaxRetryError, urllib3.exceptions.NewConnectionError) as e:
        logger.exception("minio not reachable during ingest for doc %s", doc_id)
        await status.write_error(pool, doc_id, "minio_connection", str(e))

    except UnexpectedModelBehavior as e:
        logger.exception("llm output validation failed for doc %s", doc_id)
        await status.write_error(pool, doc_id, "llm_error", str(e))

    except Exception as e:
        logger.exception("unexpected error during ingest for doc: %s [%s]: %s", doc_id, type(e).__name__, str(e))
        await status.write_error(pool, doc_id, "unknown", str(e))
