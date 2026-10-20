import type { Citation } from './chat.models';

export interface SourceDocument {
  document_id: string;
  document_name: string;
  chunkCount: number;
}

export function groupSourceDocuments(sources: Citation[]): SourceDocument[] {
  const documents = new Map<string, { name: string; chunks: Set<string> }>();
  for (const source of sources) {
    let document = documents.get(source.document_id);
    if (!document) {
      document = { name: source.document_name, chunks: new Set<string>() };
      documents.set(source.document_id, document);
    }
    document.chunks.add(source.chunk_Id);
  }
  return Array.from(documents, ([document_id, document]) => ({
    document_id,
    document_name: document.name,
    chunkCount: document.chunks.size,
  })).sort((a, b) => b.chunkCount - a.chunkCount);
}
