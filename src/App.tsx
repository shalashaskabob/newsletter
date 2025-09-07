import { useEffect, useState } from 'react';
import Newsletter from './components/Newsletter';
import NewsletterForm from './components/NewsletterForm';
import { sampleNewsletterData } from './data/sampleNewsletter';
import { NewsletterData } from './types/newsletter';

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState<'form' | 'preview'>('form');
  const [newsletterData, setNewsletterData] = useState<NewsletterData>({ ...sampleNewsletterData, fontScale: 1 });

  // Apply font scale to document root for preview
  useEffect(() => {
    const scale = newsletterData.fontScale ?? 1;
    document.documentElement.style.setProperty('font-size', `${16 * scale}px`);
    localStorage.setItem('newsletter-font-scale', String(scale));
    return () => {
      // no-op
    };
  }, [newsletterData.fontScale]);

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newsletterData }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kl-newsletter-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to generate image');
        alert('Failed to generate image. Please try again.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // removed print preview per request

  const handleFormSubmit = (data: NewsletterData) => {
    setNewsletterData(data);
    setCurrentView('preview');
  };

  const handleLoadSample = () => {
    setNewsletterData(sampleNewsletterData);
    setCurrentView('preview');
  };

  const generateNewsletterFromCurrentData = () => {
    try {
      // Load current form data from localStorage
      const savedFormData = localStorage.getItem('newsletter-form-basic');
      const savedFontScale = localStorage.getItem('newsletter-font-scale');
      // Removed trades and trader of the week per request
      const savedDailyNews = localStorage.getItem('newsletter-daily-news');
      const savedCommunityNews = localStorage.getItem('newsletter-community-news');
      const savedNews = localStorage.getItem('newsletter-news');
      const savedCustom = localStorage.getItem('newsletter-custom');

      const formData = savedFormData ? JSON.parse(savedFormData) : sampleNewsletterData;
      // Removed trades and trader of the week per request
      const dailyNews = savedDailyNews ? JSON.parse(savedDailyNews) : null;
      const communityNews = savedCommunityNews ? JSON.parse(savedCommunityNews) : [];
      const newsItems = savedNews ? JSON.parse(savedNews) : [];
      const customSections = savedCustom ? JSON.parse(savedCustom) : [];

      // Build sections array
      const sections = [];

      // Removed KL Traders and Trader of the Week sections

      // Add community news section if community news exist
      if (communityNews.length > 0) {
        sections.push({
          id: 'community-news',
          title: '🏛️ Kingline Community News',
          communityNews: communityNews
        });
      }

      // Add News section if exists
      if (newsItems.length > 0) {
        sections.push({
          id: 'news',
          title: '🗞️ News',
          newsItems
        });
      }

      // Add daily news section if any day has news items
      if (dailyNews) {
        const hasNewsItems = Object.values(dailyNews).some((dayItems: any) => dayItems.length > 0);
        if (hasNewsItems) {
          sections.push({
            id: 'daily-news',
            title: '📰 Economic News',
            dailyNews: dailyNews
          });
        }
      }

      // Add custom sections
      if (Array.isArray(customSections) && customSections.length > 0) {
        customSections.forEach((cs: any) => {
          sections.push({ id: `custom-${cs.id}`, title: cs.title, customHtml: cs.customHtml, imageDataUrl: cs.imageDataUrl });
        });
      }

      // Create newsletter data
      const newsletterData = {
        ...formData,
        fontScale: savedFontScale ? parseFloat(savedFontScale) : (formData.fontScale ?? 1),
        sections
      };

      return newsletterData;
    } catch (error) {
      console.error('Error generating newsletter from current data:', error);
      return sampleNewsletterData;
    }
  };

  const handlePreviewClick = () => {
    const currentNewsletterData = generateNewsletterFromCurrentData();
    setNewsletterData(currentNewsletterData);
    setCurrentView('preview');
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">KL Newsletter Creator</h1>
        <p className="app-description">
          Create professional trading newsletters with KL branding and export as high-resolution images
        </p>
      </div>

      <div className="controls">
        <button 
          className={`btn ${currentView === 'form' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentView('form')}
        >
          Create Newsletter
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setNewsletterData(prev => ({ ...prev, fontScale: Math.max(0.8, (prev.fontScale ?? 1) - 0.05) }))}
        >
          A-
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setNewsletterData(prev => ({ ...prev, fontScale: Math.min(1.6, (prev.fontScale ?? 1) + 0.05) }))}
        >
          A+
        </button>
        <button 
          className={`btn ${currentView === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handlePreviewClick}
        >
          Preview
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleLoadSample}
        >
          Load Sample
        </button>
        {currentView === 'preview' && (
          <>
            <button 
              className="btn btn-primary" 
              onClick={handleGenerateImage}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>
          </>
        )}
      </div>

      {currentView === 'form' ? (
        <NewsletterForm 
          onSubmit={handleFormSubmit}
          initialData={newsletterData}
        />
      ) : (
        <Newsletter data={newsletterData} />
      )}
    </div>
  );
}

export default App;
