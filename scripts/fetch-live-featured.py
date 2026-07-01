#!/usr/bin/env python3
"""Fetch live blog post og:image URLs and map them to local blog posts by slug.

For each local blog post without a featuredImage, fetch the live post page,
extract og:image, download it to public/images/wp-content/..., and set
featuredImage in the frontmatter.
"""

import re
import sys
import subprocess
import urllib.request
import urllib.error
import ssl
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "src" / "content" / "blog"
PUBLIC = ROOT / "public"
BASE = "https://mijntuinproducten.nl"

FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
OG_RE = re.compile(r'<meta\s+property="og:image"\s+content="([^"]+)"', re.IGNORECASE)

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def local_exists(p: str) -> bool:
    return (PUBLIC / p.lstrip("/")).is_file()


def fetch(url: str, timeout: int = 20) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as r:
            return r.read()
    except Exception as e:
        print(f"    fetch error {url}: {e}")
        return None


def wp_to_local(url: str) -> str:
    # https://mijntuinproducten.nl/wp-content/uploads/2026/06/foo.jpg -> /images/wp-content/2026/06/foo.jpg
    m = re.search(r"/wp-content/uploads/(.+)$", url)
    if not m:
        return ""
    return "/images/wp-content/" + m.group(1)


def set_featured(path: Path, img: str) -> bool:
    text = path.read_text()
    m = FM_RE.match(text)
    if not m:
        return False
    fm = m.group(1)
    if re.search(r"^featuredImage:\s*\S", fm, re.MULTILINE):
        return False
    replacement = '\\1\nfeaturedImage: "' + img + '"'
    new_fm = re.sub(r'(^description: "[^"]*"\s*$)', replacement, fm, count=1, flags=re.MULTILINE)
    path.write_text(text[:m.start(1)] + new_fm + text[m.end(1):])
    return True


def main() -> int:
    posts = sorted(BLOG.glob("*.mdx")) + sorted(BLOG.glob("*.md"))
    todo = []
    for p in posts:
        text = p.read_text()
        m = FM_RE.match(text)
        if not m:
            continue
        if re.search(r"^featuredImage:\s*\S", m.group(1), re.MULTILINE):
            continue
        todo.append(p)

    print(f"{len(todo)} posts need a featured image.")
    set_count = 0
    for i, p in enumerate(todo, 1):
        slug = p.stem
        live_url = f"{BASE}/{slug}/"
        html = fetch(live_url)
        if not html:
            continue
        html_s = html.decode("utf-8", "ignore")
        og = OG_RE.search(html_s)
        if not og:
            print(f"  [{i}/{len(todo)}] {slug}: no og:image")
            continue
        img_url = og.group(1)
        local = wp_to_local(img_url)
        if not local:
            print(f"  [{i}/{len(todo)}] {slug}: og:image not wp-content ({img_url})")
            continue
        dest = PUBLIC / local.lstrip("/")
        if not dest.exists():
            data = fetch(img_url)
            if not data:
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            print(f"  [{i}/{len(todo)}] {slug}: downloaded {local}")
        else:
            print(f"  [{i}/{len(todo)}] {slug}: exists {local}")
        if set_featured(p, local):
            set_count += 1

    print(f"\nSet {set_count} featured images from live og:image.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
