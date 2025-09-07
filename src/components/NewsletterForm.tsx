import React, { useState, useEffect } from 'react';
import { NewsletterData, TraderTrade, TraderOfWeek, DailyNews, DailyNewsItem, CommunityNewsItem, NewsItem } from '../types/newsletter';
import RichText from './RichText';

interface NewsletterFormProps {
  onSubmit: (data: NewsletterData) => void;
  initialData?: NewsletterData;
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({ onSubmit, initialData }) => {
  // Helper: compress an image file and return a data URL
  const fileToDataUrlCompressed = async (file: File, maxWidth = 1400, maxHeight = 1400, quality = 0.9): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Selected file is not an image');
    }

    const drawToCanvas = (source: any, width: number, height: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(source, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', quality);
    };

    // Prefer createImageBitmap for robustness
    if ('createImageBitmap' in window) {
      const bitmap = await createImageBitmap(file).catch(() => null as any);
      if (bitmap) {
        let width = bitmap.width;
        let height = bitmap.height;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const dataUrl = drawToCanvas(bitmap, width, height);
        // @ts-ignore close might not exist in some browsers
        if (typeof (bitmap as any).close === 'function') { (bitmap as any).close(); }
        return dataUrl;
      }
    }

    // Fallback: use Image with Object URL
    return new Promise((resolve, reject) => {
      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.naturalWidth;
            let height = img.naturalHeight;
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
            const dataUrl = drawToCanvas(img, width, height);
            URL.revokeObjectURL(objectUrl);
            resolve(dataUrl);
          } catch (err) {
            URL.revokeObjectURL(objectUrl);
            reject(err);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Image load failed'));
        };
        img.src = objectUrl;
      } catch (e) {
        reject(e as Error);
      }
    });
  };
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

  const [activeTab, setActiveTab] = useState<'basic' | 'community-news' | 'news' | 'custom' | 'daily-news'>('basic');

  // Removed trades and trader of week state per request

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

  // Custom sections
  const [customSections, setCustomSections] = useState<Array<{ id: string; title: string; customHtml?: string; imageDataUrl?: string }>>([]);
  const [newCustom, setNewCustom] = useState<{ title: string; customHtml: string; imageDataUrl?: string }>({ title: '', customHtml: '' });

  // Removed trades list per request

  // Load saved data on component mount
  useEffect(() => {
    try {
      // Removed trades and trader of week load

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

      const savedCustom = localStorage.getItem('newsletter-custom');
      if (savedCustom) {
        setCustomSections(JSON.parse(savedCustom));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('newsletter-form-basic', JSON.stringify(formData));
  }, [formData]);

  // Removed trades/trader-of-week persistence

  useEffect(() => {
    localStorage.setItem('newsletter-daily-news', JSON.stringify(dailyNews));
  }, [dailyNews]);

  useEffect(() => {
    localStorage.setItem('newsletter-community-news', JSON.stringify(communityNews));
  }, [communityNews]);

  useEffect(() => {
    localStorage.setItem('newsletter-news', JSON.stringify(newsItems));
  }, [newsItems]);

  useEffect(() => {
    localStorage.setItem('newsletter-custom', JSON.stringify(customSections));
  }, [customSections]);

  // Removed trade add logic

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

  const addCustomSection = () => {
    if (!newCustom.title || (!newCustom.customHtml && !newCustom.imageDataUrl)) return;
    setCustomSections(prev => [...prev, { id: Date.now().toString(), title: newCustom.title, customHtml: newCustom.customHtml, imageDataUrl: newCustom.imageDataUrl }]);
    setNewCustom({ title: '', customHtml: '' });
  };

  const onPickCustomImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrlCompressed(file);
      setNewCustom(prev => ({ ...prev, imageDataUrl: dataUrl }));
    } catch (err) {
      console.error('Failed to process image', err);
      alert('Could not process image. Please try a different image.');
    }
  };

  const handleSubmit = () => {
    
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

    // Add custom sections (each as its own block)
    customSections.forEach(cs => {
      sections.push({ id: `custom-${cs.id}`, title: cs.title, customHtml: cs.customHtml, imageDataUrl: cs.imageDataUrl });
    });

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
      // Cleared keys removed per request
      localStorage.removeItem('newsletter-daily-news');
      localStorage.removeItem('newsletter-community-news');
      localStorage.removeItem('newsletter-news');
      localStorage.removeItem('newsletter-custom');

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
      // Removed traders and trader-of-week resets
      setDailyNews({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] });
      setCommunityNews([]);
      setNewsItems([]);
      setCustomSections([]);
      setNewCommunityNews({
        title: '', description: '', type: 'announcement', date: '', author: '', link: ''
      });
      setNewNews({ title: '', description: '', link: '' });
      setNewCustom({ title: '', customHtml: '' });
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
          className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Custom Sections ({customSections.length})
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

        {activeTab === 'custom' && (
          <div className="form-section">
            <h3>Custom Sections</h3>
            <div className="community-news-form">
              <div className="form-group">
                <label>Section Title</label>
                <input type="text" value={newCustom.title} onChange={(e)=>setNewCustom({...newCustom, title: e.target.value})} placeholder="Cozy Calendar" />
              </div>
              <div className="form-group">
                <label>Formatted Content (optional)</label>
                <RichText value={newCustom.customHtml} onChange={(html)=>setNewCustom({...newCustom, customHtml: html})} placeholder="Write content..." />
              </div>
              <div className="form-group">
                <label>Image (optional)</label>
                <input type="file" accept="image/*" onChange={onPickCustomImage} />
                {newCustom.imageDataUrl && (
                  <div style={{marginTop: '8px'}}>
                    <img src={newCustom.imageDataUrl} alt="preview" style={{maxWidth:'100%', borderRadius:'8px'}} />
                  </div>
                )}
              </div>
              <button type="button" className="btn btn-secondary" onClick={addCustomSection} disabled={!newCustom.title || (!newCustom.customHtml && !newCustom.imageDataUrl)}>Add Custom Section</button>
            </div>

            {customSections.length>0 && (
              <div className="community-news-list">
                <h4>Added Custom Sections ({customSections.length})</h4>
                {customSections.map((cs, idx)=> (
                  <div key={cs.id} className="community-news-preview">
                    <div className="community-news-preview-title">{cs.title}</div>
                    {cs.customHtml && (<div className="community-news-preview-description" dangerouslySetInnerHTML={{__html: cs.customHtml}} />)}
                    {cs.imageDataUrl && (<div style={{marginTop:'8px'}}><img src={cs.imageDataUrl} alt="custom" style={{maxWidth:'100%', borderRadius:'8px'}}/></div>)}
                    <div style={{marginTop:'8px'}}>
                      <button type="button" className="remove-btn" onClick={()=> setCustomSections(customSections.filter((_,i)=>i!==idx))}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <RichText
                  value={newNews.description || ''}
                  onChange={(html) => setNewNews({ ...newNews, description: html })}
                  placeholder="Write description with formatting..."
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
                    <div className="community-news-preview-description" dangerouslySetInnerHTML={{ __html: item.description || '' }} />
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
                <RichText
                  value={newCommunityNews.description || ''}
                  onChange={(html) => setNewCommunityNews({ ...newCommunityNews, description: html })}
                  placeholder="Write description with formatting..."
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
