import { CLASS_COLORS, CLASS_SPECS, getRole, type Choice } from '../lib/gameData'

export function ChoicePicker({ rank, value, onChange }: { rank: number; value: Choice; onChange: (v: Choice) => void }) {
  return <div className="rounded-xl border border-stone-700 bg-black/20 p-4" style={{ borderLeft: `4px solid ${CLASS_COLORS[value.class_name] ?? '#9a7740'}` }}>
    <div className="mb-3 flex items-center justify-between"><strong className="text-amber-200">{rank === 1 ? 'Main Flask' : `Reserve Brew ${rank}`}</strong><span className="text-xs text-stone-500">{value.spec_name ? getRole(value) : `Choice ${rank}`}</span></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <select className="rounded-lg border border-stone-700 bg-stone-950 p-3" value={value.class_name} onChange={e => onChange({ class_name: e.target.value, spec_name: '' })}>
        <option value="">Choose class</option>{Object.keys(CLASS_SPECS).map(c => <option key={c}>{c}</option>)}
      </select>
      <select className="rounded-lg border border-stone-700 bg-stone-950 p-3" value={value.spec_name} disabled={!value.class_name} onChange={e => onChange({ ...value, spec_name: e.target.value })}>
        <option value="">Choose spec</option>{(CLASS_SPECS[value.class_name] ?? []).map(s => <option key={s}>{s}</option>)}
      </select>
    </div>
  </div>
}
