import type { Task } from '@/types';

export function taskToMarkdown(task: Task): string {
  const lines: string[] = [`## ${task.title}`];

  if (task.description) {
    lines.push('');
    lines.push(task.description);
  }

  const substeps = task.substeps ?? [];
  if (substeps.length > 0) {
    lines.push('');
    const sorted = [...substeps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const substep of sorted) {
      const checkbox = substep.status === 'completed' ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} ${substep.title}`);
      if (substep.notes) {
        lines.push(`  ↳ ${substep.notes}`);
      }
    }
  }

  return lines.join('\n');
}
