export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Compare two objects and return an array of changed fields.
 * Only compares top-level fields listed in `fields`.
 */
export function diffFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  fields: string[]
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const field of fields) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }
  return diffs;
}

/**
 * Format diffs into a human-readable action string.
 */
export function formatDiffAction(
  entityType: string,
  entityName: string,
  diffs: FieldDiff[]
): string {
  if (diffs.length === 0) return `Updated ${entityType} "${entityName}"`;
  if (diffs.length === 1) {
    const d = diffs[0];
    return `Changed ${entityType} "${entityName}" ${d.field} from "${d.oldValue ?? '(empty)'}" to "${d.newValue}"`;
  }
  return `Updated ${diffs.length} fields on ${entityType} "${entityName}": ${diffs.map((d) => d.field).join(', ')}`;
}
