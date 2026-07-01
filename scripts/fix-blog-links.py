#!/usr/bin/env python3
"""Remap broken inline links in blog MDX content to their correct routes.

- Blog-post links written as /<slug>/ (WordPress root permalink) -> /blog/<slug>/
  when a matching blog post exists.
- Product review links /beste-<thing>/ -> the matching category product page.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "src" / "content" / "blog"

BLOG_SLUGS = {p.stem for p in BLOG.glob("*.mdx")} | {p.stem for p in BLOG.glob("*.md")}

# best-<thing>/ -> category/<thing>/  (verified against built routes)
PRODUCT_REMAP = {
    "/beste-grasmaaier/": "/gereedschap/grasmaaier/",
    "/beste-plantenbakken/": "/decoratie/plantenbakken/",
    "/beste-snoeigereedschap/": "/gereedschap/snoeigereedschap/",
}

# Build remap for blog posts: /<slug>/ -> /blog/<slug>/
BLOG_REMAP = {f"/{s}/": f"/blog/{s}/" for s in BLOG_SLUGS}

REMAP = {**BLOG_REMAP, **PRODUCT_REMAP}

# Match markdown links [text](/slug/) and HTML href="/slug/"
MD_LINK_RE = re.compile(r"(\[[^\]]+\]\()(\/[^)]+)(\))")
HTML_HREF_RE = re.compile(r'(href=")(/[^"]+)(")')


def remap(href: str) -> str:
    return REMAP.get(href, href)


def process(path: Path) -> int:
    text = path.read_text()
    orig = text

    def md_sub(m):
        return m.group(1) + remap(m.group(2)) + m.group(3)

    def html_sub(m):
        return m.group(1) + remap(m.group(2)) + m.group(3)

    text = MD_LINK_RE.sub(md_sub, text)
    text = HTML_HREF_RE.sub(html_sub, text)

    if text != orig:
        path.write_text(text)
        return 1
    return 0


def main() -> int:
    changed = 0
    for p in BLOG.glob("*.mdx"):
        changed += process(p)
    for p in BLOG.glob("*.md"):
        changed += process(p)
    print(f"Updated {changed} blog files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
