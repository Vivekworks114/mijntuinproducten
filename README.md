# MijnTuinProducten.nl - Astro Frontend

Modern, responsive Astro.js frontend for mijntuinproducten.nl — a Dutch garden products review website.

## Tech Stack

- **Framework**: Astro 5.x (Static Site Generation)
- **Styling**: Scoped CSS with CSS Custom Properties
- **Fonts**: Concert One (headings) + Noto Sans (body)
- **Build**: Static output with trailing slashes

## Getting Started

```bash
npm install
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── components/      # Reusable Astro components
│   ├── Header.astro       # Navigation (desktop + mobile drawer)
│   ├── Footer.astro       # Site footer with columns
│   ├── Hero.astro         # Homepage hero section
│   ├── Categories.astro   # Category grid
│   ├── ProductCard.astro  # Product review card
│   ├── BlogCard.astro     # Blog post card
│   ├── BlogSection.astro  # Blog posts listing
│   ├── ReviewsSection.astro
│   ├── ToolsSection.astro
│   ├── PlantsSection.astro
│   ├── AboutSection.astro
│   ├── CTASection.astro
│   └── CategoryPage.astro # Reusable category page template
├── data/
│   └── navigation.ts     # Navigation data + footer data
├── layouts/
│   └── BaseLayout.astro   # Base HTML layout
├── pages/                 # File-based routing
│   ├── index.astro        # Homepage
│   ├── blog/              # Blog listing + detail pages
│   ├── tuincentrum/       # Garden center locations
│   ├── planten/           # Plants category
│   ├── decoratie/         # Decoration category
│   ├── gereedschap/       # Tools category
│   ├── overig/            # Other category
│   ├── planten-zaden/     # Plants & seeds
│   ├── tuingerei/         # Garden equipment
│   ├── verbouwing/        # Renovation category
│   └── sitemap/           # Sitemap page
└── styles/
    └── global.css         # Global styles + design tokens

public/images/             # All images stored locally
├── logo.png
├── hero/
├── products/
└── blog/
```

## Design Tokens

- **Primary**: `#19512B` (dark green)
- **Secondary**: `#2E6031`
- **Accent**: `#F8D098` (peach/gold)
- **Text**: `#181818`

## Pages (1066 total built)

- Homepage
- Blog listing + 194 blog post detail pages
- 8 category index pages (Tuincentrum, Planten, Decoratie, Gereedschap, Overig, Planten & zaden, Tuingerei, Verbouwing)
- Subcategory / product review detail pages
- Sitemap page

## Blog images

- Every blog post has a featured image. When the original WordPress featured image
  was unavailable, a deterministic on-theme garden image is assigned from
  `src/data/fallback-images.ts` so cards stay varied and never break.
- All images are stored locally under `public/images/` — no hotlinked
  `wp-content` URLs in the built output.

## Scripts

```bash
npm run build                      # Build site
python3 scripts/verify-links.py    # Verify 0 broken internal links in dist/
python3 scripts/fix-blog-links.py  # Remap stray inline links to correct routes
python3 scripts/fix-blog-descriptions.py  # Clean image-path artifacts in descriptions
```

