import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://mijntuinproducten.nl';

const tuincentrumLocations = ['almere', 'amersfoort', 'amsterdam', 'den-haag', 'den-helder', 'drachten', 'hardenberg', 'leusden', 'oosterhout', 'tilburg'];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractMainContent(html) {
  const bodyMatch = html.match(/<div[^>]*class="[^"]*elementor-widget-theme-post-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
  if (bodyMatch) return bodyMatch[1].trim();
  
  const contentMatch = html.match(/<div[^>]*data-elementor-type="wp-page"[^>]*>([\s\S]*?)<footer/);
  if (contentMatch) {
    let content = contentMatch[1];
    content = content.replace(/<nav[^>]*class="[^"]*elementor-nav-menu[^"]*"[\s\S]*?<\/nav>/g, '');
    content = content.replace(/<header[\s\S]*?<\/header>/g, '');
    return content.trim();
  }

  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (articleMatch) return articleMatch[1].trim();
  
  return null;
}

function extractTextContent(html) {
  const sections = [];
  
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  
  const dateMatch = html.match(/Laatst bijgewerkt[^<]*<\/span>|Laatst bijgewerkt[^<]*/i);
  const date = dateMatch ? dateMatch[0].replace(/<[^>]+>/g, '').trim() : '';
  
  const paragraphs = [];
  const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g);
  for (const m of pMatches) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text && text.length > 20 && !text.includes('Bij MijnTuinProducten') && !text.includes('Wekelijks schrijven wij')) {
      paragraphs.push(text);
    }
  }

  const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g);
  const headings = [];
  for (const m of h2Matches) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text && !text.includes('Tuincentrum locaties') && !text.includes('Laatste blogs')) {
      headings.push(text);
    }
  }
  
  return { title, date, paragraphs, headings };
}

async function scrapeTuincentrumPage(location) {
  const url = `${DOMAIN}/tuincentrum/${location}/`;
  console.log(`Scraping: ${url}`);
  
  try {
    const html = await fetchPage(url);
    const content = extractTextContent(html);
    
    const listItems = [];
    const liMatches = html.matchAll(/<li[^>]*class="[^"]*zbmp[^"]*"[^>]*>([\s\S]*?)<\/li>/g);
    for (const m of liMatches) {
      const text = m[1].replace(/<[^>]+>/g, '').trim();
      if (text) listItems.push(text);
    }

    const faqItems = [];
    const faqMatches = html.matchAll(/<div[^>]*class="[^"]*elementor-toggle-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g);
    for (const m of faqMatches) {
      const qMatch = m[1].match(/<(?:a|span)[^>]*class="[^"]*elementor-toggle-title[^"]*"[^>]*>([\s\S]*?)<\/(?:a|span)>/);
      const aMatch = m[1].match(/<div[^>]*class="[^"]*elementor-toggle-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (qMatch && aMatch) {
        faqItems.push({
          q: qMatch[1].replace(/<[^>]+>/g, '').trim(),
          a: aMatch[1].replace(/<[^>]+>/g, '').trim()
        });
      }
    }

    return { location, content, listItems, faqItems, raw: html };
  } catch (e) {
    console.error(`Error scraping ${location}: ${e.message}`);
    return { location, content: null, listItems: [], faqItems: [] };
  }
}

async function main() {
  const outputDir = path.join(process.cwd(), 'src/data/pages');
  fs.mkdirSync(outputDir, { recursive: true });

  const results = {};
  
  for (const loc of tuincentrumLocations) {
    const data = await scrapeTuincentrumPage(loc);
    const locationName = loc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    results[loc] = {
      name: locationName,
      title: data.content?.title || `Tuincentrum ${locationName}`,
      date: data.content?.date || '',
      paragraphs: data.content?.paragraphs || [],
      headings: data.content?.headings || [],
      tuincentra: data.listItems,
      faq: data.faqItems
    };
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  fs.writeFileSync(path.join(outputDir, 'tuincentrum-data.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved tuincentrum data for ${Object.keys(results).length} locations`);
}

main().catch(console.error);
