import { NextRequest, NextResponse } from 'next/server'

export interface NewsArticle {
  id: string
  headline: string
  source: string
  url: string
  publishedAt: string
  thumbnail?: string
  summary?: string
  teams?: string[]
}

// In-memory cache
let cache: { articles: NewsArticle[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// --- Mock data (realistic tournament stories) ---
const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    headline: 'Duke Basketball: Freshman Phenom Projected as #1 Overall Seed Heading into Tournament',
    source: 'ESPN',
    url: 'https://www.espn.com/mens-college-basketball/',
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/150.png&w=80&h=80&scale=crop',
    summary: 'The Blue Devils are riding a 12-game winning streak into Selection Sunday, with their freshman center averaging 22 points per game.',
    teams: ['Duke'],
  },
  {
    id: '2',
    headline: 'Kansas Enters Tournament as Defending Conference Champions, Eyes Another Deep Run',
    source: 'CBS Sports',
    url: 'https://www.cbssports.com/college-basketball/',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Kansas_Jayhawks_logo.svg/200px-Kansas_Jayhawks_logo.svg.png',
    summary: 'Bill Self\'s squad has navigated the Big 12 gauntlet and enters March as one of the nation\'s elite programs.',
    teams: ['Kansas'],
  },
  {
    id: '3',
    headline: 'Selection Sunday Preview: Everything You Need to Know About the 2026 NCAA Bracket',
    source: 'NCAA.com',
    url: 'https://www.ncaa.com/news/basketball-men/article/',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'The committee reveals the full 68-team bracket Sunday evening. Here\'s what the experts are predicting for seeds and matchups.',
    teams: [],
  },
  {
    id: '4',
    headline: 'Kentucky Wildcats Survive SEC Tournament Scare, Secure At-Large Bid',
    source: 'Bleacher Report',
    url: 'https://bleacherreport.com/college-basketball',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'The Wildcats needed overtime to escape SEC play, but projections still have them as a 4-seed heading into the Big Dance.',
    teams: ['Kentucky'],
  },
  {
    id: '5',
    headline: 'Houston Cougars Make Case for #1 Seed With Dominant AAC Tournament Win',
    source: 'ESPN',
    url: 'https://www.espn.com/mens-college-basketball/',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'Kelvin Sampson\'s team has the nation\'s top defense and is making a strong case to be the overall top seed.',
    teams: ['Houston'],
  },
  {
    id: '6',
    headline: 'March Madness Bracket Tips: Historical Upset Patterns and Which Seeds to Target',
    source: 'CBS Sports',
    url: 'https://www.cbssports.com/college-basketball/',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: '5 vs 12 remains the most reliable first-round upset spot. Here\'s where the data says to pick the chalky bracket and where to gamble.',
    teams: [],
  },
  {
    id: '7',
    headline: 'UConn Looks to Three-Peat as Huskies Enter Tournament Hot',
    source: 'Bleacher Report',
    url: 'https://bleacherreport.com/college-basketball',
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'Dan Hurley\'s dynasty continues. The Huskies have won back-to-back titles and are gunning for unprecedented three-peat.',
    teams: ['UConn'],
  },
  {
    id: '8',
    headline: 'Gonzaga Earns West Region Top Seed, Sets Up Potential Elite Eight Rematch with Arizona',
    source: 'NCAA.com',
    url: 'https://www.ncaa.com/news/basketball-men/article/',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'The Bulldogs are back in familiar territory after a dominant WCC Tournament, drawing the West Regional top line.',
    teams: ['Gonzaga', 'Arizona'],
  },
  {
    id: '9',
    headline: 'North Carolina Tar Heels: Can This Veteran Roster Finally Break Through to the Title?',
    source: 'ESPN',
    url: 'https://www.espn.com/mens-college-basketball/',
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'With four returning starters from last year\'s Elite Eight run, UNC has the experience to make a serious championship push.',
    teams: ['North Carolina'],
  },
  {
    id: '10',
    headline: 'Cinderella Watch 2026: These Mid-Majors Are Primed for March Madness Upsets',
    source: 'Bleacher Report',
    url: 'https://bleacherreport.com/college-basketball',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'San Diego State, Saint Mary\'s, and Vermont headline a strong group of mid-major teams capable of busting brackets.',
    teams: [],
  },
  {
    id: '11',
    headline: 'Michigan State Spartans Ride Veteran Point Guard to Big Ten Title, Set for Deep March Run',
    source: 'CBS Sports',
    url: 'https://www.cbssports.com/college-basketball/',
    publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'Tom Izzo\'s squad is battle-tested after surviving one of college basketball\'s toughest conferences all season.',
    teams: ['Michigan State'],
  },
  {
    id: '12',
    headline: 'Auburn Tigers: SEC\'s Best Offense Looks to Dominate Through March',
    source: 'ESPN',
    url: 'https://www.espn.com/mens-college-basketball/',
    publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'Bruce Pearl\'s up-tempo offense averages 88 points per game — the highest in the SEC — and could be a nightmare matchup for any opponent.',
    teams: ['Auburn'],
  },
  {
    id: '13',
    headline: 'Tennessee Volunteers Secure 2-Seed, Rick Barnes Eyes First Final Four',
    source: 'NCAA.com',
    url: 'https://www.ncaa.com/news/basketball-men/article/',
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'Tennessee\'s physical, defensive-minded style has propelled them to their best season in decades. Rick Barnes is still searching for his first Final Four.',
    teams: ['Tennessee'],
  },
  {
    id: '14',
    headline: 'Expert Bracket Predictions: Analysts Favor Three ACC Teams to Reach Final Four',
    source: 'CBS Sports',
    url: 'https://www.cbssports.com/college-basketball/',
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'A panel of 10 college basketball experts submitted their bracket predictions. Three ACC teams dominate the Final Four picks.',
    teams: [],
  },
  {
    id: '15',
    headline: 'Indiana Hoosiers Bubble Watch: Will They Sneak Into the Field of 68?',
    source: 'Bleacher Report',
    url: 'https://bleacherreport.com/college-basketball',
    publishedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    thumbnail: undefined,
    summary: 'Indiana is firmly on the bubble heading into Selection Sunday, needing a committee miracle or a Quadrant 1 win to hear their name called.',
    teams: ['Indiana'],
  },
]

// Try to fetch ESPN RSS feed; fall back gracefully
async function fetchESPNRSS(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(
      'https://www.espn.com/espn/rss/ncb/news',
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return []
    const xml = await res.text()

    // Simple XML parsing without a library
    const items: NewsArticle[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    let idx = 0

    while ((match = itemRegex.exec(xml)) !== null && idx < 15) {
      const block = match[1]
      const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) || /<title>(.*?)<\/title>/.exec(block))?.[1]?.trim()
      const link = (/<link>(.*?)<\/link>/.exec(block))?.[1]?.trim()
      const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(block))?.[1]?.trim()
      const desc = (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(block) || /<description>(.*?)<\/description>/.exec(block))?.[1]?.trim()
      const img = (/<media:thumbnail[^>]+url="([^"]+)"/.exec(block) || /<enclosure[^>]+url="([^"]+)"/.exec(block))?.[1]

      if (title && link) {
        items.push({
          id: `espn-${idx}`,
          headline: title,
          source: 'ESPN',
          url: link,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          thumbnail: img,
          summary: desc?.replace(/<[^>]+>/g, '').substring(0, 200),
          teams: [],
        })
        idx++
      }
    }

    return items
  } catch {
    return []
  }
}

async function getArticles(): Promise<NewsArticle[]> {
  // Return cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.articles
  }

  // Try live ESPN RSS; supplement with mock data
  const live = await fetchESPNRSS()
  const articles = live.length >= 5
    ? live
    : [...MOCK_ARTICLES] // fall back to mock

  cache = { articles, fetchedAt: Date.now() }
  return articles
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const team = searchParams.get('team')?.toLowerCase().trim()

  const articles = await getArticles()

  let filtered = articles
  if (team) {
    filtered = articles.filter(a =>
      a.teams?.some(t => t.toLowerCase().includes(team)) ||
      a.headline.toLowerCase().includes(team) ||
      a.summary?.toLowerCase().includes(team)
    )

    // If no team-specific results, return general news
    if (filtered.length === 0) {
      filtered = articles.slice(0, 5)
    }
  }

  return NextResponse.json({ articles: filtered, cached: !!cache, team: team || null })
}
