/**
 * Make remote media paths safe for Windows checkouts.
 * Strips ?query/#hash and characters Windows rejects in filenames.
 */

const WIN_INVALID = /[<>:"|?*\u0000-\u001f]/g;

/** Strip query/hash and Windows-illegal characters from a relative media path. */
export function toSafeLocalMediaPath(input) {
  if (!input || typeof input !== 'string') return '';

  let path = input.trim();
  try {
    if (/^https?:\/\//i.test(path)) {
      path = new URL(path).pathname;
    }
  } catch {
    // keep raw
  }

  path = path.split('#')[0].split('?')[0];
  path = path.replace(/^\/+/, '');

  // Drop leftover encoded query fragments that sometimes leak into paths
  path = path.replace(/%3[fF].*$/, '');

  const parts = path.split('/').filter(Boolean).map((seg) => {
    const cleaned = seg.replace(WIN_INVALID, '').replace(/\.+$/g, '').trim();
    return cleaned;
  }).filter(Boolean);

  return parts.join('/');
}

/** True when a git path cannot be checked out on Windows. */
export function isWindowsInvalidPath(path) {
  if (!path) return false;
  if (/[<>:"|?*\u0000-\u001f]/.test(path)) return true;
  // Also catch query-string style leftovers
  if (path.includes('?') || path.includes('*')) return true;
  return false;
}
