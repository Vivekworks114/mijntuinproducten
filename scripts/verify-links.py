#!/usr/bin/env python3
"""Verify all internal links in built HTML resolve to a built file.

Scans every .html in dist/ for href and src attributes that point to local
routes, then confirms a corresponding built file exists. Reports any broken
internal links.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"


def collect_built_routes() -> set[str]:
    routes = set()
    if not DIST.exists():
        return routes
    # HTML routes
    for p in DIST.rglob("*.html"):
        rel = p.relative_to(DIST)
        parts = list(rel.parts)
        if parts[-1] == "index.html":
            route = "/" + "/".join(parts[:-1])
            route = route if route.endswith("/") else route + "/"
            if route != "/":
                route = route.rstrip("/") + "/"
            routes.add(route)
            routes.add(route.rstrip("/"))  # also accept no-trailing-slash form
        else:
            route = "/" + "/".join(parts).removesuffix(".html")
            routes.add(route)
    # Static assets (images, fonts, etc.) — referenced by absolute path
    for p in DIST.rglob("*"):
        if p.is_file() and p.suffix != ".html":
            rel = p.relative_to(DIST)
            routes.add("/" + "/".join(rel.parts))
    return routes


LINK_RE = re.compile(r'(?:href|src)=["\']([^"\']+)["\']', re.IGNORECASE)


def normalize(href: str) -> str:
    if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "data:", "javascript:")):
        return href
    # strip query/anchor
    href = href.split("#")[0].split("?")[0]
    return href


def main() -> int:
    if not DIST.exists():
        print("dist/ not found — run `npm run build` first.")
        return 1

    routes = collect_built_routes()
    checked = 0
    external = 0
    broken = []
    seen_broken = set()

    for html in DIST.rglob("*.html"):
        text = html.read_text(errors="ignore")
        for m in LINK_RE.finditer(text):
            href = normalize(m.group(1))
            if not href:
                continue
            if href.startswith(("http://", "https://")):
                external += 1
                continue
            if href.startswith(("mailto:", "tel:", "#", "data:", "javascript:")):
                continue
            checked += 1
            # internal link — must resolve to a built route
            target = href if href.endswith("/") else href + "/"
            if href in routes or target in routes or href.rstrip("/") in routes:
                continue
            key = (str(html.relative_to(DIST)), href)
            if key not in seen_broken:
                seen_broken.add(key)
                broken.append(key)

    print(f"Checked {checked} internal links across {sum(1 for _ in DIST.rglob('*.html'))} pages.")
    print(f"External references skipped: {external}")
    print(f"Broken internal links: {len(broken)}")
    for page, href in broken[:80]:
        print(f"  BROKEN [{page}] {href}")
    if len(broken) > 80:
        print(f"  ... and {len(broken) - 80} more")

    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
