import { useMemo, useState } from 'react'
import { Check, LockKeyhole, Search } from 'lucide-react'
import { rosterApi, type AdminPlayer } from '../lib/api'
import { CLASS_COLORS, choiceLabel, getRole, type Role } from '../lib/gameData'
import { Breakdown, type BreakdownRow } from './Breakdown'

export function Admin() {
  const [secret, setSecret] = useState('')
  const [players, setPlayers] = useState<AdminPlayer[]>([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const unlock = async () => { setLoading(true); setMessage(''); try { const roster = await rosterApi.adminRoster(secret); setPlayers(roster.map(player => ({ ...player, status: player.status === 'unassigned' ? 'roster' : player.status, assigned_rank: player.assigned_rank ?? 1 }))); setUnlocked(true) } catch (error) { setMessage(error instanceof Error ? error.message : 'Access failed.') } setLoading(false) }
  const update = (id: string, patch: Partial<AdminPlayer>) => setPlayers(current => current.map(player => player.id === id ? { ...player, ...patch } : player))
  const save = async (player: AdminPlayer) => { try { await rosterApi.saveAssignment(secret, player); setMessage(`Saved ${player.character_name}.`) } catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed.') } }
  const mains = useMemo(() => players.filter(player => player.status === 'roster' && player.assigned_rank).map(player => {
    const choice = player[`choice_${player.assigned_rank}` as 'choice_1']
    return { ...player, choice, role: getRole(choice) }
  }), [players])
  const roleCounts = (['Tank', 'Healer', 'Melee', 'Ranged'] as Role[]).map(role => ({ role, count: mains.filter(player => player.role === role).length }))
  const assignedRows = Object.values(mains.reduce<Record<string, BreakdownRow>>((output, player) => {
    const choice = player[`choice_${player.assigned_rank}` as 'choice_1']
    const key = `${choice.class_name}|${choice.spec_name}`
    output[key] = { class_name: choice.class_name, spec_name: choice.spec_name, rank: 1, choice_count: (output[key]?.choice_count ?? 0) + 1 }
    return output
  }, {}))

  if (!unlocked) return <section className="panel gold-border rounded-2xl p-5 sm:p-8"><LockKeyhole className="text-amber-300" /><h2 className="mt-3 text-3xl font-black">Raid leader access</h2><p className="mt-2 text-stone-400">This secret is checked by Apps Script and is never stored in the GitHub repository.</p><div className="mt-5 flex max-w-lg gap-2"><input type="password" className="min-w-0 flex-1 rounded-lg border border-stone-700 bg-stone-950 p-3" value={secret} onChange={event => setSecret(event.target.value)} placeholder="Admin secret" /><button onClick={unlock} disabled={loading || !secret} className="rounded-lg bg-amber-600 px-5 font-bold text-stone-950 disabled:opacity-50">{loading ? 'Checking…' : 'Unlock'}</button></div>{message && <p className="mt-3 text-red-300">{message}</p>}</section>

  const visible = players.filter(player => `${player.discord_name} ${player.character_name}`.toLowerCase().includes(search.toLowerCase()))
  return <section className="space-y-5"><div className="panel gold-border rounded-2xl p-5 sm:p-8"><p className="rune text-xs font-bold text-red-300">Private planning</p><h2 className="mt-2 text-3xl font-black">Raid leader overview</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-6"><Summary label="Roster" value={players.filter(player => player.status === 'roster').length} /><Summary label="Fill" value={players.filter(player => player.status === 'fill').length} />{roleCounts.map(item => <Summary key={item.role} label={item.role} value={item.count} />)}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(['Tank', 'Healer', 'Melee', 'Ranged'] as Role[]).map(role => {
      const rolePlayers = mains.filter(player => player.role === role).sort((a, b) => a.character_name.localeCompare(b.character_name))
      return <section key={role} className="overflow-hidden rounded-xl border border-stone-700 bg-black/20"><header className="flex items-center justify-between border-b border-stone-800 px-4 py-3"><h3 className="font-black">{role}{role === 'Melee' || role === 'Ranged' ? ' DPS' : 's'}</h3><span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs font-black">{rolePlayers.length}</span></header><div className="divide-y divide-stone-800">{rolePlayers.map(player => <div key={player.id} className="px-4 py-3"><div className="break-words font-bold leading-snug">{player.character_name}</div><div className="mt-1 break-words text-xs font-bold leading-snug" style={{ color: CLASS_COLORS[player.choice.class_name] }}>{player.choice.spec_name} {player.choice.class_name}</div></div>)}{!rolePlayers.length && <div className="px-4 py-5 text-center text-sm text-red-300">No assigned players</div>}</div></section>
    })}</div>
  </div>
    <Breakdown rowsOverride={assignedRows} mode="assigned" />
    <div className="panel gold-border rounded-2xl p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black">Player roster sheet</h3><p className="text-sm text-stone-500">One player per row with every decision field visible.</p></div><label className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-950 px-3"><Search size={15} /><input className="w-40 bg-transparent py-2 outline-none" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search" /></label></div>{message && <p className="mt-3 text-amber-200">{message}</p>}
      <div className="mt-5 overflow-x-auto rounded-xl border border-stone-700"><table className="w-full min-w-[1460px] table-fixed border-collapse text-left text-sm"><colgroup><col className="w-[170px]" /><col className="w-[280px]" /><col className="w-[310px]" /><col className="w-[120px]" /><col className="w-[120px]" /><col className="w-[370px]" /><col className="w-[70px]" /></colgroup><thead className="sticky top-0 bg-stone-950 text-xs uppercase tracking-wide text-stone-400"><tr><th className="p-3">Player</th><th className="p-3">Ranked choices</th><th className="p-3">Message to raid leaders</th><th className="p-3">Decision</th><th className="p-3">Assigned</th><th className="p-3">Private officer notes</th><th className="p-3"><span className="sr-only">Save</span></th></tr></thead><tbody>{visible.map(player => {
        const choices = [player.choice_1, player.choice_2, player.choice_3]
        return <tr key={player.id} className="border-t border-stone-800 align-top hover:bg-white/[.025]"><td className="p-3"><div className="break-words font-black">{player.character_name}</div><div className="break-words text-xs text-stone-500">{player.discord_name}</div></td><td className="p-3"><div className="space-y-1.5">{choices.map((choice, index) => <div key={index} className={`rounded border px-2 py-1.5 ${player.assigned_rank === index + 1 ? 'border-amber-700/70 bg-amber-950/20' : 'border-stone-800'}`}><div className="font-bold" style={{ color: CLASS_COLORS[choice.class_name] }}>{index + 1}. {choiceLabel(choice)}</div><div className="text-xs text-stone-500">{getRole(choice)}</div></div>)}</div></td><td className="p-3"><div className="min-h-24 rounded-lg border border-stone-800 bg-stone-950/50 p-3"><RaidLeaderMessage notes={player.notes} /></div></td><td className="p-3"><select aria-label={`Decision for ${player.character_name}`} className="w-full rounded border border-stone-700 bg-stone-950 p-2" value={player.status} onChange={event => update(player.id, { status: event.target.value as AdminPlayer['status'] })}><option value="roster">Roster</option><option value="fill">Fill</option></select></td><td className="p-3"><select aria-label={`Assigned choice for ${player.character_name}`} className="w-full rounded border border-stone-700 bg-stone-950 p-2" value={player.assigned_rank ?? 1} onChange={event => update(player.id, { assigned_rank: Number(event.target.value) })}><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option></select></td><td className="p-3"><textarea aria-label={`Officer notes for ${player.character_name}`} className="min-h-28 w-full resize-y rounded border border-stone-700 bg-stone-950 p-3 leading-relaxed" value={player.officer_notes} onChange={event => update(player.id, { officer_notes: event.target.value })} placeholder="Evaluation, attendance, follow-up…" /></td><td className="p-3"><button title={`Save ${player.character_name}`} onClick={() => save(player)} className="rounded-lg bg-emerald-800 p-2 text-emerald-50"><Check size={16} /></button></td></tr>
      })}{!visible.length && <tr><td colSpan={7} className="p-8 text-center text-stone-500">No player responses match this view.</td></tr>}</tbody></table></div>
    </div></section>
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-stone-700 bg-black/20 p-4"><div className="text-2xl font-black">{value}</div><div className="text-xs uppercase text-stone-500">{label}</div></div> }

function RaidLeaderMessage({ notes }: { notes: string }) {
  if (!notes) return <div className="text-stone-600">—</div>
  const lines = notes.split('\n').map(line => line.trim()).filter(Boolean)
  const valueFor = (label: string) => lines.find(line => line.startsWith(`${label}:`))?.slice(label.length + 1).trim()
  const extraDay = valueFor('Extra day')
  const leadership = valueFor('Leadership')
  const attendance = valueFor('95% attendance')
  const commentsLabel = 'Additional comments:'
  const comments = notes.includes(commentsLabel) ? notes.slice(notes.indexOf(commentsLabel) + commentsLabel.length).trim() : undefined
  const structured = extraDay !== undefined || leadership !== undefined || attendance !== undefined

  if (!structured) return <div className="whitespace-pre-wrap break-words leading-relaxed text-stone-300">{notes}</div>

  const chips = (value?: string) => value && value !== 'None' && value !== 'No'
    ? <div className="mt-1.5 flex flex-wrap gap-1">{value.split(',').map(item => <span key={item} className="rounded-full border border-stone-700 bg-stone-900 px-2 py-0.5 text-xs text-stone-300">{item.trim()}</span>)}</div>
    : <div className="mt-1 text-xs text-stone-600">None selected</div>

  return <div className="space-y-3">
    <div><div className="text-[10px] font-black uppercase tracking-wider text-stone-500">Optional day</div>{chips(extraDay)}</div>
    <div><div className="text-[10px] font-black uppercase tracking-wider text-stone-500">Leadership</div>{chips(leadership)}</div>
    <div className="flex items-center justify-between gap-3"><div className="text-[10px] font-black uppercase tracking-wider text-stone-500">95% attendance</div><span className={`rounded-full px-2 py-0.5 text-xs font-black ${attendance === 'Yes' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>{attendance || 'No'}</span></div>
    {comments && <div className="border-t border-stone-800 pt-2"><div className="text-[10px] font-black uppercase tracking-wider text-stone-500">Comments</div><div className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-stone-300">{comments}</div></div>}
  </div>
}
