import { useEffect, useState } from 'react';
import Newsletter from './components/Newsletter';
import NewsletterForm from './components/NewsletterForm';
import { sampleNewsletterData } from './data/sampleNewsletter';
import EmojiPane from './components/EmojiPane';
import { NewsletterData } from './types/newsletter';

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState<'form' | 'preview'>('form');
  const [newsletterData, setNewsletterData] = useState<NewsletterData>({ ...sampleNewsletterData, fontScale: 1 });
  const [showSavePicker, setShowSavePicker] = useState(false);
  const [serverSaves, setServerSaves] = useState<Array<{ id: string; name?: string; mtimeMs: number; size: number }>>([]);
  const [selectedSaveId, setSelectedSaveId] = useState<string>('');
  const [loadingSaves, setLoadingSaves] = useState<boolean>(false);

  // Apply font scale to document root for preview
  useEffect(() => {
    const scale = newsletterData.fontScale ?? 1;
    document.documentElement.style.setProperty('font-size', `${16 * scale}px`);
    localStorage.setItem('newsletter-font-scale', String(scale));
    return () => {
      // no-op
    };
  }, [newsletterData.fontScale]);

  // Save/Load snapshot of all form-related state
  const handleSaveSnapshot = async () => {
    try {
      const snapshot = {
        basic: localStorage.getItem('newsletter-form-basic'),
        daily: localStorage.getItem('newsletter-daily-news'),
        community: localStorage.getItem('newsletter-community-news'),
        news: localStorage.getItem('newsletter-news'),
        custom: localStorage.getItem('newsletter-custom'),
        prop: localStorage.getItem('newsletter-prop-news'),
        font: localStorage.getItem('newsletter-font-scale')
      };
      localStorage.setItem('newsletter-snapshot', JSON.stringify(snapshot));
      // Also save server-side for cross-device use
      const desiredName = prompt('Enter a name for this save (optional):', 'My Newsletter');
      const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ snapshot, name: desiredName || undefined }) });
      if (res.ok) {
        const json = await res.json();
        if (json?.id) {
          localStorage.setItem('newsletter-shared-id', json.id);
          alert(`Saved as: ${json.name || json.id} (ID: ${json.id})`);
        } else {
          alert('Saved locally and on server.');
        }
      } else {
        alert('Saved locally. Server save failed.');
      }
    } catch (e) {
      alert('Failed to save.');
    }
  };

  const handleLoadSnapshotState = async () => {
    try {
      let raw = localStorage.getItem('newsletter-snapshot');
      // If user has a shared id, try server first
      const sharedId = localStorage.getItem('newsletter-shared-id');
      if (sharedId) {
        try {
          const res = await fetch(`/api/save/${sharedId}`);
          if (res.ok) {
            const json = await res.json();
            raw = JSON.stringify(json.snapshot || {});
          }
        } catch {}
      }
      if (!raw) {
        alert('No saved state found.');
        return;
      }
      const snap = JSON.parse(raw);
      if (snap.basic) localStorage.setItem('newsletter-form-basic', snap.basic);
      if (snap.daily) localStorage.setItem('newsletter-daily-news', snap.daily);
      if (snap.community) localStorage.setItem('newsletter-community-news', snap.community);
      if (snap.news) localStorage.setItem('newsletter-news', snap.news);
      if (snap.custom) localStorage.setItem('newsletter-custom', snap.custom);
      if (snap.prop) localStorage.setItem('newsletter-prop-news', snap.prop);
      if (snap.font) localStorage.setItem('newsletter-font-scale', snap.font);
      const currentNewsletterData = generateNewsletterFromCurrentData();
      setNewsletterData(currentNewsletterData);
      setCurrentView('form');
      alert('Loaded saved state.');
    } catch (e) {
      alert('Failed to load saved state.');
    }
  };

  // removed print preview per request

  const handleFormSubmit = (data: NewsletterData) => {
    setNewsletterData(data);
    setCurrentView('preview');
  };

  // removed Load Sample per request

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
          title: formData.labels?.communityNews || '🏛️ Kingline Community News',
          communityNews: communityNews
        });
      }

      // Add News section if exists
      if (newsItems.length > 0) {
        sections.push({
          id: 'news',
          title: formData.labels?.news || '🗞️ News',
          newsItems
        });
      }

      // Add daily news section if any day has news items
      if (dailyNews) {
        const hasNewsItems = Object.values(dailyNews).some((dayItems: any) => dayItems.length > 0);
        if (hasNewsItems) {
          sections.push({
            id: 'daily-news',
            title: formData.labels?.dailyNews || '📰 Economic News',
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

  const openSavePicker = async () => {
    try {
      setLoadingSaves(true);
      const res = await fetch('/api/saves');
      if (!res.ok) throw new Error('Failed to list saves');
      const json = await res.json();
      const items = (json?.items || []) as Array<{ id: string; name?: string; mtimeMs: number; size: number }>;
      setServerSaves(items);
      setSelectedSaveId(items[0]?.id || '');
      setShowSavePicker(true);
    } catch (e) {
      console.error(e);
      alert('Failed to load saves list.');
    } finally {
      setLoadingSaves(false);
    }
  };

  const handleLoadSelected = async () => {
    if (!selectedSaveId) { alert('Pick a save to load.'); return; }
    localStorage.setItem('newsletter-shared-id', selectedSaveId);
    await handleLoadSnapshotState();
    setShowSavePicker(false);
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
          onClick={handleSaveSnapshot}
        >
          Save
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={openSavePicker}
        >
          Load
        </button>
        {currentView === 'preview' && (
          <>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  const res = await fetch('/api/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newsletterData })
                  });
                  if (!res.ok) {
                    throw new Error('Failed to publish');
                  }
                  const json = await res.json();
                  if (json?.url) {
                    window.open(json.url, '_blank');
                  } else {
                    alert('Publish succeeded but no URL returned.');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Failed to publish newsletter.');
                }
              }}
            >
              Publish (Share Link)
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

      {showSavePicker && (
        <div
          onClick={() => setShowSavePicker(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 80,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: 12,
              minWidth: 320,
              maxWidth: '90vw'
            }}
          >
            <div style={{ marginBottom: 8, color: 'var(--text-primary)', fontWeight: 600 }}>Pick a saved file to load</div>
            {loadingSaves ? (
              <div style={{ color: 'var(--text-secondary)' }}>Loading…</div>
            ) : serverSaves.length ? (
              <select
                value={selectedSaveId}
                onChange={(e) => setSelectedSaveId(e.target.value)}
                style={{ width: '100%', padding: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 6 }}
              >
                {serverSaves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(s.name || s.id)} — {new Date(s.mtimeMs).toLocaleString()}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>No saves found.</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowSavePicker(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleLoadSelected} disabled={!selectedSaveId}>Load Selected</button>
            </div>
          </div>
        </div>
      )}
      <EmojiPane />
    </div>
  );
}

export default App;
