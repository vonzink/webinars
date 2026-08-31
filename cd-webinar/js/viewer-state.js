export const ZOOM_LEVELS = Object.freeze([1, 1.25, 1.5, 2]);
export const DEFAULT_STATE = Object.freeze({
  pageId: 'le-1',
  selectedHotspotId: null,
  zoom: 1,
  magnifier: false,
  openBubbleIds: Object.freeze([]),
});

export function reduceViewerState(state, action, validPageIds) {
  if (action.type === 'select-page') {
    if (!validPageIds.has(action.pageId)) return state;
    return { ...state, pageId: action.pageId, selectedHotspotId: null, openBubbleIds: [] };
  }
  if (action.type === 'select-hotspot') {
    const openBubbleIds = [...state.openBubbleIds.filter(id => id !== action.hotspotId), action.hotspotId];
    return { ...state, selectedHotspotId: action.hotspotId, openBubbleIds };
  }
  if (action.type === 'close-bubble') {
    if (!state.openBubbleIds.includes(action.hotspotId)) return state;
    const openBubbleIds = state.openBubbleIds.filter(id => id !== action.hotspotId);
    const selectedHotspotId = state.selectedHotspotId === action.hotspotId
      ? (openBubbleIds[openBubbleIds.length - 1] ?? null)
      : state.selectedHotspotId;
    return { ...state, selectedHotspotId, openBubbleIds };
  }
  if (action.type === 'clear-selection') {
    if (!state.openBubbleIds.length && !state.selectedHotspotId) return state;
    const openBubbleIds = state.openBubbleIds.slice(0, -1);
    return { ...state, selectedHotspotId: openBubbleIds[openBubbleIds.length - 1] ?? null, openBubbleIds };
  }
  if (action.type === 'toggle-magnifier') return { ...state, magnifier: !state.magnifier };
  if (action.type === 'fit') return { ...state, zoom: 1 };
  if (action.type === 'zoom-in' || action.type === 'zoom-out') {
    const current = ZOOM_LEVELS.indexOf(state.zoom);
    const delta = action.type === 'zoom-in' ? 1 : -1;
    const index = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, current + delta));
    return { ...state, zoom: ZOOM_LEVELS[index] };
  }
  return state;
}
