import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Users } from 'lucide-react'
import { apiConfigured, rosterApi, type PublicRow as Row } from '../lib/api'
import { CAPABILITY_GROUPS, CLASS_COLORS, CLASS_SPECS, getRole, type Role } from '../lib/gameData'

const ROLES: Role[] = ['Tank', 'Healer', 'Melee', 'Ranged']
export type BreakdownRow = Row
const CACHE_KEY = 'only-flasks-breakdown-cache'

function readCache(): { rows: Row[]; updatedAt: Date | null } {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return { rows: Array.isArray(cached?.rows) ? cached.rows : [], updatedAt: cached?.updatedAt ? new Date(cached.updatedAt) : null }
  } catch {
    return { rows: [], updatedAt: null }
  }
}

export function Breakdown({ rowsOverride, mode = 'public' }: { rowsOverride?: Row[]; mode?: 'public' | 'assigned' | 'first' } = {}) {
  const cached = useMemo(readCache, [])
  const [rows, setRows] = useState<Row[]>(() => rowsOverride ?? cached.rows)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(() => rowsOverride ? null : cached.updatedAt)

  const load = useCallback(async () => {
    if (!apiConfigured) return
    setLoading(true)
    try {
      const freshRows = await rosterApi.breakdown()
      const freshTime = new Date()
      setRows(freshRows)
      setUpdatedAt(freshTime)
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rows: freshRows, updatedAt: freshTime.toISOString() }))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load responses.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (rowsOverride) return
    load()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') load() }, 15_000)
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    const onSubmission = () => load()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('roster-submitted', onSubmission)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('roster-submitted', onSubmission) }
  }, [load, rowsOverride])

  const dataRows = rowsOverride ?? rows

  const count = useCallback((className: string, specName: string, rank: number) =>
    Number(dataRows.find(row => row.class_name === className && row.spec_name === specName && row.rank === rank)?.choice_count ?? 0), [dataRows])

  const totalRespondents = dataRows.filter(row => row.rank === 1).reduce((sum, row) => sum + Number(row.choice_count), 0)
  const roleCounts = useMemo(() => ROLES.map(role => ({
    role,
    count: Object.entries(CLASS_SPECS).flatMap(([className, specs]) => specs.map(specName => ({ className, specName })))
      .filter(spec => getRole({ class_name: spec.className, spec_name: spec.specName }) === role)
      .reduce((sum, spec) => sum + count(spec.className, spec.specName, 1), 0),
  })), [count])

  const classes = useMemo(() => Object.entries(CLASS_SPECS).map(([className, specs]) => {
    const visibleSpecs = specs.filter(specName => roleFilter === 'All' || getRole({ class_name: className, spec_name: specName }) === roleFilter)
    const totals = visibleSpecs.reduce((output, specName) => ({
      first: output.first + count(className, specName, 1),
      depth: output.depth + count(className, specName, 2) + count(className, specName, 3),
    }), { first: 0, depth: 0 })
    return { className, specs: visibleSpecs, ...totals }
  }).filter(item => item.specs.length).sort((a, b) => b.first - a.first || b.depth - a.depth || a.className.localeCompare(b.className)), [count, roleFilter])

  const maxSpecInterest = Math.max(1, ...classes.flatMap(item => item.specs.map(spec => count(item.className, spec, 1) + count(item.className, spec, 2) + count(item.className, spec, 3))))
  const classCoverage = Object.keys(CLASS_SPECS).reduce<Record<string, { first: number; backup: number }>>((output, className) => {
    output[className] = CLASS_SPECS[className].reduce((totals, specName) => ({
      first: totals.first + count(className, specName, 1),
      backup: totals.backup + count(className, specName, 2) + count(className, specName, 3),
    }), { first: 0, backup: 0 })
    return output
  }, {})

  return <section className="space-y-5">
    <div className="panel gold-border rounded-2xl p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="rune text-xs font-bold text-amber-300">Roster intelligence</p><h2 className="mt-2 text-3xl font-black">{mode === 'assigned' ? 'Assigned roster composition' : mode === 'first' ? 'First-choice snapshot' : 'Guild preference map'}</h2><p className="mt-2 max-w-2xl text-stone-400">{mode === 'assigned' ? 'Every count reflects players marked Roster and their assigned choice.' : mode === 'first' ? 'Every response is shown on its first choice, before Roster and Fill decisions.' : 'First choices show commitment. Second and third choices show the flex depth available to solve roster gaps.'}</p></div>
        {mode === 'public' && <button onClick={load} disabled={loading || !apiConfigured} className="flex items-center gap-2 rounded-lg border border-stone-700 bg-black/20 px-4 py-2 text-sm font-bold disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>}
      </div>
      {error && <p className="mt-4 rounded-lg border border-red-900 bg-red-950/30 p-3 text-red-200">{error}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-amber-700/60 bg-amber-950/20 p-4"><Users size={18} className="text-amber-300" /><div className="mt-2 text-3xl font-black">{totalRespondents}</div><div className="text-xs uppercase tracking-wide text-stone-400">Responses</div></div>
        {roleCounts.map(item => {
          const share = totalRespondents ? Math.round(item.count / totalRespondents * 100) : 0
          return <button key={item.role} onClick={() => setRoleFilter(roleFilter === item.role ? 'All' : item.role)} className={`rounded-xl border p-4 text-left transition ${roleFilter === item.role ? 'border-amber-400 bg-amber-500/10' : 'border-stone-700 bg-black/20 hover:border-stone-500'}`}><div className="flex items-end justify-between"><span className="text-3xl font-black">{item.count}</span><span className="text-sm text-stone-500">{share}%</span></div><div className="text-xs uppercase tracking-wide text-stone-400">{item.role} mains</div><div className="mt-2 h-1.5 overflow-hidden rounded bg-stone-800"><div className="h-full bg-amber-400" style={{ width: `${share}%` }} /></div></button>
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500"><span>Click a role to filter{mode === 'public' ? ' · auto-refreshes every 15 seconds' : ''}</span>{mode === 'public' && <span>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}` : 'Waiting for roster data'}</span>}</div>
    </div>

    <div className="panel gold-border rounded-2xl p-5 sm:p-8">
      <div><p className="rune text-xs font-bold text-sky-300">{mode === 'assigned' ? 'Locked coverage' : mode === 'first' ? 'Survey baseline' : 'Anonymous coverage'}</p><h3 className="mt-2 text-2xl font-black">{mode === 'assigned' ? 'What the assigned roster brings' : 'What the preference pool brings'}</h3>{mode === 'public' && <p className="mt-2 text-sm text-stone-400">Solid color is first-choice coverage. The smaller flex count comes from second and third choices.</p>}</div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">{Object.keys(CLASS_SPECS).map(className => {
        const coverage = classCoverage[className]
        return <div key={className} className={`rounded-lg border p-3 ${coverage.first ? 'border-stone-600 bg-black/25' : coverage.backup ? 'border-sky-900/70 bg-sky-950/15' : 'border-red-950 bg-red-950/10 opacity-60'}`} style={coverage.first ? { borderTopColor: CLASS_COLORS[className], borderTopWidth: 3 } : undefined}><div className="flex items-baseline justify-between gap-2"><b style={{ color: CLASS_COLORS[className] }}>{className}</b><span className="text-xl font-black">{coverage.first}</span></div>{mode === 'public' && <div className="mt-1 text-xs text-stone-500">{coverage.backup} flex</div>}</div>
      })}</div>
      <div className="mt-6 rounded-xl border border-stone-700 bg-black/20 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-3"><h4 className="font-black">Complete capability audit</h4><span className="text-xs font-bold text-amber-300">{mode === 'assigned' ? 'Assigned roster' : 'First choices only'}</span></div>
        <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">{CAPABILITY_GROUPS.map(group => <section key={group.name}><h5 className="mb-2 text-sm font-black text-amber-200">{group.name}</h5><div className="space-y-1">{group.items.map(item => {
          const first = item.providers.reduce((sum, className) => sum + (classCoverage[className]?.first ?? 0), 0)
          return <div key={item.name} tabIndex={0} className={`group relative flex items-center justify-between gap-3 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-500/60 ${first ? 'bg-emerald-950/20' : 'opacity-45 hover:opacity-100 focus:opacity-100'}`}><span className="text-stone-300">{item.name}{item.conditional && <sup className="ml-0.5 text-amber-400">*</sup>}</span><span className={`whitespace-nowrap font-black ${first ? 'text-emerald-300' : 'text-stone-600'}`}>{first}</span>
            <div role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden min-w-48 -translate-x-1/2 rounded-lg border border-stone-600 bg-stone-950 p-3 shadow-2xl group-hover:block group-focus:block"><div className="mb-2 text-xs font-black uppercase tracking-wider text-stone-400">Provider classes</div><div className="space-y-1.5">{item.providers.map(className => { const providerCount = classCoverage[className]?.first ?? 0; return <div key={className} className="flex items-center justify-between gap-5 text-sm"><span className="font-bold" style={{ color: providerCount ? CLASS_COLORS[className] : '#78716c' }}>{className}</span><span className={providerCount ? 'font-black text-stone-100' : 'text-stone-600'}>{providerCount ? `×${providerCount}` : '—'}</span></div> })}</div></div>
          </div>
        })}</div></section>)}</div>
        <p className="mt-5 border-t border-stone-800 pt-3 text-xs text-stone-500"><span className="text-amber-400">*</span> Talent, pet, spec, or loadout dependent. Counts use first choices and show players with access, not number of distinct spells. Hover an item to see provider classes.</p>
      </div>
    </div>

    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-black">{roleFilter === 'All' ? 'Class coverage' : `${roleFilter} coverage`}</h3>{roleFilter !== 'All' && <button onClick={() => setRoleFilter('All')} className="text-sm font-bold text-amber-300">Show every role</button>}</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{classes.map(item => <article key={item.className} className="panel overflow-hidden rounded-xl border border-stone-700" style={{ borderTop: `3px solid ${CLASS_COLORS[item.className]}` }}>
        <header className="flex items-center justify-between border-b border-stone-800 px-4 py-3"><div className="font-black" style={{ color: CLASS_COLORS[item.className] }}>{item.className}</div><div className="text-xs text-stone-500">{item.first} main · {item.depth} flex</div></header>
        <div className="divide-y divide-stone-800">{item.specs.map(specName => {
          const values = [1, 2, 3].map(rank => count(item.className, specName, rank))
          const interest = values.reduce((sum, value) => sum + value, 0)
          return <div key={specName} className="relative px-4 py-3"><div className="absolute inset-y-0 left-0 opacity-10" style={{ width: `${interest / maxSpecInterest * 100}%`, background: CLASS_COLORS[item.className] }} /><div className="relative flex items-center justify-between gap-3"><div><div className="font-bold">{specName}</div><div className="text-xs text-stone-500">{getRole({ class_name: item.className, spec_name: specName })}</div></div><div className="flex items-center gap-1.5" aria-label={`${specName}: ${values[0]} first, ${values[1]} second, ${values[2]} third choices`}><div title="First choice" className="grid h-11 w-11 place-items-center rounded-md border border-amber-500/70 bg-amber-950/50 text-lg font-black text-amber-100">{values[0]}</div>{values.slice(1).map((value, index) => <div key={index} title={`${index + 2}${index === 0 ? 'nd' : 'rd'} choice`} className="grid h-8 w-8 place-items-center rounded-md border border-stone-700 bg-black/20 text-xs font-bold text-stone-400">{value}</div>)}</div></div></div>
        })}</div>
      </article>)}</div>
      <div className="mt-4 flex items-center justify-end gap-3 text-xs text-stone-500"><span><b className="text-amber-200">1</b> First</span><span><b className="text-stone-300">2</b> Second</span><span><b className="text-stone-300">3</b> Third</span></div>
    </div>
  </section>
}
