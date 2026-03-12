import { NextRequest, NextResponse } from 'next/server'
import { MOCK_TEAMS, type BracketTeam } from '@/lib/bracket'
import { createServerClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedPick {
  round: number
  region: string
  gameId: string
  extractedName: string        // raw name from AI
  matchedTeamId: string | null // our team id
  matchedTeamName: string | null
  confidence: number           // 0-1
  needsReview: boolean
}

export interface ImportResult {
  picks: Record<string, string>         // gameId → teamId (high-confidence only)
  extractedPicks: ExtractedPick[]       // full list with confidence scores
  uncertainCount: number
  unmatchedCount: number
  provider: string
}

// ── Fuzzy matching ────────────────────────────────────────────────────────────

/** Known aliases: maps common abbreviations/nicknames → canonical team name fragments */
const ALIASES: Record<string, string> = {
  uconn: 'connecticut',
  conn: 'connecticut',
  usc: 'southern california',
  ucla: 'los angeles',
  unlv: 'las vegas',
  vcu: 'vcu',
  smu: 'southern methodist',
  lsu: 'louisiana state',
  tcu: 'tcu',
  'ole miss': 'mississippi',
  pitt: 'pittsburgh',
  'ohio st': 'ohio state',
  'mich st': 'michigan state',
  mich: 'michigan',
  'nc state': 'nc state',
  ncstate: 'nc state',
  'n.c. state': 'nc state',
  unc: 'north carolina',
  'north carolina': 'north carolina',
  gonzaga: 'gonzaga',
  'texas a&m': 'texas a&m',
  'texas am': 'texas a&m',
  'a&m': 'texas a&m',
  byu: 'brigham young',
  'iowa st': 'iowa state',
  'arizona st': 'arizona state',
  'arizona state': 'arizona state',
  'fau': 'florida atlantic',
  'fiu': 'florida international',
  'ucf': 'central florida',
  'uab': 'alabama birmingham',
  'utep': 'texas el paso',
  'oru': 'oral roberts',
  'cofc': 'charleston',
  'gcu': 'grand canyon',
  'unca': 'unc asheville',
  'semo': 'southeast missouri',
  'kenn': 'kennesaw',
  'mtst': 'montana state',
  'prin': 'princeton',
  'uvm': 'vermont',
  'nku': 'northern kentucky',
  'drke': 'drake',
  'ucsb': 'uc santa barbara',
  'fur': 'furman',
}

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function computeSimilarity(a: string, b: string): number {
  if (a === b) return 1.0
  if (a.includes(b) || b.includes(a)) return 0.9

  // Check aliases
  const aAlias = ALIASES[a] || a
  const bAlias = ALIASES[b] || b
  if (aAlias === bAlias) return 0.95
  if (aAlias.includes(bAlias) || bAlias.includes(aAlias)) return 0.88

  // Token overlap
  const aTokens = a.split(' ')
  const bTokens = b.split(' ')
  const bTokenSet = new Set(bTokens)
  const intersection = aTokens.filter(t => bTokenSet.has(t)).length
  const allTokens = Array.from(new Set([...aTokens, ...bTokens]))
  const union = allTokens.length
  const jaccard = union > 0 ? intersection / union : 0

  return jaccard
}

function matchTeamName(
  extracted: string,
  teams: BracketTeam[]
): { team: BracketTeam | null; confidence: number } {
  const norm = normalizeTeamName(extracted)
  const normAlias = ALIASES[norm] || norm

  let best: BracketTeam | null = null
  let bestScore = 0

  for (const team of teams) {
    const tNorm = normalizeTeamName(team.name)
    const tAbbr = normalizeTeamName(team.abbreviation)
    const tAlias = ALIASES[tNorm] || tNorm

    const scores = [
      computeSimilarity(norm, tNorm),
      computeSimilarity(norm, tAbbr),
      computeSimilarity(normAlias, tAlias),
      computeSimilarity(normAlias, tNorm),
    ]

    const score = Math.max(...scores)
    if (score > bestScore) {
      bestScore = score
      best = team
    }
  }

  return { team: bestScore > 0.4 ? best : null, confidence: bestScore }
}

// ── AI extraction ─────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are analyzing an NCAA tournament bracket image. Extract ALL picks (winners) from every round.

Return ONLY valid JSON in this exact format:
{
  "provider": "ESPN|Yahoo|CBS|NCAA|Unknown",
  "rounds": {
    "round1": [
      {"region": "East|West|South|Midwest", "winner": "Team Name", "seed": 1},
      ...32 games total (8 per region)
    ],
    "round2": [...16 games],
    "sweet16": [...8 games],
    "elite8": [...4 games],
    "finalFour": [...2 games],
    "championship": [{"region": "Championship", "winner": "Team Name", "seed": 1}]
  }
}

Rules:
- Include seed numbers when visible
- Use the EXACT team name as printed on the bracket
- If a pick is unclear/illegible, use null for winner
- The "winner" is the team that advances (the circled/highlighted/underlined pick)
- List in order from top to bottom within each region
- For Final Four, region should be the team's original region`

async function extractPicksFromImage(
  imageBase64: string,
  mimeType: string
): Promise<{ rawData: Record<string, unknown>; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    if (response.status === 429) throw new Error('Rate limit reached. Please try again in a moment.')
    throw new Error(err.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
  const jsonStr = jsonMatch[1]?.trim() || content.trim()

  try {
    return { rawData: JSON.parse(jsonStr) }
  } catch {
    return { rawData: {}, error: 'Could not parse AI response as JSON. The image may be unclear or not a bracket.' }
  }
}

// ── Round mapping ─────────────────────────────────────────────────────────────

const AI_ROUND_MAP: Record<string, number> = {
  round1: 1,
  round_1: 1,
  'round of 64': 1,
  round2: 2,
  round_2: 2,
  'round of 32': 2,
  sweet16: 3,
  sweet_16: 3,
  'sweet 16': 3,
  elite8: 4,
  elite_8: 4,
  'elite 8': 4,
  'elite eight': 4,
  finalfour: 5,
  final_four: 5,
  'final four': 5,
  championship: 6,
}

interface AIPickEntry {
  region?: string
  winner?: string | null
  seed?: number
}

function buildGameIdForPick(
  round: number,
  region: string,
  gameIndexInRound: number,
  allTeams: BracketTeam[]
): string | null {
  // Map region names (AI may return variations)
  const regionMap: Record<string, string> = {
    east: 'east', e: 'east',
    west: 'west', w: 'west',
    south: 'south', s: 'south',
    midwest: 'midwest', mw: 'midwest', mid: 'midwest',
    'final four': 'ff', finalfour: 'ff',
    championship: 'championship',
  }

  const normRegion = region.toLowerCase().replace(/[^a-z]/g, '')
  const mappedRegion = regionMap[normRegion] || normRegion

  if (round <= 4) {
    // Regional rounds: determine game number
    const regionOrder: Record<string, number> = { east: 0, west: 1, south: 2, midwest: 3 }
    const regionIdx = regionOrder[mappedRegion] ?? 0
    const gamesPerRegionPerRound: Record<number, number> = { 1: 8, 2: 4, 3: 2, 4: 1 }
    const gamesPerRegion = gamesPerRegionPerRound[round] || 1
    const gameNum = regionIdx * gamesPerRegion + gameIndexInRound + 1
    return `${mappedRegion}-r${round}-g${gameNum}`
  } else if (round === 5) {
    // Final Four: 2 games
    return `ff-r5-g${gameIndexInRound + 1}`
  } else if (round === 6) {
    return 'championship-r6-g1'
  }

  return null
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const provider = (formData.get('provider') as string) || 'Unknown'

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Please upload a JPEG, PNG, WebP, or GIF image.` },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image under 20MB.' },
        { status: 400 }
      )
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Load teams from DB or fall back to mock
    const { data: dbTeams } = await supabase.from('teams').select('*').eq('is_active', true)
    const teams: BracketTeam[] =
      dbTeams && dbTeams.length >= 64
        ? dbTeams.map(t => ({
            id: t.id,
            name: t.name,
            abbreviation: t.abbreviation,
            seed: t.seed || 1,
            region: t.region || 'East',
            primaryColor: t.primary_color || undefined,
          }))
        : MOCK_TEAMS

    // Call GPT-4 Vision
    let rawData: Record<string, unknown>
    let extractionError: string | undefined
    try {
      const result = await extractPicksFromImage(base64, file.type)
      rawData = result.rawData
      extractionError = result.error
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI extraction failed'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    if (extractionError || !rawData.rounds) {
      return NextResponse.json(
        {
          error:
            extractionError ||
            "Couldn't find bracket picks in this image. Make sure it's a clear screenshot of a filled-out bracket.",
        },
        { status: 422 }
      )
    }

    // Process extracted picks
    const extractedPicks: ExtractedPick[] = []
    const confirmedPicks: Record<string, string> = {}

    const rounds = rawData.rounds as Record<string, AIPickEntry[]>

    for (const [roundKey, entries] of Object.entries(rounds)) {
      const roundNum = AI_ROUND_MAP[roundKey.toLowerCase().replace(/[\s_]/g, '')] ??
                       AI_ROUND_MAP[roundKey.toLowerCase()]
      if (!roundNum || !Array.isArray(entries)) continue

      // Track index within each region for game ID mapping
      const regionCounts: Record<string, number> = {}

      for (const entry of entries) {
        if (!entry.winner) continue

        const region = entry.region || 'Unknown'
        const regionKey = region.toLowerCase().replace(/[^a-z]/g, '')
        regionCounts[regionKey] = (regionCounts[regionKey] || 0)

        const gameId = buildGameIdForPick(roundNum, region, regionCounts[regionKey], teams)
        regionCounts[regionKey]++

        if (!gameId) continue

        const { team, confidence } = matchTeamName(entry.winner, teams)
        const needsReview = confidence < 0.8 || !team

        const extractedPick: ExtractedPick = {
          round: roundNum,
          region,
          gameId,
          extractedName: entry.winner,
          matchedTeamId: team?.id || null,
          matchedTeamName: team?.name || null,
          confidence,
          needsReview,
        }

        extractedPicks.push(extractedPick)

        if (team && confidence >= 0.8) {
          confirmedPicks[gameId] = team.id
        }
      }
    }

    if (extractedPicks.length === 0) {
      return NextResponse.json(
        { error: "No picks could be extracted. The image may be unclear, cropped, or not a bracket screenshot." },
        { status: 422 }
      )
    }

    const uncertainCount = extractedPicks.filter(p => p.needsReview && p.matchedTeamId).length
    const unmatchedCount = extractedPicks.filter(p => !p.matchedTeamId).length

    const result: ImportResult = {
      picks: confirmedPicks,
      extractedPicks,
      uncertainCount,
      unmatchedCount,
      provider: (rawData.provider as string) || provider,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Bracket import error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
