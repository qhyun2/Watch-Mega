export function watchingToString(count: number): string {
  return count + ` user${count === 1 ? "" : "s"} currently watching`;
}
