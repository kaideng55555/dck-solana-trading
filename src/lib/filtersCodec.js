/**
 * Encode filters object to base64url string
 * @param {any} obj - Filters object
 * @returns {string}
 */
export function encodeFiltersParam(obj) {
  try {
    const json = JSON.stringify(obj || {});
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return b64;
  } catch {
    return '';
  }
}

/**
 * Decode base64url string to filters object
 * @param {string} s - Base64url encoded string
 * @returns {any | null}
 */
export function decodeFiltersParam(s) {
  if (!s) return null;
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
