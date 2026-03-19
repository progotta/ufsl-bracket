'use client'

import { useState, useRef } from 'react'
import { Users, FileCheck, DollarSign, Trophy, Bell, Lock, Download, Share2, Check, Clock, AlertTriangle, Info, Loader2, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import PaymentToggle from '@/components/pools/PaymentToggle'
import RoleToggle from '@/components/pools/RoleToggle'
import InvitePanel from '@/components/pools/InvitePanel'
import { getOpenBracketTypes } from '@/lib/secondChance'
import { PRESET_PAYOUTS, type PayoutStructure } from '@/lib/payouts'

interface MemberData {
  id: string
  user_id: string
  role: string
  display_name: string
  avatar_url: string | null
  payment_status: string
  payment_date: string | null
  has_submitted: boolean
  bracket_name: string | null
  bracket_submitted_at: string | null
  score: number
  joined_at: string
}

interface Props {
  poolId: string
  poolName: string
  poolStatus: string
  entryFee: number
  payoutStructure: PayoutStructure | null
  maxMembers: number | null
  inviteUrl: string
  inviteCode: string
  members: MemberData[]
  isOwner: boolean
  ownerUserId: string
  games: { round: number; status: string; team1_id: string | null; team2_id: string | null; winner_id: string | null }[]
}

export default function ManageDashboard({
  poolId, poolName, poolStatus, entryFee, payoutStructure, maxMembers, inviteUrl, inviteCode, members, isOwner, ownerUserId, games,
}: Props) {
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [reminderResult, setReminderResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState(payoutStructure ? JSON.stringify(payoutStructure) : JSON.stringify(PRESET_PAYOUTS[0].value))
  const [savingPayout, setSavingPayout] = useState(false)
  const [payoutSaved, setPayoutSaved] = useState(false)
  const paymentsRef = useRef<HTMLDivElement>(null)

  const handleSavePayout = async () => {
    setSavingPayout(true)
    try {
      await fetch(`/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_structure: JSON.parse(selectedPayout) }),
      })
      setPayoutSaved(true)
      setTimeout(() => setPayoutSaved(false), 2000)
    } finally {
      setSavingPayout(false)
    }
  }

  const submittedCount = members.filter(m => m.has_submitted).length
  const paidCount = members.filter(m => m.payment_status === 'paid' || m.payment_status === 'waived').length
  const unpaidCount = members.filter(m => m.payment_status === 'unpaid').length
  const pendingCount = members.filter(m => m.payment_status === 'pending_verification').length
  const unsubmittedCount = members.filter(m => !m.has_submitted).length
  const prizePool = paidCount * entryFee
  const openSecondChanceTypes = getOpenBracketTypes(games as any).filter(t => t !== 'full')

  const submitted = members.filter(m => m.has_submitted)
  const notSubmitted = members.filter(m => !m.has_submitted)

  // Action items
  const actionItems = [
    unsubmittedCount > 0 && {
      type: 'warning' as const,
      message: `${unsubmittedCount} member${unsubmittedCount > 1 ? "s haven't" : " hasn't"} submitted yet`,
      action: 'Send reminder',
      actionType: 'submit',
    },
    unpaidCount > 0 && entryFee > 0 && {
      type: 'warning' as const,
      message: `${unpaidCount} member${unpaidCount > 1 ? 's owe' : ' owes'} entry fees`,
      action: 'Send payment reminder',
      actionType: 'pay',
    },
    pendingCount > 0 && {
      type: 'info' as const,
      message: `${pendingCount} payment${pendingCount > 1 ? 's' : ''} waiting for your confirmation`,
      action: 'Review payments',
      actionType: 'scroll-payments',
    },
  ].filter(Boolean) as Array<{ type: 'warning' | 'info'; message: string; action: string; actionType: string }>

  const sendReminder = async (type: string) => {
    if (type === 'scroll-payments') {
      paymentsRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setSendingReminder(type)
    setReminderResult(null)
    try {
      const res = await fetch(`/api/pools/${poolId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (res.ok) {
        setReminderResult(`Sent ${data.sent} reminder${data.sent !== 1 ? 's' : ''}!`)
      } else {
        setReminderResult(data.error || 'Failed to send')
      }
    } catch {
      setReminderResult('Failed to send reminders')
    }
    setSendingReminder(null)
    setTimeout(() => setReminderResult(null), 4000)
  }

  const handleLockPicks = async () => {
    if (!confirm('Lock picks now? Members will no longer be able to submit or edit brackets.')) return
    const res = await fetch(`/api/pools/${poolId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'locked' }),
    })
    if (res.ok) window.location.reload()
  }

  const exportCSV = () => {
    const header = 'Name,Submitted,Score,Payment Status,Paid Date,Joined'
    const rows = members.map(m => [
      m.display_name,
      m.has_submitted ? 'Yes' : 'No',
      m.score,
      m.payment_status,
      m.payment_date ? new Date(m.payment_date).toLocaleDateString() : '',
      new Date(m.joined_at).toLocaleDateString(),
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${poolName.replace(/\s+/g, '_')}_export.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} label="Members" value={`${members.length}${maxMembers ? `/${maxMembers}` : ''}`} color="blue" />
        <StatCard icon={<FileCheck size={18} />} label="Submitted" value={`${submittedCount}/${members.length}`} color="green" />
        {entryFee > 0 && (
          <>
            <StatCard icon={<DollarSign size={18} />} label="Paid" value={`${paidCount}/${members.length}`} color="yellow" />
            <StatCard icon={<Trophy size={18} />} label="Prize Pool" value={`$${prizePool}`} color="orange" />
          </>
        )}
      </div>

      {/* Invite Panel */}
      <div>
        <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-3">Invite People</h3>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
          <InvitePanel
            poolName={poolName}
            inviteCode={inviteCode}
            inviteUrl={inviteUrl}
          />
        </div>
      </div>

      {/* Action items */}
      {actionItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider">Action Items</h3>
          {actionItems.map((item, i) => (
            <div key={i} className={clsx(
              'flex items-center justify-between gap-3 rounded-xl p-4 border',
              item.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-blue-500/5 border-blue-500/20'
            )}>
              <div className="flex items-center gap-3">
                {item.type === 'warning' ? (
                  <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
                ) : (
                  <Info size={16} className="text-blue-400 flex-shrink-0" />
                )}
                <span className="text-sm">{item.message}</span>
              </div>
              <button
                onClick={() => sendReminder(item.actionType)}
                disabled={sendingReminder === item.actionType}
                className="text-xs font-bold text-brand-orange hover:text-white bg-brand-orange/10 hover:bg-brand-orange/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {sendingReminder === item.actionType ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : item.action}
              </button>
            </div>
          ))}
          {reminderResult && (
            <p className="text-xs text-green-400 pl-1">{reminderResult}</p>
          )}
        </div>
      )}

      {/* Submission tracker */}
      <div>
        <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-3">Bracket Submissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submitted */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Check size={14} className="text-green-400" />
              <span className="font-bold text-sm text-green-400">Submitted ({submitted.length})</span>
            </div>
            <div className="space-y-2">
              {submitted.length === 0 ? (
                <p className="text-xs text-brand-muted py-2">No submissions yet</p>
              ) : submitted.map(m => (
                <div key={m.user_id} className="flex items-center gap-3">
                  <Avatar name={m.display_name} url={m.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.display_name}</p>
                    {m.bracket_name && (
                      <p className="text-xs text-brand-muted truncate">{m.bracket_name}</p>
                    )}
                  </div>
                  {isOwner && m.user_id !== ownerUserId && (
                    <RoleToggle
                      memberId={m.id}
                      poolId={poolId}
                      currentRole={m.role as 'commissioner' | 'member'}
                      memberName={m.display_name}
                    />
                  )}
                  {m.bracket_submitted_at && (
                    <span className="text-[10px] text-brand-muted whitespace-nowrap">
                      {new Date(m.bracket_submitted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Not submitted */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-yellow-400" />
              <span className="font-bold text-sm text-yellow-400">Not submitted ({notSubmitted.length})</span>
            </div>
            <div className="space-y-2">
              {notSubmitted.length === 0 ? (
                <p className="text-xs text-green-400 py-2">Everyone has submitted!</p>
              ) : notSubmitted.map(m => (
                <div key={m.user_id} className="flex items-center gap-3">
                  <Avatar name={m.display_name} url={m.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.display_name}</p>
                  </div>
                  {isOwner && m.user_id !== ownerUserId && (
                    <RoleToggle
                      memberId={m.id}
                      poolId={poolId}
                      currentRole={m.role as 'commissioner' | 'member'}
                      memberName={m.display_name}
                    />
                  )}
                  <button
                    onClick={() => sendReminder('submit')}
                    disabled={!!sendingReminder}
                    className="text-[10px] font-bold text-brand-orange hover:text-white bg-brand-orange/10 hover:bg-brand-orange/20 px-2 py-1 rounded-md transition-colors"
                  >
                    Nudge
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment tracker */}
      {entryFee > 0 && (
        <div ref={paymentsRef}>
          <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-3">Payment Tracker</h3>
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            {members.map((m, idx) => (
              <div key={m.user_id} className={clsx(
                'flex items-center justify-between px-4 py-3',
                idx > 0 && 'border-t border-brand-border/50'
              )}>
                <div className="flex items-center gap-3">
                  <Avatar name={m.display_name} url={m.avatar_url} />
                  <div>
                    <p className="text-sm font-medium">{m.display_name}</p>
                    {m.payment_date && (
                      <p className="text-[10px] text-brand-muted">
                        Paid {new Date(m.payment_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isOwner && m.user_id !== ownerUserId && (
                    <RoleToggle
                      memberId={m.id}
                      poolId={poolId}
                      currentRole={m.role as 'commissioner' | 'member'}
                      memberName={m.display_name}
                    />
                  )}
                  {m.payment_status === 'waived' ? (
                    <span className="text-xs text-brand-muted bg-brand-surface px-2 py-1 rounded-full border border-brand-border">Waived</span>
                  ) : (
                    <PaymentToggle
                      memberId={m.id}
                      status={m.payment_status as any}
                      poolId={poolId}
                      fee={entryFee}
                      memberName={m.display_name}
                    />
                  )}
                </div>
              </div>
            ))}
            <div className="border-t border-brand-border px-4 py-3 flex justify-between items-center bg-brand-card">
              <span className="text-sm font-medium text-brand-muted">Total collected</span>
              <span className="font-black text-brand-orange">${prizePool}</span>
            </div>
          </div>

          {/* Payout Structure */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-4 space-y-3">
            <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Payout Structure</h3>
            {!payoutStructure && (
              <p className="text-xs text-amber-400">⚠️ No payout structure set — players can't see who wins what.</p>
            )}
            <div className="flex items-center gap-2">
              <select
                value={selectedPayout}
                onChange={e => setSelectedPayout(e.target.value)}
                className="input-base flex-1"
              >
                {PRESET_PAYOUTS.map(p => (
                  <option key={p.label} value={JSON.stringify(p.value)}>{p.label}</option>
                ))}
              </select>
              <button
                onClick={handleSavePayout}
                disabled={savingPayout}
                className="px-3 py-2 rounded-lg bg-brand-orange text-black text-sm font-bold hover:bg-brand-orange/90 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {savingPayout ? <Loader2 size={14} className="animate-spin" /> : payoutSaved ? <Check size={14} /> : null}
                {payoutSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <QuickAction
            icon={<Bell size={16} />}
            label="Remind everyone who hasn't submitted"
            onClick={() => sendReminder('submit')}
            disabled={!!sendingReminder || unsubmittedCount === 0}
          />
          {entryFee > 0 && (
            <QuickAction
              icon={<DollarSign size={16} />}
              label="Remind everyone who hasn't paid"
              onClick={() => sendReminder('pay')}
              disabled={!!sendingReminder || unpaidCount === 0}
            />
          )}
          {poolStatus === 'open' && (
            <QuickAction
              icon={<Lock size={16} />}
              label="Lock picks now"
              onClick={handleLockPicks}
              variant="danger"
            />
          )}
          <QuickAction
            icon={<Download size={16} />}
            label="Export results CSV"
            onClick={exportCSV}
          />
          <QuickAction
            icon={<Share2 size={16} />}
            label={copied ? 'Copied!' : 'Share pool invite link'}
            onClick={copyInviteLink}
          />
          {openSecondChanceTypes.length > 0 && (
            <QuickAction
              icon={<RefreshCw size={16} />}
              label="Launch 2nd Chance Pool"
              onClick={() => {
                const type = openSecondChanceTypes[0]
                const params = new URLSearchParams({
                  bracket_type: type,
                  from_pool: poolId,
                  from_name: poolName,
                })
                window.location.href = `/pools/new?${params.toString()}`
              }}
              variant="secondary"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'blue' | 'green' | 'yellow' | 'orange'
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    orange: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
  }
  return (
    <div className={clsx('rounded-xl border p-4', colors[color])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-black">{value}</p>
    </div>
  )
}

function QuickAction({ icon, label, onClick, disabled, variant }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'danger' | 'secondary'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left',
        variant === 'danger'
          ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
          : variant === 'secondary'
          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
          : 'bg-brand-surface border border-brand-border hover:bg-brand-card',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
    )
  }
  return (
    <div className="w-7 h-7 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-bold flex-shrink-0">
      {name[0]?.toUpperCase() || '?'}
    </div>
  )
}
