/**
 * ESPN team ID mapping for NCAA basketball teams.
 * Used to construct ESPN CDN logo URLs:
 * https://a.espncdn.com/i/teamlogos/ncaa/500/{espn_id}.png
 *
 * Maps lowercase team name -> ESPN numeric ID.
 * Covers top 68 tournament teams + common programs.
 */

const ESPN_TEAM_IDS: Record<string, number> = {
  // Major programs — alphabetical
  'alabama': 333,
  'arizona': 12,
  'arizona state': 9,
  'arkansas': 8,
  'auburn': 2,
  'baylor': 239,
  'boise state': 68,
  'boston college': 103,
  'butler': 2166,
  'byu': 252,
  'charleston': 232,
  'cincinnati': 2132,
  'clemson': 228,
  'colorado': 38,
  'colorado state': 36,
  'connecticut': 41,
  'uconn': 41,
  'creighton': 156,
  'dayton': 2168,
  'drake': 2181,
  'duke': 150,
  'duquesne': 2184,
  'fau': 2229,
  'florida': 57,
  'florida atlantic': 2229,
  'florida state': 52,
  'furman': 231,
  'georgetown': 46,
  'georgia': 61,
  'georgia tech': 59,
  'gonzaga': 2250,
  'grand canyon': 2253,
  'houston': 248,
  'howard': 47,
  'illinois': 356,
  'indiana': 84,
  'iona': 314,
  'iowa': 2294,
  'iowa state': 66,
  'james madison': 256,
  'kansas': 2305,
  'kansas state': 2306,
  'kennesaw st': 338584,
  'kennesaw state': 338584,
  'kent state': 2309,
  'kentucky': 96,
  'liberty': 2335,
  'long beach state': 299,
  'louisiana': 309,
  'louisville': 97,
  'lsu': 99,
  'loyola chicago': 2350,
  'marquette': 269,
  'maryland': 120,
  'memphis': 235,
  'miami': 2390,
  'michigan': 130,
  'michigan state': 127,
  'minnesota': 135,
  'mississippi state': 344,
  'missouri': 142,
  'montana state': 149,
  'nc state': 152,
  'n. kentucky': 94,
  'northern kentucky': 94,
  'nebraska': 158,
  'nevada': 2440,
  'new mexico': 167,
  'north carolina': 153,
  'unc': 153,
  'northwestern': 77,
  'notre dame': 87,
  'oakland': 2473,
  'ohio state': 194,
  'oklahoma': 201,
  'oklahoma state': 197,
  'ole miss': 145,
  'oral roberts': 198,
  'oregon': 2483,
  'penn state': 213,
  'pittsburgh': 221,
  'princeton': 163,
  'providence': 2507,
  'purdue': 2509,
  'rutgers': 164,
  'saint marys': 2608,
  "saint mary's": 2608,
  'samford': 2534,
  'san diego st': 21,
  'san diego state': 21,
  'se missouri st': 2546,
  'southeast missouri state': 2546,
  'seton hall': 2550,
  'south carolina': 2579,
  'south dakota state': 2571,
  'st. johns': 2599,
  "st. john's": 2599,
  'stanford': 24,
  'stetson': 56,
  'syracuse': 183,
  'tcu': 2628,
  'temple': 218,
  'tennessee': 2633,
  'texas': 251,
  'texas a&m': 245,
  'texas southern': 2640,
  'texas state': 326,
  'texas tech': 2641,
  'uc santa barbara': 2540,
  'ucla': 26,
  'unc asheville': 2427,
  'usc': 30,
  'utah': 254,
  'utah state': 328,
  'uvm': 261,
  'vermont': 261,
  'vcu': 2670,
  'villanova': 222,
  'virginia': 258,
  'virginia tech': 259,
  'wagner': 2681,
  'wake forest': 154,
  'washington': 264,
  'washington state': 265,
  'west virginia': 277,
  'western kentucky': 98,
  'wichita state': 2724,
  'wisconsin': 275,
  'xavier': 2752,
  'yale': 43,
}

/**
 * Look up ESPN team ID by team name (case-insensitive).
 * Tries exact match first, then partial matching.
 */
export function getEspnTeamId(teamName: string): number | undefined {
  const lower = teamName.toLowerCase().trim()

  // Exact match
  if (ESPN_TEAM_IDS[lower]) return ESPN_TEAM_IDS[lower]

  // Try matching without common suffixes/prefixes
  for (const [key, id] of Object.entries(ESPN_TEAM_IDS)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) {
      return id
    }
  }

  return undefined
}

/**
 * Get the ESPN logo URL for a team. Returns undefined if no mapping found.
 */
export function getEspnLogoUrl(teamName: string): string | undefined {
  const id = getEspnTeamId(teamName)
  if (!id) return undefined
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`
}

export { ESPN_TEAM_IDS }
