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
app.use(express.static(path.join(__dirname, '../dist')));

// Persistent publish directory on Render
const PUBLISH_DIR = process.env.PUBLISH_DIR || '/var/data/published';
try {
  fs.mkdirSync(PUBLISH_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not ensure publish dir exists:', e?.message);
}
// Serve published HTML files
app.use('/published', express.static(PUBLISH_DIR));

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
    const htmlContent = generateNewsletterHTML(newsletterData);
    const id = `${Date.now()}`;
    const filename = `${id}.html`;
    const filePath = path.join(PUBLISH_DIR, filename);
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    const url = `/published/${filename}`;
    return res.json({ id, url });
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
        .newsletter-container { width: 100vw; max-width: none; margin: 0; background: var(--bg-primary); color: var(--text-primary); overflow: hidden; }
        .newsletter-header { background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: var(--white); padding: var(--spacing-8) var(--spacing-6); text-align: center; }
        .newsletter-title { font-family: 'Poppins', var(--font-family); font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: var(--spacing-2); letter-spacing: -0.025em; }
        .newsletter-subtitle { font-size: var(--font-size-lg); opacity: 0.9; font-weight: 300; }
        .newsletter-content { padding: var(--spacing-8) var(--spacing-6); }
        .newsletter-section { margin-bottom: var(--spacing-8); }
        .section-title { font-size: var(--font-size-2xl); font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-4); padding-bottom: var(--spacing-2); border-bottom: 2px solid var(--primary-color); display: inline-block; }
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