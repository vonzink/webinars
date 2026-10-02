export function filterWebinarCards(cards, selectedAccess) {
  let visibleCount = 0;

  for (const card of cards) {
    const isVisible = selectedAccess === "both" || card.dataset.access === selectedAccess;
    card.hidden = !isVisible;
    visibleCount += Number(isVisible);
  }

  return visibleCount;
}
