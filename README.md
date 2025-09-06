# Newsletter Creator

A professional newsletter generator built with React and Puppeteer that creates sleek, branded newsletters and exports them as high-quality PDFs.

## Features

- **Professional Design**: Clean, modern newsletter templates with customizable branding
- **PDF Generation**: High-quality PDF export using Puppeteer
- **Responsive Layout**: Looks great on all devices and in print
- **Easy Customization**: Simple data structure for content management
- **Brand Consistency**: CSS variables for consistent styling across all elements

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   This will start both the React development server (port 3000) and the Express server (port 3001).

3. **View Your Newsletter**
   Open http://localhost:3000 in your browser to see the newsletter preview.

4. **Generate PDF**
   Click the "Generate PDF" button to create and download a PDF version of your newsletter.

## Project Structure

```
newsletter-creator/
├── src/
│   ├── components/
│   │   └── Newsletter.tsx      # Main newsletter component
│   ├── data/
│   │   └── sampleNewsletter.ts # Sample newsletter data
│   ├── types/
│   │   └── newsletter.ts       # TypeScript interfaces
│   ├── App.tsx                 # Main app component
│   ├── index.css              # Global styles and design system
│   └── main.tsx               # React entry point
├── server/
│   └── index.js               # Express server with PDF generation
├── scripts/
│   └── start-dev.js           # Development startup script
└── package.json
```

## Customization

### Newsletter Content

Edit `src/data/sampleNewsletter.ts` to customize your newsletter content:

```typescript
export const sampleNewsletterData: NewsletterData = {
  title: "Your Newsletter Title",
  subtitle: "Your newsletter description",
  date: "Current Date",
  sections: [
    {
      id: "featured",
      title: "Featured Stories",
      articles: [
        {
          id: "1",
          title: "Article Title",
          excerpt: "Article description...",
          author: "Author Name",
          readTime: "5 min read",
          url: "https://example.com/article"
        }
      ]
    }
  ],
  footer: {
    companyName: "Your Company",
    websiteUrl: "https://yourcompany.com",
    // ... other footer options
  }
};
```

### Branding and Styling

Customize the design by editing CSS variables in `src/index.css`:

```css
:root {
  /* Brand Colors */
  --primary-color: #2563eb;      /* Main brand color */
  --primary-dark: #1d4ed8;       /* Darker shade */
  --accent-color: #f59e0b;       /* Accent color */
  
  /* Typography */
  --font-family: 'Inter', sans-serif;
  
  /* Add your custom variables here */
}
```

## Production Build

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm run build-and-serve
   ```

## PDF Generation

The PDF generation happens server-side using Puppeteer. The process:

1. Takes newsletter data from the frontend
2. Generates HTML with embedded CSS
3. Uses Puppeteer to render and convert to PDF
4. Returns the PDF file for download

### PDF Customization

You can customize PDF settings in `server/index.js`:

```javascript
const pdf = await page.pdf({
  format: 'A4',              // Page format
  printBackground: true,      // Include background colors
  margin: {                  // Page margins
    top: '20px',
    right: '20px',
    bottom: '20px',
    left: '20px'
  }
});
```

## Development Tips

- **Hot Reload**: The React dev server supports hot reload for quick development
- **PDF Preview**: Use the browser's print preview (Ctrl+P) to see how the PDF will look
- **Responsive Testing**: Test the newsletter layout on different screen sizes
- **Font Loading**: The app uses Google Fonts (Inter) for consistent typography

## Troubleshooting

### PDF Generation Issues

If PDF generation fails:

1. Check that Puppeteer installed correctly: `npm list puppeteer`
2. On Linux, you may need additional dependencies: `sudo apt-get install -y libgbm-dev`
3. Check server logs for detailed error messages

### Development Server Issues

If the development server won't start:

1. Make sure ports 3000 and 3001 are available
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## License

MIT License - feel free to use this project for your newsletter needs!
