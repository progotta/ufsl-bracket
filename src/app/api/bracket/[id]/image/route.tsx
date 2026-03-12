import { ImageResponse } from 'next/og'
import { createServerClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

// We use a simpler approach for edge runtime - no supabase, accept query params instead
// and also allow server-side fetch for the full version

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)

    // These can be passed as query params for edge rendering
    // OR fetched from DB for server rendering (below)
    const userName = searchParams.get('name') || 'Anonymous'
    const poolName = searchParams.get('pool') || 'UFSL Pool'
    const score = searchParams.get('score') || '0'
    const rank = searchParams.get('rank') || ''
    const champion = searchParams.get('champion') || ''
    const status = searchParams.get('status') || 'active' // pre | active | busted | won
    const correct = searchParams.get('correct') || ''
    const total = searchParams.get('total') || ''
    const bracketId = params.id

    // Subtle grid pattern via inline SVG data URI
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'ufsl.net'

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f1117',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background gradient accent */}
          <div
            style={{
              position: 'absolute',
              top: '-120px',
              right: '-80px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,102,0,0.18) 0%, transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-100px',
              left: '-60px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            }}
          />

          {/* Bracket lines decoration - mini bracket visualization */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0px',
              opacity: 0.15,
            }}
          >
            {/* Mini bracket visual - just decorative lines */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: i % 2 === 1 ? '16px' : '4px',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '18px',
                    border: '1px solid #ff6600',
                    borderRadius: '3px',
                    marginRight: '4px',
                  }}
                />
                <div
                  style={{
                    width: '1px',
                    height: i % 2 === 0 ? '22px' : '0',
                    backgroundColor: '#ff6600',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '52px 60px',
              position: 'relative',
            }}
          >
            {/* Top row: UFSL logo + badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Logo mark */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#ff6600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '20px',
                    color: 'white',
                    letterSpacing: '-1px',
                  }}
                >
                  U
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
                    UFSL
                  </span>
                  <span style={{ fontSize: '11px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    BRACKET CHALLENGE
                  </span>
                </div>
              </div>

              {/* Status badge */}
              {status === 'won' && (
                <div
                  style={{
                    padding: '8px 18px',
                    borderRadius: '100px',
                    backgroundColor: 'rgba(255,215,0,0.15)',
                    border: '1px solid rgba(255,215,0,0.4)',
                    color: '#ffd700',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  🏆 WINNER
                </div>
              )}
              {status === 'busted' && (
                <div
                  style={{
                    padding: '8px 18px',
                    borderRadius: '100px',
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: '#ef4444',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  💀 BRACKET BUSTED
                </div>
              )}
              {status === 'pre' && (
                <div
                  style={{
                    padding: '8px 18px',
                    borderRadius: '100px',
                    backgroundColor: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(34,197,94,0.4)',
                    color: '#22c55e',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  🔒 LOCKED IN
                </div>
              )}
              {status === 'active' && (
                <div
                  style={{
                    padding: '8px 18px',
                    borderRadius: '100px',
                    backgroundColor: 'rgba(255,102,0,0.15)',
                    border: '1px solid rgba(255,102,0,0.4)',
                    color: '#ff6600',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  🔥 IN PROGRESS
                </div>
              )}
            </div>

            {/* Player info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
              {/* Avatar placeholder */}
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,102,0,0.2)',
                  border: '2px solid rgba(255,102,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#ff6600',
                  flexShrink: 0,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1.1 }}>
                  {userName}
                </span>
                <span style={{ fontSize: '15px', color: '#888', marginTop: '4px' }}>
                  {poolName}
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              {/* Score */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: '11px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Score
                </span>
                <span style={{ fontSize: '42px', fontWeight: 900, color: '#ff6600', letterSpacing: '-2px', lineHeight: 1 }}>
                  {score}
                </span>
                <span style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>points</span>
              </div>

              {/* Rank (if available) */}
              {rank && (
                <div
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Pool Rank
                  </span>
                  <span style={{ fontSize: '42px', fontWeight: 900, color: '#ffd700', letterSpacing: '-2px', lineHeight: 1 }}>
                    #{rank}
                  </span>
                  <span style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>in pool</span>
                </div>
              )}

              {/* Correct picks (if available) */}
              {correct && total && (
                <div
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Correct
                  </span>
                  <span style={{ fontSize: '42px', fontWeight: 900, color: '#22c55e', letterSpacing: '-2px', lineHeight: 1 }}>
                    {correct}/{total}
                  </span>
                  <span style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>picks</span>
                </div>
              )}

              {/* Champion pick */}
              {champion && (
                <div
                  style={{
                    flex: 2,
                    backgroundColor: 'rgba(255,215,0,0.05)',
                    border: '1px solid rgba(255,215,0,0.15)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Champion Pick
                  </span>
                  <span style={{ fontSize: '30px', fontWeight: 900, color: '#ffd700', letterSpacing: '-1px', lineHeight: 1.1 }}>
                    🏆 {champion}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
                  Think you can beat me?
                </span>
                <span style={{ fontSize: '14px', color: '#555', marginTop: '2px' }}>
                  {siteUrl}
                </span>
              </div>
              <div
                style={{
                  padding: '12px 28px',
                  borderRadius: '100px',
                  backgroundColor: '#ff6600',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                }}
              >
                Join the Pool →
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e) {
    console.error('OG image error:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
