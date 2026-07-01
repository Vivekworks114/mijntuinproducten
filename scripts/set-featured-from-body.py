#!/usr/bin/env python3
"""For blog posts without a featuredImage, set it to the first inline image
referenced in the body that exists locally. Falls back to leaving unset
(BlogCard will use the themed fallback pool).
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "src" / "content" / "blog"
PUBLIC = ROOT / "public"

FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
IMG_RE = re.compile(r'/images/wp-content/[^\s")\]]+\.(?:jpg|jpeg|png|webp)', re.IGNORECASE)


def local_exists(p: str) -> bool:
    return (PUBLIC / p.lstrip("/")).is_file()


def process(path: Path) -> str:
    text = path.read_text()
    m = FM_RE.match(text)
    if not m:
        return "skip"
    fm = m.group(1)
    if re.search(r"^featuredImage:\s*\S", fm, re.MULTILINE):
        return "has-featured"
    body = text[m.end():]
    for img in IMG_RE.findall(body):
        if local_exists(img):
            replacement = '\\1\nfeaturedImage: "' + img + '"'
            new_fm = re.sub(
                r'(^description: "[^"]*"\s*$)',
                replacement,
                fm,
                count=1,
                flags=re.MULTILINE,
            )
            path.write_text(text[:m.start(1)] + new_fm + text[m.end(1):])
            return f"set -> {img}"
    return "no-inline-image"


def main() -> int:
    counts = {}
    for p in sorted(BLOG.glob("*.mdx")) + sorted(BLOG.glob("*.md")):
        r = process(p)
        counts[r.split(" ->")[0].split(" ->")[0]] = counts.get(r.split(" ->")[0].split(" ->")[0], 0) + 1
        if r not in ("skip", "has-featured", "no-inline-image"):
            print(f"  {p.name}: {r}")
    print("\nSummary:", counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
