// Curated, on-theme garden image pool used as a deterministic fallback for
// blog posts that have no featured image. Assignment is stable per-slug so a
// given post always renders the same image across renders.

export const FALLBACK_IMAGES: string[] = [
  '/images/blog/fallbacks/garden-01.jpg',
  '/images/blog/fallbacks/garden-02.jpg',
  '/images/blog/fallbacks/garden-03.jpg',
  '/images/blog/fallbacks/garden-04.jpg',
  '/images/blog/fallbacks/garden-06.jpg',
  '/images/blog/fallbacks/garden-07.jpg',
  '/images/blog/fallbacks/garden-08.png',
  '/images/blog/fallbacks/garden-09.png',
  '/images/blog/potgrond.jpg',
  '/images/blog/bestrating.png',
  '/images/wp-content/2025/03/sheep-4461377_1280.jpg',
  '/images/wp-content/2025/03/roof-4374705_1280.jpg',
  '/images/wp-content/2025/03/fence-1543108_1280.jpg',
  '/images/wp-content/2025/08/kelly-sikkema-cl0CBmInJ3A-unsplash-scaled.jpg',
  '/images/wp-content/2025/08/alin-gavriliuc-kByWTJ9Zy0w-unsplash.jpg',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function fallbackImage(slug: string): string {
  if (FALLBACK_IMAGES.length === 0) return '/images/blog/potgrond.jpg';
  return FALLBACK_IMAGES[hash(slug) % FALLBACK_IMAGES.length];
}
