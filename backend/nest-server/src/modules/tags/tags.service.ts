import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { Tag } from './entities/tag.entity';
import { TagResponseDto } from './dto/tag-response.dto';

interface TagRawRow {
  id: string;
  name: string;
  label: string;
  parentId: string | null;
  documentCount: string;
}

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly logger: Logger,
  ) {}

  async findAll(userId: string): Promise<TagResponseDto[]> {
    this.logger.log({ userId }, 'Listing tags visible to user');

    const rows = await this.tagsRepository.query<TagRawRow[]>(
      `
      WITH accessible_docs AS (
          SELECT
              DISTINCT d.id
          FROM documents AS d
          INNER JOIN document_groups AS dg
              ON dg.document_id = d.id
          INNER JOIN user_groups AS ug
              ON ug.group_id = dg.group_id
          INNER JOIN user_permission AS up
              ON up.user_id = ug.user_id
              AND up.group_id = ug.group_id
          INNER JOIN permissions AS p
              ON p.id = up.permission_id
          WHERE
              d.deleted_at IS NULL
              AND ug.user_id = $1
              AND p.perm_key = 'documents.read'
      ),
      matched_tags AS (
          SELECT DISTINCT t.*
          FROM tags AS t
          INNER JOIN document_tags AS dt
              ON dt.tag_id = t.id
          INNER JOIN accessible_docs AS ad
              ON ad.id = dt.document_id
      ),
      all_tags AS (
          SELECT * FROM matched_tags
          UNION
          SELECT
              pt.*
          FROM matched_tags AS mt
          INNER JOIN tags AS pt
              ON pt.id = mt.parent_id
      ),
      tag_counts AS (
          SELECT
              t.id AS tag_id,
              count(DISTINCT dt.document_id) AS document_count
          FROM all_tags AS t
          INNER JOIN tags AS x
              ON x.id = t.id OR x.parent_id = t.id
          INNER JOIN document_tags AS dt
              ON dt.tag_id = x.id
          INNER JOIN accessible_docs AS ad
              ON ad.id = dt.document_id
          GROUP BY t.id
      )
      SELECT
          t.id AS "id",
          t.name AS "name",
          t.label AS "label",
          t.parent_id AS "parentId",
          coalesce(tc.document_count, 0) AS "documentCount"
      FROM all_tags AS t
      LEFT JOIN tag_counts AS tc
          ON tc.tag_id = t.id
      ORDER BY t.name ASC
      `,
      [userId],
    );

    this.logger.log({ userId, count: rows.length }, 'Tags listed successfully');

    return rows.map((row) =>
      Object.assign(new TagResponseDto(), {
        id: row.id,
        name: row.name,
        label: row.label,
        parentId: row.parentId,
        documentCount: Number(row.documentCount),
      }),
    );
  }
}
