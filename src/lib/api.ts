import type { Submission } from './gameData'

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined
export const apiConfigured = Boolean(API_URL)

async function request<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  if (!API_URL) throw new Error('The Google Apps Script URL has not been configured.')
  const url = new URL(API_URL)
  url.searchParams.set('_request', `${Date.now()}-${crypto.randomUUID()}`)
  const body = new URLSearchParams({ action, payload: JSON.stringify(payload) })
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 20_000)
  let response: Response
  try {
    response = await fetch(url, { method: 'POST', body, cache: 'no-store', signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The roster service timed out. Try again.')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) throw new Error('The roster service returned an invalid response.')
  const result = await response.json()
  if (!result.ok) throw new Error(result.error || 'The request failed.')
  return result.data as T
}

export type PublicRow = {
  class_name: string
  spec_name: string
  rank: number
  choice_count: number
  assignment_status?: 'roster' | 'fill'
}
export type AdminPlayer = Submission & {
  id: string
  discord_name: string
  status: 'unassigned' | 'roster' | 'fill'
  assigned_rank: number | null
  officer_notes: string
  updated_at: string
}

export const rosterApi = {
  submit: (submission: Submission & {
    discord_name: string
    identity_token: string
    extra_days: string[]
    leadership_areas: string[]
    attendance_90: boolean
    guild_goal: string
    additional_comments: string
  }) => request<{ updated: boolean }>('submit', submission),
  breakdown: async () => {
    const rows = await request<PublicRow[]>('breakdown')
    if (!Array.isArray(rows)) throw new Error('The roster service returned invalid breakdown data.')
    return rows
  },
  adminRoster: (admin_secret: string) => request<AdminPlayer[]>('adminRoster', { admin_secret }),
  saveAssignment: async (admin_secret: string, player: AdminPlayer) => {
    const isFill = (player.status as string) === 'fill' || (player.status as string) === 'bench'
    const payload = {
      admin_secret,
      id: player.id,
      status: isFill ? 'fill' : 'roster',
      assigned_rank: player.assigned_rank,
      officer_notes: player.officer_notes,
    }
    try {
      return await request<null>('saveAssignment', payload)
    } catch (error) {
      if (!(error instanceof Error) || !error.message.toLowerCase().includes('invalid roster status')) throw error
      return request<null>('saveAssignment', { ...payload, status: isFill ? 'bench' : 'main' })
    }
  },
}
