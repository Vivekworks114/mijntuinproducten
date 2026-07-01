import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { parseString } from 'xml2js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const xmlPath = process.argv[2];
if (!xmlPath) {
  console.error('Usage: node scripts/migrate-wordpress.mjs <path-to-xml>');
  process.exit(1);
}

const xmlContent = readFileSync(xmlPath, 'utf-8');

function stripCDATA(val) {
  if (!val) return '';
  if (Array.isArray(val)) val = val[0];
  if (typeof val === 'object' && val._) return val._;
  if (typeof val === 'object' && val['_']) return val['_'];
  if (typeof val !== 'string') return String(val || '');
  return val.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function getMeta(item, key) {
  const metas = item['wp:postmeta'] || [];
  for (const meta of metas) {
    const metaKey = stripCDATA(meta['wp:meta_key']);
    if (metaKey === key) {
      return stripCDATA(meta['wp:meta_value']);
    }
  }
  return '';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function htmlToMarkdown(html, blogSlugs = new Set()) {
  if (!html) return '';

  let md = html;

  // Remove WordPress comments
  md = md.replace(/<!--.*?-->/gs, '');
  md = md.replace(/\/\*![\s\S]*?\*\//g, '');
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Handle headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Handle images - replace WP URLs with local paths
  md = md.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, (match, src, alt) => {
    const localSrc = src.replace(/https?:\/\/mijntuinproducten\.nl\/wp-content\/uploads\//, '/images/wp-content/');
    return `![${alt}](${localSrc})`;
  });
  md = md.replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (match, src) => {
    const localSrc = src.replace(/https?:\/\/mijntuinproducten\.nl\/wp-content\/uploads\//, '/images/wp-content/');
    return `![](${localSrc})`;
  });

  // Handle links
  md = md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (match, href, text) => {
    // Convert internal links
    let url = href;
    if (url.startsWith('https://mijntuinproducten.nl/')) {
      url = url.replace('https://mijntuinproducten.nl', '');
    }
    // WordPress blog permalinks are root-level; Astro serves posts under /blog/
    const path = url.replace(/\/$/, '');
    const slug = path.replace(/^\//, '');
    if (slug && !slug.includes('/') && blogSlugs.has(slug) && !url.startsWith('/blog/')) {
      url = `/blog/${slug}/`;
    }
    if (url !== '/' && !url.endsWith('/')) url += '/';
    return `[${text}](${url})`;
  });

  // Handle lists
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Handle bold and italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Handle blockquotes
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, (match, content) => {
    return content.split('\n').map(l => `> ${l}`).join('\n') + '\n\n';
  });

  // Handle paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gs, '$1\n\n');

  // Handle line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Remove figure/figcaption tags
  md = md.replace(/<\/?figure[^>]*>/gi, '');
  md = md.replace(/<figcaption[^>]*>.*?<\/figcaption>/gi, '');

  // Remove remaining HTML tags
  md = md.replace(/<div[^>]*>/gi, '\n');
  md = md.replace(/<\/div>/gi, '\n');
  md = md.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
  md = md.replace(/<\/?[^>]+(>|$)/g, '');

  // Decode HTML entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#039;/g, "'");
  md = md.replace(/&nbsp;/g, ' ');

  // Clean up multiple newlines
  md = md.replace(/\n{3,}/g, '\n\n');
  // Strip Elementor inline CSS blocks that break MDX parsing
  md = md.replace(/\.elementor-[^{]+\{[^}]+\}/g, '');
  md = md.trim();

  return md;
}

function sanitizeMdxBody(body) {
  return body
    .replace(/\/\*![\s\S]*?\*\//g, '')
    .replace(/\.elementor-[^{]+\{[^}]+\}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeFrontmatterValue(str) {
  if (!str) return '""';
  // Escape quotes and wrap in quotes if needed
  if (str.includes(':') || str.includes('"') || str.includes("'") || str.includes('#') || str.includes('[') || str.includes('{')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return `"${str}"`;
}

parseString(xmlContent, { explicitArray: true }, (err, result) => {
  if (err) {
    console.error('XML Parse Error:', err);
    process.exit(1);
  }

  const channel = result.rss.channel[0];
  const items = channel.item || [];

  console.log(`Total items in XML: ${items.length}`);

  // Extract blog posts (type = post, status = publish)
  const posts = items.filter(item => {
    const postType = stripCDATA(item['wp:post_type']);
    const status = stripCDATA(item['wp:status']);
    return postType === 'post' && status === 'publish';
  });

  console.log(`Published blog posts: ${posts.length}`);

  const blogSlugs = new Set(posts.map((p) => stripCDATA(p['wp:post_name'])));

  // Extract attachments for featured image lookup
  const attachments = {};
  items.filter(item => stripCDATA(item['wp:post_type']) === 'attachment').forEach(item => {
    const id = stripCDATA(item['wp:post_id']);
    const url = stripCDATA(item['wp:attachment_url']);
    attachments[id] = url;
  });

  // Create blog content directory
  const blogDir = join(projectRoot, 'src', 'content', 'blog');
  mkdirSync(blogDir, { recursive: true });

  // Track all image URLs to download
  const imageUrls = new Set();

  let migrated = 0;

  for (const post of posts) {
    const title = stripCDATA(post.title);
    const slug = stripCDATA(post['wp:post_name']);
    const date = stripCDATA(post['wp:post_date']);
    const author = stripCDATA(post['dc:creator']);
    const content = stripCDATA(post['content:encoded']);
    const excerpt = stripCDATA(post['excerpt:encoded']);

    // Get categories
    const categories = [];
    const tags = [];
    if (post.category) {
      for (const cat of post.category) {
        const domain = cat.$ ? cat.$.domain : '';
        const name = cat._ || stripCDATA(cat);
        if (domain === 'category') {
          categories.push(name);
        } else if (domain === 'post_tag') {
          tags.push(name);
        }
      }
    }

    // Get featured image
    const thumbnailId = getMeta(post, '_thumbnail_id');
    let featuredImage = '';
    if (thumbnailId && attachments[thumbnailId]) {
      featuredImage = attachments[thumbnailId];
      imageUrls.add(featuredImage);
    }

    // Find images in content
    const imgRegex = /https?:\/\/mijntuinproducten\.nl\/wp-content\/uploads\/[^"'\s)]+/g;
    const contentImages = content.match(imgRegex) || [];
    contentImages.forEach(url => imageUrls.add(url));

    // Convert content to markdown
    const markdownContent = htmlToMarkdown(content, blogSlugs);

    // Generate description from excerpt or content
    let description = excerpt || '';
    // Strip HTML from excerpt
    description = description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    // Strip accidental featured-image path pasted into excerpt (WordPress migration artifact)
    description = description.replace(/^\/images\/wp-content\/[^\s]+\s*/i, '').trim();
    if (!description) {
      description = markdownContent.replace(/[#*\[\]()!]/g, '').substring(0, 160).trim();
      if (description.length >= 155) description = description.substring(0, 155) + '...';
    }

    // Build frontmatter
    const featuredImageLocal = featuredImage
      ? featuredImage.replace(/https?:\/\/mijntuinproducten\.nl\/wp-content\/uploads\//, '/images/wp-content/')
      : '';

    let frontmatter = '---\n';
    frontmatter += `title: ${escapeFrontmatterValue(title)}\n`;
    frontmatter += `description: ${escapeFrontmatterValue(description)}\n`;
    frontmatter += `pubDate: ${date || '2026-01-01 00:00:00'}\n`;
    if (author) frontmatter += `author: ${escapeFrontmatterValue(author)}\n`;
    if (categories.length > 0) frontmatter += `categories: [${categories.map(c => `"${c}"`).join(', ')}]\n`;
    if (tags.length > 0) frontmatter += `tags: [${tags.map(t => `"${t}"`).join(', ')}]\n`;
    if (featuredImageLocal) frontmatter += `featuredImage: ${escapeFrontmatterValue(featuredImageLocal)}\n`;
    frontmatter += '---\n\n';

    const mdxContent = frontmatter + sanitizeMdxBody(markdownContent);
    const filePath = join(blogDir, `${slug}.mdx`);
    writeFileSync(filePath, mdxContent, 'utf-8');
    migrated++;
  }

  console.log(`\nMigrated ${migrated} blog posts to src/content/blog/`);
  console.log(`Found ${imageUrls.size} unique images to download`);

  // Write image URLs to a file for the download script
  const imageListPath = join(projectRoot, 'scripts', 'image-urls.json');
  writeFileSync(imageListPath, JSON.stringify([...imageUrls], null, 2), 'utf-8');
  console.log(`Image URL list saved to scripts/image-urls.json`);
});
