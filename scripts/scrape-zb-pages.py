#!/usr/bin/env python3
"""Scrape zb_mp product/plant/business pages from the live WordPress site."""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "scripts" / "zb_mp-sitemap.xml"
OUT_DIR = ROOT / "src" / "data" / "scraped"
UA = "Mozilla/5.0 (compatible; MijnTuinProductenMigration/1.0)"

IMG_RE = re.compile(
    r"https?://(?:www\.)?mijntuinproducten\.nl/wp-content/uploads/[^\s\"'<>]+",
    re.I,
)


def fetch(url: str, timeout: int = 30) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, res.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace") if e.fp else ""
        return e.code, body


def load_urls(kinds: set[str]) -> list[tuple[str, str, str]]:
    """Return list of (kind, slug, url)."""
    locs = re.findall(r"<loc>(.*?)</loc>", SITEMAP.read_text(encoding="utf-8"))
    out: list[tuple[str, str, str]] = []
    seen: set[str] = set()
    for loc in locs:
        if "/sitemap" in loc:
            continue
        path = loc.replace("https://mijntuinproducten.nl/", "").strip("/")
        if not path or path in seen:
            continue
        if path.startswith("beste-") and "beste" in kinds:
            kind, slug = "beste", path  # keep full slug incl. beste-
        elif path.startswith("plant/") and "plant" in kinds:
            kind, slug = "plant", path[len("plant/") :]
        elif path.startswith("tuincentrum/") and "tuincentrum" in kinds:
            kind, slug = "tuincentrum", path[len("tuincentrum/") :]
        elif (
            "bedrijf" in kinds
            and not path.startswith(("beste-", "plant/", "tuincentrum/"))
            and "/" not in path
        ):
            kind, slug = "bedrijf", path
        else:
            continue
        seen.add(path)
        out.append((kind, slug, loc if loc.endswith("/") else loc + "/"))
    return out


def clean_widgets(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", "", html)
    html = re.sub(r"<style[\s\S]*?</style>", "", html)
    html = re.sub(r"<svg[\s\S]*?</svg>", "", html)

    parts: list[str] = []
    for wm in re.finditer(
        r'elementor-widget-(heading|text-editor|image|html)[^"]*"[^>]*>\s*'
        r'<div class="elementor-widget-container">(.*?)</div>\s*</div>',
        html,
        re.S,
    ):
        inner = wm.group(2).strip()
        if not inner:
            continue
        # Drop empty TOC / empty lists
        if 'id="toc_container"' in inner:
            continue
        if re.fullmatch(r"<p>\s*</p>", inner):
            continue
        parts.append(inner)

    content = "\n".join(parts)
    # Normalize nested <p><p>
    content = re.sub(r"<p>\s*<p>", "<p>", content)
    content = re.sub(r"</p>\s*</p>", "</p>", content)
    # Strip empty heading spans noise lightly
    content = re.sub(r' class="elementor-heading-title elementor-size-default"', "", content)
    content = re.sub(r"<span id=\"[^\"]*\">", "", content)
    content = re.sub(r"</span>(?=</h[1-6]>)", "", content)
    # Rewrite local image URLs to public path
    content = re.sub(
        r"https?://(?:www\.)?mijntuinproducten\.nl/wp-content/uploads/",
        "/images/wp-content/",
        content,
    )
    # Drop srcset to avoid remote refs
    content = re.sub(r'\s+srcset="[^"]*"', "", content)
    content = re.sub(r'\s+sizes="[^"]*"', "", content)
    return content.strip()


def extract_page(url: str, html: str) -> dict | None:
    if "niet gevonden" in html.lower() and "<h1" in html.lower():
        # soft 404
        title_m = re.search(r"<title>(.*?)</title>", html, re.S)
        if title_m and "niet gevonden" in title_m.group(1).lower():
            return None

    title_m = re.search(r"<title>(.*?)</title>", html, re.S)
    title = unescape(title_m.group(1)).strip() if title_m else ""
    title = re.sub(r"\s+", " ", title)
    # strip site suffix variants
    title = re.sub(r"\s*[-|]\s*Mijn Tuin Producten.*$", "", title, flags=re.I).strip()

    desc_m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html, re.I)
    description = unescape(desc_m.group(1)).strip() if desc_m else ""

    # Content window
    start = html.find("zbmp-breadcrumb")
    if start < 0:
        start = html.find("<h1")
    if start < 0:
        return None

    end_cands = []
    for pat in (
        "Andere artikelen",
        "elementor-posts--skin-classic",
        "Wekelijks schrijven wij",
        "Laatste blogs",
    ):
        i = html.find(pat, start + 100)
        if i > 0:
            end_cands.append(i)
    end = min(end_cands) if end_cands else min(len(html), start + 200_000)
    chunk = html[start:end]
    content_html = clean_widgets(chunk)
    if len(re.sub(r"<[^>]+>", "", content_html).strip()) < 80:
        return None

    h1_m = re.search(r"<h1[^>]*>(.*?)</h1>", content_html, re.S)
    h1 = re.sub(r"<[^>]+>", "", h1_m.group(1)).strip() if h1_m else title

    date_m = re.search(r"Laatst bijgewerkt:\s*([^<]+)", content_html)
    date = date_m.group(1).strip() if date_m else ""

    images = sorted(set(IMG_RE.findall(html)))
    # also local rewritten ones already in content - collect original for download
    local_imgs = re.findall(r'src="(/images/wp-content/[^"]+)"', content_html)
    for li in local_imgs:
        images.append("https://mijntuinproducten.nl/wp-content/uploads/" + li.split("/images/wp-content/", 1)[1])

    return {
        "url": url,
        "title": title or h1,
        "h1": h1,
        "description": description,
        "date": date,
        "contentHtml": content_html,
        "images": sorted(set(images)),
    }


def scrape_one(kind: str, slug: str, url: str) -> tuple[str, str, dict | None, str]:
    try:
        code, html = fetch(url)
        if code != 200:
            return kind, slug, None, f"HTTP {code}"
        data = extract_page(url, html)
        if not data:
            return kind, slug, None, "empty/404"
        data["kind"] = kind
        data["slug"] = slug
        return kind, slug, data, "ok"
    except Exception as e:  # noqa: BLE001
        return kind, slug, None, str(e)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--kinds",
        default="beste,plant",
        help="Comma list: beste,plant,tuincentrum,bedrijf",
    )
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    kinds = {k.strip() for k in args.kinds.split(",") if k.strip()}
    urls = load_urls(kinds)
    if args.limit:
        urls = urls[: args.limit]

    print(f"Scraping {len(urls)} pages ({', '.join(sorted(kinds))}) with {args.workers} workers")

    image_urls: set[str] = set()
    ok = fail = skip = 0

    def dest_for(kind: str, slug: str) -> Path:
        safe = slug.replace("/", "__")
        d = OUT_DIR / kind
        d.mkdir(parents=True, exist_ok=True)
        return d / f"{safe}.json"

    pending = []
    for kind, slug, url in urls:
        dest = dest_for(kind, slug)
        if dest.exists() and not args.force:
            skip += 1
            try:
                existing = json.loads(dest.read_text(encoding="utf-8"))
                image_urls.update(existing.get("images") or [])
            except Exception:
                pass
            continue
        pending.append((kind, slug, url))

    print(f"  skip existing: {skip}, to fetch: {len(pending)}")

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(scrape_one, k, s, u): (k, s) for k, s, u in pending}
        done = 0
        for fut in as_completed(futures):
            kind, slug, data, status = fut.result()
            done += 1
            if data:
                dest = dest_for(kind, slug)
                dest.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
                image_urls.update(data.get("images") or [])
                ok += 1
            else:
                fail += 1
                print(f"  FAIL {kind}/{slug}: {status}")
            if done % 25 == 0 or done == len(pending):
                print(f"  progress {done}/{len(pending)} (ok={ok} fail={fail})")
            time.sleep(0.05)

    img_list = sorted(image_urls)
    img_path = ROOT / "scripts" / "scraped-image-urls.json"
    img_path.write_text(json.dumps(img_list, indent=2), encoding="utf-8")

    # Write index for Astro
    index: dict[str, list[str]] = {}
    for kind in kinds:
        d = OUT_DIR / kind
        if not d.exists():
            continue
        index[kind] = sorted(p.stem.replace("__", "/") for p in d.glob("*.json"))
    (OUT_DIR / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")

    print(f"\nDone. ok={ok} fail={fail} skip={skip}")
    print(f"Images collected: {len(img_list)} -> {img_path}")
    print(f"Index: { {k: len(v) for k, v in index.items()} }")


if __name__ == "__main__":
    main()
