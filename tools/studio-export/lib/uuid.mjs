import { createHash } from 'node:crypto';

/* The well-known URL namespace from RFC 4122, Appendix C. */
export const UUID_V5_URL_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

function parse(uuid) {
  const hex = uuid.replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/i.test(hex)) throw new TypeError(`Invalid UUID: ${uuid}`);
  return Buffer.from(hex, 'hex');
}

export function uuidv5(name, namespace = UUID_V5_URL_NAMESPACE) {
  const bytes = createHash('sha1')
    .update(parse(namespace))
    .update(Buffer.from(String(name), 'utf8'))
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

/* Stable slide identity: the same anchor in the same webinar always maps to the
   same UUID, so a re-export never renames a slide. */
export function slideId(slug, anchor) {
  return uuidv5(`https://msfgmortgage.com/webinars/${slug}#${anchor}`);
}
