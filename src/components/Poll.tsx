import { useState } from 'react'
import { ChoicePicker } from './ChoicePicker'
import { choiceLabel, EMPTY_SUBMISSION, type Submission } from '../lib/gameData'
import { apiConfigured, rosterApi } from '../lib/api'

function browserIdentity() {
  const key = 'only-flasks-roster-identity'
  let token = localStorage.getItem(key)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(key, token)
  }
  return token
}

export function Poll() {
  const [form, setForm] = useState<Submission>(EMPTY_SUBMISSION)
  const [discordName, setDiscordName] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const labels = [form.choice_1, form.choice_2, form.choice_3].map(choice => choiceLabel(choice))
    if (labels.some(label => !label) || new Set(labels).size !== 3) return setMessage('Choose three different class/spec combinations.')
    setSaving(true); setMessage('')
    try {
      await rosterApi.submit({ ...form, discord_name: discordName.trim(), identity_token: browserIdentity() })
      window.dispatchEvent(new Event('roster-submitted'))
      setMessage('Saved. You can update this response later from this browser.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save.') }
    setSaving(false)
  }

  return <form onSubmit={save} className="panel gold-border rounded-2xl p-5 sm:p-8">
    <p className="rune text-xs font-bold text-amber-300">Your preferences</p><h2 className="mt-2 text-3xl font-black">Choose your three brews</h2>
    <label className="mt-6 block text-sm font-bold text-stone-300">Discord name<input required maxLength={60} className="mt-2 w-full rounded-lg border border-stone-700 bg-stone-950 p-3" value={discordName} onChange={event => setDiscordName(event.target.value)} /></label>
    <label className="mt-4 block text-sm font-bold text-stone-300">Character name<input required maxLength={40} className="mt-2 w-full rounded-lg border border-stone-700 bg-stone-950 p-3" value={form.character_name} onChange={event => setForm({ ...form, character_name: event.target.value })} /></label>
    <div className="mt-5 space-y-4">{([1, 2, 3] as const).map(rank => { const key = `choice_${rank}` as const; return <ChoicePicker key={rank} rank={rank} value={form[key]} onChange={value => setForm({ ...form, [key]: value })} /> })}</div>
    <label className="mt-5 block text-sm font-bold text-stone-300">Anything raid leaders should know<textarea maxLength={1000} className="mt-2 min-h-24 w-full rounded-lg border border-stone-700 bg-stone-950 p-3" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="Flexibility, gearing, schedule concerns, or goals…" /></label>
    <button disabled={saving || !apiConfigured} className="mt-5 w-full rounded-lg bg-amber-600 px-5 py-3 font-black text-stone-950 disabled:opacity-50">{saving ? 'Saving…' : 'Save My Choices'}</button>
    {message && <p role="status" className="mt-3 text-center text-sm text-amber-200">{message}</p>}
  </form>
}
