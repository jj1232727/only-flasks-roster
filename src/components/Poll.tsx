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

const EXTRA_DAY_OPTIONS = ['Early prog (first month)', 'Alt run', 'Sales']
const LEADERSHIP_OPTIONS = ['Strategy prep', 'Calls & assignments', 'Log review', 'Recruitment', 'Roster & admin']

export function Poll() {
  const [form, setForm] = useState<Submission>(EMPTY_SUBMISSION)
  const [discordName, setDiscordName] = useState('')
  const [extraDays, setExtraDays] = useState<string[]>([])
  const [leadership, setLeadership] = useState(false)
  const [leadershipAreas, setLeadershipAreas] = useState<string[]>([])
  const [attendance, setAttendance] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const toggle = (value: string, values: string[], update: (next: string[]) => void) =>
    update(values.includes(value) ? values.filter(item => item !== value) : [...values, value])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const labels = [form.choice_1, form.choice_2, form.choice_3].map(choice => choiceLabel(choice))
    if (labels.some(label => !label) || new Set(labels).size !== 3) return setMessage('Choose three different class/spec combinations.')
    const notes = [
      `Extra day: ${extraDays.length ? extraDays.join(', ') : 'None'}`,
      `Leadership: ${leadership ? (leadershipAreas.length ? leadershipAreas.join(', ') : 'Interested') : 'No'}`,
      `95% attendance: ${attendance ? 'Yes' : 'No'}`,
      form.notes.trim() ? `Additional comments: ${form.notes.trim()}` : '',
    ].filter(Boolean).join('\n')

    setSaving(true)
    setMessage('')
    try {
      await rosterApi.submit({ ...form, notes, discord_name: discordName.trim(), identity_token: browserIdentity() })
      window.dispatchEvent(new Event('roster-submitted'))
      setMessage('Saved. You can update this response later from this browser.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save.')
    }
    setSaving(false)
  }

  return <form onSubmit={save} className="panel gold-border rounded-2xl p-5 sm:p-8">
    <p className="rune text-xs font-bold text-amber-300">Your preferences</p>
    <h2 className="mt-2 text-3xl font-black">Choose your three brews</h2>
    <label className="mt-6 block text-sm font-bold text-stone-300">Discord name<input required maxLength={60} className="mt-2 w-full rounded-lg border border-stone-700 bg-stone-950 p-3" value={discordName} onChange={event => setDiscordName(event.target.value)} /></label>
    <label className="mt-4 block text-sm font-bold text-stone-300">Character name<input required maxLength={40} className="mt-2 w-full rounded-lg border border-stone-700 bg-stone-950 p-3" value={form.character_name} onChange={event => setForm({ ...form, character_name: event.target.value })} /></label>
    <div className="mt-5 space-y-4">{([1, 2, 3] as const).map(rank => { const key = `choice_${rank}` as const; return <ChoicePicker key={rank} rank={rank} value={form[key]} onChange={value => setForm({ ...form, [key]: value })} /> })}</div>

    <section className="mt-6 rounded-xl border border-stone-700 bg-black/20 p-4 sm:p-5">
      <p className="rune text-xs font-bold text-amber-300">Raid expectations</p>
      <h3 className="mt-2 text-xl font-black">What works for you?</h3>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold text-stone-300">Extra raid day <span className="font-normal text-stone-500">(select any)</span></legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {EXTRA_DAY_OPTIONS.map(option => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${extraDays.includes(option) ? 'border-amber-500 bg-amber-500/10 text-amber-100' : 'border-stone-700 bg-stone-950/60 text-stone-300'}`}><input type="checkbox" className="h-4 w-4 accent-amber-500" checked={extraDays.includes(option)} onChange={() => toggle(option, extraDays, setExtraDays)} /><span className="font-bold">{option}</span></label>)}
        </div>
      </fieldset>

      <label className={`mt-4 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${leadership ? 'border-amber-500 bg-amber-500/10' : 'border-stone-700 bg-stone-950/60'}`}><input type="checkbox" className="h-4 w-4 accent-amber-500" checked={leadership} onChange={event => { setLeadership(event.target.checked); if (!event.target.checked) setLeadershipAreas([]) }} /><span className="font-bold">I can help with leadership</span></label>
      {leadership && <fieldset className="mt-3 rounded-lg border border-stone-800 bg-stone-950/40 p-3">
        <legend className="px-1 text-sm font-bold text-stone-400">How can you help? <span className="font-normal">(select any)</span></legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LEADERSHIP_OPTIONS.map(option => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-stone-300 hover:bg-white/5"><input type="checkbox" className="h-4 w-4 accent-amber-500" checked={leadershipAreas.includes(option)} onChange={() => toggle(option, leadershipAreas, setLeadershipAreas)} />{option}</label>)}
        </div>
      </fieldset>}

      <label className={`mt-4 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${attendance ? 'border-emerald-700 bg-emerald-950/20' : 'border-stone-700 bg-stone-950/60'}`}><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={attendance} onChange={event => setAttendance(event.target.checked)} /><span className="font-bold">I can maintain 95% attendance</span></label>

      <label className="mt-4 block text-sm font-bold text-stone-300">Additional comments<textarea maxLength={700} className="mt-2 min-h-20 w-full rounded-lg border border-stone-700 bg-stone-950 p-3" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="Anything else raid leaders should know…" /></label>
    </section>

    <button disabled={saving || !apiConfigured} className="mt-5 w-full rounded-lg bg-amber-600 px-5 py-3 font-black text-stone-950 disabled:opacity-50">{saving ? 'Saving…' : 'Save My Choices'}</button>
    {message && <p role="status" className="mt-3 text-center text-sm text-amber-200">{message}</p>}
  </form>
}
