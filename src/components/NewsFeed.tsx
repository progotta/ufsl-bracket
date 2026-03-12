'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, RefreshCw, Newspaper, ChevronDown } from 'lucide-react'
import type { NewsArticle } from '@/app/api/news/route'

const PAGE_SIZE = 5

const SOURCE_COLORS: Record<string, string> = {
  ESPN: 'text-red-400',
  'CBS Sports': 'text-blue-400',
  'Bleacher Report': 'text-yellow-400',
  'NCAA.com': 'text-green-400',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

interface NewsFeedProps {
  team?: string
  compact?: boolean  // for use inside modals
}

export default function NewsFeed({ team, compact = false }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const url = team ? `/api/news?team=${encodeURIComponent(team)}` : '/api/news'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load news')
      const data = await res.json()
      setArticles(data.articles || [])
      setVisibleCount(PAGE_SIZE)
    } catch (e) {
      setError('Couldn\'t load news right now.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [team])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const visible = articles.slice(0, visibleCount)
  const hasMore = visibleCount < articles.length

  if (loading) {
    return <NewsFeedSkeleton compact={compact} />
  }

  return (
    <div className={compact ? '' : 'space-y-1'}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-brand-orange" />
            <h2 className="text-xl font-bold">
              {team ? `${team} News` : 'Tournament News'}
            </h2>
          </div>
          <button
            onClick={() => fetchNews(true)}
            disabled={refreshing}
            className="text-brand-muted hover:text-white transition-colors p-1 rounded"
            title="Refresh news"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-brand-muted text-sm text-center py-4">{error}</div>
      )}

      {/* Article list */}
      {!error && visible.length === 0 && (
        <div className="text-brand-muted text-sm text-center py-6">
          No news found{team ? ` for ${team}` : ''}.
        </div>
      )}

      <div className={`space-y-${compact ? '2' : '3'}`}>
        {visible.map((article, i) => (
          <ArticleCard key={article.id} article={article} compact={compact} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-brand-muted hover:text-white transition-colors py-2 border border-brand-border rounded-lg hover:border-brand-orange/40"
        >
          <ChevronDown size={15} />
          Load more ({articles.length - visibleCount} remaining)
        </button>
      )}
    </div>
  )
}

function ArticleCard({ article, compact }: { article: NewsArticle; compact: boolean }) {
  const sourceColor = SOURCE_COLORS[article.source] || 'text-brand-muted'

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        group flex gap-3 bg-brand-surface border border-brand-border rounded-xl
        hover:border-brand-orange/40 transition-all
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {/* Thumbnail */}
      {article.thumbnail && !compact && (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-brand-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-semibold leading-snug group-hover:text-brand-orange transition-colors line-clamp-2 ${compact ? 'text-sm' : 'text-sm'}`}>
            {article.headline}
          </p>
          <ExternalLink
            size={13}
            className="flex-shrink-0 text-brand-muted group-hover:text-brand-orange transition-colors mt-0.5"
          />
        </div>

        {article.summary && !compact && (
          <p className="text-xs text-brand-muted mt-1 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-xs font-medium ${sourceColor}`}>{article.source}</span>
          <span className="text-brand-border">·</span>
          <span className="text-xs text-brand-muted">{timeAgo(article.publishedAt)}</span>
          {article.teams && article.teams.length > 0 && (
            <>
              <span className="text-brand-border">·</span>
              <span className="text-xs text-brand-muted truncate">
                {article.teams.slice(0, 2).join(', ')}
              </span>
            </>
          )}
        </div>
      </div>
    </a>
  )
}

function NewsFeedSkeleton({ compact }: { compact: boolean }) {
  const count = compact ? 3 : 5
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-brand-surface border border-brand-border rounded-xl ${compact ? 'p-3' : 'p-4'} flex gap-3`}>
          {!compact && <div className="skeleton w-16 h-16 rounded-lg flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-full" />
            <div className="skeleton h-4 rounded w-4/5" />
            {!compact && <div className="skeleton h-3 rounded w-3/5" />}
            <div className="skeleton h-3 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
