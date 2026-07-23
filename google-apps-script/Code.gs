const HEADERS = [
  'id', 'discord_name', 'discord_key', 'edit_hash', 'character_name',
  'choice_1', 'choice_2', 'choice_3', 'player_notes', 'status',
  'assigned_rank', 'officer_notes', 'updated_at'
];

/**
 * Run once from a script bound to the destination Google Sheet.
 * Replace the placeholder before running; never put this secret in GitHub.
 */
function setup() {
  const adminSecret = 'REPLACE_WITH_A_LONG_RANDOM_ADMIN_SECRET';
  if (adminSecret.indexOf('REPLACE_') === 0) throw new Error('Set a real admin secret first.');
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('SHEET_ID', SpreadsheetApp.getActive().getId());
  properties.setProperty('ADMIN_SECRET', adminSecret);
  if (!properties.getProperty('EDIT_SALT')) {
    properties.setProperty('EDIT_SALT', Utilities.getUuid() + Utilities.getUuid());
  }
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
}

function doGet() {
  return json_({ ok: true, data: { service: 'Only Flasks roster API' } });
}

function doPost(event) {
  try {
    const action = String(event.parameter.action || '');
    const payload = JSON.parse(event.parameter.payload || '{}');
    if (action === 'submit') return json_({ ok: true, data: submit_(payload) });
    if (action === 'breakdown') return json_({ ok: true, data: breakdown_() });
    if (action === 'adminRoster') { requireAdmin_(payload); return json_({ ok: true, data: adminRoster_() }); }
    if (action === 'saveAssignment') { requireAdmin_(payload); saveAssignment_(payload); return json_({ ok: true, data: null }); }
    throw new Error('Unknown action.');
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function submit_(payload) {
  const discordName = clean_(payload.discord_name, 60);
  const identityToken = String(payload.identity_token || '');
  const characterName = clean_(payload.character_name, 40);
  if (!discordName || !characterName || identityToken.length < 20) throw new Error('Discord name, character name, and a valid browser identity are required.');
  const choices = [payload.choice_1, payload.choice_2, payload.choice_3];
  choices.forEach(validateChoice_);
  if (new Set(choices.map(choice => choice.spec_name + '|' + choice.class_name)).size !== 3) throw new Error('Choices must be different.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const rows = values_(sheet);
    const discordKey = discordName.toLowerCase();
    const index = rows.findIndex(row => row.discord_key === discordKey);
    const editHash = hash_(identityToken);
    const existing = index >= 0 ? rows[index] : null;
    if (existing && existing.edit_hash !== editHash) throw new Error('That Discord name was submitted from another browser. Ask a raid leader to remove or correct the old response.');
    const record = [
      existing ? existing.id : Utilities.getUuid(), discordName, discordKey, editHash, characterName,
      JSON.stringify(choices[0]), JSON.stringify(choices[1]), JSON.stringify(choices[2]),
      clean_(payload.notes, 1000), existing ? (existing.status === 'unassigned' ? 'roster' : existing.status) : 'roster',
      existing ? (existing.assigned_rank || 1) : 1, existing ? existing.officer_notes : '', new Date().toISOString()
    ];
    if (existing) sheet.getRange(index + 2, 1, 1, HEADERS.length).setValues([record]);
    else sheet.appendRow(record);
    CacheService.getScriptCache().remove('breakdown');
    return { updated: Boolean(existing) };
  } finally {
    lock.releaseLock();
  }
}

function breakdown_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('breakdown');
  if (cached) return JSON.parse(cached);
  const counts = {};
  values_(getSheet_()).forEach(row => [1, 2, 3].forEach(rank => {
    const choice = JSON.parse(row['choice_' + rank]);
    const key = choice.class_name + '|' + choice.spec_name + '|' + rank;
    counts[key] = (counts[key] || 0) + 1;
  }));
  const result = Object.keys(counts).map(key => {
    const parts = key.split('|');
    return { class_name: parts[0], spec_name: parts[1], rank: Number(parts[2]), choice_count: counts[key] };
  });
  cache.put('breakdown', JSON.stringify(result), 30);
  return result;
}

function adminRoster_() {
  return values_(getSheet_()).map(row => ({
    id: row.id, discord_name: row.discord_name, character_name: row.character_name,
    choice_1: JSON.parse(row.choice_1), choice_2: JSON.parse(row.choice_2), choice_3: JSON.parse(row.choice_3),
    notes: row.player_notes || '', status: row.status === 'main' ? 'roster' : row.status === 'bench' ? 'fill' : (!row.status || row.status === 'unassigned' ? 'roster' : row.status),
    assigned_rank: row.assigned_rank === '' ? 1 : Number(row.assigned_rank),
    officer_notes: row.officer_notes || '', updated_at: row.updated_at
  }));
}

function saveAssignment_(payload) {
  const allowed = ['unassigned', 'roster', 'fill'];
  if (!allowed.includes(payload.status)) throw new Error('Invalid roster status.');
  if (payload.assigned_rank !== null && ![1, 2, 3].includes(Number(payload.assigned_rank))) throw new Error('Invalid assigned choice.');
  const sheet = getSheet_();
  const rows = values_(sheet);
  const index = rows.findIndex(row => row.id === payload.id);
  if (index < 0) throw new Error('Raider not found.');
  sheet.getRange(index + 2, HEADERS.indexOf('status') + 1).setValue(payload.status);
  sheet.getRange(index + 2, HEADERS.indexOf('assigned_rank') + 1).setValue(payload.assigned_rank === null ? '' : Number(payload.assigned_rank));
  sheet.getRange(index + 2, HEADERS.indexOf('officer_notes') + 1).setValue(clean_(payload.officer_notes, 2000));
}

function requireAdmin_(payload) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET');
  if (!expected || String(payload.admin_secret || '') !== expected) throw new Error('Invalid raid-leader secret.');
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Run setup() before deploying.');
  const spreadsheet = SpreadsheetApp.openById(id);
  let sheet = spreadsheet.getSheetByName('Roster');
  if (!sheet) sheet = spreadsheet.insertSheet('Roster');
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function values_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues().map(values => {
    const row = {};
    HEADERS.forEach((header, index) => row[header] = values[index]);
    return row;
  });
}

function hash_(value) {
  const salt = PropertiesService.getScriptProperties().getProperty('EDIT_SALT') || '';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value + salt);
  return bytes.map(byte => ('0' + ((byte < 0 ? byte + 256 : byte).toString(16))).slice(-2)).join('');
}

function validateChoice_(choice) {
  if (!choice || !clean_(choice.class_name, 30) || !clean_(choice.spec_name, 30)) throw new Error('All three choices are required.');
}

function clean_(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
