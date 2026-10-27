// Ignore taps and predominantly vertical gestures. Touch navigation stops at the ends.
export function gallerySwipeIndex(index: number, total: number, dx: number, dy: number) {
  if (total < 2 || Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.3) return index
  return Math.max(0, Math.min(total - 1, index + (dx < 0 ? 1 : -1)))
}
