const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors());
// Increase body size limit to accommodate embedded image data URLs
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
// We'll mount auth-protected static later, after auth middleware

// Persistent publish directory on Render
const PUBLISH_DIR = process.env.PUBLISH_DIR || '/var/data/published';
const SAVES_DIR = process.env.SAVES_DIR || '/var/data/saves';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';
try {
  fs.mkdirSync(PUBLISH_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not ensure publish dir exists:', e?.message);
}
try {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not ensure saves dir exists:', e?.message);
}
// Serve published HTML files
app.use('/published', express.static(PUBLISH_DIR));

// Serve logo asset for published pages
app.get('/logo.svg', (req, res) => {
  res.sendFile(path.join(__dirname, '../logo.svg'));
});

// -----------------
// Simple cookie auth
// -----------------
const crypto = require('crypto');
const AUTH_SECRET = process.env.AUTH_SECRET || 'kl_news_local_secret_please_change';
const AUTH_COOKIE = 'kl_session';
const USERNAME = 'KLNewsTeam';
const PASSWORD = 'KLNewsTeam123!@#';

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = decodeURIComponent(pair.slice(idx + 1).trim());
      if (key) cookies[key] = val;
    }
  });
  return cookies;
}

function sign(value) {
  const h = crypto.createHmac('sha256', AUTH_SECRET).update(value).digest('hex');
  return `${value}.${h}`;
}

function verify(signed) {
  if (!signed) return false;
  const lastDot = signed.lastIndexOf('.');
  if (lastDot === -1) return false;
  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(value).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function isPublicPath(p) {
  return (
    p === '/login' ||
    p === '/api/login' ||
    p === '/api/health' ||
    // listing saves remains behind auth; do not expose here
    p.startsWith('/published/') ||
    p.startsWith('/published') ||
    p === '/logo.svg' ||
    p === '/favicon.ico'
  );
}

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === USERNAME && password === PASSWORD) {
    const payload = JSON.stringify({ u: USERNAME, iat: Date.now() });
    const cookieValue = sign(Buffer.from(payload).toString('base64'));
    res.cookie
      ? res.cookie(AUTH_COOKIE, cookieValue, { httpOnly: true, sameSite: 'lax', secure: NODE_ENV !== 'development', maxAge: 7 * 24 * 60 * 60 * 1000 })
      : res.setHeader('Set-Cookie', `${AUTH_COOKIE}=${encodeURIComponent(cookieValue)}; HttpOnly; Path=/; SameSite=Lax${NODE_ENV !== 'development' ? '; Secure' : ''}; Max-Age=${7 * 24 * 60 * 60}`);
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${AUTH_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
});

// Login page (simple form)
app.get('/login', (req, res) => {
  const html = `<!doctype html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Login - KL Newsletter</title>
  <style>body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0d1117;color:#f0f6fc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0} .card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:24px;max-width:360px;width:100%} h1{font-size:20px;margin:0 0 12px} label{font-size:12px;display:block;margin:10px 0 6px;color:#b0bac4} input{width:100%;padding:10px;border-radius:8px;border:1px solid #30363d;background:#21262d;color:#f0f6fc} button{margin-top:16px;width:100%;padding:10px;border:none;border-radius:8px;background:#d4af37;color:#0d1117;font-weight:600;cursor:pointer} .error{color:#ef4444;margin-top:10px;font-size:12px}</style>
  </head><body>
  <div class="card">
    <h1>KL Newsletter Login</h1>
    <label>Username</label>
    <input id="u" placeholder="Username" />
    <label>Password</label>
    <input id="p" placeholder="Password" type="password" />
    <button id="b">Login</button>
    <div id="e" class="error" style="display:none;">Invalid credentials</div>
  </div>
  <script>
    document.getElementById('b').addEventListener('click', async () => {
      const username = document.getElementById('u').value;
      const password = document.getElementById('p').value;
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (res.ok) { window.location.href = '/'; } else { document.getElementById('e').style.display = 'block'; }
    });
  </script>
  </body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Auth guard for everything except public paths
app.use((req, res, next) => {
  if (isPublicPath(req.path)) return next();
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE];
  if (verify(token)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
  return res.redirect('/login');
});

// After auth, serve app assets
app.use(express.static(path.join(__dirname, '../dist')));

// High-resolution image generation endpoint using ScreenshotOne
app.post('/api/generate-image', async (req, res) => {
  try {
    console.log('Received image generation request');
    const { newsletterData } = req.body;
    
    if (!newsletterData) {
      console.error('No newsletter data provided');
      return res.status(400).json({ error: 'Newsletter data is required' });
    }
    
    console.log('Newsletter data received:', JSON.stringify(newsletterData, null, 2));

    // Generate HTML content
    const htmlContent = generateNewsletterHTML(newsletterData);
    
    // ScreenshotOne API configuration
    const screenshotOneApiKey = process.env.SCREENSHOTONE_API_KEY;
    
    if (!screenshotOneApiKey) {
      console.error('ScreenshotOne API key not found');
      return res.status(500).json({ error: 'ScreenshotOne API key not configured' });
    }

    console.log('Calling ScreenshotOne API...');

    // Prefer POST with raw HTML to avoid URL length limits
    const response = await fetch('https://api.screenshotone.com/take', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'image/png' },
      body: JSON.stringify({
        access_key: screenshotOneApiKey,
        html: htmlContent,
        format: 'png',
        viewport_width: 1920,
        viewport_height: 2200,
        device_scale_factor: 3,
        full_page: true,
        delay: 2,
        block_ads: true,
        block_trackers: true,
        block_cookie_banners: true
      })
    });
    
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`ScreenshotOne API error: ${response.status} ${response.statusText} ${errText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageBuffer);
    
    console.log('Screenshot taken successfully, size:', imageUint8Array.length, 'bytes');

    // Set response headers for PNG image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="newsletter-${new Date().toISOString().split('T')[0]}.png"`);

    // Send PNG image
    res.send(Buffer.from(imageUint8Array));
    console.log('Image sent to client');

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Publish endpoint: write HTML file to persistent storage
app.post('/api/publish', async (req, res) => {
  try {
    const { newsletterData } = req.body;
    if (!newsletterData) {
      return res.status(400).json({ error: 'Newsletter data is required' });
    }
    const id = `${Date.now()}`;
    const dir = path.join(PUBLISH_DIR, id);
    fs.mkdirSync(dir, { recursive: true });

    // Build effective sections list; include Prop Firm News if present
    const effectiveSections = Array.isArray(newsletterData.sections) ? [...newsletterData.sections] : [];
    if (Array.isArray(newsletterData.propFirmNews) && newsletterData.propFirmNews.length) {
      effectiveSections.push({ id: 'prop-firm-news', title: (newsletterData.labels && newsletterData.labels.propFirmNews) || 'Prop Firm News', newsItems: newsletterData.propFirmNews });
    }

    const slugify = (t) => String(t || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const pages = effectiveSections.map((s) => ({ title: s.title, slug: `section-${slugify(s.title)}`, href: '' }));
    pages.forEach((p) => { p.href = `${p.slug}.html`; });

    const baseUrl = PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const ogPngPath = path.join(dir, 'og.png');
    let ogImageUrl = '';
    try {
      const screenshotOneApiKey = process.env.SCREENSHOTONE_API_KEY;
      if (screenshotOneApiKey) {
        const fullHtml = generateNewsletterHTML(newsletterData);
        const resp = await fetch('https://api.screenshotone.com/take', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'image/png' },
          body: JSON.stringify({ access_key: screenshotOneApiKey, html: fullHtml, format: 'png', viewport_width: 1920, viewport_height: 2200, device_scale_factor: 3, full_page: true, delay: 2, block_ads: true, block_trackers: true, block_cookie_banners: true })
        });
        if (resp.ok) {
          const ab = await resp.arrayBuffer();
          fs.writeFileSync(ogPngPath, Buffer.from(new Uint8Array(ab)));
          ogImageUrl = `${baseUrl}/published/${id}/og.png`;
        }
      }
    } catch (e) { console.warn('Social image generation failed:', e?.message); }

    const escape = (s) => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    const commonTitle = escape(newsletterData.title);
    const commonDesc = escape(newsletterData.subtitle || newsletterData.weekRange || '');

    // Write each section page
    for (const p of pages) {
      const html = generateNewsletterHTML(newsletterData, { sections: effectiveSections, currentSlug: p.slug, pageLinks: pages.map(q => ({ title: q.title, slug: q.slug, href: q.href })) });
      const canonical = `${baseUrl}/published/${id}/${p.slug}.html`;
      const meta = `
      <link rel="canonical" href="${canonical}">
      <meta property="og:title" content="${commonTitle} - ${escape(p.title)}">
      <meta property="og:description" content="${commonDesc}">
      ${ogImageUrl ? `<meta property=\"og:image\" content=\"${ogImageUrl}\">` : ''}
      <meta property="og:url" content="${canonical}">
      <meta property="og:type" content="article">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${commonTitle} - ${escape(p.title)}">
      <meta name="twitter:description" content="${commonDesc}">
      ${ogImageUrl ? `<meta name=\"twitter:image\" content=\"${ogImageUrl}\">` : ''}
      `;
      const injected = html.replace('</head>', `${meta}\n</head>`);
      fs.writeFileSync(path.join(dir, p.href), injected, 'utf8');
    }

    // Create index.html as the first section page
    if (pages.length) {
      const first = pages[0];
      const firstHtml = fs.readFileSync(path.join(dir, first.href), 'utf8');
      fs.writeFileSync(path.join(dir, 'index.html'), firstHtml, 'utf8');
    }

    const url = `${baseUrl}/published/${id}/${pages[0] ? pages[0].href : 'index.html'}`;
    return res.json({ id, url, image: ogImageUrl, baseUrl });
  } catch (err) {
    console.error('Failed to publish newsletter:', err);
    return res.status(500).json({ error: 'Failed to publish newsletter' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV 
  });
});

// Save/Load snapshots to persistent storage so multiple devices can share
// Save: POST { id?: string, snapshot: object } -> { id }
app.post('/api/save', (req, res) => {
  try {
    const body = req.body || {};
    const id = (body.id && String(body.id).trim()) || String(Date.now());
    const name = (body.name && String(body.name).trim()) || `newsletter-${id}`;
    const file = path.join(SAVES_DIR, `${id}.json`);
    const payload = {
      meta: {
        id,
        name,
        savedAt: Date.now()
      },
      snapshot: body.snapshot || {}
    };
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
    return res.json({ id, name });
  } catch (e) {
    console.error('Failed to save snapshot', e);
    return res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// Load: GET /api/save/:id -> { snapshot }
app.get('/api/save/:id', (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const file = path.join(SAVES_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    // Support older format (no meta)
    const snapshot = data && data.snapshot ? data.snapshot : data;
    return res.json({ snapshot, meta: data.meta || { id } });
  } catch (e) {
    console.error('Failed to load snapshot', e);
    return res.status(500).json({ error: 'Failed to load snapshot' });
  }
});

// List: GET /api/saves -> { items: [{ id, size, mtimeMs }] }
app.get('/api/saves', (req, res) => {
  try {
    const entries = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json'));
    const items = entries.map((f) => {
      const st = fs.statSync(path.join(SAVES_DIR, f));
      let name = '';
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(SAVES_DIR, f), 'utf8'));
        name = (raw && raw.meta && raw.meta.name) || '';
      } catch {}
      return { id: f.replace(/\.json$/, ''), name, size: st.size, mtimeMs: st.mtimeMs };
    }).sort((a, b) => b.mtimeMs - a.mtimeMs);
    return res.json({ items });
  } catch (e) {
    console.error('Failed to list saves', e);
    return res.status(500).json({ error: 'Failed to list saves' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

function generateNewsletterHTML(newsletterData, opts) {
  const fontScale = Number(newsletterData?.fontScale || 1);
  const basePx = Math.round(16 * fontScale);
  // Ensure Daily News renders at the bottom by sorting sections
  const sourceSections = opts && Array.isArray(opts.sections) ? opts.sections : newsletterData.sections;
  const sectionsSorted = Array.isArray(sourceSections)
    ? [...sourceSections].sort((a, b) => {
        const aIsDaily = a && a.dailyNews ? 1 : 0;
        const bIsDaily = b && b.dailyNews ? 1 : 0;
        return aIsDaily - bIsDaily;
      })
    : [];
  const slugify = (t) => String(t || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const findByTitleIncludes = (needle) => sectionsSorted.find(s => String(s?.title || '').toLowerCase().includes(needle));
  const cotSection = findByTitleIncludes('commitment of traders');
  const cozySection = findByTitleIncludes('cozy calendar');
  const econSection = sectionsSorted.find(s => s && s.dailyNews);
  const cotId = cotSection ? `section-${slugify(cotSection.title)}` : '';
  const cozyId = cozySection ? `section-${slugify(cozySection.title)}` : '';
  const econId = econSection ? `section-${slugify(econSection.title || (newsletterData.labels && newsletterData.labels.dailyNews) || 'Economic News')}` : '';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${newsletterData.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
          /* KL Brand Colors - Dark Mode */
          --primary-color: #d4af37;
          --primary-dark: #b8941f;
          --secondary-color: #8b949e;
          --accent-color: #00d4aa;
          --success-color: #22c55e;
          --danger-color: #ef4444;

          /* Dark Mode Colors */
          --bg-primary: #0d1117;
          --bg-secondary: #161b22;
          --bg-tertiary: #21262d;
          --bg-card: #1c2128;
          --border-color: #30363d;
          --text-primary: #f0f6fc;
          --text-secondary: #8b949e;
          --text-muted: #6e7681;

          /* Typography */
          --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          --font-size-xs: 0.875rem;
          --font-size-sm: 1rem;
          --font-size-base: 1.2rem;
          --font-size-lg: 1.35rem;
          --font-size-xl: 1.6rem;
          --font-size-2xl: 1.9rem;
          --font-size-3xl: 2.3rem;
          --font-size-4xl: 2.8rem;

          /* Spacing */
          --spacing-1: 0.25rem;
          --spacing-2: 0.5rem;
          --spacing-3: 0.75rem;
          --spacing-4: 1rem;
          --spacing-5: 1.25rem;
          --spacing-6: 1.5rem;
          --spacing-8: 2rem;
          --spacing-10: 2.5rem;
          --spacing-12: 3rem;
          --spacing-16: 4rem;

          /* Border Radius */
          --radius-sm: 0.125rem;
          --radius-md: 0.375rem;
          --radius-lg: 0.5rem;
          --radius-xl: 0.75rem;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html { font-size: ${basePx}px; }

        body {
          font-family: var(--font-family);
          font-size: var(--font-size-base);
          line-height: 1.6;
          color: var(--text-primary);
          background-color: var(--bg-primary);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .newsletter-container { width: 100vw; max-width: none; margin: 0; background: var(--bg-primary); color: var(--text-primary); overflow: visible; }
        .newsletter-header { background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: var(--white); padding: var(--spacing-8) var(--spacing-6); text-align: center; }
        .newsletter-title { font-family: 'Poppins', var(--font-family); font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: var(--spacing-2); letter-spacing: -0.025em; }
        .newsletter-subtitle { font-size: var(--font-size-lg); opacity: 0.9; font-weight: 300; }
        .newsletter-content { padding: var(--spacing-8) var(--spacing-6); }
        .newsletter-section { margin-bottom: var(--spacing-8); }
        .section-title { font-size: var(--font-size-2xl); font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-4); padding-bottom: var(--spacing-2); border-bottom: 2px solid var(--primary-color); display: inline-block; }
        /* Daily News styles */
        .daily-news-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--spacing-4); margin-bottom: var(--spacing-8); }
        @media (max-width: 1400px) { .daily-news-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px) { .daily-news-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .daily-news-grid { grid-template-columns: 1fr; } }
        .daily-news-pane { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--spacing-5); min-width: 0; overflow: hidden; }
        .daily-news-day { font-size: var(--font-size-lg); font-weight: 600; color: var(--primary-color); margin-bottom: var(--spacing-4); text-align: center; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: var(--spacing-2); border-bottom: 2px solid var(--primary-color); }
        .daily-news-items { list-style: none; padding: 0; margin: 0; }
        .daily-news-item { margin-bottom: var(--spacing-3); padding-left: var(--spacing-4); position: relative; color: var(--text-secondary); line-height: 1.5; font-size: var(--font-size-sm); overflow-wrap: anywhere; word-break: break-word; }
        .daily-news-item:last-child { margin-bottom: 0; }
        .daily-news-item:before { content: '•'; color: var(--primary-color); font-weight: bold; position: absolute; left: 0; top: 0; }
        .daily-news-headline { color: var(--text-primary); font-weight: 500; }
        .daily-news-details { color: var(--text-muted); font-size: var(--font-size-xs); margin-top: var(--spacing-1); font-style: italic; }
        .community-news-list { display: grid; gap: var(--spacing-4); }
        .community-news-item { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--spacing-4); }
        .community-news-title { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-2); }
        .community-news-content { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; }
        .community-news-content ol, .community-news-content ul { padding-left: 1.5rem; margin-left: 0; list-style-position: outside; }
        .community-news-content li { padding-left: 0.125rem; }
        .community-news-link { display: inline-block; margin-top: var(--spacing-3); background: var(--primary-color); color: var(--bg-primary); text-decoration: none; font-weight: 600; padding: 4px 6px; border-radius: var(--radius-md); font-size: 0.5em; }
        .community-news-link:hover { background: var(--primary-dark); color: var(--bg-primary); }
        /* Images in content reduced by ~50% */
        .community-news-item img { max-width: 50%; height: auto; }
        .custom-section-image { max-width: 50%; height: auto; }
        /* Logo */
        .kl-logo { height: 96px; margin-bottom: var(--spacing-3); display: inline-block; }
        /* Top Nav */
        .top-nav { display: flex; gap: var(--spacing-4); align-items: center; padding: var(--spacing-4) var(--spacing-6); border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); position: sticky; top: 0; z-index: 50; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        /* Link-style nav items */
        .tab-btn { background: transparent; border: none; color: var(--text-primary); cursor: pointer; font-weight: 600; display: inline-block; height: 44px; line-height: 44px; text-align: center; white-space: nowrap; padding: 0 14px; text-decoration: none; box-sizing: border-box; border-bottom: 2px solid transparent; }
        .tab-btn:hover { color: var(--primary-color); border-bottom-color: var(--primary-color); }
        .tab-btn.active { color: var(--bg-primary); background: var(--primary-color); border-radius: var(--radius-md) var(--radius-md) 0 0; border-bottom-color: var(--primary-color); }
        /* Footer */
        .newsletter-footer { border-top: 1px solid var(--border-color); padding: var(--spacing-8) var(--spacing-6); color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-4); flex-wrap: wrap; }
        .footer-text p { margin: 0; }
        .footer-links { display: flex; gap: var(--spacing-4); align-items: center; }
        .footer-link { color: var(--text-secondary); text-decoration: none; border: 1px solid var(--border-color); padding: 6px 10px; border-radius: var(--radius-md); }
        .footer-link:hover { color: var(--bg-primary); background: var(--primary-color); border-color: var(--primary-color); }
    </style>
</head>
<body>
    <div class="newsletter-container">
        <header class="newsletter-header" style="position: relative;">
            ${newsletterData.edition ? `<div class="newsletter-edition" style="position: absolute; top: var(--spacing-4); right: var(--spacing-6); font-size: var(--font-size-base); font-weight: 600; color: var(--primary-color);">${newsletterData.edition}</div>` : ''}
            <img src="/logo.svg" alt="Kingline Capital" class="kl-logo" />
            <h1 class="newsletter-title">${newsletterData.title}</h1>
            <p class="newsletter-subtitle">${newsletterData.subtitle}</p>
            ${newsletterData.weekRange ? `<div class="newsletter-week-range" style="font-size: var(--font-size-sm); opacity: 0.8; margin-top: var(--spacing-2);">${newsletterData.weekRange}</div>` : ''}
        </header>

        ${(Array.isArray(opts?.pageLinks) && opts.pageLinks.length) ? `
        <nav class="top-nav">
          ${opts.pageLinks.map(pl => `<a class=\"tab-btn\" href=\"${pl.href}\">${pl.title}</a>`).join('')}
        </nav>
        ` : (cotId || cozyId || econId) ? `
        <nav class="top-nav">
          ${cotId ? `<button class=\"tab-btn\" data-target=\"${cotId}\">Commitment of Traders</button>` : ''}
          ${cozyId ? `<button class=\"tab-btn\" data-target=\"${cozyId}\">Cozy Calendar</button>` : ''}
          ${econId ? `<button class=\"tab-btn\" data-target=\"${econId}\">Economic News</button>` : ''}
        </nav>
        ` : ''}

        <main class="newsletter-content">
            ${sectionsSorted.map(section => {
              if (opts?.currentSlug && `section-${String(section.title || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}` !== opts.currentSlug) {
                return '';
              }
              return `
                <section id="section-${String(section.title || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}" class="newsletter-section">
                    <h2 class="section-title">${section.title}</h2>
                    ${section.communityNews ? `
                        <div class="community-news-list">
                            ${section.communityNews.map(news => `
                                <div class="community-news-item">
                                    <div class="community-news-title">${news.title}</div>
                                    <div class="community-news-content">${news.description || news.content || ''}</div>
                                    ${news.link ? `<a href="${news.link}" class="community-news-link" target="_blank" rel="noopener noreferrer">Read More →</a>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${section.dailyNews ? `
                        <div class="daily-news-grid">
                            ${['monday','tuesday','wednesday','thursday','friday'].map((dayKey) => {
                                const items = (section.dailyNews && section.dailyNews[dayKey]) || [];
                                const label = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
                                return `
                                <div class=\"daily-news-pane\"> 
                                  <div class=\"daily-news-day\">${label}</div>
                                  <ul class=\"daily-news-items\">
                                    ${items.length ? items.map((it) => `
                                      <li class=\"daily-news-item\">
                                        <div class=\"daily-news-headline\">${it.headline || ''}</div>
                                        ${it.details ? `<div class=\\"daily-news-details\\">${it.details}</div>` : ''}
                                      </li>
                                    `).join('') : `
                                      <li class=\"daily-news-item\"><div class=\"daily-news-headline\" style=\"color: var(--text-muted); font-style: italic;\">No news items for this day</div></li>
                                    `}
                                  </ul>
                                </div>`
                            }).join('')}
                        </div>
                    ` : ''}
                    ${Array.isArray(section.imageDataUrls) && section.imageDataUrls.length ? `
                        <div class="community-news-list">
                          <div class="community-news-item">
                            ${section.imageDataUrls.map((u) => `
                              <div style=\"margin-top:12px; display:flex; justify-content:center;\"><img src=\"${u}\" alt=\"daily-section\" class=\"custom-section-image\" style=\"border-radius:12px; display:block; margin:0 auto;\" /></div>
                            `).join('')}
                          </div>
                        </div>
                    ` : ''}
                    ${section.newsItems ? `
                        <div class="community-news-list">
                            ${section.newsItems.map(news => `
                                <div class="community-news-item">
                                    <div class="community-news-title">${news.title}</div>
                                    <div class="community-news-content">${news.description || ''}</div>
                                    ${news.link ? `<a href="${news.link}" class="community-news-link" target="_blank" rel="noopener noreferrer">Read More →</a>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${section.customHtml || section.imageDataUrl ? `
                        <div class="community-news-list">
                            <div class="community-news-item">
                                ${section.customHtml ? `<div class=\"community-news-content\">${section.customHtml}</div>` : ''}
                                ${section.imageDataUrl ? `<div style=\"margin-top:12px; display:flex; justify-content:center;\"><img src=\"${section.imageDataUrl}\" alt=\"custom\" class=\"custom-section-image\" style=\"border-radius:12px; display:block; margin:0 auto;\" /></div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </section>
            `}).join('')}
            ${Array.isArray(newsletterData.propFirmNews) && newsletterData.propFirmNews.length ? `
              <section class="newsletter-section">
                <h2 class="section-title">${(newsletterData.labels && newsletterData.labels.propFirmNews) || 'Prop Firm News'}</h2>
                <div class="community-news-list">
                  ${newsletterData.propFirmNews.map(news => `
                    <div class="community-news-item">
                      <div class="community-news-title">${news.title || ''}</div>
                      <div class="community-news-content">${news.description || news.content || ''}</div>
                      ${news.link ? `<a href="${news.link}" class="community-news-link" target="_blank" rel="noopener noreferrer">Read More →</a>` : ''}
                    </div>
                  `).join('')}
                </div>
              </section>
            ` : ''}
        </main>
        <footer class="newsletter-footer">
          <div class="footer-text">
            <p>© 2025 ${(newsletterData.footer && newsletterData.footer.companyName) || ''}. All rights reserved.</p>
          </div>
          <div class="footer-links">
            ${newsletterData.footer && newsletterData.footer.websiteUrl ? `<a href="${newsletterData.footer.websiteUrl}" class="footer-link" target="_blank" rel="noopener noreferrer">Visit Website</a>` : ''}
            ${newsletterData.footer && newsletterData.footer.socialLinks && newsletterData.footer.socialLinks.twitter ? `<a href="${newsletterData.footer.socialLinks.twitter}" class="footer-link" target="_blank" rel="noopener noreferrer">X</a>` : ''}
            ${newsletterData.footer && newsletterData.footer.socialLinks && newsletterData.footer.socialLinks.discord ? `<a href="${newsletterData.footer.socialLinks.discord}" class="footer-link" target="_blank" rel="noopener noreferrer">Discord</a>` : ''}
          </div>
        </footer>
    </div>
<script>
  (function(){
    var nav = document.querySelector('.top-nav');
    if (!nav) return;
    var tabs = Array.from(nav.querySelectorAll('.tab-btn'));

    // If tabs are anchors, enable in-page navigation without full reload
    var isLinkTabs = tabs.length && tabs[0].tagName === 'A';

    function setActiveByUrl(url){
      tabs.forEach(function(t){ t.classList.remove('active'); });
      var match = tabs.find(function(t){
        if (t.tagName !== 'A') return false;
        var href = t.getAttribute('href');
        return href && (url.endsWith(href) || url.indexOf('/' + href) !== -1);
      });
      (match || tabs[0]) && (match || tabs[0]).classList.add('active');
    }

    if (isLinkTabs) {
      setActiveByUrl(location.pathname);
      tabs.forEach(function(a){
        a.addEventListener('click', function(e){
          // Only intercept same-folder links
          var href = a.getAttribute('href');
          if (!href || href.indexOf('http') === 0) return; 
          e.preventDefault();
          fetch(href).then(function(r){ return r.text(); }).then(function(html){
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var newMain = doc.querySelector('.newsletter-content');
            var newTitle = doc.querySelector('title');
            var curMain = document.querySelector('.newsletter-content');
            if (newMain && curMain) {
              curMain.innerHTML = newMain.innerHTML;
            }
            if (newTitle) {
              document.title = newTitle.textContent || document.title;
            }
            history.pushState({}, '', href);
            setActiveByUrl(location.pathname);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }).catch(function(){
            // Fallback to full navigation if fetch fails
            location.href = href;
          });
        });
      });

      window.addEventListener('popstate', function(){
        // On back/forward, reload current page content via fetch
        var current = location.pathname.split('/').pop() || 'index.html';
        fetch(current).then(function(r){ return r.text(); }).then(function(html){
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var newMain = doc.querySelector('.newsletter-content');
          var newTitle = doc.querySelector('title');
          var curMain = document.querySelector('.newsletter-content');
          if (newMain && curMain) { curMain.innerHTML = newMain.innerHTML; }
          if (newTitle) { document.title = newTitle.textContent || document.title; }
          setActiveByUrl(location.pathname);
          window.scrollTo({ top: 0 });
        });
      });
    } else {
      // Button-based smooth scroll (single-page fallback)
      tabs.forEach(function(btn, idx){
        btn.addEventListener('click', function(){
          var targetId = btn.getAttribute('data-target');
          var el = document.getElementById(targetId);
          if (el) {
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            tabs.forEach(function(b){ b.classList.remove('active'); });
            btn.classList.add('active');
          }
        });
        if (idx === 0) btn.classList.add('active');
      });
    }
  })();
  </script>
</body>
</html>
  `;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`Frontend served from: ${path.join(__dirname, '../dist')}`);
  console.log(`Published files served from: ${PUBLISH_DIR}`);
});