/**
 * Multas CDV — backend en Google Apps Script sobre una hoja de cálculo.
 *
 * Lectura pública (GET). Escritura (POST) sólo con un token de dispositivo.
 * Cada responsable (Clau, David, Sergio, Gabi) reclama su plaza una sola vez
 * desde su móvil; una vez ocupada, nadie más puede usar ese nombre.
 */

/** Únicos responsables posibles (3 capitanes + entrenador). Un móvil por persona. */
const RESPONSABLES = { Clau: 'Capitán', David: 'Capitán', Sergio: 'Capitán', Gabi: 'Entrenador' };
const MAX_ADMINS = Object.keys(RESPONSABLES).length;
const SHEET_MULTAS = 'Multas';
const SHEET_ADMINS = 'Responsables';
const MULTAS_HEADERS = [
  'id', 'fecha', 'jugadorId', 'jugador', 'infraccionId', 'concepto', 'importe',
  'nota', 'creadaPor', 'pagada', 'fechaPago', 'cobradaPor',
];
const ADMINS_HEADERS = ['nombre', 'rol', 'tokenHash', 'fechaAlta', 'dispositivo'];
const ZONA = 'Europe/Madrid';
const CACHE_KEY = 'datos-v2';
const CACHE_SEG = 300; // ediciones manuales en la hoja se ven en ≤ 5 min

/** Ejecútalo una vez desde el editor para crear las pestañas y el código. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEET_MULTAS, MULTAS_HEADERS);
  ensureSheet_(ss, SHEET_ADMINS, ADMINS_HEADERS);
  const def = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  Logger.log('Listo.');
}

function doGet(e) {
  try {
    ensureFormato_();
    const cache = CacheService.getScriptCache();
    const hit = cache.get(CACHE_KEY);
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    return json_({ ok: true, ...readFresh_() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const result = handle_(body);
    const cambia = ['add', 'pay', 'unpay', 'delete', 'register', 'logout'].indexOf(body.action) >= 0;
    if (!cambia) return json_({ ok: true, ...result });
    // Devuelve los datos actualizados en la misma respuesta: el móvil no necesita otra llamada.
    return json_({ ok: true, ...result, datos: readFresh_() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function handle_(body) {
  switch (body.action) {
    case 'register': return register_(body);
    case 'whoami': return { admin: requireAdmin_(body.token) };
    case 'add': return addMulta_(requireAdmin_(body.token), body);
    case 'pay': return setPaid_(requireAdmin_(body.token), body.id, true);
    case 'unpay': return setPaid_(requireAdmin_(body.token), body.id, false);
    case 'delete': return deleteMulta_(requireAdmin_(body.token), body.id);
    case 'logout': return logout_(body.token);
    default: throw new Error('Acción desconocida');
  }
}

// ---------- lectura ----------

/** Lee la hoja y deja el resultado en caché para las siguientes visitas. */
function readFresh_() {
  const datos = readAll_();
  try {
    CacheService.getScriptCache().put(CACHE_KEY, JSON.stringify({ ok: true, ...datos }), CACHE_SEG);
  } catch (_) { /* > 100 KB: sin caché */ }
  return datos;
}

/**
 * Una vez: las fechas pasan a texto ISO (no dependen de zonas horarias) y la
 * hoja se pone en hora de Madrid. Las fechas antiguas se guardaron como celdas
 * de fecha en una hoja con hora de Los Ángeles y se leían desplazadas; se corrigen.
 */
function ensureFormato_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('formatoV2')) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const zonaHoja = ss.getSpreadsheetTimeZone();
  const sh = ss.getSheetByName(SHEET_MULTAS);
  const fmt = "yyyy-MM-dd'T'HH:mm:ss.SSS";
  ['fecha', 'fechaPago'].forEach(h => {
    const col = MULTAS_HEADERS.indexOf(h) + 1;
    const n = sh.getLastRow() - 1;
    if (n > 0) {
      const rango = sh.getRange(2, col, n, 1);
      const vals = rango.getValues().map(([v]) => {
        if (!(v instanceof Date)) return [v];
        const real = Utilities.parseDate(Utilities.formatDate(v, 'UTC', fmt), zonaHoja, fmt);
        return [real.toISOString()];
      });
      rango.setNumberFormat('@').setValues(vals);
    }
    sh.getRange(2, col, sh.getMaxRows() - 1, 1).setNumberFormat('@');
  });
  if (zonaHoja !== ZONA) ss.setSpreadsheetTimeZone(ZONA);
  props.setProperty('formatoV2', '1');
  CacheService.getScriptCache().remove(CACHE_KEY);
}

function readAll_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const multas = rows_(ss.getSheetByName(SHEET_MULTAS)).map(r => ({
    id: String(r.id),
    fecha: toIso_(r.fecha),
    jugadorId: String(r.jugadorId),
    infraccionId: String(r.infraccionId),
    concepto: String(r.concepto),
    importe: Number(r.importe) || 0,
    nota: String(r.nota || ''),
    creadaPor: String(r.creadaPor || ''),
    pagada: r.pagada === true || String(r.pagada).toUpperCase() === 'TRUE',
    fechaPago: r.fechaPago ? toIso_(r.fechaPago) : null,
    cobradaPor: String(r.cobradaPor || ''),
  }));
  const responsables = rows_(ss.getSheetByName(SHEET_ADMINS)).map(r => ({
    nombre: String(r.nombre),
    rol: String(r.rol),
  }));
  const ocupados = responsables.map(r => r.nombre);
  const libres = Object.keys(RESPONSABLES).filter(n => ocupados.indexOf(n) < 0);
  return { multas, responsables, libres, plazas: MAX_ADMINS, zona: ss.getSpreadsheetTimeZone() };
}

// ---------- responsables ----------

function register_(body) {
  const nombre = String(body.nombre || '').trim();
  const rol = RESPONSABLES[nombre];
  if (!rol) throw new Error('Solo pueden darse de alta ' + Object.keys(RESPONSABLES).join(', '));
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ADMINS);
  const admins = rows_(sheet);
  if (admins.some(a => String(a.nombre) === nombre)) {
    throw new Error(nombre + ' ya tiene un móvil autorizado. Si has cambiado de móvil, borra tu fila en la pestaña Responsables de la hoja.');
  }
  const token = Utilities.getUuid() + Utilities.getUuid();
  sheet.appendRow([nombre, rol, hash_(token), new Date(), String(body.dispositivo || '').slice(0, 120)]);
  return { token, admin: { nombre, rol } };
}

function requireAdmin_(token) {
  if (!token) throw new Error('No autorizado');
  const h = hash_(String(token));
  const a = rows_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ADMINS))
    .find(r => r.tokenHash === h);
  if (!a) throw new Error('No autorizado');
  return { nombre: String(a.nombre), rol: String(a.rol) };
}

function logout_(token) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ADMINS);
  const idx = findRowIndex_(sheet, 'tokenHash', hash_(String(token || '')));
  if (idx > 0) sheet.deleteRow(idx);
  return {};
}

// ---------- multas ----------

function addMulta_(admin, b) {
  const importe = Math.round(Number(b.importe) * 100) / 100;
  if (!b.jugadorId || !b.concepto) throw new Error('Faltan datos');
  if (!(importe >= 0) || importe > 500) throw new Error('Importe no válido');
  ensureFormato_();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MULTAS);
  const id = Utilities.getUuid();
  const fecha = new Date().toISOString();
  sheet.appendRow([
    id, fecha, String(b.jugadorId), String(b.jugador || ''), String(b.infraccionId || 'otra'),
    String(b.concepto).slice(0, 160), importe, String(b.nota || '').slice(0, 300),
    admin.nombre, false, '', '',
  ]);
  return { id };
}

function setPaid_(admin, id, paid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MULTAS);
  const row = findRowIndex_(sheet, 'id', String(id));
  if (row < 0) throw new Error('Multa no encontrada');
  ensureFormato_();
  const col = MULTAS_HEADERS.indexOf('pagada') + 1;
  sheet.getRange(row, col, 1, 3).setValues([[paid, paid ? new Date().toISOString() : '', paid ? admin.nombre : '']]);
  return {};
}

function deleteMulta_(admin, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MULTAS);
  const row = findRowIndex_(sheet, 'id', String(id));
  if (row < 0) throw new Error('Multa no encontrada');
  sheet.deleteRow(row);
  return {};
}

// ---------- utilidades ----------

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function rows_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  return values
    .filter(v => v.some(c => c !== ''))
    .map(v => Object.fromEntries(headers.map((h, i) => [h, v[i]])));
}

function findRowIndex_(sheet, header, value) {
  const values = sheet.getDataRange().getValues();
  const col = values[0].indexOf(header);
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][col]) === value) return i + 1;
  }
  return -1;
}

function hash_(s) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function toIso_(v) {
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toISOString();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
