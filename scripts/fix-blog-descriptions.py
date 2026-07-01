#!/usr/bin/env python3
"""Clean blog frontmatter where `description` accidentally starts with an image
path (a migration artifact). The stray image path is moved into `featuredImage`
when the file exists locally, and stripped from the description otherwise.

Handles YAML of the form:
    description: "/images/wp-content/2024/07/foo.jpg

    Real excerpt text that continues..."
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "src" / "content" / "blog"
PUBLIC = ROOT / "public"

IMG_LINE_RE = re.compile(r'^description:\s*"/(images/[^"\s]+\n)')  # image as first line
FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)


def local_exists(img_path: str) -> bool:
    return (PUBLIC / img_path.lstrip("/")).is_file()


def process(path: Path) -> str:
    text = path.read_text()
    m = FRONTMATTER_RE.match(text)
    if not m:
        return "skip"
    fm = m.group(1)
    desc_match = re.search(r'^description:\s*"(.*?)"\s*$', fm, re.DOTALL | re.MULTILINE)
    if not desc_match:
        return "skip"
    desc = desc_match.group(1)
    # Does the description start with an image path?
    img_m = re.match(r"^\s*(/images/[^\s\n]+)\s*\n\s*\n?(.*)", desc, re.DOTALL)
    if not img_m:
        return "skip"
    img = img_m.group(1).strip()
    clean_desc = img_m.group(2).strip()

    has_feat = re.search(r"^featuredImage:\s*", fm, re.MULTILINE) is not None

    new_fm = fm
    # Replace description value
    new_fm = new_fm[:desc_match.start()] + f'description: "{clean_desc}"' + new_fm[desc_match.end():]

    # Set featuredImage if image exists locally and not already present
    if not has_feat and local_exists(img):
        # insert after description line
        new_fm = re.sub(
            r'(^description: "[^"]*"\s*$)',
            r'\1\nfeaturedImage: "' + img + '"',
            new_fm,
            count=1,
            flags=re.MULTILINE,
        )

    new_text = text[:m.start(1)] + new_fm + text[m.end(1):]
    path.write_text(new_text)
    return f"cleaned (featuredImage={'set' if (not has_feat and local_exists(img)) else 'kept/missing'})"


def main() -> int:
    changed = 0
    for p in sorted(BLOG.glob("*.mdx")) + sorted(BLOG.glob("*.md")):
        res = process(p)
        if res != "skip":
            changed += 1
            print(f"  {p.name}: {res}")
    print(f"\nProcessed {changed} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
