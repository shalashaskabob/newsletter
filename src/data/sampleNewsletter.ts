import { NewsletterData } from '../types/newsletter';

export const sampleNewsletterData: NewsletterData = {
  title: "KL WEEKLY REPORT",
  subtitle: "Elite Trading Insights & Community Highlights",
  date: new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  weekRange: "September 1st - 5th, 2024",
  edition: "Edition 1",
  sections: [
    {
      id: "official-trades",
      title: "🏆 Official KL Traders Performance",
      traderTrades: [
        {
          id: "1",
          traderName: "Alex Chen",
          symbol: "NVDA",
          pointsGained: 250,
          date: "Dec 15, 2024",
          modelsUsed: "Momentum, AI Breakout",
          tradeLinks: "https://twitter.com/AlexChenTrader/status/1234567890",
          notes: "Perfect AI momentum setup with strong volume confirmation. Entry at key support level."
        },
        {
          id: "2",
          traderName: "Sarah Martinez",
          symbol: "TSLA",
          pointsGained: 180,
          date: "Dec 14, 2024",
          modelsUsed: "EV Momentum, Breakout",
          notes: "Caught the breakout above resistance after Cybertruck delivery news."
        },
        {
          id: "3",
          traderName: "Mike Johnson",
          symbol: "SPY",
          pointsGained: -45,
          date: "Dec 13, 2024",
          modelsUsed: "Market Reversal, Short",
          notes: "Market rejection at key resistance. Quick scalp on weakness but hit stop loss."
        },
        {
          id: "4",
          traderName: "Emma Davis",
          symbol: "AAPL",
          pointsGained: 120,
          date: "Dec 12, 2024",
          modelsUsed: "Tech Momentum, Support Bounce",
          notes: "Strong bounce from 200MA support. Holiday season optimism driving momentum."
        }
      ]
    },
    {
      id: "trader-of-week",
      title: "⭐ KL Trader of the Week",
      traderOfWeek: {
        id: "trader-spotlight",
        traderName: "Marcus Thompson",
        timeInKL: "8 months",
        cashbackEarned: 3250,
        favoriteSymbol: "AMD",
        favoriteTradingModel: "Semiconductor Momentum",
        testimonial: "KL has completely transformed my trading journey. The community support and educational resources are unmatched. My favorite model is the semiconductor momentum strategy - it's helped me consistently identify breakout opportunities. The cashback program is incredible too, I've earned over $3,000 just from my regular trading!"
      }
    },
    {
      id: "community-news",
      title: "🏛️ Kingline Community News",
      communityNews: [
        {
          id: "comm1",
          title: "New Trading Challenge Launched",
          description: "Join our December trading challenge! Compete with fellow KL members for a chance to win $5,000 in prizes. Challenge runs from Dec 1-31 with weekly leaderboards and bonus rewards.",
          type: "event",
          date: "Dec 1, 2024",
          author: "KL Team",
          link: "https://kltrading.com/challenge"
        },
        {
          id: "comm2",
          title: "Community Milestone: 10,000 Members!",
          description: "We're thrilled to announce that the Kingline community has reached 10,000 active members! Thank you to everyone who makes this community amazing. Special celebration event coming soon.",
          type: "achievement",
          date: "Nov 28, 2024",
          author: "KL Leadership"
        },
        {
          id: "comm3",
          title: "New Educational Series: Options Mastery",
          description: "Starting next week, we're launching a comprehensive 8-part options trading series. Learn from our top traders and master advanced options strategies. Free for all KL members.",
          type: "announcement",
          date: "Dec 5, 2024",
          author: "Education Team"
        },
        {
          id: "comm4",
          title: "Mobile App Update v2.1",
          description: "Our mobile app has been updated with new features including real-time trade alerts, improved portfolio tracking, and enhanced chat functionality. Update available now on all platforms.",
          type: "update",
          date: "Nov 30, 2024",
          author: "Tech Team"
        }
      ]
    },
    {
      id: "daily-news",
      title: "📰 Economic News",
      dailyNews: {
        monday: [
          {
            id: "mon1",
            headline: "Stocks dropped following the holiday extended weekend ahead of the highly anticipated Nonfarm Payroll report on Friday."
          },
          {
            id: "mon2", 
            headline: "US ISM Manufacturing PMI Actual 48.7 (Forecast 48.0, Previous 48.0)"
          },
          {
            id: "mon3",
            headline: "European bond sales top €49.6 billion in a record-breaking day. Regional bonds plummeted, sparked by budgetary concerns in regions like France and Belgium."
          },
          {
            id: "mon4",
            headline: "US Judge releases sealed decision that shows Google is not required to sell all of Chrome in Antitrust Court Ruling, sparking the company's massive breakup."
          }
        ],
        tuesday: [
          {
            id: "tue1",
            headline: "Fed's Waller Speaks: 'Tariffs aren't likely to cause long-run inflation.' 'We know we'll have a blip of inflation, but it won't be permanent and 6 months will get us closer to 2%.'"
          },
          {
            id: "tue2",
            headline: "Fed's Musalem Speaks: 'There is a risk the labor market will slow more than expected.' 'There increased up the labor market risks and marked down inflation risks.' 'Some of the data longer term.'"
          },
          {
            id: "tue3",
            headline: "Fed's Bostic Speaks: 'Firm on decision absorb higher tariffs much longer.' 'Inflation on core consumer goods which face it, may take months to materialize.' 'I am not in a September rate cut depending on the coming jobs report and other data.'"
          },
          {
            id: "tue4",
            headline: "US JOLTS Job Openings Actual 7.84M (Forecast 7.38M, Previous 7.43M, Revised 7.37M)"
          },
          {
            id: "tue5",
            headline: "Traders began adding to FTD rate cut bets"
          },
          {
            id: "tue6",
            headline: "Fed's Kashkari Speaks: 'The Fed is getting into a tricky situation with mandates.'"
          }
        ],
        wednesday: [
          {
            id: "wed1",
            headline: "US ADP Employment Change Actual 54k (Forecast 75k, Previous 50k)"
          },
          {
            id: "wed2",
            headline: "US Initial Jobless Claims Actual 237k (Forecast 230k, Previous 229k)"
          },
          {
            id: "wed3",
            headline: "Traders continued Fed rate cut bets"
          },
          {
            id: "wed4",
            headline: "US ISM Services PMI Actual 52.0 (Forecast 51, Previous 50.1)"
          },
          {
            id: "wed5",
            headline: "AMZN Earnings: Adjusted EPS $1.07, est. $1.07. Adjusted net revenue $95.95B, est. $95.84b. Sees Q4 net revenue $181.5B-$188.5B, est. $186.2B. Sees Q4 Op. Income $16B-$20B, est. $17.5B. Sees Q4 Adj. EBITDA margin 6.7%"
          }
        ],
        thursday: [
          {
            id: "thu1",
            headline: "US Nonfarm Payrolls Actual 22k (Forecast 75k, Previous 78k, Revised 78k)"
          },
          {
            id: "thu2",
            headline: "Traders increased Fed rate cut bets, pricing in about a 75% chance of a half-point Fed rate cut in September, up from zero before the data."
          },
          {
            id: "thu3",
            headline: "Retail stock gains from the Nonfarm Payrolls report, which increased cut expectations, variance in guidance and lower bond yields as investors grew concerned about possible recession fears amid weak jobs data."
          },
          {
            id: "thu4",
            headline: "The sharp cooling led to a rally in Treasuries. With two-year yields falling to their lowest since 2022, while money markets nearly three Fed rate cuts in 2025."
          }
        ],
        friday: [
          {
            id: "fri1",
            headline: "The EU fined Google almost €3 billion over search dominance. The EU orders Google to end adtech conflicts of interest. Google gets a 60-day deadline to tell the EU how it will comply."
          }
        ]
      }
    }
  ],
  footer: {
    companyName: "KL Trading Community",
    websiteUrl: "https://kltrading.com",
    unsubscribeUrl: "https://kltrading.com/unsubscribe",
    socialLinks: {
      twitter: "https://twitter.com/kltrading",
      discord: "https://discord.gg/kltrading",
      linkedin: "https://linkedin.com/company/kltrading"
    }
  }
};
