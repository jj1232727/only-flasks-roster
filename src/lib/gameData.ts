export const CLASS_SPECS: Record<string, string[]> = {
  'Death Knight': ['Blood', 'Frost', 'Unholy'],
  'Demon Hunter': ['Havoc', 'Vengeance', 'Devourer'],
  Druid: ['Balance', 'Feral', 'Guardian', 'Restoration'],
  Evoker: ['Augmentation', 'Devastation', 'Preservation'],
  Hunter: ['Beast Mastery', 'Marksmanship', 'Survival'],
  Mage: ['Arcane', 'Fire', 'Frost'],
  Monk: ['Brewmaster', 'Mistweaver', 'Windwalker'],
  Paladin: ['Holy', 'Protection', 'Retribution'],
  Priest: ['Discipline', 'Holy', 'Shadow'],
  Rogue: ['Assassination', 'Outlaw', 'Subtlety'],
  Shaman: ['Elemental', 'Enhancement', 'Restoration'],
  Warlock: ['Affliction', 'Demonology', 'Destruction'],
  Warrior: ['Arms', 'Fury', 'Protection'],
}

export const CLASS_COLORS: Record<string, string> = {
  'Death Knight': '#C41E3A', 'Demon Hunter': '#A330C9', Druid: '#FF7C0A', Evoker: '#33937F',
  Hunter: '#AAD372', Mage: '#3FC7EB', Monk: '#00FF98', Paladin: '#F48CBA', Priest: '#FFFFFF',
  Rogue: '#FFF468', Shaman: '#0070DD', Warlock: '#8788EE', Warrior: '#C69B6D',
}

export type Choice = { class_name: string; spec_name: string }
export type Role = 'Tank' | 'Healer' | 'Melee' | 'Ranged'

const TANKS = new Set(['Blood Death Knight', 'Vengeance Demon Hunter', 'Guardian Druid', 'Brewmaster Monk', 'Protection Paladin', 'Protection Warrior'])
const HEALERS = new Set(['Restoration Druid', 'Preservation Evoker', 'Mistweaver Monk', 'Holy Paladin', 'Discipline Priest', 'Holy Priest', 'Restoration Shaman'])
const MELEE = new Set([
  'Frost Death Knight', 'Unholy Death Knight', 'Havoc Demon Hunter', 'Feral Druid', 'Survival Hunter',
  'Windwalker Monk', 'Retribution Paladin', 'Assassination Rogue', 'Outlaw Rogue', 'Subtlety Rogue',
  'Enhancement Shaman', 'Arms Warrior', 'Fury Warrior',
])

export function getRole(choice: Choice): Role {
  const key = `${choice.spec_name} ${choice.class_name}`
  if (TANKS.has(key)) return 'Tank'
  if (HEALERS.has(key)) return 'Healer'
  if (MELEE.has(key)) return 'Melee'
  return 'Ranged'
}

export function choiceLabel(choice: Choice) {
  return `${choice.spec_name} ${choice.class_name}`.trim()
}

export type RaidUtility = { name: string; providers: string[]; kind: 'Raid buff' | 'Key utility' }
export const RAID_UTILITIES: RaidUtility[] = [
  { name: 'Battle Shout', providers: ['Warrior'], kind: 'Raid buff' },
  { name: 'Arcane Intellect', providers: ['Mage'], kind: 'Raid buff' },
  { name: 'Power Word: Fortitude', providers: ['Priest'], kind: 'Raid buff' },
  { name: 'Mark of the Wild', providers: ['Druid'], kind: 'Raid buff' },
  { name: 'Mystic Touch', providers: ['Monk'], kind: 'Raid buff' },
  { name: 'Chaos Brand', providers: ['Demon Hunter'], kind: 'Raid buff' },
  { name: 'Blessing of the Bronze', providers: ['Evoker'], kind: 'Raid buff' },
  { name: 'Devotion Aura', providers: ['Paladin'], kind: 'Raid buff' },
  { name: 'Skyfury', providers: ['Shaman'], kind: 'Raid buff' },
  { name: 'Bloodlust / Heroism', providers: ['Mage', 'Shaman', 'Evoker', 'Hunter'], kind: 'Key utility' },
  { name: 'Combat resurrection', providers: ['Death Knight', 'Druid', 'Warlock', 'Paladin'], kind: 'Key utility' },
  { name: 'Healthstones', providers: ['Warlock'], kind: 'Key utility' },
  { name: 'Demonic Gateway', providers: ['Warlock'], kind: 'Key utility' },
  { name: 'Rallying Cry', providers: ['Warrior'], kind: 'Key utility' },
  { name: 'Mass Dispel', providers: ['Priest'], kind: 'Key utility' },
]

export type Capability = { name: string; providers: string[]; conditional?: boolean }
export type CapabilityGroup = { name: string; items: Capability[] }
const cap = (name: string, providers: string[], conditional = false): Capability => ({ name, providers, conditional })

export const CAPABILITY_GROUPS: CapabilityGroup[] = [
  { name: 'Buffs', items: [
    cap('Versatility', ['Druid']), cap('Intellect', ['Mage']), cap('Attack Power', ['Warrior']),
    cap('Stamina', ['Priest']), cap('Damage Dealt', ['Hunter'], true),
    cap('Movement Abilities', ['Evoker']), cap('Melee', ['Shaman'], true),
  ] },
  { name: 'Debuffs', items: [
    cap('Physical Damage Taken', ['Monk']), cap('Magic Damage Taken', ['Demon Hunter']),
  ] },
  { name: 'External Cooldowns', items: [
    cap('Damage Mitigation', ['Paladin', 'Priest', 'Evoker', 'Druid', 'Monk', 'Shaman'], true),
    cap('Immunities', ['Paladin'], true), cap('Movement Abilities', ['Priest', 'Evoker'], true),
    cap('Cheat Death', ['Shaman'], true), cap('Health', ['Priest', 'Shaman', 'Warlock'], true),
    cap('Reduced Threat', ['Paladin', 'Rogue', 'Hunter'], true),
  ] },
  { name: 'Personal Cooldowns', items: [
    cap('Damage Mitigation', Object.keys(CLASS_SPECS)),
    cap('Immunities', ['Death Knight', 'Demon Hunter', 'Hunter', 'Mage', 'Paladin', 'Rogue'], true),
    cap('Movement Abilities', Object.keys(CLASS_SPECS)),
    cap('Cheat Death', ['Mage', 'Rogue', 'Shaman'], true),
    cap('Stuns', ['Death Knight', 'Demon Hunter', 'Druid', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], true),
  ] },
  { name: 'Crowd Control', items: [
    cap('Incapacitates', ['Demon Hunter', 'Druid', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock'], true),
    cap('Roots', ['Druid', 'Hunter', 'Mage', 'Priest', 'Shaman'], true),
    cap('Slows', ['Death Knight', 'Demon Hunter', 'Druid', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], true),
    cap('Taunts', ['Death Knight', 'Demon Hunter', 'Druid', 'Monk', 'Paladin', 'Warrior']),
    cap('Stuns', ['Death Knight', 'Demon Hunter', 'Druid', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], true),
    cap('External Cooldowns', ['Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Mage', 'Monk', 'Paladin', 'Priest', 'Shaman', 'Warlock', 'Warrior'], true),
    cap('Disorients', ['Druid', 'Hunter', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Warlock', 'Warrior'], true),
    cap('Knockbacks', ['Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Hunter', 'Mage', 'Monk', 'Shaman'], true),
    cap('Miscellaneous Utility', ['Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], true),
  ] },
  { name: 'Other', items: [
    cap('Offensive Magic Dispels', ['Demon Hunter', 'Evoker', 'Hunter', 'Mage', 'Priest', 'Shaman', 'Warlock'], true),
    cap('Friendly Curse Dispels', ['Druid', 'Mage', 'Shaman']),
    cap('Friendly Magic Dispels', ['Druid', 'Evoker', 'Monk', 'Paladin', 'Priest', 'Shaman'], true),
    cap('Friendly Disease Dispels', ['Monk', 'Paladin', 'Priest']),
    cap('Silences', ['Death Knight', 'Demon Hunter', 'Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Warlock'], true),
    cap('Short CD Interrupts', ['Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], true),
    cap('Long CD Interrupts', ['Druid', 'Priest'], true),
    cap('Friendly Poison Dispels', ['Druid', 'Evoker', 'Monk', 'Paladin', 'Shaman']),
    cap('Offensive Enrage Dispels', ['Druid', 'Evoker', 'Hunter', 'Rogue'], true),
    cap('Battle Resurrections', ['Death Knight', 'Druid', 'Paladin', 'Warlock']),
    cap('Haste', ['Evoker', 'Hunter', 'Mage', 'Shaman'], true),
    cap('Miscellaneous Utility', ['Death Knight', 'Demon Hunter', 'Druid', 'Evoker', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], true),
    cap('Friendly Bleed Dispels', ['Druid', 'Evoker'], true),
    cap('Slows', ['Death Knight', 'Demon Hunter', 'Druid', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], true),
  ] },
]
export type Submission = {
  character_name: string
  choice_1: Choice
  choice_2: Choice
  choice_3: Choice
  notes: string
}

export const EMPTY_SUBMISSION: Submission = {
  character_name: '',
  choice_1: { class_name: '', spec_name: '' },
  choice_2: { class_name: '', spec_name: '' },
  choice_3: { class_name: '', spec_name: '' },
  notes: '',
}
