import https from 'https';
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://mijntuinproducten.nl';
const locations = ['almere', 'amersfoort', 'amsterdam', 'den-haag', 'den-helder', 'drachten', 'hardenberg', 'leusden', 'oosterhout', 'tilburg'];

function fetch(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return fetch(r.headers.location).then(res).catch(rej);
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    }).on('error', rej);
  });
}

function toName(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function scrapePage(loc) {
  const name = toName(loc);
  const url = `${DOMAIN}/tuincentrum/${loc}/`;
  console.log(`Scraping: ${url}`);
  const html = await fetch(url);

  const introMatch = html.match(new RegExp(`In ${name} vind je[\\s\\S]*?<\\/p>`));
  const intro = introMatch ? introMatch[0].replace(/<[^>]+>/g, '').trim() : `In ${name} vind je diverse tuincentra waar je terecht kunt voor tuinmeubelen, tuingereedschap of decoratie.`;

  const shopMatch = html.match(new RegExp(`Tuinartikelen shoppen in ${name}([\\s\\S]*?)(?:Veelgestelde vragen|Bekijk nog meer)`));
  const businesses = [];
  if (shopMatch) {
    const names = shopMatch[1].matchAll(/<li[^>]*>\s*(?:<a[^>]*>)?([\s\S]*?)(?:<\/a>)?\s*<\/li>/g);
    for (const n of names) {
      const bname = n[1].replace(/<[^>]+>/g, '').trim();
      if (bname && bname.length > 2 && !bname.includes('{')) businesses.push(bname);
    }
  }

  const faqMatch = html.match(new RegExp(`Veelgestelde vragen over tuincentra in ${name}([\\s\\S]*?)(?:Bekijk nog meer|<footer)`));
  const faqs = [];
  if (faqMatch) {
    const toggles = faqMatch[1].matchAll(/<(?:a|span)[^>]*elementor-toggle-title[^>]*>([\s\S]*?)<\/(?:a|span)>/g);
    const answers = faqMatch[1].matchAll(/<div[^>]*elementor-tab-content[^>]*>([\s\S]*?)<\/div>/g);
    const qs = []; for (const t of toggles) qs.push(t[1].replace(/<[^>]+>/g, '').trim());
    const as = []; for (const a of answers) as.push(a[1].replace(/<[^>]+>/g, '').trim());
    for (let i = 0; i < qs.length; i++) {
      if (qs[i]) faqs.push({ q: qs[i], a: as[i] || '' });
    }
  }

  const dateMatch = html.match(/Laatst bijgewerkt[^<]*(?:<\/span>|<\/div>)/i);
  const date = dateMatch ? dateMatch[0].replace(/<[^>]+>/g, '').replace('Laatst bijgewerkt', '').replace(':', '').trim() : '';

  return { slug: loc, name, intro, businesses, faqs, date };
}

async function main() {
  const data = {};
  for (const loc of locations) {
    data[loc] = await scrapePage(loc);
    await new Promise(r => setTimeout(r, 500));
  }

  const outDir = path.join(process.cwd(), 'src/data/pages');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'tuincentrum-data.json'), JSON.stringify(data, null, 2));
  console.log(`\nDone! Saved data for ${Object.keys(data).length} tuincentrum pages`);
  
  for (const [slug, d] of Object.entries(data)) {
    console.log(`  ${slug}: ${d.businesses.length} businesses, ${d.faqs.length} FAQs`);
  }
}

main().catch(console.error);
