// ===== Despacho móvil: vista de consulta dentro de la página de ATGO (Android, sin PC ni servidor) =====
// Solo lee: la única función que habla con ATGO es leer() y siempre hace GET (lo comprueba tests/pruebas.js).
// El token no sale de esta página. Lo guardado (última carga) se borra solo tras 7 días sin uso.
// El bloque «Copias» viene de la PWA y de atgo-sync.js: las pruebas exigen que siga idéntico a su original.
(function () {
'use strict';
{
  // Ya abierta en esta pestaña: se enseña. Si su ventana desapareció de la página (ATGO la rehízo), se cierra lo anterior y se abre de nuevo
  const prev = window.__despachoMovil, viva = document.getElementById('despacho-movil');
  if (prev && viva) { viva.style.display = ''; return; }
  if (prev) { try { if (typeof prev.salir === 'function') prev.salir(); } catch (e) { /* versión anterior: se sustituye igualmente */ } delete window.__despachoMovil; }
}
const MOVIL_VERSION = '1.3.1';
const EN_APP = /DespachoApp\//.test(navigator.userAgent);   // dentro de la app Android «Despacho»
const CLAVE = 'despachoMovil_v1', PARALELO = 6, TIEMPO_MS = 40000, CADUCA_MS = 7 * 86400000, REFRESCO_MS = 10 * 60000, AL_VOLVER_MS = 2 * 60000;
const ESTADOS_ATGO = [10, 20, 30, 40, 80, 100, 110];
const ESTADOS_SIN_SLA = ['FUERA DE MANTENIMIENTO'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// ---- Copias (no editar aquí) ----
const ZONAS_BASE = [
  { nombre:'DISPATCHER',     ops:['AMRG'], dispatcher:true },
  { nombre:'SEVILLA/HUELVA', ops:['DSG','ACAB','CLH','JGAM'] },
  { nombre:'CÓRDOBA/JAÉN',   ops:['JCGM'] },
  { nombre:'GRANADA',        ops:['LGV','ADJC'] },
  { nombre:'ALMERÍA',        ops:['LEOC','IFF'] },
  { nombre:'MÁLAGA',         ops:['JVR','ILG','MMHG','FMNT'] },
  { nombre:'CÁDIZ',          ops:['EACL','AAR','DSJ','JRHG'] },
  { nombre:'CEUTA',          ops:['JIFC'], apoyo:['DSJ','AAR','EACL','JRHG'] },
  { nombre:'MELILLA',        ops:['PHEP'], apoyo:['JVR','ILG','FMNT','MMHG'] },
  { nombre:'EXTREMADURA',    ops:['MLOR'] },
  // DSP2 · Cataluña y Levante
  { nombre:'MURCIA',            ops:['RUFB','GAS'], dsp:'DSP2' },
  { nombre:'ALICANTE',          ops:['JLAR','DOB','FMDT'], dsp:'DSP2' },
  { nombre:'VALENCIA/CASTELLÓN', ops:['AHC','EMPC','JPV'], dsp:'DSP2' },
  { nombre:'CATALUÑA',          ops:['JHT','MRME','JMLZ','JGIM','ALA','AGR','JJCH','OALC'], dsp:'DSP2' },
  // DSP3 · Madrid-Centro
  { nombre:'MADRID',            ops:['ADGG','AGUR','JCY','ASAR','ALV','IRP','JMIO','LOM'], dsp:'DSP3' },
  { nombre:'CIUDAD REAL',       ops:['JICN','ANAR'], dsp:'DSP3' },
  // DSP4 · Norte
  { nombre:'CASTILLA Y LEÓN',   ops:['JCCT','MREE','AGOR','JLMG','CVA','ZETA'], dsp:'DSP4' },
  { nombre:'ARAGÓN',            ops:['JRAM'], dsp:'DSP4' },
  { nombre:'GALICIA',           ops:['JMPL','JSF','PRG'], dsp:'DSP4' },
  { nombre:'ASTURIAS/CANTABRIA', ops:['CMDF','MACR','LABEL','ABEC'], dsp:'DSP4' },
  { nombre:'NORTE',             ops:['CBUP','OAM','JRMO','JAIS'], dsp:'DSP4' },
  // DSP5 · Baleares-Portugal
  { nombre:'BALEARES',          ops:['GOMILA','FASG','JMV','TIKKA'], dsp:'DSP5' },
  { nombre:'PORTUGAL',          ops:['TICASGEST'], dsp:'DSP5' }
];
const ESTADO_COLOR = { 'presencial':'#2f8f87', 'puesto operativo':'#4f9a5b', 'fuera de mantenimiento':'#7d8790', 'material pte. fabricante':'#8e6cc4', 'pte. mover material':'#c9862b', 'en fabricante':'#4a7fcf', 'escalado tier1':'#d0544a', 'cerrado':'#5f8f6a' };
const ESTADOS = ['PRESENCIAL','PUESTO OPERATIVO','FUERA DE MANTENIMIENTO','MATERIAL PTE. FABRICANTE','PTE. MOVER MATERIAL','EN FABRICANTE','ESCALADO TIER1'];
const PALETTE = ['#2f8f87','#c9862b','#5b8dd9','#a97fd1','#c9527a','#5ea86f','#d9614f','#8b98a3'];
const POOL_ZONA = { 'XXX-SVQ': 'SEVILLA/HUELVA', 'XXX-CA': 'CÁDIZ', 'XXX-MA': 'MÁLAGA', 'XXX-G': 'GRANADA', 'XXX-AL': 'ALMERÍA', 'XXX-J': 'CÓRDOBA/JAÉN', 'XXX-0EXTREM': 'EXTREMADURA', 'XXX-0CEUTA': 'CEUTA', 'XXX-0MELILL': 'MELILLA' };
const HILO_SISTEMA = [/^el usuario \S+ ha (iniciado|finalizado|pausado|reanudado|cerrado|reabierto)/i, /^incidencia asignada a/i, /^se ha (cambiado|modificado) el estado/i,
  /^el ticket ha cambiado del estado/i, /^cambio caducidad:/i, /^\S+ ha firmado el parte de trabajo/i, /^\[SM\][^-]*- Service Manager - Actualizaci/i];
const ESTADOS_CIERRE = ['CERRADO', 'CERRADO PTE. PRESUPUESTO', 'PUESTO OPERATIVO', 'PTO. OPERATIVO PTE. ENVÍO PRESUPUESTO', 'PTO. OPERATIVO PTE. ACEPTACIÓN PRESUPUESTO'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const CAD_RE = /caduc|vencimiento|\bvence\b|fecha\s+l[ií]mite|\bsla\b/i;
const PROV_ZONA = { sevilla: 'SEVILLA/HUELVA', huelva: 'SEVILLA/HUELVA', cordoba: 'CÓRDOBA/JAÉN', jaen: 'CÓRDOBA/JAÉN', granada: 'GRANADA', almeria: 'ALMERÍA', malaga: 'MÁLAGA', cadiz: 'CÁDIZ', ceuta: 'CEUTA', melilla: 'MELILLA', badajoz: 'EXTREMADURA', caceres: 'EXTREMADURA',
  murcia: 'MURCIA', cartagena: 'MURCIA', alicante: 'ALICANTE', alacant: 'ALICANTE', valencia: 'VALENCIA/CASTELLÓN', castellon: 'VALENCIA/CASTELLÓN', castello: 'VALENCIA/CASTELLÓN',
  barcelona: 'CATALUÑA', girona: 'CATALUÑA', gerona: 'CATALUÑA', lleida: 'CATALUÑA', lerida: 'CATALUÑA', tarragona: 'CATALUÑA',
  madrid: 'MADRID', 'ciudad real': 'CIUDAD REAL',
  leon: 'CASTILLA Y LEÓN', valladolid: 'CASTILLA Y LEÓN', burgos: 'CASTILLA Y LEÓN', salamanca: 'CASTILLA Y LEÓN', zamora: 'CASTILLA Y LEÓN', palencia: 'CASTILLA Y LEÓN', segovia: 'CASTILLA Y LEÓN', soria: 'CASTILLA Y LEÓN', avila: 'CASTILLA Y LEÓN',
  zaragoza: 'ARAGÓN', huesca: 'ARAGÓN', teruel: 'ARAGÓN',
  galicia: 'GALICIA', coruna: 'GALICIA', 'a coruna': 'GALICIA', lugo: 'GALICIA', ourense: 'GALICIA', orense: 'GALICIA', pontevedra: 'GALICIA', vigo: 'GALICIA',
  asturias: 'ASTURIAS/CANTABRIA', oviedo: 'ASTURIAS/CANTABRIA', gijon: 'ASTURIAS/CANTABRIA', cantabria: 'ASTURIAS/CANTABRIA', santander: 'ASTURIAS/CANTABRIA',
  'pais vasco': 'NORTE', euskadi: 'NORTE', guipuzkoa: 'NORTE', vizcaya: 'NORTE', bizkaia: 'NORTE', bilbao: 'NORTE', guipuzcoa: 'NORTE', gipuzkoa: 'NORTE', alava: 'NORTE', araba: 'NORTE', vitoria: 'NORTE', navarra: 'NORTE', pamplona: 'NORTE', rioja: 'NORTE', logrono: 'NORTE', donostia: 'NORTE', 'san sebastian': 'NORTE',
  baleares: 'BALEARES', balears: 'BALEARES', mallorca: 'BALEARES', menorca: 'BALEARES', ibiza: 'BALEARES', eivissa: 'BALEARES',
  portugal: 'PORTUGAL', lisboa: 'PORTUGAL', porto: 'PORTUGAL', faro: 'PORTUGAL', braga: 'PORTUGAL', coimbra: 'PORTUGAL' };
const PROV_RE = Object.entries(PROV_ZONA).map(([k, z]) => [new RegExp('(^|[^a-z0-9])' + k + '([^a-z0-9]|$)'), z]);
function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); }
function cleanInitials(s){ return String(s||'').toUpperCase().replace(/[.\s]/g,'').trim(); }
function horaMin(h){ const m = /^(\d{1,2}):(\d{2})/.exec(h || ''); return m ? (+m[1])*60 + (+m[2]) : 9999; }
function esPresencial(r){ return norm(r.estado).includes('presencial'); }
function colorFor(s){
  const str = String(s||'—');
  let h = 0; for (let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function ordenVisita(a, b, hoyT){
  const clave = r => { const d = parseEs(r.fVisita); if (!d) return [1, 0]; const t = d.getTime(); return t >= hoyT ? [0, t] : [2, -t]; };
  const x = clave(a), y = clave(b);
  return x[0] - y[0] || x[1] - y[1] || horaMin(a.desdeHora) - horaMin(b.desdeHora);
}
function ordenEstado(e){ const i = ESTADOS.findIndex(x => norm(x) === norm(e)); return i < 0 ? 99 : i; }
function parseEs(s) { const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1], 12) : null; }
function esCierre(estado) { const n = norm(estado); return ESTADOS_CIERRE.some(c => norm(c) === n); }
function fechasEnTexto(t, refTs) {
  const out = [], ref = new Date(refTs || Date.now());
  const add = (idx, y, mo, d, hh, mm, conAnio) => {
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) return;
    const dt = new Date(y, mo - 1, d, hh, mm);
    if (dt.getMonth() !== mo - 1) return;   // 31/02 y similares
    if (!conAnio && dt.getTime() < ref.getTime() - 60 * 86400000) dt.setFullYear(y + 1);
    out.push({ ts: dt.getTime(), idx, conHora: !(hh === 23 && mm === 59) });
  };
  const hora = '(?:[^\\d\\n]{0,14}?(\\d{1,2})[:h.](\\d{2}))?';
  let m;
  const re1 = new RegExp('(?<![\\d/])(\\d{1,2})[\\/\\-.](\\d{1,2})(?:[\\/\\-.](\\d{2,4}))?(?![\\d/])' + hora, 'g');
  while ((m = re1.exec(t))) {
    let y = m[3] ? +m[3] : ref.getFullYear(); if (y < 100) y += 2000;
    add(m.index, y, +m[2], +m[1], m[4] != null ? +m[4] : 23, m[5] != null ? +m[5] : 59, !!m[3]);
  }
  const re2 = new RegExp('(\\d{1,2})\\s+de\\s+(' + MESES.join('|') + ')(?:\\s+(?:de|del)\\s+(\\d{4}))?' + hora, 'gi');
  while ((m = re2.exec(t))) {
    add(m.index, m[3] ? +m[3] : ref.getFullYear(), MESES.indexOf(m[2].toLowerCase()) + 1, +m[1], m[4] != null ? +m[4] : 23, m[5] != null ? +m[5] : 59, !!m[3]);
  }
  return out.sort((a, b) => a.idx - b.idx);
}
function caducidadHiloCalc(h) {
  let best = null;
  h.items.slice().sort((a, b) => a.ts - b.ts).forEach(i => {
    if (!CAD_RE.test(i.t)) return;
    const f = fechasEnTexto(i.t, i.ts);
    if (!f.length) return;
    const last = f[f.length - 1];   // "de X a Y": la nueva es la última que aparece
    best = { ts: last.ts, conHora: last.conHora, src: 'hilo', msgTs: i.ts, autor: i.n || i.u, texto: i.t };
  });
  return best;
}
function cadNivel(c) {
  const h = (c.ts - Date.now()) / 3600000;
  return h < 0 ? 'venc' : h < 24 ? 'urg' : h < 72 ? 'pronto' : 'ok';
}
function zonaDeTexto(t) { const p = norm(t || ''); if (!p || p === 'null') return null; for (const [re, z] of PROV_RE) if (re.test(p)) return z; return null; }
const ymdToEs = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
const hhmm = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
function proyectoDe(t) { const v = t.numProy ?? t.codProyecto ?? t.codProy ?? null; return v === null || v === undefined || v === 'NULL' ? null : String(v).trim(); }
function mapTicket(t) {
    const id = t.incidenciaId || {};
    const dir = [t.direccion || t.domicilio, t.poblacion].filter(v => v && v !== 'NULL').join(', ');
    return {
      key: id.periodo + '/' + id.codSerie + '/' + id.codInc,
      num: String(id.periodo ?? '') + String(id.codSerie ?? '') + String(id.codInc ?? ''),
      url: 'https://atgo.tier1.es/#/mistickets/' + id.periodo + '/' + id.codSerie + '/' + id.codInc,
      fVisita: ymdToEs(t.fechaVisita),
      desdeHora: t.horaInicioVisita || '',
      hastaHora: t.horaFinVisita || '',
      fRegistro: hhmm(t.fechaRegistro),
      fRegistroISO: t.fechaRegistro || '',
      email: t.email && t.email !== 'NULL' ? t.email : '',
      telefono: t.telefono && t.telefono !== 'NULL' ? String(t.telefono) : '',
      poblacion: t.poblacion && t.poblacion !== 'NULL' ? t.poblacion : '',
      provincia: t.provincia && t.provincia !== 'NULL' ? t.provincia : '',
      descSede: t.sedeDescripcion || '',
      referencia: t.suReferencia || t.referencia || '',
      operario: String(t.codOpe || '').trim().toUpperCase(),
      desOperario: t.desOpe || '',
      estado: t.desEstado || '',
      descCliente: t.desCli || '',
      codCli: t.codCli, idSede: t.idSede, codSede: t.codSede, sedeTicket: t.sedeDescripcion, numProy: t.numProy, codProy: t.codProy, desProy: t.desProy,
      tipo: t.desTipoEle || '',
      proyecto: proyectoDe(t),
      elemento: t.codElemento && t.codElemento !== 'NULL' ? String(t.codElemento) : '',   // código IT del equipo (reincidencias)
      domicilio: dir
    };
  }
const isoTs = (s) => { const d = new Date(String(s || '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2')); return isNaN(d) ? 0 : d.getTime(); };
// ---- Fin de las copias ----

const iso = d => { const x = d || new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const hoyEs = () => { const x = new Date(); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear(); };
const hora = ts => new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plural = (n, s) => n + ' ' + s + (n === 1 ? '' : 's');
const estadoColor = e => ESTADO_COLOR[norm(e)] || (/cerrad|operativo/.test(norm(e)) ? '#5f8f6a' : '#7d8790');
const esCerrado = e => /cerrad/i.test(e || '');   // en Incidencias salen todos los estados de ATGO menos los cerrados
const sinSla = r => ESTADOS_SIN_SLA.some(e => norm(e) === norm(r.estado));
const dspZona = z => z.dsp || 'DSP1';
const PERFILES = ['DSP1', 'DSP2', 'DSP3', 'DSP4', 'DSP5', 'COORD'];
const zonaDe = op => { const c = cleanInitials(op), z = ZONAS_BASE.find(x => x.ops.includes(c)); return z ? z.nombre : ''; };
const zonasDe = p => ZONAS_BASE.filter(z => p === 'COORD' || dspZona(z) === p);
const opsDe = p => [...new Set(zonasDe(p).flatMap(z => z.ops))];
function perfilInicial() {
  const c = cleanInitials(localStorage.getItem('codigoOperario') || ''), z = ZONAS_BASE.find(x => x.ops.includes(c));
  return z ? dspZona(z) : 'DSP1';
}
function token() {
  let t = localStorage.getItem('token');
  try { const j = JSON.parse(t); if (typeof j === 'string') t = j; } catch (e) { /* ya es texto */ }
  return t;
}
function sesionCaducada() { const exp = Number(localStorage.getItem('expires')); return !token() || (!!exp && exp * 1000 < Date.now()); }
// Única salida hacia ATGO: siempre lectura
async function leer(ruta) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), TIEMPO_MS);
  try {
    const r = await fetch('/api/v1/atgo' + ruta, { headers: { Authorization: 'Bearer ' + token(), Accept: 'application/json' }, signal: c.signal });
    if (r.status === 401 || r.status === 403) throw Object.assign(new Error('sesion'), { sesion: true });
    if (!r.ok) throw new Error('ATGO respondió ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// ---- Estado ----
let E = { perfil: null, at: 0, tecs: {}, pool: {}, poolDesc: {}, der: {}, salidas: {}, salidasDia: '', cierres: null };   // cierres: los del día elegido en Actividad   // tecs/pool: por operario. der: lo deducido del hilo
let cargando = false, fin = 0, total = 0, fallos = 0, sesionMala = false, aviso = '', pintaT = null;
let tab = 'hoy', filtroInc = '', estadoInc = '', zonaInc = '', verMi = true, abiertos = {}, abiertosInc = {}, textoBus = '';
function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ...E, ultimoUso: Date.now() }));
  } catch (e) { aviso = 'No se han podido guardar los datos en este móvil'; }
}
function recuperar() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    if (g && Date.now() - (g.ultimoUso || g.at || 0) < CADUCA_MS) { E = { ...E, ...g }; } else localStorage.removeItem(CLAVE);
  } catch (e) { /* sin datos guardados */ }
  if (!E.perfil) E.perfil = perfilInicial();
  if (E.salidasDia !== iso()) { E.salidas = {}; E.salidasDia = iso(); }
}
const filas = () => Object.values(E.tecs).flat();
const pendientes = () => Object.values(E.pool).flat();
const todas = () => [...filas(), ...pendientes()];
const ticket = k => todas().find(r => r.key === k) || E.salidas[k] || ((E.cierres && E.cierres.items) || []).find(r => r.key === k) || null;
const cad = r => { const d = E.der[r.key]; return d && d.cad && !sinSla(r) ? d.cad : null; };
const zonaPool = r => {
  const op = cleanInitials(r.operario), d = String(E.poolDesc[op] || r.desOperario || '').replace(/^PENDIENTE( DE)? ASIGNAR\s*/i, '');
  return POOL_ZONA[op] || zonaDeTexto(d) || zonaDeTexto(r.provincia) || zonaDeTexto(r.poblacion) || (d.replace(/[()]/g, '').trim().toUpperCase() || 'OTRA ZONA');
};
const cadTexto = c => { const d = new Date(c.ts), h = c.conHora ? ' ' + hora(c.ts) : ''; return iso(d) === iso() ? 'hoy' + h : iso(d) === iso(new Date(Date.now() + 86400000)) ? 'mañana' + h : DIAS[d.getDay()].slice(0, 3) + ' ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + h; };

// ---- Carga: primero se ve lo guardado y cada técnico se sustituye al llegar ----
async function lista(op, estados) {
  const q = 'estado.in=' + estados.join('-') + ',codOpe.equals=' + encodeURIComponent(op), out = [];
  for (let p = 0; p < 20; p++) {
    const d = await leer('/incidencias/listado?page=' + p + '&size=100&sort=fechaRegistro,asc&q=' + q), c = Array.isArray(d && d.content) ? d.content : [];
    c.forEach(t => out.push(mapTicket(t)));
    if (d.last !== false || !c.length) break;
  }
  return out;
}
// «El ticket ha cambiado del estado X al estado Y»: así lo escribe ATGO en el hilo, con autor y hora
const CAMBIO_RE = /^el ticket ha cambiado del estado (.+?) (?:al estado|a) (.+?)\.?$/i, ACT_DIAS = 8;
function cambioDe(t) { const m = CAMBIO_RE.exec(String(t || '').replace(/\s+/g, ' ').trim()); return m ? { de: m[1].trim(), a: m[2].trim() } : null; }
function cambiosDe(items, desde) { return items.filter(i => i.ts >= desde).map(i => { const c = cambioDe(i.t); return c ? { ts: i.ts, u: cleanInitials(i.u), de: c.de, a: c.a } : null; }).filter(Boolean).slice(-40); }
function deducir(r, items) {
  const orden = items.slice().sort((a, b) => a.ts - b.ts), hoy = iso(), tec = cleanInitials(r.operario);
  let prog = null;
  orden.forEach(i => { if (!i.ts || iso(new Date(i.ts)) !== hoy) return; const m = /el usuario (\S+) ha (finalizado|iniciado) el ticket/i.exec(i.t || ''); if (m && cleanInitials(m[1]) === tec) prog = /^fin/i.test(m[2]) ? 'd' : 'c'; });
  const mot = orden.map(i => i.t.replace(/\s+/g, ' ').trim()).find(t => t && !HILO_SISTEMA.some(re => re.test(t))) || '';
  const c = caducidadHiloCalc({ items: orden });
  return { cad: c ? { ts: c.ts, conHora: c.conHora } : null, prog, mot: mot.slice(0, 500), camb: cambiosDe(orden, Date.now() - ACT_DIAS * 86400000) };
}
async function leerHilo(k) {
  const [p, s, c] = k.split('/');
  const d = await leer('/hilo/' + encodeURIComponent(p) + '/' + encodeURIComponent(s) + '/' + encodeURIComponent(c));
  return (Array.isArray(d) ? d : []).map(x => ({ ts: isoTs(x.hiloIncidenciaId && x.hiloIncidenciaId.fechaRegistro), u: x.usuario || '', n: x.nombre || '', t: String(x.descripcion || '').trim() }));
}
// ---- Actividad: cierres (técnico a técnico, solo al usar la pestaña) y cambios de estado, por día y franja ----
const PREF_ACT = 'despachoMovilActividad_v1';
let PA = { franjas: [['14:00', '16:00'], ['18:00', '19:00']], franja: 0, dia: 0, tipo: '', silencio: {}, tec: '' };
try { PA = { ...PA, ...(JSON.parse(localStorage.getItem(PREF_ACT)) || {}) }; } catch (e) { /* preferencias por defecto */ }
function guardarPA() { try { localStorage.setItem(PREF_ACT, JSON.stringify(PA)); } catch (e) { /* se usan en esta sesión */ } }
let cierresCargando = false, cierresFin = 0, cierresTot = 0;
const diaAct = () => iso(new Date(Date.now() - PA.dia * 86400000));
const cierresAlDia = () => E.cierres && E.cierres.perfil === E.perfil && E.cierres.desde <= diaAct() && (PA.dia > 0 || Date.now() - E.cierres.at < 5 * 60000);
async function enParalelo(lista, fn) {
  let i = 0, fallidos = 0;
  await Promise.all(Array.from({ length: 3 }, async () => { while (i < lista.length && !sesionMala) { const x = lista[i++]; try { await fn(x); } catch (e) { if (e.sesion) sesionMala = true; else fallidos++; } } }));
  return fallidos;
}
async function cargarCierres() {
  if (cierresCargando || sesionMala) return;
  cierresCargando = true; cierresFin = 0; pintar();
  while (cargando) await new Promise(r => setTimeout(r, 1000));   // con Despacho cargando, ATGO va mucho más lento
  const desde = diaAct(), perfil = E.perfil, ops = opsDe(perfil), items = {}; cierresTot = ops.length;
  const fallidos = await enParalelo(ops, async op => {
    for (let p = 0; p < 5; p++) {
      const d = await leer('/incidencias/listado?page=' + p + '&size=100&sort=fechaRegistro,desc&q=codOpe.equals=' + encodeURIComponent(op) + ',fechaCierre.greaterOrEqualThan=' + desde), c = Array.isArray(d && d.content) ? d.content : [];
      c.forEach(t => { const r = mapTicket(t); r.fCierre = isoTs(t.fechaCierre); if (r.fCierre) items[r.key] = r; });
      if (d.last !== false || !c.length) break;
    }
    cierresFin++; pintarPronto();
  });
  const lista = Object.values(items), ini = new Date(desde + 'T00:00').getTime();
  await enParalelo(lista, async r => { r.camb = cambiosDe(await leerHilo(r.key), ini); });
  if (!sesionMala && perfil === E.perfil) { E.cierres = { perfil, desde, at: Date.now(), items: lista, fallos: fallidos }; guardar(); }
  cierresCargando = false; pintar();
}
function eventosAct() {
  const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  const ini = d0.getTime() - PA.dia * 86400000, f = PA.franja < PA.franjas.length ? PA.franjas[PA.franja] : null;
  const a = f ? ini + horaMin(f[0]) * 60000 : ini, b = f ? ini + horaMin(f[1]) * 60000 : ini + 86400000;
  const ops = new Set(opsDe(E.perfil)), vistos = new Set(), out = [];
  const pon = (r, c) => { const k = r.key + '|' + c.ts + '|' + c.a; if (vistos.has(k) || c.ts < a || c.ts >= b) return; vistos.add(k); out.push({ r, ...c, cierre: c.cierre || esCerrado(c.a) }); };
  filas().forEach(r => { if (ops.has(cleanInitials(r.operario))) ((E.der[r.key] || {}).camb || []).forEach(c => pon(r, c)); });
  ((E.cierres && E.cierres.perfil === E.perfil && E.cierres.items) || []).forEach(r => {
    if (!ops.has(cleanInitials(r.operario))) return;
    const cs = r.camb || []; cs.forEach(c => pon(r, c));
    if (!cs.some(c => esCerrado(c.a))) pon(r, { ts: r.fCierre, u: '', de: '', a: r.estado || 'CERRADO', cierre: true, sinAutor: true });   // cerrada sin mensaje en el hilo
  });
  return out.sort((x, y) => y.ts - x.ts);
}
const ICO_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
const ICO_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7M10.3 21a1.94 1.94 0 0 0 3.4 0M2 2l20 20"/></svg>';
const ICO_EDIT = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
function vistaAct() {
  const ev = eventosAct(), sil = PA.silencio, porTec = {}, ops = opsDe(E.perfil);
  ev.forEach(e => { const o = cleanInitials(e.r.operario), t = porTec[o] = porTec[o] || { c: 0, m: 0 }; if (e.cierre) t.c++; else t.m++; });
  const vis = ev.filter(e => { const o = cleanInitials(e.r.operario); return !sil[o] && (!PA.tec || o === PA.tec) && (!PA.tipo || (PA.tipo === 'c') === e.cierre); });
  const dias = Array.from({ length: ACT_DIAS }, (_, i) => { const d = new Date(Date.now() - i * 86400000); return [i, i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : DIAS[d.getDay()].slice(0, 3) + ' ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })]; });
  const franjas = PA.franjas.map((f, i) => [i, f[0] + '–' + f[1]]).concat([[PA.franjas.length, 'Todo el día']]);
  const nC = vis.filter(e => e.cierre).length, tecs = ops.filter(o => porTec[o] || sil[o]).sort((x, y) => ((porTec[y] || {}).c || 0) + ((porTec[y] || {}).m || 0) - ((porTec[x] || {}).c || 0) - ((porTec[x] || {}).m || 0) || x.localeCompare(y));
  const estado = cierresCargando ? `<div class="m">Cargando cierres ${cierresFin}/${cierresTot}…</div>` : E.cierres && E.cierres.fallos ? `<div class="m">${plural(E.cierres.fallos, 'técnico')} sin responder: pulsa ⟳</div>` : !E.cierres ? '<div class="m">Pulsa ⟳ para cargar los cierres</div>' : '';
  const linea = e => { const o = cleanInitials(e.r.operario), por = e.u && e.u !== o ? ' · por ' + e.u : '';
    return `<button class="ev" data-a="ficha" data-k="${esc(e.r.key)}" style="--e:${e.cierre ? 'var(--ok)' : estadoColor(e.a)}"><span class="evh">${hora(e.ts)}</span><span class="evc"><b>${esc(o)}</b> · <span class="n">${esc(String(e.r.num).slice(-6))}</span> · ${esc(e.r.descSede || '')}<small>${e.de ? esc(e.de) + ' → ' : ''}${esc(e.a)}${esc(por)}${e.sinAutor ? ' · autor no indicado' : ''}</small></span></button>`; };
  return `<div class="tres"><select data-c="dia" aria-label="Día">${dias.map(([v, t]) => `<option value="${v}"${PA.dia === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select><select data-c="franja" aria-label="Franja">${franjas.map(([v, t]) => `<option value="${v}"${PA.franja === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select><button class="bell" data-a="franjas" aria-label="Editar franjas">${ICO_EDIT}</button></div>
    <div class="seg">${[['', 'Todo'], ['c', 'Cierres'], ['m', 'Cambios']].map(([v, t]) => `<button class="ch${PA.tipo === v ? ' on' : ''}" data-a="tipoact" data-v="${v}" aria-pressed="${PA.tipo === v}">${t}</button>`).join('')}</div>
    ${estado}<div class="res2"><b>${nC}</b> ${nC === 1 ? 'cierre' : 'cierres'} · <b>${vis.length - nC}</b> ${vis.length - nC === 1 ? 'cambio' : 'cambios'}${PA.tec ? ` de ${esc(PA.tec)} <button class="mini" data-a="tecact" data-v="">Ver todos</button>` : ''}</div>
    ${tecs.length ? '<h2>Técnicos</h2>' + tecs.map(o => { const t = porTec[o] || { c: 0, m: 0 }, on = !sil[o]; return `<div class="at"><button class="bell" data-a="campana" data-v="${esc(o)}" aria-pressed="${on}" aria-label="${on ? 'Dejar de seguir a ' : 'Seguir a '}${esc(o)}">${on ? ICO_ON : ICO_OFF}</button><button class="atn${PA.tec === o ? ' on' : ''}${on ? '' : ' off'}" data-a="tecact" data-v="${esc(o)}"><b>${esc(o)} <small>${esc(zonaDe(o))}</small></b><span>${plural(t.c, 'cierre')} · ${plural(t.m, 'cambio')}${on ? '' : ' · no lo sigues'}</span></button></div>`; }).join('') : ''}
    <h2>Actividad</h2>${vis.map(linea).join('') || `<div class="vac">${cierresCargando ? 'Cargando…' : 'Nada en esta franja.'}</div>`}`;
}
function abrirFranjas() {
  const m = $('me');
  m.innerHTML = `<div class="hoja" role="dialog" aria-label="Franjas"><h3>Franjas de Actividad</h3>${PA.franjas.map((f, i) => `<div class="dos"><input type="time" data-f="${i}-0" value="${esc(f[0])}" aria-label="Desde, franja ${i + 1}"><input type="time" data-f="${i}-1" value="${esc(f[1])}" aria-label="Hasta, franja ${i + 1}"></div>`).join('')}<button class="fila" data-a="guardafr">Guardar</button><button class="fila" data-a="cmenu">Cancelar</button></div>`;
  m.hidden = false;
}
async function cargar() {
  if (cargando) return;
  if (sesionCaducada()) { sesionMala = true; pintar(); return; }
  cargando = true; fin = 0; fallos = 0; sesionMala = false; aviso = ''; pintar();
  const antes = filas(), hoy = hoyEs(), ops = opsDe(E.perfil), perfil = E.perfil;
  try {
    const d = await leer('/operario?q=codOpe.contains=XXX'), lp = (Array.isArray(d) ? d : (d && d.content) || []).filter(o => o && /^XXX/i.test(o.codOpe || ''));
    const comodines = [...new Set(lp.map(o => cleanInitials(o.codOpe)))]; lp.forEach(o => { E.poolDesc[cleanInitials(o.codOpe)] = o.desOpe || ''; });
    let abiertos2 = ESTADOS_ATGO;
    try { const le = await leer('/estados'), l = (Array.isArray(le) ? le : []).filter(x => x && x.estado != null && !esCerrado(x.desEstado)).map(x => x.estado); if (l.length) abiertos2 = l; } catch (e) { if (e.sesion) throw e; }
    const cola = [...ops.map(op => [op, false]), ...comodines.map(op => [op, true])]; total = cola.length; const ok = new Set();
    await Promise.all(Array.from({ length: PARALELO }, async () => {
      while (cola.length && !sesionMala) {
        const [op, esPool] = cola.shift();
        try { const l = await lista(op, esPool ? [10] : abiertos2); if (esPool) E.pool[op] = l; else { E.tecs[op] = l; ok.add(op); } }
        catch (e) { if (e.sesion) sesionMala = true; else fallos++; }
        fin++; pintarPronto();
      }
    }));
    if (!sesionMala && perfil === E.perfil) {
      // Las visitas de hoy que han salido de la lista se dan por resueltas (ATGO ya no las devuelve)
      const vivas = new Set(filas().map(r => r.key));
      antes.forEach(r => { if (r.fVisita === hoy && esPresencial(r) && ok.has(cleanInitials(r.operario)) && !vivas.has(r.key)) E.salidas[r.key] = r; });
      const claves = [...todas().map(r => r), ...Object.values(E.salidas)], cola2 = claves.slice();
      await Promise.all(Array.from({ length: PARALELO }, async () => {
        while (cola2.length && !sesionMala) { const r = cola2.shift(); try { E.der[r.key] = deducir(r, await leerHilo(r.key)); } catch (e) { if (e.sesion) sesionMala = true; } }
      }));
      const k = new Set(claves.map(r => r.key)); Object.keys(E.der).forEach(x => { if (!k.has(x)) delete E.der[x]; });
      if (!sesionMala) { E.at = Date.now(); guardar(); }
    }
  } catch (e) { if (e.sesion) sesionMala = true; else aviso = e.name === 'AbortError' ? 'ATGO no responde' : 'No se pudieron cargar los datos'; }
  cargando = false; pintar();
}

// ---- Interfaz: todo dentro de su propio espacio, sin mezclarse con la página de ATGO ----
const host = document.createElement('div'); host.id = 'despacho-movil';
host.style.cssText = 'position:fixed;inset:0;z-index:2147483647';
const raiz = host.attachShadow({ mode: 'open' });
raiz.innerHTML = `<style>
:host{--bg:rgb(247,245,240);--panel:rgb(255,255,255);--p2:rgb(241,239,233);--line:rgb(226,222,212);--ink:rgb(31,35,40);--dim:rgb(90,96,103);--marca:rgb(133,86,18);--rojo:rgb(181,67,47);--aviso:rgb(143,94,20);--ok:rgb(29,126,96)}
@media (prefers-color-scheme:dark){:host{--bg:rgb(20,24,28);--panel:rgb(27,33,38);--p2:rgb(32,39,45);--line:rgb(44,53,60);--ink:rgb(232,236,239);--dim:rgb(164,175,185);--marca:rgb(224,162,74);--rojo:rgb(240,150,135);--aviso:rgb(224,162,74);--ok:rgb(94,194,143)}}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
#r{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font:15px/1.35 system-ui,sans-serif}
header{flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--panel);border-bottom:1px solid var(--line)}
header h1{font-size:18px;margin:0;flex:none}
#est{flex:1;min-width:0;font-size:12px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.ib{width:44px;height:44px;border-radius:10px;font-size:20px;flex:none}
#bar{flex:none;height:3px;background:var(--marca);width:0;transition:width .3s}
#av{flex:none;padding:10px 12px;background:var(--p2);font-size:14px;border-bottom:1px solid var(--line)}
#v{flex:1;overflow:auto;padding:12px;overscroll-behavior:contain}
nav{flex:none;display:grid;grid-template-columns:repeat(5,1fr);background:var(--panel);border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom,0)}
nav button{height:56px;font-size:12px;line-height:1.15;padding:0 2px;color:var(--dim);position:relative}
nav button.on{color:var(--marca);font-weight:700;box-shadow:inset 0 3px 0 var(--marca)}
nav i{font-style:normal;font-size:11px;margin-left:3px}
.res{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.res button{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px;text-align:left;min-height:64px}
.res b{display:block;font-size:22px}.res span{font-size:12px;color:var(--dim)}.res .mal b{color:var(--rojo)}
h2{font-size:13px;margin:14px 2px 6px;color:var(--dim);text-transform:uppercase;letter-spacing:.3px}
.c{display:block;width:100%;text-align:left;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--e,var(--line));border-radius:10px;padding:10px 12px;margin-bottom:8px}
.l1{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.n{font-family:monospace;font-weight:700;color:var(--marca)}
.s{font-weight:600;margin-top:3px;overflow-wrap:anywhere}.m{font-size:13px;color:var(--dim);overflow-wrap:anywhere}
.p{display:inline-block;font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;color:var(--ink);background:color-mix(in srgb,var(--e) 22%,transparent)}
.cad{font-size:12px;font-weight:600;color:var(--dim)}.cad.venc{color:var(--rojo)}.cad.urg{color:var(--aviso)}
.t{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;width:100%;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:6px;min-height:52px}
.t b{font-family:monospace}.t em{font-style:normal;font-weight:700}.t small{color:var(--dim);font-size:12px}.t .ret{color:var(--rojo);font-weight:600}
.pb{grid-column:1/-1;height:5px;border-radius:3px;background:var(--p2);overflow:hidden}.pb i{display:block;height:100%;background:var(--ok)}
.chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px}
.ch{flex:none;min-height:40px;padding:0 14px;border-radius:20px;border:1px solid var(--line);background:var(--panel);font-size:14px}
.ch.on{border-color:var(--marca);color:var(--marca);font-weight:700}
select,input{font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:10px;height:44px;padding:0 10px;width:100%;margin-bottom:8px}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.vac{padding:30px 10px;text-align:center;color:var(--dim)}
.plg{display:flex;align-items:center;gap:8px;margin:2px 2px 6px;font-size:13px;color:var(--dim)}.plg span{flex:1}
.mini{min-height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--marca);font-weight:600;font-size:13px}
.zh{margin:14px 2px 6px;font-size:13px}.zh b{text-transform:uppercase;letter-spacing:.3px}.zh span{color:var(--dim)}
.tg{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 10px;margin-bottom:6px;min-height:58px}
.av{flex:none;min-width:44px;height:40px;padding:0 5px;border-radius:20px;display:grid;place-items:center;font:700 12px monospace;color:var(--ink);background:color-mix(in srgb,var(--e) 30%,transparent);border:1px solid var(--e)}
.tn{flex:1;min-width:0;display:grid}.tn b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tn small{color:var(--dim);font-size:12px}.tn .ret{color:var(--rojo);font-weight:600}
.tg em{font-style:normal;font-weight:700}.cv{color:var(--dim);flex:none}
.sub{margin:8px 2px 6px;font-size:12px;font-weight:700;color:var(--dim)}
.eg{display:flex;justify-content:space-between;align-items:center;margin:8px 2px 5px;padding-left:8px;border-left:3px solid var(--e);font-size:12px;font-weight:700}.eg small{color:var(--dim)}
#fi,#me{position:absolute;inset:0;background:var(--bg);display:flex;flex-direction:column}
#me{background:rgba(0,0,0,.45);justify-content:flex-end}
.hoja{background:var(--panel);border-radius:16px 16px 0 0;padding:14px;display:grid;gap:8px}
.hoja h3{margin:0;font-size:16px}.hoja .fila{height:48px;border:1px solid var(--line);border-radius:10px;width:100%}.hoja .perf{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.perf button{height:44px;border:1px solid var(--line);border-radius:10px}.perf button.on{border-color:var(--marca);color:var(--marca);font-weight:700}
.cb{flex:1;overflow:auto;padding:12px;overscroll-behavior:contain}
.acc{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0}
.acc a,.acc button{display:flex;align-items:center;justify-content:center;height:46px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--marca);font-weight:600;text-decoration:none;padding:0 6px;text-align:center}
dl{margin:0;display:grid;grid-template-columns:96px minmax(0,1fr);gap:6px 10px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px}
dt{color:var(--dim);font-size:13px}dd{margin:0;overflow-wrap:anywhere}
.h{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:6px;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}
.h small{display:block;color:var(--dim);font-size:12px;margin-bottom:3px}.h.sis{background:none;color:var(--dim);font-size:13px}
.tres{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 48px;gap:8px;margin-bottom:8px}.tres select{min-width:0;width:100%;padding-left:8px;padding-right:2px;font-size:14px}
.seg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:6px}.seg .ch{padding:0 4px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.res2{margin:4px 2px 8px;font-size:14px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}
.at{display:flex;gap:8px;align-items:stretch;margin-bottom:6px}
.bell{flex:none;width:48px;min-height:48px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--marca);display:grid;place-items:center}
.bell[aria-pressed=false]{color:var(--dim)}
.atn{flex:1;min-width:0;min-height:48px;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:6px 10px;display:grid}
.atn.on{border-color:var(--marca);box-shadow:inset 0 0 0 1px var(--marca)}.atn.off{opacity:.6}
.atn small{color:var(--dim);font-weight:400}.atn span{font-size:12px;color:var(--dim)}
.ev{display:grid;grid-template-columns:48px minmax(0,1fr);gap:8px;width:100%;text-align:left;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--e);border-radius:10px;padding:8px 10px;margin-bottom:6px;min-height:52px}
.evh{font-family:monospace;font-weight:700}.evc{min-width:0;overflow-wrap:anywhere}.evc small{display:block;color:var(--dim);font-size:12px;margin-top:2px}
[hidden]{display:none!important}
</style>
<div id="r"><header><h1 id="ti"></h1><div id="est" role="status"></div><button class="ib" data-a="cargar" aria-label="Actualizar">⟳</button><button class="ib" data-a="menu" aria-label="Más opciones">⋮</button></header>
<div id="bar"></div><div id="av" hidden></div><main id="v"></main>
<nav aria-label="Secciones"><button data-a="tab" data-v="hoy">Hoy</button><button data-a="tab" data-v="sin">Sin asignar<i id="nSin"></i></button><button data-a="tab" data-v="inc">Incidencias</button><button data-a="tab" data-v="act">Actividad</button><button data-a="tab" data-v="bus">Buscar</button></nav>
<div id="fi" hidden></div><div id="me" hidden></div></div>`;
const $ = id => raiz.getElementById(id);
const TITULOS = { hoy: 'Hoy', sin: 'Sin asignar', inc: 'Incidencias', act: 'Actividad', bus: 'Buscar' };

function tarjeta(r, extra) {
  const c = cad(r), nv = c ? cadNivel(c) : '';
  return `<button class="c" data-a="ficha" data-k="${esc(r.key)}" style="--e:${estadoColor(r.estado)}"><span class="l1"><span class="n">${esc(String(r.num).slice(-6))}</span><span class="p" style="--e:${estadoColor(r.estado)}">${esc(r.estado)}</span>${c ? `<span class="cad ${nv}">${nv === 'venc' ? 'Caducó' : 'Caduca'} ${esc(cadTexto(c))}</span>` : ''}</span>
    <div class="s">${esc(r.descSede || r.domicilio || '—')}</div><div class="m">${esc(r.descCliente || '')}</div><div class="m">${esc([extra, /^XXX/i.test(r.operario) ? '' : r.operario, r.fVisita ? r.fVisita + (r.desdeHora ? ' ' + r.desdeHora : '') : 'Sin fecha'].filter(Boolean).join(' · '))}</div></button>`;
}
const porCad = (a, b) => { const x = cad(a), y = cad(b); return (x ? x.ts : 9e15) - (y ? y.ts : 9e15); };
function resumenHoy() {
  const hoy = hoyEs(), ahoraMin = new Date().getHours() * 60 + new Date().getMinutes(), porOp = {};
  filas().filter(r => r.fVisita === hoy && esPresencial(r)).forEach(r => {
    const d = E.der[r.key], st = d && d.prog || 'p', lim = horaMin(r.hastaHora || r.desdeHora), late = st === 'p' && lim < 9999 && ahoraMin > lim;
    (porOp[r.operario] = porOp[r.operario] || []).push({ r, st, late });
  });
  Object.values(E.salidas).forEach(r => { (porOp[r.operario] = porOp[r.operario] || []).push({ r, st: 'd', late: false, salio: true }); });
  return porOp;
}
function vistaHoy() {
  const po = resumenHoy(), ops = Object.keys(po).sort((a, b) => zonaDe(a).localeCompare(zonaDe(b)) || a.localeCompare(b)), todo = Object.values(po).flat(), abiertas = filas().filter(r => !esCierre(r.estado));
  const hechas = todo.filter(x => x.st === 'd').length, retrasos = todo.filter(x => x.late).length, ahora = Date.now(), hoyI = iso();
  const cadu = abiertas.filter(r => { const c = cad(r); return c && c.ts < ahora; }), hoy = abiertas.filter(r => { const c = cad(r); return c && c.ts >= ahora && iso(new Date(c.ts)) === hoyI; });
  if (!E.at && !filas().length) return `<div class="vac">${cargando ? 'Cargando los datos de ATGO…' : 'Sin datos todavía. Pulsa ⟳.'}</div>`;
  return `<div class="res"><button data-a="tabf" data-v="" aria-label="Visitas de hoy"><b>${hechas}/${todo.length}</b><span>Visitas hechas</span></button><button class="${retrasos ? 'mal' : ''}" data-a="tabf" data-v=""><b>${retrasos}</b><span>Con retraso</span></button><button class="${cadu.length ? 'mal' : ''}" data-a="tabf" data-v="cad"><b>${cadu.length}</b><span>Caducadas</span></button></div>
    ${hoy.length ? `<h2>Caducan hoy · ${hoy.length}</h2>${hoy.sort(porCad).map(r => tarjeta(r)).join('')}` : ''}
    <h2>Técnicos con visitas hoy · ${ops.length}</h2>${ops.map(op => { const l = po[op], d = l.filter(x => x.st === 'd').length, c = l.filter(x => x.st === 'c').length, ret = l.filter(x => x.late).length, ab = abiertos[op];
      return `<button class="t" data-a="tec" data-v="${esc(op)}" aria-expanded="${!!ab}"><span><b>${esc(op)}</b> <small>${esc(zonaDe(op))}</small></span><em>${d}/${l.length}</em><small>${c ? c + ' en curso' : ''}${c && ret ? ' · ' : ''}${ret ? `<span class="ret">${plural(ret, 'retraso')}</span>` : ''}</small><span></span><span class="pb"><i style="width:${Math.round(d / l.length * 100)}%"></i></span></button>${ab ? l.sort((a, b) => horaMin(a.r.desdeHora) - horaMin(b.r.desdeHora)).map(x => tarjeta(x.r, x.salio ? 'Ya no está en la lista' : x.st === 'd' ? 'Finalizada' : x.st === 'c' ? 'En curso' : x.late ? 'Con retraso' : 'Pendiente')).join('') : ''}`; }).join('') || '<div class="vac">Nadie tiene visitas hoy.</div>'}`;
}
function vistaSin() {
  const mis = new Set(zonasDe(E.perfil).map(z => z.nombre)), todos = pendientes(), mias = todos.filter(r => mis.has(zonaPool(r))), l = verMi ? mias : todos, g = {};
  l.slice().sort(porCad).forEach(r => { (g[zonaPool(r)] = g[zonaPool(r)] || []).push(r); });
  return `<div class="chips"><button class="ch${verMi ? ' on' : ''}" data-a="mi" data-v="1">Mis zonas · ${mias.length}</button><button class="ch${verMi ? '' : ' on'}" data-a="mi" data-v="">Todas · ${todos.length}</button></div>${Object.keys(g).sort().map(z => `<h2>${esc(z)} · ${g[z].length}</h2>${g[z].map(r => tarjeta(r)).join('')}`).join('') || '<div class="vac">Nada sin asignar.</div>'}`;
}
function listaInc() {
  const ahora = Date.now(), hoyI = iso(), hoy = hoyEs();
  return filas().filter(r => !esCerrado(r.estado) && (!estadoInc || r.estado === estadoInc) && (!zonaInc || zonaDe(r.operario) === zonaInc) && (!filtroInc || (filtroInc === 'cad' ? cad(r) && cad(r).ts < ahora : filtroInc === 'caduhoy' ? cad(r) && cad(r).ts >= ahora && iso(new Date(cad(r).ts)) === hoyI : filtroInc === 'hoy' ? r.fVisita === hoy : !r.fVisita))).sort(porCad);
}
// Por zona y técnico, como Incidencias en el ordenador: primero lo de hoy y después el resto por estado y fecha de visita
function porTecnico(l) {
  const por = {}; l.forEach(r => { (por[r.operario] = por[r.operario] || []).push(r); });
  const po = resumenHoy(), hoy = hoyEs(), hoyT = parseEs(hoy).getTime();
  return zonasDe(E.perfil).map(z => {
    const ops = z.ops.filter(op => por[op]); if (!ops.length) return '';
    const ruta = ops.flatMap(op => po[op] || []), h = z.dispatcher ? plural(ops.reduce((s, op) => s + por[op].length, 0), 'incidencia') + ' a tu nombre' : ruta.length ? ruta.filter(x => x.st === 'd').length + '/' + plural(ruta.length, 'visita') + ' hechas hoy' : 'sin visitas hoy';
    return `<div class="zh"><b>${esc(z.nombre)}</b> <span>${h}</span></div>` + ops.map(op => {
      const it = por[op], ru = po[op] || [], ab = abiertosInc[op], hechas = ru.filter(x => x.st === 'd').length, late = ru.filter(x => x.late).length, esc1 = it.filter(r => norm(r.estado) === norm('ESCALADO TIER1')).length, sinF = it.filter(r => esPresencial(r) && !r.fVisita).length;
      const dehoy = it.filter(r => r.fVisita === hoy && esPresencial(r)).sort((a, b) => horaMin(a.desdeHora) - horaMin(b.desdeHora)), k = new Set(dehoy.map(r => r.key)), resto = it.filter(r => !k.has(r.key)).sort((a, b) => ordenEstado(a.estado) - ordenEstado(b.estado) || ordenVisita(a, b, hoyT));
      let cuerpo = '';
      if (ab) {
        if (dehoy.length) cuerpo += '<div class="sub">Hoy</div>' + dehoy.map(r => tarjeta(r, (ru.find(x => x.r.key === r.key) || {}).late ? 'Con retraso' : '')).join('');
        if (resto.length) { if (dehoy.length) cuerpo += '<div class="sub">Resto de incidencias</div>'; let ant = null; resto.forEach(r => { const e = norm(r.estado); if (e !== ant) { ant = e; cuerpo += `<div class="eg" style="--e:${estadoColor(r.estado)}"><span>${esc(r.estado || '—')}</span><small>${resto.filter(x => norm(x.estado) === e).length}</small></div>`; } cuerpo += tarjeta(r); }); }
      }
      return `<button class="tg" data-a="tecinc" data-v="${esc(op)}" aria-expanded="${!!ab}"><span class="av" style="--e:${colorFor(cleanInitials(op))}">${esc(op)}</span><span class="tn"><b>${esc((it[0].desOperario || op).split(',').reverse().join(' ').trim())}</b><small>${ru.length ? hechas + '/' + ru.length + ' hoy' : 'Sin visitas hoy'}${late ? ' · <span class="ret">' + plural(late, 'retraso') + '</span>' : ''}${sinF ? ' · ' + sinF + ' sin fecha' : ''}${esc1 ? ' · ' + esc1 + ' escalada' + (esc1 === 1 ? '' : 's') : ''}</small></span><em>${it.length}</em><span class="cv">${ab ? '▴' : '▾'}</span></button>${cuerpo}`;
    }).join('');
  }).join('');
}
function vistaInc() {
  const l = listaInc(), estados = [...new Set(filas().map(r => r.estado).filter(Boolean))].sort(), zonas = zonasDe(E.perfil).map(z => z.nombre).filter(z => filas().some(r => zonaDe(r.operario) === z));
  return `<div class="chips">${[['', 'Todas'], ['cad', 'Caducadas'], ['caduhoy', 'Caducan hoy'], ['hoy', 'Visita hoy'], ['sinf', 'Sin fecha']].map(([v, t]) => `<button class="ch${filtroInc === v ? ' on' : ''}" data-a="fil" data-v="${v}">${t}</button>`).join('')}</div>
    <div class="dos"><select data-c="estado" aria-label="Estado"><option value="">Todos los estados</option>${estados.map(e => `<option${e === estadoInc ? ' selected' : ''}>${esc(e)}</option>`).join('')}</select><select data-c="zona" aria-label="Zona"><option value="">Todas las zonas</option>${zonas.map(z => `<option${z === zonaInc ? ' selected' : ''}>${esc(z)}</option>`).join('')}</select></div>
    <div class="plg"><span>${plural(l.length, 'incidencia')}</span><button class="mini" data-a="plg" data-v="1">Plegar</button><button class="mini" data-a="plg" data-v="">Desplegar</button></div>${porTecnico(l) || '<div class="vac">Nada con este filtro.</div>'}`;
}
function resultadosBus() {
  const t = norm(textoBus).trim(); if (t.length < 2) return '<div class="vac">Escribe Nº, sede, cliente, técnico o población.</div>';
  const ps = t.split(/\s+/), l = todas().filter(r => { const s = norm([r.num, r.descSede, r.descCliente, r.operario, r.desOperario, r.poblacion, r.domicilio, r.referencia].join(' ')); return ps.every(p => s.includes(p)); });
  return `<h2>${plural(l.length, 'resultado')}</h2>${l.slice(0, 60).map(r => tarjeta(r)).join('') || '<div class="vac">Sin resultados.</div>'}`;
}
function pintarEstado() {
  $('ti').textContent = TITULOS[tab];
  $('est').textContent = cargando ? (total ? 'Cargando ' + fin + '/' + total : 'Cargando…') : E.at ? 'Datos de las ' + hora(E.at) + (iso(new Date(E.at)) === iso() ? '' : ' del ' + new Date(E.at).toLocaleDateString('es-ES')) : 'Sin datos';
  $('bar').style.width = cargando && total ? Math.round(fin / total * 100) + '%' : '0';
  const a = sesionMala ? 'Sesión de ATGO caducada. Pulsa ⋮, «Volver a ATGO», inicia sesión y abre de nuevo Despacho.' : aviso || (!cargando && fallos ? plural(fallos, 'técnico') + ' sin actualizar: pulsa ⟳' : '');
  $('av').hidden = !a; $('av').textContent = a;
  raiz.querySelectorAll('nav button').forEach(b => { const on = b.dataset.v === tab; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const mis = new Set(zonasDe(E.perfil).map(z => z.nombre)); $('nSin').textContent = ' ' + pendientes().filter(r => mis.has(zonaPool(r))).length;
}
function pintar() {
  pintarEstado();
  const v = $('v'), y = v.scrollTop;
  if (tab === 'bus') {
    if (!$('q')) v.innerHTML = '<input id="q" type="search" placeholder="Buscar…" aria-label="Buscar" autocomplete="off" value="' + esc(textoBus) + '"><div id="br"></div>';
    $('br').innerHTML = resultadosBus();
  } else { v.innerHTML = tab === 'hoy' ? vistaHoy() : tab === 'sin' ? vistaSin() : tab === 'act' ? vistaAct() : vistaInc(); v.scrollTop = y; }
}
function pintarPronto() { pintarEstado(); clearTimeout(pintaT); pintaT = setTimeout(pintar, 600); }

async function abrirFicha(k, sinHistorial) {
  const r = ticket(k); if (!r) return;
  const f = $('fi'), d = E.der[k] || {}, c = cad(r), mail = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(r.email || '') ? r.email : '', tel = String(r.telefono || '').replace(/[^\d+]/g, '');
  const mapa = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([r.domicilio, r.provincia].filter(Boolean).join(', '));
  const wa = 'https://wa.me/?text=' + encodeURIComponent('Incidencia ' + r.num + ' · ' + (r.descSede || ''));
  const proy = r.numProy != null && r.numProy !== '' && r.numProy !== 'NULL' ? [r.numProy, r.codProy, r.desProy].filter(x => x != null && x !== '' && x !== 'NULL').join(' - ') : '';
  const fila = (t, v) => v ? `<dt>${t}</dt><dd>${esc(v)}</dd>` : '';
  f.innerHTML = `<header><button class="ib" data-a="cerrarf" aria-label="Volver">‹</button><h1 style="font-family:monospace;font-size:16px">${esc(r.num)}</h1><div id="est2"></div></header><div class="cb">
    <span class="p" style="--e:${estadoColor(r.estado)}">${esc(r.estado)}</span>
    <div class="s" style="font-size:17px;margin:8px 0 2px">${esc(r.descSede || '—')}</div><div class="m">${esc(r.descCliente || '')}</div>
    <div class="acc">${tel.length >= 6 ? `<a href="tel:${esc(tel)}">Llamar a la tienda</a>` : ''}${r.domicilio ? `<a href="${esc(mapa)}" target="_blank" rel="noopener">Ver en Maps</a>` : ''}${mail ? `<a href="mailto:${esc(mail)}">Correo</a>` : ''}<a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>${EN_APP ? `<button type="button" data-a="atgo" data-k="${esc(k)}">Abrir en ATGO</button>` : `<a href="${esc(r.url)}" target="_blank" rel="noopener">Abrir en ATGO</a>`}</div>
    <dl>${fila('Técnico', /^XXX/i.test(r.operario) ? 'Sin asignar · ' + zonaPool(r) : [r.operario, r.desOperario].filter(Boolean).join(' · '))}${fila('Visita', r.fVisita ? r.fVisita + (r.desdeHora ? ' · ' + r.desdeHora + (r.hastaHora ? '–' + r.hastaHora : '') : '') : 'Sin fecha')}${fila('Caducidad', c ? cadTexto(c) : '')}${fila('Dirección', r.domicilio)}${fila('Provincia', r.provincia)}${fila('Teléfono', r.telefono)}${fila('Equipo', [r.tipo, r.elemento].filter(Boolean).join(' · '))}${fila('Referencia', r.referencia)}${fila('Proyecto', proy)}${fila('Registro', r.fRegistro)}${fila('Motivo', d.mot)}</dl>
    <h2>Hilo</h2><div id="hi"><div class="vac">Cargando el hilo…</div></div></div>`;
  f.hidden = false; f.dataset.k = k;
  if (!sinHistorial) history.pushState({ despachoMovil: 1 }, '');
  try {
    const items = await leerHilo(k); if (f.dataset.k !== k || f.hidden) return;
    $('hi').innerHTML = items.slice().sort((a, b) => b.ts - a.ts).map(i => { const t = i.t.replace(/\s+$/, ''), sis = HILO_SISTEMA.some(re => re.test(t.trim())); return `<div class="h${sis ? ' sis' : ''}"><small>${esc([i.ts ? new Date(i.ts).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '', i.n || i.u].filter(Boolean).join(' · '))}</small>${esc(t)}</div>`; }).join('') || '<div class="vac">Sin mensajes.</div>';
  } catch (e) { if (e.sesion) { sesionMala = true; pintarEstado(); } const h = $('hi'); if (h && f.dataset.k === k) h.innerHTML = '<div class="vac">No se ha podido cargar el hilo.</div>'; }
}
function cerrarFicha() { const f = $('fi'); f.hidden = true; f.dataset.k = ''; f.innerHTML = ''; }
function abrirMenu() {
  const m = $('me');
  m.innerHTML = `<div class="hoja" role="dialog" aria-label="Opciones"><h3>Perfil</h3><div class="perf">${PERFILES.map(p => `<button class="${E.perfil === p ? 'on' : ''}" data-a="perfil" data-v="${p}">${p}</button>`).join('')}</div><button class="fila" data-a="salir">Volver a ATGO</button><button class="fila" data-a="borrar">Borrar los datos de este móvil</button><button class="fila" data-a="cmenu">Cerrar</button><div class="m" style="text-align:center">Despacho móvil ${MOVIL_VERSION} · solo consulta</div></div>`;
  m.hidden = false;
}
function salir() { clearInterval(reloj); window.removeEventListener('popstate', atras, true); document.removeEventListener('visibilitychange', alVolver); host.remove(); document.documentElement.style.overflow = ''; delete window.__despachoMovil; }
function acciones(b) {
  const a = b.dataset.a, v = b.dataset.v;
  if (a === 'tab') { tab = v; $('v').scrollTop = 0; $('v').innerHTML = ''; pintar(); if (v === 'act' && !cierresAlDia()) cargarCierres(); }
  else if (a === 'tabf') { tab = 'inc'; filtroInc = v; estadoInc = ''; zonaInc = ''; $('v').innerHTML = ''; $('v').scrollTop = 0; pintar(); }
  else if (a === 'cargar') { cargar(); if (tab === 'act') cargarCierres(); }
  else if (a === 'tipoact') { PA.tipo = v; guardarPA(); pintar(); }
  else if (a === 'tecact') { PA.tec = PA.tec === v ? '' : v; pintar(); }
  else if (a === 'campana') { if (PA.silencio[v]) delete PA.silencio[v]; else PA.silencio[v] = true; guardarPA(); pintar(); }
  else if (a === 'franjas') abrirFranjas();
  else if (a === 'guardafr') {
    const f = PA.franjas.map((x, i) => [raiz.querySelector('[data-f="' + i + '-0"]').value, raiz.querySelector('[data-f="' + i + '-1"]').value]);
    if (f.some(([d, h]) => !/^\d{2}:\d{2}$/.test(d) || !/^\d{2}:\d{2}$/.test(h) || horaMin(h) <= horaMin(d))) { alert('Revisa las horas: la de fin debe ser posterior a la de inicio.'); return; }
    PA.franjas = f; guardarPA(); $('me').hidden = true; pintar();
  }
  else if (a === 'menu') abrirMenu();
  else if (a === 'cmenu') $('me').hidden = true;
  else if (a === 'ficha') abrirFicha(b.dataset.k);
  else if (a === 'cerrarf') history.back();
  else if (a === 'tec') { abiertos[v] = !abiertos[v]; pintar(); }
  else if (a === 'mi') { verMi = !!v; pintar(); }
  else if (a === 'fil') { filtroInc = v; pintar(); $('v').scrollTop = 0; }
  else if (a === 'tecinc') { abiertosInc[v] = !abiertosInc[v]; pintar(); }
  else if (a === 'plg') { if (v) abiertosInc = {}; else filas().forEach(r => { abiertosInc[r.operario] = true; }); pintar(); $('v').scrollTop = 0; }
  else if (a === 'perfil') { $('me').hidden = true; if (v !== E.perfil) { E = { ...E, perfil: v, tecs: {}, pool: {}, der: {}, salidas: {}, at: 0, cierres: null }; zonaInc = ''; guardar(); cargar(); } }
  else if (a === 'salir') salir();
  else if (a === 'atgo') { const r = ticket(b.dataset.k); cerrarFicha(); host.style.display = 'none'; if (r) location.hash = '#/mistickets/' + r.key; }   // en la app: el botón «Despacho» vuelve aquí
  else if (a === 'borrar') { if (confirm('¿Borrar los datos guardados en este móvil?')) { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada que borrar */ } salir(); } }
}
raiz.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { if (b.tagName === 'A') return; e.preventDefault(); acciones(b); } else if (e.target === $('me')) $('me').hidden = true; });
raiz.addEventListener('change', e => { const c = e.target.dataset.c; if (c === 'estado') { estadoInc = e.target.value; pintar(); } else if (c === 'zona') { zonaInc = e.target.value; pintar(); } else if (c === 'franja') { PA.franja = +e.target.value; guardarPA(); pintar(); } else if (c === 'dia') { PA.dia = +e.target.value; guardarPA(); pintar(); if (!cierresAlDia()) cargarCierres(); } });
raiz.addEventListener('input', e => { if (e.target.id === 'q') { textoBus = e.target.value; $('br').innerHTML = resultadosBus(); } });
function atras(e) { if (!$('fi').hidden) { e.stopImmediatePropagation(); cerrarFicha(); } }
window.addEventListener('popstate', atras, true);
function alVolver() { if (!document.hidden && Date.now() - E.at > AL_VOLVER_MS) cargar(); }
document.addEventListener('visibilitychange', alVolver);
const reloj = setInterval(() => { if (!document.hidden && Date.now() - E.at > REFRESCO_MS) cargar(); }, 30000);

recuperar();
document.documentElement.style.overflow = 'hidden';
(document.body || document.documentElement).appendChild(host);
window.__despachoMovil = { mostrar() { host.style.display = ''; }, salir };
pintar();
if (Date.now() - E.at > AL_VOLVER_MS) cargar();
})();
