import { readFileSync, mkdirSync, createWriteStream, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const imageUrls = JSON.parse(readFileSync(join(projectRoot, 'scripts', 'image-urls.json'), 'utf-8'));

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
      file.on('finish', () => { file.close(); resolve('downloaded'); });
      file.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => { request.destroy(); reject(new Error('timeout')); });
  });
}

let downloaded = 0;
let skipped = 0;
let failed = 0;

const batchSize = 5;

async function downloadBatch(urls) {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const relativePath = url.replace(/https?:\/\/mijntuinproducten\.nl\/wp-content\/uploads\//, '');
      const dest = join(projectRoot, 'public', 'images', 'wp-content', relativePath);
      try {
        const result = await downloadFile(url, dest);
        if (result === 'exists') {
          skipped++;
        } else {
          downloaded++;
        }
      } catch (err) {
        failed++;
        console.error(`  FAILED: ${url} - ${err.message}`);
      }
    })
  );
}

async function main() {
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    await downloadBatch(batch);
    if ((i + batchSize) % 20 === 0 || i + batchSize >= imageUrls.length) {
      console.log(`  Progress: ${Math.min(i + batchSize, imageUrls.length)}/${imageUrls.length} (${downloaded} downloaded, ${skipped} skipped, ${failed} failed)`);
    }
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

main();
