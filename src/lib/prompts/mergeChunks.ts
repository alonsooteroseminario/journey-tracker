import type { PromptChunk } from '@/types';

const SEPARATOR = '\n\n';

export function mergeChunks(chunks: PromptChunk[]): string {
  return chunks.map((c) => c.content).join(SEPARATOR);
}
