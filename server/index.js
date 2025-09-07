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
try {
  fs.mkdirSync(PUBLISH_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not ensure publish dir exists:', e?.message);
}
// Serve published HTML files
app.use('/published', express.static(PUBLISH_DIR));

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
    const filename = `${id}.html`;
    const pngName = `${id}.png`;
    const filePath = path.join(PUBLISH_DIR, filename);
    const pngPath = path.join(PUBLISH_DIR, pngName);

    // 1) Base HTML for the newsletter
    const htmlContent = generateNewsletterHTML(newsletterData);

    // 2) Attempt to generate an image for social previews
    let ogImageUrl = '';
    try {
      const screenshotOneApiKey = process.env.SCREENSHOTONE_API_KEY;
      if (screenshotOneApiKey) {
        const resp = await fetch('https://api.screenshotone.com/take', {
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
        if (resp.ok) {
          const ab = await resp.arrayBuffer();
          fs.writeFileSync(pngPath, Buffer.from(new Uint8Array(ab)));
          ogImageUrl = `${req.protocol}://${req.get('host')}/published/${pngName}`;
        }
      }
    } catch (e) {
      console.warn('Social image generation failed:', e?.message);
    }

    // 3) Inject Open Graph/Twitter meta tags
    const canonical = `${req.protocol}://${req.get('host')}/published/${filename}`;
    const escape = (s) => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    const ogTitle = escape(newsletterData.title);
    const ogDesc = escape(newsletterData.subtitle || newsletterData.weekRange || '');
    const meta = `
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDesc}">
    ${ogImageUrl ? `<meta property=\"og:image\" content=\"${ogImageUrl}\">` : ''}
    <meta property="og:url" content="${canonical}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${ogDesc}">
    ${ogImageUrl ? `<meta name=\"twitter:image\" content=\"${ogImageUrl}\">` : ''}
    `;
    const injected = htmlContent.replace('</head>', `${meta}\n</head>`);

    // 4) Write the HTML file
    fs.writeFileSync(filePath, injected, 'utf8');
    const url = `/published/${filename}`;
    return res.json({ id, url, image: ogImageUrl });
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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

function generateNewsletterHTML(newsletterData) {
  const fontScale = Number(newsletterData?.fontScale || 1);
  const basePx = Math.round(16 * fontScale);
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
        .community-news-content { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; }
    </style>
</head>
<body>
    <div class="newsletter-container">
        <header class="newsletter-header" style="position: relative;">
            ${newsletterData.edition ? `<div class="newsletter-edition" style="position: absolute; top: var(--spacing-4); right: var(--spacing-6); font-size: var(--font-size-base); font-weight: 600; color: var(--primary-color);">${newsletterData.edition}</div>` : ''}
            <h1 class="newsletter-title">${newsletterData.title}</h1>
            <p class="newsletter-subtitle">${newsletterData.subtitle}</p>
            ${newsletterData.weekRange ? `<div class="newsletter-week-range" style="font-size: var(--font-size-sm); opacity: 0.8; margin-top: var(--spacing-2);">${newsletterData.weekRange}</div>` : ''}
        </header>

        <main class="newsletter-content">
            ${newsletterData.sections.map(section => `
                <section class="newsletter-section">
                    <h2 class="section-title">${section.title}</h2>
                    ${section.communityNews ? `
                        <div class="community-news-list">
                            ${section.communityNews.map(news => `
                                <div class="community-news-item">
                                    <div class="community-news-title">${news.title}</div>
                                    <div class="community-news-content">${news.description || news.content || ''}</div>
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
                                ${section.imageDataUrl ? `<div style=\"margin-top:12px; display:flex; justify-content:center;\"><img src=\"${section.imageDataUrl}\" alt=\"custom\" style=\"max-width:100%; border-radius:12px; display:block; margin:0 auto;\" /></div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </section>
            `).join('')}
        </main>
    </div>
</body>
</html>
  `;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`Frontend served from: ${path.join(__dirname, '../dist')}`);
  console.log(`Published files served from: ${PUBLISH_DIR}`);
});