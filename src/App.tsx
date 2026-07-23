import { useState } from 'react'
import { Breakdown } from './components/Breakdown'
import { Poll } from './components/Poll'
import { Admin } from './components/Admin'
import { apiConfigured } from './lib/api'

type Tab = 'poll' | 'breakdown' | 'admin'

export default function App() {
  const officerMode = new URLSearchParams(window.location.search).get('officer') === '1'
  const [tab, setTab] = useState<Tab>(officerMode ? 'admin' : 'poll')
  return <main className="mx-auto max-w-7xl px-4 py-8">
    <header className="mb-7"><p className="rune text-xs font-bold text-amber-300">Only Flasks</p><h1 className="text-4xl font-black">Raid Roster Distillery</h1><p className="mt-2 text-stone-400">Build a roster around what people want to play.</p></header>
    {!apiConfigured && <div className="mb-5 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-amber-100"><b>Preview mode:</b> add <code>VITE_APPS_SCRIPT_URL</code> to enable submissions and live roster data.</div>}
    <nav className="mb-5 flex flex-wrap gap-2">{([['poll', 'Submit Choices'], ['breakdown', 'Guild Breakdown'], ...(officerMode ? [['admin', 'Raid Leaders']] : [])] as [Tab, string][]).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-lg border px-4 py-2 font-bold ${tab === id ? 'border-amber-400 bg-amber-500/15 text-amber-200' : 'border-stone-700 text-stone-400'}`}>{label}</button>)}</nav>
    <div className={tab === 'poll' ? '' : 'hidden'}><Poll /></div>
    <div className={tab === 'breakdown' ? '' : 'hidden'}><Breakdown /></div>
    {officerMode && <div className={tab === 'admin' ? '' : 'hidden'}><Admin /></div>}
  </main>
}
