import type { PromptChunk } from '@/types';

const SEPARATOR = '\n\n';

export function mergeChunks(chunks: PromptChunk[]): string {
  return chunks
    .map((c) => (c.content ? `# ${c.title}\n${c.content}` : `# ${c.title}`))
    .join(SEPARATOR);
}
