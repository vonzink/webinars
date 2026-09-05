export function localBuildAction({ direction, manual, revealed, total }) {
  if (!manual || total <= 0) return { type: 'slide', delta: direction };

  if (direction > 0 && revealed < total) {
    return { type: 'build', count: revealed + 1 };
  }
  if (direction < 0 && revealed > 0) {
    return { type: 'build', count: revealed - 1 };
  }
  return { type: 'slide', delta: direction };
}
