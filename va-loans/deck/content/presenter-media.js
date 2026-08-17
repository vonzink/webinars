/* Presenter graphs — per-slide images shown from the presenter view.
   None supplied yet for the VA deck; add VA-specific charts here later
   (same shape: { id, slideId, title, src, alt }). */
const items = [];

export const PRESENTER_MEDIA = Object.freeze(items.map(item => Object.freeze(item)));
const byId = new Map(PRESENTER_MEDIA.map(item => [item.id, item]));
export const mediaForSlide = slideId => PRESENTER_MEDIA.filter(item => item.slideId === slideId);
export const mediaById = id => byId.get(id) || null;
