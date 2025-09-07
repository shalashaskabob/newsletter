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
        viewport_width: 1600,
        viewport_height: 1800,
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

        html {
          /* Increase base rem so all rem-based sizes scale up in screenshots */
          font-size: 20px;
        }

        body {
          font-family: var(--font-family);
          font-size: var(--font-size-base);
          line-height: 1.6;
          color: var(--text-primary);
          background-color: var(--bg-primary);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .newsletter-container {
          max-width: 1400px;
          margin: 0 auto;
          background: var(--bg-primary);
          color: var(--text-primary);
          overflow: hidden;
        }

        .newsletter-header {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
          color: var(--white);
          padding: var(--spacing-8) var(--spacing-6);
          text-align: center;
        }

        .newsletter-title {
          font-family: 'Poppins', var(--font-family);
          font-size: var(--font-size-3xl);
          font-weight: 700;
          margin-bottom: var(--spacing-2);
          letter-spacing: -0.025em;
        }

        .newsletter-subtitle {
          font-size: var(--font-size-lg);
          opacity: 0.9;
          font-weight: 300;
        }

        .newsletter-date {
          font-size: var(--font-size-sm);
          opacity: 0.8;
          margin-top: var(--spacing-3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .newsletter-content {
          padding: var(--spacing-8) var(--spacing-6);
        }

        .newsletter-section {
          margin-bottom: var(--spacing-8);
        }

        .section-title {
          font-size: var(--font-size-2xl);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-4);
          padding-bottom: var(--spacing-2);
          border-bottom: 2px solid var(--primary-color);
          display: inline-block;
        }

        /* Trade Cards */
        .trades-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-6);
          margin-bottom: var(--spacing-8);
        }

        .trade-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-6);
        }

        .trade-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-4);
        }

        .trade-symbol {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--primary-color);
        }

        .trade-points {
          padding: var(--spacing-1) var(--spacing-3);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: 600;
        }

        .trade-points.positive {
          background: rgba(34, 197, 94, 0.2);
          color: var(--success-color);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .trade-points.negative {
          background: rgba(239, 68, 68, 0.2);
          color: var(--danger-color);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .trade-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-2);
          margin-bottom: var(--spacing-4);
        }

        .trade-detail {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }

        .trade-link {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
          margin-left: var(--spacing-2);
        }

        /* Daily News */
        .daily-news-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: var(--spacing-4);
          margin-bottom: var(--spacing-8);
        }

        .daily-news-item {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-4);
        }

        .daily-news-day {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: var(--spacing-2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .daily-news-headline {
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          line-height: 1.4;
        }

        /* Community News */
        .community-news-list {
          display: grid;
          gap: var(--spacing-4);
        }

        .community-news-item {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-4);
        }

        .community-news-title {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-2);
        }

        .community-news-content {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Trader of the Week */
        .trader-spotlight {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-6);
          margin-bottom: var(--spacing-8);
        }

        .trader-name {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: var(--spacing-4);
        }

        .trader-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-4);
          margin-bottom: var(--spacing-4);
        }

        .trader-stat {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }

        .trader-testimonial {
          font-style: italic;
          color: var(--text-primary);
          font-size: var(--font-size-base);
          line-height: 1.6;
          margin-top: var(--spacing-4);
          padding-top: var(--spacing-4);
          border-top: 1px solid var(--border-color);
        }
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

                    ${section.traderTrades ? `
                        <div class="trades-grid">
                            ${section.traderTrades.map(trade => `
                                <div class="trade-card">
                                    <div class="trade-header">
                                        <span class="trade-symbol">${trade.symbol}</span>
                                        <span class="trade-points ${trade.pointsGained >= 0 ? 'positive' : 'negative'}">
                                            ${trade.pointsGained >= 0 ? '+' : ''}${trade.pointsGained} pts
                                        </span>
                                    </div>
                                    <div class="trade-details">
                                        <div class="trade-detail"><strong>Models:</strong> ${trade.modelsUsed}</div>
                                        ${trade.tradeLinks ? `<div class="trade-detail" style="grid-column: 1 / -1; margin-top: var(--spacing-3);"><strong>Links:</strong><a href="${trade.tradeLinks}" target="_blank" rel="noopener noreferrer" class="trade-link">View Trade →</a></div>` : ''}
                                    </div>
                                    <div class="trade-trader" style="margin-top: var(--spacing-2); font-size: var(--font-size-lg); color: var(--primary-color); font-weight: 700; text-align: center;">
                                        ${trade.traderName}
                                    </div>
                                    ${trade.notes ? `<div class="trade-notes" style="margin-top: var(--spacing-3); font-size: var(--font-size-sm); color: var(--text-secondary); font-style: italic;">"${trade.notes}"</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${section.traderOfWeek ? `
                        <div class="trader-spotlight">
                            <div class="trader-name">${section.traderOfWeek.traderName}</div>
                            <div class="trader-stats">
                                <div class="trader-stat"><strong>Time in KL:</strong> ${section.traderOfWeek.timeInKL}</div>
                                <div class="trader-stat"><strong>Cashback Earned:</strong> ${section.traderOfWeek.cashbackEarned}</div>
                                <div class="trader-stat"><strong>Favorite Symbol:</strong> ${section.traderOfWeek.favoriteSymbol}</div>
                                <div class="trader-stat"><strong>Favorite Model:</strong> ${section.traderOfWeek.favoriteTradingModel}</div>
                            </div>
                            ${section.traderOfWeek.testimonial ? `<div class="trader-testimonial">"${section.traderOfWeek.testimonial}"</div>` : ''}
                        </div>
                    ` : ''}

                    ${section.dailyNews ? `
                        <div class="daily-news-grid">
                            ${['monday','tuesday','wednesday','thursday','friday'].map((dayKey) => {
                                const items = (section.dailyNews && section.dailyNews[dayKey]) || [];
                                const label = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
                                return `
                                <div class="daily-news-item">
                                  <div class="daily-news-day">${label}</div>
                                  <ul class="daily-news-items">
                                    ${items.length ? items.map((it) => `
                                      <li class="daily-news-item">
                                        <div class="daily-news-headline">${it.headline || ''}</div>
                                        ${it.details ? `<div class=\"daily-news-details\">${it.details}</div>` : ''}
                                      </li>
                                    `).join('') : `
                                      <li class="daily-news-item"><div class="daily-news-headline" style="color: var(--text-muted); font-style: italic;">No news items for this day</div></li>
                                    `}
                                  </ul>
                                </div>`
                            }).join('')}
                        </div>
                    ` : ''}

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
                                ${section.imageDataUrl ? `<div style=\"margin-top:12px\"><img src=\"${section.imageDataUrl}\" alt=\"custom\" style=\"max-width:100%; border-radius:12px\" /></div>` : ''}
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
});