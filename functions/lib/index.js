"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsletterApi = void 0;
const https_1 = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const app = express();
// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
// High-resolution image generation endpoint
app.post('/generate-image', async (req, res) => {
    let browser;
    try {
        console.log('Received image generation request');
        const { newsletterData } = req.body;
        if (!newsletterData) {
            console.error('No newsletter data provided');
            res.status(400).json({ error: 'Newsletter data is required' });
            return;
        }
        console.log('Newsletter data received:', JSON.stringify(newsletterData, null, 2));
        // Launch Puppeteer
        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        console.log('Puppeteer launched successfully');
        const page = await browser.newPage();
        // Set viewport for high-resolution rendering
        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 3 // High DPI for crisp image
        });
        // Generate HTML content
        const htmlContent = generateNewsletterHTML(newsletterData);
        // Set content and wait for fonts to load
        await page.setContent(htmlContent, {
            waitUntil: ['networkidle0', 'domcontentloaded']
        });
        // Wait a bit more for fonts to fully render
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Generate high-resolution screenshot
        console.log('Taking screenshot...');
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true,
            optimizeForSpeed: false
        });
        console.log('Screenshot taken successfully, size:', screenshot.length, 'bytes');
        // Set response headers for PNG image
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="newsletter-${new Date().toISOString().split('T')[0]}.png"`);
        // Send PNG image
        res.send(screenshot);
        console.log('Image sent to client');
    }
    catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
function generateNewsletterHTML(newsletterData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${newsletterData.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-size-2xl: 1.5rem;
          --font-size-3xl: 1.875rem;
          --font-size-4xl: 2.25rem;

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
          max-width: 1200px;
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

        /* Additional styles for other sections would go here... */
    </style>
</head>
<body>
    <div class="newsletter-container">
        <header class="newsletter-header">
            <h1 class="newsletter-title">${newsletterData.title}</h1>
            <p class="newsletter-subtitle">${newsletterData.subtitle}</p>
            <div class="newsletter-date">${newsletterData.date}</div>
        </header>

        <main class="newsletter-content">
            ${newsletterData.sections.map((section) => `
                <section class="newsletter-section">
                    <h2 class="section-title">${section.title}</h2>

                    ${section.traderTrades ? `
                        <div class="trades-grid">
                            ${section.traderTrades.map((trade) => `
                                <div class="trade-card">
                                    <div class="trade-header">
                                        <span class="trade-symbol">${trade.symbol}</span>
                                        <span class="trade-points ${trade.pointsGained >= 0 ? 'positive' : 'negative'}">
                                            ${trade.pointsGained >= 0 ? '+' : ''}${trade.pointsGained} pts
                                        </span>
                                    </div>
                                    <div class="trade-details">
                                        <div class="trade-detail"><strong>Date:</strong> ${trade.date}</div>
                                        <div class="trade-detail"><strong>Models:</strong> ${trade.modelsUsed}</div>
                                        ${trade.tradeLinks ? `<div class="trade-detail" style="grid-column: 1 / -1; margin-top: var(--spacing-3);"><strong>Links:</strong><a href="${trade.tradeLinks}" target="_blank" rel="noopener noreferrer" class="trade-link">View Trade →</a></div>` : ''}
                                    </div>
                                    <div class="trade-trader" style="margin-top: var(--spacing-3); font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 500;">
                                        Trader: ${trade.traderName}
                                    </div>
                                    ${trade.notes ? `<div class="trade-notes" style="margin-top: var(--spacing-3); font-size: var(--font-size-sm); color: var(--text-secondary); font-style: italic;">"${trade.notes}"</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Additional section rendering would go here for traderOfWeek, communityNews, dailyNews -->
                </section>
            `).join('')}
        </main>
    </div>
</body>
</html>
  `;
}
// Export the Express app as a Firebase Cloud Function
exports.newsletterApi = (0, https_1.onRequest)({
    timeoutSeconds: 300,
    memory: '1GiB',
    maxInstances: 10
}, app);
//# sourceMappingURL=index.js.map