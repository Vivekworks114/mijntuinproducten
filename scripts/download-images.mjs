import { readFileSync, mkdirSync, createWriteStream, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { toSafeLocalMediaPath } from './lib/safe-media-path.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const urlFiles = ['all-image-urls.json', 'scraped-image-urls.json', 'image-urls.json'];
let imageUrls = [];
for (const file of urlFiles) {
  const full = join(projectRoot, 'scripts', file);
  if (existsSync(full)) {
    imageUrls = JSON.parse(readFileSync(full, 'utf-8'));
    console.log(`Using ${file}`);
    break;
  }
}
imageUrls = [
  ...new Set(
    imageUrls.filter((u) => typeof u === 'string' && u.includes('/wp-content/uploads/')),
  ),
];

console.log(`Downloading ${imageUrls.length} images...`);

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = dirname(dest);
    mkdirSync(dir, { recursive: true });

    if (existsSync(dest)) {
      resolve('exists');
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, { timeout: 15000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      const file = createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve('downloaded');
      });
      file.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('timeout'));
    });
  });
}

let downloaded = 0;
let skipped = 0;
let failed = 0;
let ignored = 0;

const batchSize = 5;

/** Map a remote WP uploads URL to a Windows-safe local path under public/images/wp-content. */
function localDestForUrl(url) {
  let pathPart = url;
  try {
    pathPart = new URL(url).pathname;
  } catch {
    pathPart = url.split('?')[0].split('#')[0];
  }

  const marker = '/wp-content/uploads/';
  const idx = pathPart.indexOf(marker);
  const relative = idx >= 0 ? pathPart.slice(idx + marker.length) : pathPart.replace(/^\/+/, '');

  // Elementor runtime CSS/fonts are not needed for the Astro site and often include ?ver=.
  if (relative.startsWith('elementor/')) {
    return null;
  }

  const safeRelative = toSafeLocalMediaPath(relative);
  if (!safeRelative) return null;
  return join(projectRoot, 'public', 'images', 'wp-content', safeRelative);
}

async function downloadBatch(urls) {
  await Promise.allSettled(
    urls.map(async (url) => {
      const dest = localDestForUrl(url);
      if (!dest) {
        ignored++;
        return;
      }
      try {
        const result = await downloadFile(url, dest);
        if (result === 'exists') skipped++;
        else downloaded++;
      } catch (err) {
        failed++;
        console.error(`  FAILED: ${url} - ${err.message}`);
      }
    }),
  );
}

async function main() {
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    await downloadBatch(batch);
    if ((i + batchSize) % 20 === 0 || i + batchSize >= imageUrls.length) {
      console.log(
        `  Progress: ${Math.min(i + batchSize, imageUrls.length)}/${imageUrls.length} (${downloaded} downloaded, ${skipped} skipped, ${ignored} ignored, ${failed} failed)`,
      );
    }
  }

  console.log(
    `\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Ignored: ${ignored}, Failed: ${failed}`,
  );
}

main();
