export const ZOOM_LEVELS = Object.freeze([1, 1.25, 1.5, 2]);
export const DEFAULT_STATE = Object.freeze({ pageId: 'le-1', selectedHotspotId: null, zoom: 1 });

export function reduceViewerState(state, action, validPageIds) {
  if (action.type === 'select-page') {
    if (!validPageIds.has(action.pageId)) return state;
    return { ...state, pageId: action.pageId, selectedHotspotId: null };
  }
  if (action.type === 'select-hotspot') return { ...state, selectedHotspotId: action.hotspotId };
  if (action.type === 'clear-selection') return { ...state, selectedHotspotId: null };
  if (action.type === 'fit') return { ...state, zoom: 1 };
  if (action.type === 'zoom-in' || action.type === 'zoom-out') {
    const current = ZOOM_LEVELS.indexOf(state.zoom);
    const delta = action.type === 'zoom-in' ? 1 : -1;
    const index = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, current + delta));
    return { ...state, zoom: ZOOM_LEVELS[index] };
  }
  return state;
}
