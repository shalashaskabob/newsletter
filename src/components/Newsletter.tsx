import React from 'react';
import { NewsletterData, TraderTrade, TraderOfWeek, DailyNews, CommunityNewsItem, NewsItem } from '../types/newsletter';

interface NewsletterProps {
  data: NewsletterData;
}

const Newsletter: React.FC<NewsletterProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderNews = (items: NewsItem[]) => (
    <div className="community-news-container">
      {items.map((item) => (
        <div key={item.id} className="community-news-item">
          <h3 className="community-news-title">{item.title}</h3>
          <p className="community-news-description" dangerouslySetInnerHTML={{ __html: item.description }} />
          {item.link && (
            <a href={item.link} className="community-news-link" target="_blank" rel="noopener noreferrer">
              Read More →
            </a>
          )}
        </div>
      ))}
    </div>
  );


  const renderTradeCard = (trade: TraderTrade) => (
    <div key={trade.id} className="trade-card">
      <div className="trade-header">
        <span className="trade-symbol">{trade.symbol}</span>
        <span className={`trade-points ${trade.pointsGained >= 0 ? 'positive' : 'negative'}`}>
          {trade.pointsGained >= 0 ? '+' : ''}{trade.pointsGained} pts
        </span>
      </div>
      
      <div className="trade-details">
        <div className="trade-detail">
          <strong>Models:</strong> {trade.modelsUsed}
        </div>
        {trade.tradeLinks && (
          <div className="trade-detail" style={{ gridColumn: '1 / -1', marginTop: 'var(--spacing-3)' }}>
            <strong>Links:</strong>
            <a 
              href={trade.tradeLinks} 
              target="_blank" 
              rel="noopener noreferrer"
              className="trade-link"
            >
              View Trade →
            </a>
          </div>
        )}
      </div>

      <div
        className="trade-trader"
        style={{
          marginTop: 'var(--spacing-2)',
          fontSize: 'var(--font-size-lg)',
          color: 'var(--primary-color)',
          fontWeight: 700,
          letterSpacing: '-0.01em'
        }}
      >
        {trade.traderName}
      </div>

      {trade.notes && (
        <div className="trade-notes" style={{ marginTop: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{trade.notes}"
        </div>
      )}
    </div>
  );

  const renderCommunityNews = (communityNews: CommunityNewsItem[]) => (
    <div className="community-news-container">
      {communityNews.map((item) => (
        <div key={item.id} className="community-news-item">
          <div className={`community-news-type ${item.type}`}>
            {item.type}
          </div>
          <h3 className="community-news-title">{item.title}</h3>
          <p className="community-news-description" dangerouslySetInnerHTML={{ __html: item.description }} />
          {item.link && (
            <a href={item.link} className="community-news-link" target="_blank" rel="noopener noreferrer">
              Read More →
            </a>
          )}
          <div className="community-news-meta">
            <span className="community-news-date">{item.date}</span>
            {item.author && (
              <span className="community-news-author">By {item.author}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDailyNews = (dailyNews: DailyNews) => {
    const days = [
      { key: 'monday', label: 'Monday', data: dailyNews.monday },
      { key: 'tuesday', label: 'Tuesday', data: dailyNews.tuesday },
      { key: 'wednesday', label: 'Wednesday', data: dailyNews.wednesday },
      { key: 'thursday', label: 'Thursday', data: dailyNews.thursday },
      { key: 'friday', label: 'Friday', data: dailyNews.friday },
    ];

    return (
      <div className="daily-news-container">
        {days.map((day) => (
          <div key={day.key} className="daily-news-pane">
            <div className="daily-news-day">{day.label}</div>
            <ul className="daily-news-items">
              {day.data.map((item) => (
                <li key={item.id} className="daily-news-item">
                  <div className="daily-news-headline">{item.headline}</div>
                  {item.details && (
                    <div className="daily-news-details">{item.details}</div>
                  )}
                </li>
              ))}
              {day.data.length === 0 && (
                <li className="daily-news-item">
                  <div className="daily-news-headline" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No news items for this day
                  </div>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderTraderOfWeek = (trader: TraderOfWeek) => (
    <div className="trader-spotlight">
      <div className="trader-header">
        <div className="trader-avatar">
          {trader.profileImage ? (
            <img src={trader.profileImage} alt={trader.traderName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          ) : (
            trader.traderName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="trader-info">
          <h3>{trader.traderName}</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            KL Member for {trader.timeInKL}
          </p>
        </div>
      </div>

      <div className="trader-stats">
        <div className="stat-item">
          <span className="stat-value">{formatCurrency(trader.cashbackEarned)}</span>
          <span className="stat-label">Cashback Earned</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{trader.favoriteSymbol}</span>
          <span className="stat-label">Favorite Symbol</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{trader.favoriteTradingModel}</span>
          <span className="stat-label">Favorite Model</span>
        </div>
      </div>

      <div className="trader-testimonial">
        "{trader.testimonial}"
      </div>
    </div>
  );

  return (
    <div className="newsletter-container">
      {/* Header */}
      <header className="newsletter-header" style={{ position: 'relative' }}>
        <img src="/logo.svg" alt="KL Logo" className="newsletter-logo" />
        {data.edition && (
          <div className="newsletter-edition" style={{ 
            position: 'absolute', 
            top: 'var(--spacing-4)', 
            right: 'var(--spacing-6)', 
            fontSize: 'var(--font-size-base)', 
            fontWeight: '600', 
            color: 'var(--primary-color)' 
          }}>
            {data.edition}
          </div>
        )}
        <h1 className="newsletter-title">{data.title}</h1>
        <p className="newsletter-subtitle">{data.subtitle}</p>
        {data.weekRange && (
          <div className="newsletter-week-range" style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8, marginTop: 'var(--spacing-2)' }}>
            {data.weekRange}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="newsletter-content">
        {data.sections.map((section) => (
          <section key={section.id} className="newsletter-section">
            <h2 className="section-title">{section.title}</h2>
            
            {/* Regular Articles */}
            {section.articles && section.articles.map((article) => (
              <article key={article.id} className="article-card">
                <h3 className="article-title">{article.title}</h3>
                <p className="article-excerpt">{article.excerpt}</p>
                <div className="article-meta">
                  <span>By {article.author}</span>
                  <div>
                    <span>{article.readTime}</span>
                    {article.url && (
                      <>
                        <span> • </span>
                        <a href={article.url} className="read-more">
                          Read More
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {/* Trader Trades Section removed per request */}

            {/* Community News Section */}
            {section.communityNews && renderCommunityNews(section.communityNews)}

            {/* Daily News Section */}
            {section.dailyNews && renderDailyNews(section.dailyNews)}

            {/* News Section (simple) */}
            {section.newsItems && renderNews(section.newsItems)}

            {/* Custom Section */}
            {(section.customHtml || section.imageDataUrl) && (
              <div className="community-news-container">
                <div className="community-news-item">
                  {section.customHtml && (
                    <div className="community-news-description" dangerouslySetInnerHTML={{ __html: section.customHtml }} />
                  )}
                  {section.imageDataUrl && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                      <img
                        src={section.imageDataUrl}
                        alt="section"
                        style={{ maxWidth: '100%', borderRadius: '12px', display: 'block', margin: '0 auto' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trader of the Week Section removed per request */}
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="newsletter-footer">
        <div className="footer-text">
          <p>© 2025 {data.footer.companyName}. All rights reserved.</p>
        </div>
        
        <div className="footer-links">
          {data.footer.websiteUrl && (
            <a href={data.footer.websiteUrl} className="footer-link" target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          )}
          {data.footer.socialLinks?.twitter && (
            <a href={data.footer.socialLinks.twitter} className="footer-link" target="_blank" rel="noopener noreferrer">
              X
            </a>
          )}
          {data.footer.socialLinks?.discord && (
            <a href={data.footer.socialLinks.discord} className="footer-link" target="_blank" rel="noopener noreferrer">
              Discord
            </a>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Newsletter;
