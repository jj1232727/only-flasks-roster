import type { Submission } from './gameData'

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined
export const apiConfigured = Boolean(API_URL)

async function request<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  if (!API_URL) throw new Error('The Google Apps Script URL has not been configured.')
  const body = new URLSearchParams({ action, payload: JSON.stringify(payload) })
  const response = await fetch(API_URL, { method: 'POST', body })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  const result = await response.json()
  if (!result.ok) throw new Error(result.error || 'The request failed.')
  return result.data as T
}

export type PublicRow = { class_name: string; spec_name: string; rank: number; choice_count: number }
export type AdminPlayer = Submission & {
  id: string
  discord_name: string
  status: 'unassigned' | 'roster' | 'fill'
  assigned_rank: number | null
  officer_notes: string
  updated_at: string
}

export const rosterApi = {
  submit: (submission: Submission & { discord_name: string; identity_token: string }) => request<{ updated: boolean }>('submit', submission),
  breakdown: () => request<PublicRow[]>('breakdown'),
  adminRoster: (admin_secret: string) => request<AdminPlayer[]>('adminRoster', { admin_secret }),
  saveAssignment: (admin_secret: string, player: AdminPlayer) => request<null>('saveAssignment', {
    admin_secret,
    id: player.id,
    status: player.status,
    assigned_rank: player.assigned_rank,
    officer_notes: player.officer_notes,
  }),
}
