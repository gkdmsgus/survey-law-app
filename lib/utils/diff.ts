import { diffLines, type Change } from "diff";

export type DiffChange = Change;

export function computeArticleDiff(
  oldText: string,
  newText: string
): DiffChange[] {
  return diffLines(oldText, newText, { ignoreWhitespace: false });
}

export function hasDifference(changes: DiffChange[]): boolean {
  return changes.some((c) => c.added || c.removed);
}
