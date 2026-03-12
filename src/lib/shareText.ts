// Share text templates for UFSL social sharing

export type ShareContext =
  | { stage: 'pre-tournament'; champion: string; link: string }
  | { stage: 'mid-tournament'; correct: number; total: number; rank: number; link: string }
  | { stage: 'busted'; link: string }
  | { stage: 'won'; points: number; link: string }
  | { stage: 'generic'; percentBusted: number; link: string }

export function getShareText(ctx: ShareContext): string {
  switch (ctx.stage) {
    case 'pre-tournament':
      return `🏀 My March Madness bracket is locked in! Champion pick: ${ctx.champion}. Think you can beat me? ${ctx.link}`
    case 'mid-tournament':
      return `🔥 ${ctx.correct}/${ctx.total} picks correct so far! My bracket is #${ctx.rank} in my pool. ${ctx.link}`
    case 'busted':
      return `💀 My bracket just got BUSTED but I'm not done! Joining a Second Chance pool. ${ctx.link}`
    case 'won':
      return `🏆 I WON my bracket pool! ${ctx.points} points. Who wants to challenge me next year? ${ctx.link}`
    case 'generic':
    default:
      return `🏀 My bracket is ${ctx.percentBusted}% busted! Think you can do better? Join me on UFSL ${ctx.link}`
  }
}

export function buildBracketShareUrl(bracketId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://ufsl.net')
  return `${base}/brackets/${bracketId}`
}

export function buildTwitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}

export function buildFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}
