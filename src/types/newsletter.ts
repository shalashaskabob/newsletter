export interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  url?: string;
}

export interface DailyNewsItem {
  id: string;
  headline: string;
  details?: string;
}

export interface DailyNews {
  monday: DailyNewsItem[];
  tuesday: DailyNewsItem[];
  wednesday: DailyNewsItem[];
  thursday: DailyNewsItem[];
  friday: DailyNewsItem[];
}

export interface CommunityNewsItem {
  id: string;
  title: string;
  description: string;
  type: 'announcement' | 'event' | 'achievement' | 'update' | 'feature';
  date: string;
  author?: string;
  link?: string;
}

export interface TraderTrade {
  id: string;
  traderName: string;
  symbol: string;
  pointsGained: number;
  date: string;
  modelsUsed: string;
  tradeLinks?: string;
  notes?: string;
}

export interface TraderOfWeek {
  id: string;
  traderName: string;
  profileImage?: string;
  timeInKL: string;
  cashbackEarned: number;
  favoriteSymbol: string;
  favoriteTradingModel: string;
  testimonial: string;
}

export interface NewsletterSection {
  id: string;
  title: string;
  articles?: Article[];
  traderTrades?: TraderTrade[];
  traderOfWeek?: TraderOfWeek;
  dailyNews?: DailyNews;
  communityNews?: CommunityNewsItem[];
}

export interface NewsletterData {
  title: string;
  subtitle: string;
  date: string;
  weekRange: string;
  sections: NewsletterSection[];
  footer: {
    companyName: string;
    unsubscribeUrl?: string;
    websiteUrl?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      discord?: string;
    };
  };
}
