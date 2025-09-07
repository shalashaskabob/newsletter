import React, { useState, useEffect } from 'react';
import { NewsletterData, TraderTrade, TraderOfWeek, DailyNews, DailyNewsItem, CommunityNewsItem, NewsItem } from '../types/newsletter';

interface NewsletterFormProps {
  onSubmit: (data: NewsletterData) => void;
  initialData?: NewsletterData;
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({ onSubmit, initialData }) => {
  // Load saved data from localStorage
  const loadSavedFormData = () => {
    try {
      const saved = localStorage.getItem('newsletter-form-basic');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading saved form data:', error);
      return null;
    }
  };

  const savedFormData = loadSavedFormData();

  const [formData, setFormData] = useState<NewsletterData>(
    savedFormData || initialData || {
      title: 'KL WEEKLY REPORT',
      subtitle: 'Elite Trading Insights & Community Highlights',
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      weekRange: '',
      edition: '',
      sections: [],
      footer: {
        companyName: 'KL Trading Community',
        websiteUrl: 'https://kltrading.com',
        unsubscribeUrl: 'https://kltrading.com/unsubscribe',
        socialLinks: {
          twitter: 'https://twitter.com/kltrading',
          discord: 'https://discord.gg/kltrading',
          linkedin: 'https://linkedin.com/company/kltrading'
        }
      }
    }
  );

  const [activeTab, setActiveTab] = useState<'basic' | 'trades' | 'trader-spotlight' | 'community-news' | 'news' | 'daily-news'>('basic');

  // Trade form state
  const [newTrade, setNewTrade] = useState<Partial<TraderTrade>>({
    traderName: '',
    symbol: '',
    pointsGained: 0,
    date: '',
    modelsUsed: '',
    tradeLinks: '',
    notes: ''
  });

  // Trader of the week form state
  const [traderOfWeek, setTraderOfWeek] = useState<Partial<TraderOfWeek>>({
    traderName: '',
    timeInKL: '',
    cashbackEarned: 0,
    favoriteSymbol: '',
    favoriteTradingModel: '',
    testimonial: ''
  });

  // Daily news form state
  const [dailyNews, setDailyNews] = useState<DailyNews>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: []
  });

  const [newNewsItems, setNewNewsItems] = useState<{[key: string]: string}>({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: ''
  });

  // Community news form state
  const [communityNews, setCommunityNews] = useState<CommunityNewsItem[]>([]);
  const [newCommunityNews, setNewCommunityNews] = useState<Partial<CommunityNewsItem>>({
    title: '',
    description: '',
    type: 'announcement',
    date: '',
    author: '',
    link: ''
  });

  // Simple News section state
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newNews, setNewNews] = useState<Partial<NewsItem>>({
    title: '',
    description: '',
    link: ''
  });

  const [trades, setTrades] = useState<TraderTrade[]>([]);

  // Load saved data on component mount
  useEffect(() => {
    try {
      const savedTrades = localStorage.getItem('newsletter-trades');
      if (savedTrades) {
        setTrades(JSON.parse(savedTrades));
      }

      const savedTraderOfWeek = localStorage.getItem('newsletter-trader-of-week');
      if (savedTraderOfWeek) {
        setTraderOfWeek(JSON.parse(savedTraderOfWeek));
      }

      const savedDailyNews = localStorage.getItem('newsletter-daily-news');
      if (savedDailyNews) {
        setDailyNews(JSON.parse(savedDailyNews));
      }

      const savedCommunityNews = localStorage.getItem('newsletter-community-news');
      if (savedCommunityNews) {
        setCommunityNews(JSON.parse(savedCommunityNews));
      }

      const savedNews = localStorage.getItem('newsletter-news');
      if (savedNews) {
        setNewsItems(JSON.parse(savedNews));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('newsletter-form-basic', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('newsletter-trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('newsletter-trader-of-week', JSON.stringify(traderOfWeek));
  }, [traderOfWeek]);

  useEffect(() => {
    localStorage.setItem('newsletter-daily-news', JSON.stringify(dailyNews));
  }, [dailyNews]);

  useEffect(() => {
    localStorage.setItem('newsletter-community-news', JSON.stringify(communityNews));
  }, [communityNews]);

  useEffect(() => {
    localStorage.setItem('newsletter-news', JSON.stringify(newsItems));
  }, [newsItems]);

  const addTrade = () => {
    if (newTrade.traderName && newTrade.symbol && newTrade.date && newTrade.modelsUsed) {
      const trade: TraderTrade = {
        id: Date.now().toString(),
        traderName: newTrade.traderName!,
        symbol: newTrade.symbol!,
        pointsGained: newTrade.pointsGained || 0,
        date: newTrade.date!,
        modelsUsed: newTrade.modelsUsed!,
        tradeLinks: newTrade.tradeLinks || undefined,
        notes: newTrade.notes || undefined
      };

      setTrades([...trades, trade]);
      setNewTrade({
        traderName: '',
        symbol: '',
        pointsGained: 0,
        date: '',
        modelsUsed: '',
        tradeLinks: '',
        notes: ''
      });
    }
  };

  const addNewsItem = (day: keyof DailyNews) => {
    const headline = newNewsItems[day].trim();
    if (headline) {
      const newsItem: DailyNewsItem = {
        id: Date.now().toString(),
        headline: headline
      };

      setDailyNews(prev => ({
        ...prev,
        [day]: [...prev[day], newsItem]
      }));

      setNewNewsItems(prev => ({
        ...prev,
        [day]: ''
      }));
    }
  };

  const removeNewsItem = (day: keyof DailyNews, itemId: string) => {
    setDailyNews(prev => ({
      ...prev,
      [day]: prev[day].filter(item => item.id !== itemId)
    }));
  };

  const addCommunityNews = () => {
    if (newCommunityNews.title && newCommunityNews.description && newCommunityNews.date) {
      const communityNewsItem: CommunityNewsItem = {
        id: Date.now().toString(),
        title: newCommunityNews.title!,
        description: newCommunityNews.description!,
        type: newCommunityNews.type!,
        date: newCommunityNews.date!,
        author: newCommunityNews.author || undefined,
        link: newCommunityNews.link || undefined
      };

      setCommunityNews([...communityNews, communityNewsItem]);
      setNewCommunityNews({
        title: '',
        description: '',
        type: 'announcement',
        date: '',
        author: '',
        link: ''
      });
    }
  };

  const addNews = () => {
    if (newNews.title && newNews.description) {
      const item: NewsItem = {
        id: Date.now().toString(),
        title: newNews.title!,
        description: newNews.description!,
        link: newNews.link || undefined,
        author: newNews.author || undefined
      };
      setNewsItems([...newsItems, item]);
      setNewNews({ title: '', description: '', link: '' });
    }
  };

  const handleSubmit = () => {
    
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
    if (traderOfWeek.traderName && traderOfWeek.testimonial) {
      sections.push({
        id: 'trader-of-week',
        title: '⭐ KL Trader of the Week',
        traderOfWeek: {
          id: 'trader-spotlight',
          traderName: traderOfWeek.traderName!,
          timeInKL: traderOfWeek.timeInKL!,
          cashbackEarned: traderOfWeek.cashbackEarned!,
          favoriteSymbol: traderOfWeek.favoriteSymbol!,
          favoriteTradingModel: traderOfWeek.favoriteTradingModel!,
          testimonial: traderOfWeek.testimonial!
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

    // Add News section if exists
    if (newsItems.length > 0) {
      sections.push({
        id: 'news',
        title: '🗞️ News',
        newsItems
      });
    }

    // Add daily news section if any day has news items
    const hasNewsItems = Object.values(dailyNews).some(dayItems => dayItems.length > 0);
    if (hasNewsItems) {
      sections.push({
        id: 'daily-news',
        title: '📰 Economic News',
        dailyNews: dailyNews
      });
    }

    const newsletterData: NewsletterData = {
      ...formData,
      sections
    };

    onSubmit(newsletterData);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all saved form data? This cannot be undone.')) {
      localStorage.removeItem('newsletter-form-basic');
      localStorage.removeItem('newsletter-trades');
      localStorage.removeItem('newsletter-trader-of-week');
      localStorage.removeItem('newsletter-daily-news');
      localStorage.removeItem('newsletter-community-news');
      
      // Reset all form states
      setFormData({
        title: 'KL WEEKLY REPORT',
        subtitle: 'Elite Trading Insights & Community Highlights',
        date: new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        weekRange: '',
        edition: '',
        sections: [],
        footer: {
          companyName: 'KL Trading Community',
          websiteUrl: 'https://kltrading.com',
          unsubscribeUrl: 'https://kltrading.com/unsubscribe',
          socialLinks: {
            twitter: 'https://twitter.com/kltrading',
            discord: 'https://discord.gg/kltrading',
            linkedin: 'https://linkedin.com/company/kltrading'
          }
        }
      });
      setTrades([]);
      setTraderOfWeek({
        traderName: '', timeInKL: '', cashbackEarned: 0, favoriteSymbol: '', favoriteTradingModel: '', testimonial: ''
      });
      setDailyNews({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] });
      setCommunityNews([]);
      setNewTrade({
        traderName: '', symbol: '', pointsGained: 0, date: '', modelsUsed: '', tradeLinks: '', notes: ''
      });
      setNewCommunityNews({
        title: '', description: '', type: 'announcement', date: '', author: '', link: ''
      });
    }
  };

  return (
    <div className="newsletter-form-container">
      <div className="form-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Create KL Newsletter</h2>
            <p>Fill in the details to generate your weekly trading newsletter</p>
          </div>
          <button 
            type="button" 
            onClick={clearAllData}
            className="btn btn-secondary"
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            Clear All Data
          </button>
        </div>
      </div>

      <div className="form-tabs">
        <button 
          className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Info
        </button>
        <button 
          className={`tab ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          Kingline Traders ({trades.length})
        </button>
        <button 
          className={`tab ${activeTab === 'trader-spotlight' ? 'active' : ''}`}
          onClick={() => setActiveTab('trader-spotlight')}
        >
          Trader Spotlight
        </button>
        <button 
          className={`tab ${activeTab === 'community-news' ? 'active' : ''}`}
          onClick={() => setActiveTab('community-news')}
        >
          Community News ({communityNews.length})
        </button>
        <button 
          className={`tab ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          News ({newsItems.length})
        </button>
        <button 
          className={`tab ${activeTab === 'daily-news' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily-news')}
        >
          Daily News ({Object.values(dailyNews).reduce((total, dayItems) => total + dayItems.length, 0)})
        </button>
      </div>

            <div className="newsletter-form">
        {activeTab === 'basic' && (
          <div className="form-section">
            <h3>Newsletter Details</h3>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="KL WEEKLY REPORT"
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                placeholder="Elite Trading Insights & Community Highlights"
              />
            </div>
            <div className="form-group">
              <label>Edition</label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => setFormData({...formData, edition: e.target.value})}
                placeholder="Edition 1"
              />
            </div>
            <div className="form-group">
              <label>Week Range</label>
              <input
                type="text"
                value={formData.weekRange}
                onChange={(e) => setFormData({...formData, weekRange: e.target.value})}
                placeholder="September 1st - 5th, 2024"
              />
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="form-section">
            <h3>News</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-6)' }}>
              General news items. Displayed like Community News but without type/date.
            </p>

            <div className="community-news-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newNews.title || ''}
                  onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                  placeholder="Headline title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newNews.description || ''}
                  onChange={(e) => setNewNews({ ...newNews, description: e.target.value })}
                  placeholder="Short description"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Link (Optional)</label>
                <input
                  type="url"
                  value={newNews.link || ''}
                  onChange={(e) => setNewNews({ ...newNews, link: e.target.value })}
                  placeholder="https://example.com/article"
                />
              </div>
              <button type="button" onClick={addNews} className="btn btn-secondary" disabled={!(newNews.title && newNews.description)}>
                Add News Item
              </button>
            </div>

            {newsItems.length > 0 && (
              <div className="community-news-list">
                <h4>Added News ({newsItems.length})</h4>
                {newsItems.map((item, index) => (
                  <div key={item.id} className="community-news-preview">
                    <div className="community-news-preview-title">{item.title}</div>
                    <div className="community-news-preview-description">{item.description}</div>
                    {item.link && (
                      <div className="community-news-preview-meta">
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="read-more">Read More →</a>
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setNewsItems(newsItems.filter((_, i) => i !== index))}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="form-section">
            <h3>Kingline Traders Performance</h3>
            <div className="trade-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Trader Name</label>
                  <input
                    type="text"
                    value={newTrade.traderName}
                    onChange={(e) => setNewTrade({...newTrade, traderName: e.target.value})}
                    placeholder="JD_Astra"
                  />
                </div>
                <div className="form-group">
                  <label>Symbol</label>
                  <input
                    type="text"
                    value={newTrade.symbol}
                    onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value.toUpperCase()})}
                    placeholder="MNQ"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Points Gained</label>
                  <input
                    type="number"
                    value={newTrade.pointsGained}
                    onChange={(e) => setNewTrade({...newTrade, pointsGained: parseFloat(e.target.value)})}
                    placeholder="150"
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="text"
                    value={newTrade.date}
                    onChange={(e) => setNewTrade({...newTrade, date: e.target.value})}
                    placeholder="Dec 15, 2024"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Models Used</label>
                <input
                  type="text"
                  value={newTrade.modelsUsed}
                  onChange={(e) => setNewTrade({...newTrade, modelsUsed: e.target.value})}
                  placeholder="Q3 Inverse"
                />
              </div>
              <div className="form-group">
                <label>Links to Trades (Optional)</label>
                <input
                  type="url"
                  value={newTrade.tradeLinks}
                  onChange={(e) => setNewTrade({...newTrade, tradeLinks: e.target.value})}
                  placeholder="https://twitter.com/username/status/123456789"
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                  placeholder="Perfect setup with strong momentum confirmation..."
                  rows={3}
                />
              </div>
              <button type="button" onClick={addTrade} className="btn btn-secondary">
                Add Trade
              </button>
            </div>

            {trades.length > 0 && (
              <div className="trades-list">
                <h4>Added Trades ({trades.length})</h4>
                {trades.map((trade, index) => (
                  <div key={trade.id} className="trade-preview">
                    <div className="trade-preview-header">
                      <span className="trade-symbol">{trade.symbol}</span>
                      <span className={`trade-pnl ${trade.pointsGained >= 0 ? 'positive' : 'negative'}`}>
                        {trade.pointsGained >= 0 ? '+' : ''}{trade.pointsGained} pts
                      </span>
                    </div>
                    <div className="trade-preview-details">
                      {trade.traderName} • {trade.modelsUsed} • {trade.date}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setTrades(trades.filter((_, i) => i !== index))}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trader-spotlight' && (
          <div className="form-section">
            <h3>Trader of the Week Spotlight</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Trader Name</label>
                <input
                  type="text"
                  value={traderOfWeek.traderName}
                  onChange={(e) => setTraderOfWeek({...traderOfWeek, traderName: e.target.value})}
                  placeholder=""
                />
              </div>
              <div className="form-group">
                <label>Time in KL</label>
                <input
                  type="text"
                  value={traderOfWeek.timeInKL}
                  onChange={(e) => setTraderOfWeek({...traderOfWeek, timeInKL: e.target.value})}
                  placeholder=""
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cashback Earned</label>
                <input
                  type="number"
                  value={traderOfWeek.cashbackEarned}
                  onChange={(e) => setTraderOfWeek({...traderOfWeek, cashbackEarned: parseFloat(e.target.value)})}
                  placeholder=""
                />
              </div>
              <div className="form-group">
                <label>Favorite Symbol</label>
                <input
                  type="text"
                  value={traderOfWeek.favoriteSymbol}
                  onChange={(e) => setTraderOfWeek({...traderOfWeek, favoriteSymbol: e.target.value.toUpperCase()})}
                  placeholder=""
                />
              </div>
            </div>
            <div className="form-group">
              <label>Favorite Trading Model</label>
              <input
                type="text"
                value={traderOfWeek.favoriteTradingModel}
                onChange={(e) => setTraderOfWeek({...traderOfWeek, favoriteTradingModel: e.target.value})}
                placeholder=""
              />
            </div>
            <div className="form-group">
              <label>Testimonial/Anything to Say</label>
              <textarea
                value={traderOfWeek.testimonial}
                onChange={(e) => setTraderOfWeek({...traderOfWeek, testimonial: e.target.value})}
                placeholder="KL has completely transformed my trading journey. The community support and educational resources are unmatched..."
                rows={4}
              />
            </div>
          </div>
        )}

        {activeTab === 'community-news' && (
          <div className="form-section">
            <h3>Kingline Community News</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-6)' }}>
              Add community updates, announcements, events, and achievements to showcase what's happening in the Kingline community.
            </p>
            
            <div className="community-news-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newCommunityNews.title}
                  onChange={(e) => setNewCommunityNews({...newCommunityNews, title: e.target.value})}
                  placeholder="New Trading Challenge Launched"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newCommunityNews.description}
                  onChange={(e) => setNewCommunityNews({...newCommunityNews, description: e.target.value})}
                  placeholder="Join our monthly trading challenge and compete with fellow KL members for prizes and recognition..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newCommunityNews.type}
                    onChange={(e) => setNewCommunityNews({...newCommunityNews, type: e.target.value as CommunityNewsItem['type']})}
                  >
                    <option value="announcement">Announcement</option>
                    <option value="event">Event</option>
                    <option value="achievement">Achievement</option>
                    <option value="update">Update</option>
                    <option value="feature">Feature</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="text"
                    value={newCommunityNews.date}
                    onChange={(e) => setNewCommunityNews({...newCommunityNews, date: e.target.value})}
                    placeholder="Dec 15, 2024"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Author (Optional)</label>
                  <input
                    type="text"
                    value={newCommunityNews.author}
                    onChange={(e) => setNewCommunityNews({...newCommunityNews, author: e.target.value})}
                    placeholder="KL Team"
                  />
                </div>
                <div className="form-group">
                  <label>Link (Optional)</label>
                  <input
                    type="url"
                    value={newCommunityNews.link}
                    onChange={(e) => setNewCommunityNews({...newCommunityNews, link: e.target.value})}
                    placeholder="https://kltrading.com/challenge"
                  />
                </div>
              </div>

              <button type="button" onClick={addCommunityNews} className="btn btn-secondary">
                Add Community News
              </button>
            </div>

            {communityNews.length > 0 && (
              <div className="community-news-list">
                <h4>Added Community News ({communityNews.length})</h4>
                {communityNews.map((item, index) => (
                  <div key={item.id} className="community-news-preview">
                    <div className="community-news-preview-title">{item.title}</div>
                    <div className={`community-news-preview-type ${item.type}`} style={{
                      backgroundColor: item.type === 'announcement' ? 'rgba(212, 175, 55, 0.2)' :
                                     item.type === 'event' ? 'rgba(0, 212, 170, 0.2)' :
                                     item.type === 'achievement' ? 'rgba(34, 197, 94, 0.2)' :
                                     item.type === 'update' ? 'rgba(139, 148, 158, 0.2)' :
                                     'rgba(99, 102, 241, 0.2)',
                      color: item.type === 'announcement' ? 'var(--primary-color)' :
                             item.type === 'event' ? 'var(--accent-color)' :
                             item.type === 'achievement' ? 'var(--success-color)' :
                             item.type === 'update' ? 'var(--secondary-color)' :
                             '#6366f1'
                    }}>
                      {item.type}
                    </div>
                    <div className="community-news-preview-description">{item.description}</div>
                    <div className="community-news-preview-meta">
                      {item.date} {item.author && `• By ${item.author}`}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setCommunityNews(communityNews.filter((_, i) => i !== index))}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'daily-news' && (
          <div className="form-section">
            <h3>Daily Economic News</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-6)' }}>
              Add news headlines for each day of the week. These will be displayed in separate panes.
            </p>
            
            <div className="daily-news-form">
              <div className="daily-news-form-grid">
                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => (
                  <div key={day} className="daily-news-day-form">
                    <div className="daily-news-day-title">{day}</div>
                    
                    <div className="news-item-input">
                      <input
                        type="text"
                        value={newNewsItems[day]}
                        onChange={(e) => setNewNewsItems(prev => ({ ...prev, [day]: e.target.value }))}
                        placeholder="Enter news headline..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addNewsItem(day);
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => addNewsItem(day)}
                        disabled={!newNewsItems[day].trim()}
                      >
                        Add
                      </button>
                    </div>

                    <div className="news-items-list">
                      {dailyNews[day].map((item) => (
                        <div key={item.id} className="news-item-preview">
                          {item.headline}
                          <button
                            type="button"
                            className="news-item-remove"
                            onClick={() => removeNewsItem(day, item.id)}
                            title="Remove item"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      
      <div className="form-actions">
        <button 
          onClick={handleSubmit} 
          className="btn btn-primary"
          type="button"
        >
          Generate Newsletter
        </button>
      </div>
    </div>
  );
};

export default NewsletterForm;
