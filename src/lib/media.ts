/**
 * Blog cover resolution (same pattern as lifestylewijzer / expertcommunity):
 * - Cards / OG: featuredImage → heroImage → image → slug fallback
 * - Detail hero: heroImage → featuredImage → image → slug fallback
 * - Bare R2 URLs → …/tenants/mijntuinproducten/<file>
 */
import { fallbackImage } from '../data/fallback-images';

/** Matches R2 object prefix used in synced Payload media. */
export const TENANT_SLUG = 'mijntuinproducten';

export type BlogImageFields = {
  featuredImage?: string | null;
  heroImage?: string | null;
  image?: string | null;
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)(?:$|\?)/i;

/** Rewrite bare R2 object keys that 404 without the tenant prefix. */
export function repairTenantR2Url(
  url: string | undefined | null,
  tenantSlug: string = TENANT_SLUG,
): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const slug = tenantSlug.trim().replace(/^\/+|\/+$/g, '');
  if (!slug) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes(`/tenants/${slug}/`)) return trimmed;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const isR2Like =
      host.endsWith('.r2.dev') || host.includes('r2.cloudflarestorage.com');
    if (!isR2Like) return trimmed;

    const path = u.pathname.replace(/^\/+/, '');
    if (!path || path.includes('/')) return trimmed;
    u.pathname = `/tenants/${slug}/${path}`;
    return u.toString();
  } catch {
    return trimmed;
  }
}

/** Reject non-image / placeholder / site-root "images". */
export function isUsableMediaUrl(src?: string | null): boolean {
  const trimmed = src?.trim();
  if (!trimmed) return false;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const path = u.pathname.replace(/\/+$/, '') || '/';
      if (path === '/' || !path.includes('.')) {
        // Allow Payload/R2 media routes without classic extensions
        if (path.includes('/api/media/file/') || path.includes('/tenants/')) {
          return IMAGE_EXT.test(path) || Boolean(path.split('/').pop());
        }
        return false;
      }
      return IMAGE_EXT.test(path) || path.includes('/api/media/file/');
    } catch {
      return false;
    }
  }

  return IMAGE_EXT.test(trimmed) || trimmed.startsWith('/images/');
}

function firstUsable(...candidates: Array<string | null | undefined>): string {
  for (const c of candidates) {
    const repaired = repairTenantR2Url(c);
    if (repaired && isUsableMediaUrl(repaired)) return repaired;
  }
  return '';
}

/** Listing / card image (featured preferred). */
export function getBlogCardImage(data: BlogImageFields, slug = ''): string {
  return (
    firstUsable(data.featuredImage, data.heroImage, data.image) ||
    fallbackImage(slug || 'blog')
  );
}

/** Detail hero image (hero preferred). */
export function getBlogHeroImage(data: BlogImageFields, slug = ''): string {
  return (
    firstUsable(data.heroImage, data.featuredImage, data.image) ||
    fallbackImage(slug || 'blog')
  );
}

export function hasBlogCover(data: BlogImageFields): boolean {
  return Boolean(firstUsable(data.heroImage, data.featuredImage, data.image));
}
