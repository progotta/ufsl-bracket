export type NotificationType =
  // Player
  | 'picks_locking_soon'
  | 'round_complete'
  | 'standings_change'
  | 'bracket_busted'
  | 'bracket_alive'
  | 'pool_invite'
  | 'payment_due'
  | 'pool_notes_updated'
  // Commissioner
  | 'member_joined'
  | 'bracket_submitted'
  | 'unsubmitted_reminder'
  | 'payment_received'
  | 'payment_dispute'
  | 'all_submitted'
  | 'round_summary'
  | 'low_engagement'

export type NotificationAudience = 'player' | 'commissioner'

export interface NotificationDefinition {
  type: NotificationType
  audience: NotificationAudience
  label: string
  description: string
  defaultPush: boolean
  defaultEmail: boolean
  defaultSms: boolean
}

export const NOTIFICATION_DEFINITIONS: NotificationDefinition[] = [
  // Player
  { type: 'picks_locking_soon',   audience: 'player',       label: 'Picks locking soon',       description: 'Reminder before picks lock (2 hours before)',          defaultPush: true,  defaultEmail: true,  defaultSms: true  },
  { type: 'round_complete',       audience: 'player',       label: 'Round complete',            description: 'When a round finishes — check your standings',         defaultPush: true,  defaultEmail: false, defaultSms: false },
  { type: 'standings_change',     audience: 'player',       label: 'Standings change',          description: 'When someone passes you on the leaderboard',           defaultPush: false, defaultEmail: false, defaultSms: false },
  { type: 'bracket_busted',       audience: 'player',       label: 'Bracket busted',            description: 'When your bracket is eliminated',                      defaultPush: true,  defaultEmail: false, defaultSms: false },
  { type: 'bracket_alive',        audience: 'player',       label: 'Still in contention',       description: 'When you survive a big round (Elite 8, Final 4)',      defaultPush: true,  defaultEmail: false, defaultSms: false },
  { type: 'pool_invite',          audience: 'player',       label: 'Pool invitation',           description: 'When someone invites you to a pool',                   defaultPush: true,  defaultEmail: true,  defaultSms: false },
  { type: 'payment_due',          audience: 'player',       label: 'Payment reminder',          description: 'When you owe an entry fee',                            defaultPush: true,  defaultEmail: true,  defaultSms: false },
  { type: 'pool_notes_updated',  audience: 'player',       label: 'League announcements',      description: 'When the commissioner posts a league update or rule change', defaultPush: true, defaultEmail: false, defaultSms: false },
  // Commissioner
  { type: 'member_joined',        audience: 'commissioner', label: 'New member joined',         description: 'When someone joins your pool',                         defaultPush: true,  defaultEmail: false, defaultSms: false },
  { type: 'bracket_submitted',    audience: 'commissioner', label: 'Bracket submitted',         description: 'When a member submits their bracket',                  defaultPush: false, defaultEmail: false, defaultSms: false },
  { type: 'unsubmitted_reminder', audience: 'commissioner', label: 'Unsubmitted reminder',      description: 'Members haven\'t submitted — lock is approaching',     defaultPush: true,  defaultEmail: false, defaultSms: false },
  { type: 'payment_received',     audience: 'commissioner', label: 'Payment received',          description: 'When a member marks their payment as sent',            defaultPush: true,  defaultEmail: false, defaultSms: false },
  { type: 'payment_dispute',      audience: 'commissioner', label: 'Payment dispute',           description: 'When a member disputes a payment',                     defaultPush: true,  defaultEmail: true,  defaultSms: false },
  { type: 'all_submitted',        audience: 'commissioner', label: 'All brackets submitted',    description: 'When every member has submitted — ready to lock',      defaultPush: true,  defaultEmail: false, defaultSms: false },
  { type: 'round_summary',        audience: 'commissioner', label: 'Round summary',             description: 'Pool standings summary after each round',              defaultPush: true,  defaultEmail: false, defaultSms: false },
  { type: 'low_engagement',       audience: 'commissioner', label: 'Low engagement alert',      description: 'When submission rate is low before the deadline',      defaultPush: false, defaultEmail: false, defaultSms: false },
]

export const PLAYER_NOTIFICATIONS = NOTIFICATION_DEFINITIONS.filter(d => d.audience === 'player')
export const COMMISSIONER_NOTIFICATIONS = NOTIFICATION_DEFINITIONS.filter(d => d.audience === 'commissioner')
