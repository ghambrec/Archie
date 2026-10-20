import type { Citation } from './chat.models';

export interface SourceDocument {
  document_id: string;
  document_name: string;
  chunkCount: number;
  medianSimilarity: number | null;
}

export function groupSourceDocuments(sources: Citation[]): SourceDocument[] {
  const documents = new Map<string, { name: string; chunks: Set<string>; scores: number[] }>();
  for (const source of sources) {
    let document = documents.get(source.document_id);
    if (!document) {
      document = { name: source.document_name, chunks: new Set<string>(), scores: [] };
      documents.set(source.document_id, document);
    }
    if (document.chunks.has(source.chunk_Id)) continue;
    document.chunks.add(source.chunk_Id);
    if (typeof source.similarity_score === 'number' && Number.isFinite(source.similarity_score)) {
      document.scores.push(source.similarity_score);
    }
  }
  return Array.from(documents, ([document_id, document]) => ({
    document_id,
    document_name: document.name,
    chunkCount: document.chunks.size,
    medianSimilarity: median(document.scores),
  })).sort((a, b) => b.chunkCount - a.chunkCount);
}

function median(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}
