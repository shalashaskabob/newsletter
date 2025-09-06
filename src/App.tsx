import { useState } from 'react';
import Newsletter from './components/Newsletter';
import NewsletterForm from './components/NewsletterForm';
import { sampleNewsletterData } from './data/sampleNewsletter';
import { NewsletterData } from './types/newsletter';

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState<'form' | 'preview'>('form');
  const [newsletterData, setNewsletterData] = useState<NewsletterData>(sampleNewsletterData);

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

  const handlePrintPreview = () => {
    window.print();
  };

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
      const savedTrades = localStorage.getItem('newsletter-trades');
      const savedTraderOfWeek = localStorage.getItem('newsletter-trader-of-week');
      const savedDailyNews = localStorage.getItem('newsletter-daily-news');
      const savedCommunityNews = localStorage.getItem('newsletter-community-news');

      const formData = savedFormData ? JSON.parse(savedFormData) : sampleNewsletterData;
      const trades = savedTrades ? JSON.parse(savedTrades) : [];
      const traderOfWeek = savedTraderOfWeek ? JSON.parse(savedTraderOfWeek) : null;
      const dailyNews = savedDailyNews ? JSON.parse(savedDailyNews) : null;
      const communityNews = savedCommunityNews ? JSON.parse(savedCommunityNews) : [];

      // Build sections array
      const sections = [];

      // Add trades section if trades exist
      if (trades.length > 0) {
        sections.push({
          id: 'official-trades',
          title: '🏆 Official KL Traders Performance',
          traderTrades: trades
        });
      }

      // Add trader of the week if filled
      if (traderOfWeek && traderOfWeek.traderName && traderOfWeek.testimonial) {
        sections.push({
          id: 'trader-of-week',
          title: '⭐ KL Trader of the Week',
          traderOfWeek: {
            id: 'trader-spotlight',
            traderName: traderOfWeek.traderName,
            timeInKL: traderOfWeek.timeInKL,
            cashbackEarned: traderOfWeek.cashbackEarned,
            favoriteSymbol: traderOfWeek.favoriteSymbol,
            favoriteTradingModel: traderOfWeek.favoriteTradingModel,
            testimonial: traderOfWeek.testimonial
          }
        });
      }

      // Add community news section if community news exist
      if (communityNews.length > 0) {
        sections.push({
          id: 'community-news',
          title: '🏛️ Kingline Community News',
          communityNews: communityNews
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

      // Create newsletter data
      const newsletterData = {
        ...formData,
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
            <button className="btn btn-secondary" onClick={handlePrintPreview}>
              Print Preview
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
