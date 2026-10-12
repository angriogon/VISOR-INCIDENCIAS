// Zonas: ordenan y agrupan a los técnicos en todas las vistas.
// La zona "dispatcher" es quien controla (no es un técnico): va la primera en Incidencias
// y no cuenta en la carga de Mañana ni recibe WhatsApp.
// "apoyo": técnicos de otra zona que también pueden atenderla (salen al asignar y en las sugerencias).
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
// Perfiles: cada dispatcher (DSP1…DSP5) y el coordinador (COORD) ven solo sus técnicos.
// Cada zona indica en "dsp" su perfil (sin "dsp" = DSP1: Andalucía/Extremadura). Es la lista inicial de cada perfil.
// Se gestionan en la ventana de Perfiles (ajustes.js). Un técnico puede estar en varios perfiles.
const PERFILES = ['DSP1','DSP2','DSP3','DSP4','DSP5','COORD'];
const PERFIL_KEY = 'dispatcher_perfiles_v1';
const BASE_OPS = ZONAS_BASE.flatMap(z => z.ops);
const dspZona = z => z.dsp || 'DSP1';
// Lista matriz (por defecto): cada DSP con los técnicos de sus zonas y COORD con todos. «Restablecer» vuelve a ella.
function perfilesPorDefecto(){
  const t = Object.fromEntries(PERFILES.map(p => [p, p === 'COORD' ? BASE_OPS.slice() : ZONAS_BASE.filter(z => dspZona(z) === p).flatMap(z => z.ops)]));
  return t;
}
const PERFIL_INICIAL = perfilesPorDefecto();
let perfilCfg = (() => {
  let c = null; try{ c = JSON.parse(localStorage.getItem(PERFIL_KEY) || 'null'); }catch(e){}
  if (!c || !c.tecs) c = { activo:'DSP1', tecs:{} };
  // 1.16.2: todos los perfiles pasan una vez a la lista matriz (lo pidió el usuario); después mandan sus cambios
  if (!c.matriz1){ c.tecs = perfilesPorDefecto(); c.matriz1 = true; try{ localStorage.setItem(PERFIL_KEY, JSON.stringify(c)); }catch(e){} }
  PERFILES.forEach(p => { if (!Array.isArray(c.tecs[p])) c.tecs[p] = (PERFIL_INICIAL[p] || []).slice(); });
  // Técnicos que se añadan a ZONAS_BASE en el futuro: entran solos en el perfil de su zona (y en COORD).
  // "conocidos" guarda los que ya existían, para no volver a meter a los que quitaste tú.
  if (!Array.isArray(c.conocidos)){ c.conocidos = BASE_OPS.slice(); try{ localStorage.setItem(PERFIL_KEY, JSON.stringify(c)); }catch(e){} }   // se guarda ya: si no, un técnico nuevo en el código nunca entraría
  const nuevos = BASE_OPS.filter(op => !c.conocidos.includes(op));
  if (nuevos.length){
    ZONAS_BASE.forEach(z => z.ops.filter(op => nuevos.includes(op)).forEach(op => { [dspZona(z), 'COORD'].forEach(p => { if (!c.tecs[p].includes(op)) c.tecs[p].push(op); }); }));
    c.conocidos = BASE_OPS.slice(); try{ localStorage.setItem(PERFIL_KEY, JSON.stringify(c)); }catch(e){}
  }
  if (!PERFILES.includes(c.activo)) c.activo = 'DSP1';
  return c;
})();
const PERFIL = perfilCfg.activo;
// Todos los técnicos conocidos (de cualquier perfil): se puede asignar a cualquiera desde cualquier perfil
const TODOS_OPS = [...new Set([...BASE_OPS, ...PERFILES.flatMap(p => perfilCfg.tecs[p])])];
// Perfil "dueño" de un técnico (el de su zona; si no tiene zona, el primer DSP que lo tiene)
function perfilDeOp(op){ const z = ZONAS_BASE.find(x => x.ops.includes(op)); return z ? dspZona(z) : PERFILES.filter(p => p !== 'COORD').find(p => perfilCfg.tecs[p].includes(op)) || 'OTROS'; }
// Zonas del perfil activo: las de ZONAS_BASE con sus técnicos y, para los demás, un grupo por perfil (p. ej. "DSP2")
const ZONAS = (() => {
  const mios = perfilCfg.tecs[PERFIL];
  const base = ZONAS_BASE.map(z => ({ ...z, ops: z.ops.filter(op => mios.includes(op)) })).filter(z => z.ops.length);
  const extra = {};
  mios.filter(op => !BASE_OPS.includes(op)).forEach(op => { const g = perfilDeOp(op); (extra[g] = extra[g] || []).push(op); });
  return [...base, ...Object.entries(extra).map(([nombre, ops]) => ({ nombre, ops, extra: true }))];
})();
function zonaOps(nombre){ const z = ZONAS_BASE.find(x => x.nombre === nombre); return z ? [...z.ops, ...(z.apoyo || [])] : []; }
const ZONAS_TEC = ZONAS.filter(z => !z.dispatcher);
const TECNICOS = ZONAS_TEC.flatMap(z => z.ops);
// Solo se cargan incidencias de estos operarios y en estos estados (también al importar Excel).
// Si cambias algo aquí, cámbialo igual en atgo-sync.js.
const OPERARIOS = ZONAS.flatMap(z => z.ops);
const ESTADOS = ['PRESENCIAL','PUESTO OPERATIVO','FUERA DE MANTENIMIENTO','MATERIAL PTE. FABRICANTE','PTE. MOVER MATERIAL','EN FABRICANTE','ESCALADO TIER1'];
const ATGO_URL = 'https://atgo.tier1.es/#/mistickets/';
const ATGO_ORIGIN = 'https://atgo.tier1.es';
const ATGO_KEY = 'dispatcher_atgo_v1';
// Índices de columna (0 = A, 1 = B, ...)
const COLS = { num:1, fVisita:4, desdeHora:5, fCaducidad:6, descSede:8, referencia:9, operario:10, estado:11, descCliente:13, estCaducidad:15, domicilio:18 };

let rows = [];
let source = null;   // 'excel' | 'atgo'
let collapsed = {};   // por técnico: false = desplegado (por defecto, plegado)
function todayStr(){
  const d = new Date();
  return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();
}
const PALETTE = ['#2f8f87','#c9862b','#5b8dd9','#a97fd1','#c9527a','#5ea86f','#d9614f','#8b98a3'];
function colorFor(s){
  const str = String(s||'—');
  let h = 0; for (let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); }
function cleanInitials(s){ return String(s||'').toUpperCase().replace(/[.\s]/g,'').trim(); }
function fmt(v){
  if (v instanceof Date) return v.toLocaleDateString('es-ES');
  return String(v ?? '').trim();
}
function jsq(s){ return esc(String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")); }

// ===== Importación de Excel/CSV (botón, arrastrar o "Abrir con" desde Windows) =====
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) readSpreadsheet(file);
});

// Librerías externas: se cargan solo cuando hacen falta (Excel al importar/exportar, Leaflet al abrir el mapa).
// Un solo intento a la vez; si falla (sin conexión) se puede reintentar sin dejar restos en la página.
const libsCargando = {};
function cargarLibreria(url, lista, css){
  if (lista()) return Promise.resolve();
  if (libsCargando[url]) return libsCargando[url];
  const p = new Promise((res, rej) => {
    if (css && !document.querySelector(`link[href="${css}"]`)){ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = css; document.head.appendChild(l); }
    const s = document.createElement('script'); s.src = url;
    s.onload = () => lista() ? res() : rej(new Error('no se pudo cargar'));
    s.onerror = () => { s.remove(); rej(new Error('sin conexión')); };
    document.head.appendChild(s);
  });
  libsCargando[url] = p; p.catch(() => { delete libsCargando[url]; });
  return p;
}
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';   // la guarda también sw.js para usarla sin conexión
function cargarXLSX(){ return cargarLibreria(XLSX_URL, () => window.XLSX); }

async function readSpreadsheet(file){
  try{ await cargarXLSX(); }catch(e){ toast('No se pudo cargar el lector de Excel. Abre la app una vez con conexión.'); return; }
  const reader = new FileReader();
  reader.onload = (evt) => {
    try{
      const wb = XLSX.read(new Uint8Array(evt.target.result), { type:'array', cellDates:true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { header:1, defval:'', raw:false, dateNF:'dd/mm/yyyy' });
      const dataRows = raw.slice(1).filter(r => r.some(c => String(c||'').trim() !== ''));
      if (!dataRows.length){ toast('El archivo no tiene filas de datos.'); return; }
      loadData(dataRows, file.name);
      showTab('inc');
    }catch(err){
      toast('No se pudo leer el archivo: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// Arrastrar y soltar un Excel sobre la ventana
let dragDepth = 0;
window.addEventListener('dragenter', e => { e.preventDefault(); dragDepth++; document.body.classList.add('dragging'); });
window.addEventListener('dragleave', e => { e.preventDefault(); if (--dragDepth <= 0){ dragDepth = 0; document.body.classList.remove('dragging'); } });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => {
  e.preventDefault(); dragDepth = 0; document.body.classList.remove('dragging');
  const f = e.dataTransfer && e.dataTransfer.files[0];
  if (f && /\.(xlsx|xls|csv)$/i.test(f.name)) readSpreadsheet(f);
  else if (f && /\.json$/i.test(f.name)) restoreBackup(f);
});

// "Abrir con → Despacho" desde el Explorador de Windows (app instalada)
if ('launchQueue' in window){
  window.launchQueue.setConsumer(async (params) => {
    if (!params.files || !params.files.length) return;
    const f = await params.files[0].getFile();
    readSpreadsheet(f);
  });
}

document.getElementById('clearBtn').addEventListener('click', async () => {
  // Desde ⚙ › Datos. Solo quita la lista cargada (se recupera en la próxima sincronización); notas y ajustes no se tocan
  if (!await confirmar('<b>¿Quitar los datos cargados?</b><p>Se vacía la lista de incidencias de esta pantalla. Vuelve a llenarse en la próxima sincronización con ATGO. Tus notas y ajustes no se tocan.</p>', 'Quitar')) return;
  rows = []; poolRows = []; poolCargado = false;
  source = null;
  try{ localStorage.removeItem(ATGO_KEY); }catch(e){}
  setAtgoStatus('');
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('dataView').style.display = 'none';
  document.getElementById('clearBtn').style.display = 'none';
  document.getElementById('fileStatus').textContent = 'Sin datos';
  document.getElementById('fileInput').value = '';
  refreshVisible();   // Mi día, Sin asignar y Planificación también se vacían
});

const ESTADOS_N = ESTADOS.map(norm);
function permitido(r){ return OPERARIOS.includes(cleanInitials(r.operario)) && ESTADOS_N.includes(norm(r.estado)); }

// Muestra un conjunto de incidencias. keepView=true conserva grupos plegados y filtros (refrescos de ATGO).
function setRows(newRows, label, keepView){
  rows = newRows.filter(permitido);
  if (!keepView){ collapsed = {}; }
  document.getElementById('fileStatus').textContent = `${label} · ${rows.length} incidencias`;
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('dataView').style.display = 'block';
  document.getElementById('clearBtn').style.display = 'inline-block';
  renderFilters();
  render();
  if (document.getElementById('viewMan').style.display !== 'none') renderManana();
  if (document.getElementById('viewDia').style.display !== 'none') renderDia();
}

function loadData(dataRows, filename){
  const parsed = dataRows.map(r => {
    const o = {};
    for (const [field, idx] of Object.entries(COLS)) o[field] = fmt(r[idx]);
    return o;
  }).filter(r => r.operario);
  source = 'excel';
  setAtgoStatus('', 'off');
  document.getElementById('fileInput').value = '';
  setRows(parsed, filename, false);
  const fuera = parsed.length - rows.length;
  if (fuera > 0) toast(`${fuera} filas ignoradas (otros operarios o estados)`);
}

// ===== Zonas =====
let zonaSel = null;   // nombre de zona o null = todas (compartido por Incidencias y Mañana)
function zonaDe(op){ const i = cleanInitials(op); const z = ZONAS.find(z => z.ops.includes(i)) || ZONAS_BASE.find(z => z.ops.includes(i)); return z ? z.nombre : TODOS_OPS.includes(i) ? perfilDeOp(i) : 'SIN ZONA'; }
function opIndex(op){ const i = OPERARIOS.indexOf(cleanInitials(op)); return i === -1 ? 999 : i; }
function enZona(r){ return !zonaSel || zonaDe(r.operario) === zonaSel; }
// Agrupa filas por zona (en el orden de ZONAS) y, dentro, por técnico.
function zoneChips(onPick, counts, lista){
  const el = document.createElement('span');
  el.className = 'filters';
  const mk = (label, val, n) => {
    const b = document.createElement('button');
    b.className = 'chip' + (zonaSel === val ? ' active' : '');
    b.textContent = n != null ? `${label} · ${n}` : label;
    b.onclick = () => { zonaSel = zonaSel === val ? null : val; onPick(); };
    return b;
  };
  el.appendChild(mk('Todas', null));
  (lista || ZONAS).forEach(z => { if (counts[z.nombre]) el.appendChild(mk(z.nombre, z.nombre, counts[z.nombre])); });
  return el;
}
function zoneCounts(list){ const c = {}; list.forEach(r => { const z = zonaDe(r.operario); c[z] = (c[z]||0) + 1; }); return c; }

// ---- Filtros de Incidencias (zona, estado, caducidad, texto) y filtros guardados ----
const FILTROS_KEY = 'dispatcher_filtros_v1';
let filtroInc = { est: '', cad: false, q: '', dsp: '' };   // dsp: ver solo los técnicos de un DSP (desde el resumen de COORD)
let filtrosGuardados = (() => { try{ const l = JSON.parse(localStorage.getItem(FILTROS_KEY) || '[]'); return Array.isArray(l) ? l : []; }catch(e){ return []; } })();
function filtroActivo(){ return !!(filtroInc.est || filtroInc.cad || filtroInc.q || filtroInc.dsp); }
function pasaFiltro(r){
  if (filtroInc.dsp && !(perfilCfg.tecs[filtroInc.dsp] || []).includes(cleanInitials(r.operario))) return false;
  if (filtroInc.est && norm(r.estado) !== filtroInc.est) return false;
  if (filtroInc.cad){ const c = caducidad(r); if (!c || !['venc','urg'].includes(cadNivel(c))) return false; }
  if (filtroInc.q){ const h = norm([r.num, r.descSede, r.descCliente, r.domicilio, r.referencia, r.tipo, r.operario].join(' ')); if (!norm(filtroInc.q).split(/\s+/).every(t => h.includes(t))) return false; }
  return true;
}
function renderFilters(){
  const el = document.getElementById('filters');
  el.innerHTML = '';
  el.appendChild(zoneChips(() => { renderFilters(); render(); }, zoneCounts(rows), ZONAS.filter(z => z.ops.some(op => enDsp(op)))));
  const f = document.createElement('div'); f.className = 'filt2';
  f.innerHTML = `${dspChipsHtml('renderFilters();render()') || (filtroInc.dsp ? `<span class="chip sm active fsav"><span>Solo ${esc(filtroInc.dsp)}</span><b onclick="filtroInc.dsp='';renderFilters();render()" title="Ver todos" aria-label="Quitar">×</b></span>` : '')}<select onchange="filtroInc.est=this.value;render()" title="Estado"><option value="">Todos los estados</option>${ESTADOS.map(e => `<option value="${esc(norm(e))}"${filtroInc.est === norm(e) ? ' selected' : ''}>${esc(e)}</option>`).join('')}</select>
    <label class="chip sm${filtroInc.cad ? ' active' : ''}"><input type="checkbox" hidden ${filtroInc.cad ? 'checked' : ''} onchange="filtroInc.cad=this.checked;renderFilters();render()">Caducan en 24 h o vencidas</label>
    <input type="search" id="filtQ" placeholder="Filtrar: sede, cliente, Nº…" value="${esc(filtroInc.q)}" oninput="filtroInc.q=this.value;render()">
    ${filtroActivo() || zonaSel ? `<button class="chip sm" onclick="guardarFiltro()" title="Guardar esta combinación como acceso rápido">☆ Guardar</button><button class="chip sm" onclick="filtroInc={est:'',cad:false,q:''};zonaSel=null;renderFilters();render()">Limpiar</button>` : ''}
    ${filtrosGuardados.map((g, i) => `<span class="chip sm fsav"><span onclick="aplicarFiltro(${i})" title="Aplicar">★ ${esc(g.n)}</span><b onclick="borrarFiltro(${i})" title="Quitar" aria-label="Quitar">×</b></span>`).join('')}`;
  el.appendChild(f);
}
function guardarFiltro(){
  const def = [zonaSel, filtroInc.est && ESTADOS.find(e => norm(e) === filtroInc.est), filtroInc.cad && 'caducan', filtroInc.q].filter(Boolean).join(' + ');
  const n = (prompt('Nombre del filtro', def) || '').trim(); if (!n) return;
  filtrosGuardados.push({ n, z: zonaSel, ...filtroInc });
  try{ localStorage.setItem(FILTROS_KEY, JSON.stringify(filtrosGuardados)); }catch(e){}
  renderFilters(); toast('Filtro guardado');
}
function aplicarFiltro(i){ const g = filtrosGuardados[i]; if (!g) return; zonaSel = g.z || null; filtroInc = { est: g.est || '', cad: !!g.cad, q: g.q || '' }; renderFilters(); render(); }
function borrarFiltro(i){ filtrosGuardados.splice(i, 1); try{ localStorage.setItem(FILTROS_KEY, JSON.stringify(filtrosGuardados)); }catch(e){} renderFilters(); }

function filteredRows(){ return rows.filter(r => enZona(r) && pasaFiltro(r)); }

// ---- Filtro por DSP (perfiles con técnicos de varios DSP, p. ej. COORD) ----
// Es el mismo en Incidencias, Planificación (semana y día) y Sin asignar: filtroInc.dsp.
function dspsDelPerfil(){ return PERFILES.filter(p => p !== 'COORD' && perfilCfg.tecs[p].some(op => OPERARIOS.includes(op))); }
function enDsp(op){ return !filtroInc.dsp || (perfilCfg.tecs[filtroInc.dsp] || []).includes(cleanInitials(op)); }
function zonaEnDsp(nombre){ if (!filtroInc.dsp) return true; const z = ZONAS_BASE.find(x => x.nombre === nombre); return !!z && dspZona(z) === filtroInc.dsp; }
// Zonas de técnicos que se ven: las del perfil, con el filtro de zona y el de DSP
function zonasVisibles(){
  let z = zonaSel ? ZONAS_TEC.filter(x => x.nombre === zonaSel) : ZONAS_TEC;
  if (filtroInc.dsp){ const l = perfilCfg.tecs[filtroInc.dsp] || []; z = z.map(x => ({ ...x, ops: x.ops.filter(op => l.includes(op)) })).filter(x => x.ops.length); }
  return z;
}
function dspChipsHtml(alCambiar){
  const l = dspsDelPerfil(); if (l.length < 2) return '';
  if (filtroInc.dsp && !l.includes(filtroInc.dsp)) filtroInc.dsp = '';
  return `<span class="seg mini dsp-seg" title="Ver solo los técnicos y zonas de un DSP">${[['', 'Todos'], ...l.map(p => [p, p])].map(([v, t]) => `<button class="segb${(filtroInc.dsp || '') === v ? ' on' : ''}" onclick="filtroInc.dsp='${v}';zonaSel=null;${alCambiar}">${t}</button>`).join('')}</span>`;
}

// ===== Sincronización en tiempo real con ATGO (ver atgo-sync.js) =====
function setAtgoStatus(text, state){
  const el = document.getElementById('atgoStatus');
  el.innerHTML = text ? ` · ${esc(text)}` : '';
  // Punto de la cabecera: verde al día, ámbar cargando o con datos guardados, rojo con error
  const dot = document.getElementById('syncDot');
  if (dot) dot.className = 'sync-dot ' + (state === 'err' ? 'err' : state === 'off' ? 'off' : /^Cargando/.test(text || '') ? 'load' : text ? 'ok' : '');
}

// Si ATGO devuelve de golpe casi nada (sesión rara o cambio en su web), no se da por bueno a la primera:
// así no parece que todos los tickets "salieron". A la tercera carga seguida igual, se acepta.
let caidaSeguida = 0;
function cargaSospechosa(msg){
  const n = (Array.isArray(msg.rows) ? msg.rows : []).filter(permitido).length, antes = rows.length;
  if (source === 'atgo' && antes >= 10 && n < antes * 0.2 && caidaSeguida < 2){
    caidaSeguida++;
    const el = document.getElementById('syncAviso');
    if (el){ el.hidden = false; el.innerHTML = `⚠ ATGO ha devuelto ${n} incidencias (antes ${antes}). No se aplica hasta confirmarlo en la próxima carga. <button class="btn sm" onclick="document.getElementById('atgoBtn').click()">Abrir ATGO</button>`; }
    diagLog && diagLog('Carga sospechosa: ' + n + ' de ' + antes);
    return true;
  }
  caidaSeguida = 0; return false;
}
function applyAtgo(msg, fromCache){
  if (!msg.partial && !fromCache && cargaSospechosa(msg)) return;
  const firstAtgo = source !== 'atgo';
  source = 'atgo';
  setRows(Array.isArray(msg.rows) ? msg.rows : [], 'ATGO', !firstAtgo);
  if (msg.partial) setAtgoStatus(`Cargando… ${msg.progress||''}`, '');
  else if (fromCache) setAtgoStatus(`Último dato ${new Date(msg.at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} · sin conexión con ATGO`, 'off');
  else setAtgoStatus(`En vivo · ${hhmm(msg.at)}`, '');
  if (!msg.partial && !fromCache){
    try{ localStorage.setItem(ATGO_KEY, JSON.stringify(msg)); }catch(e){}
    hilosTrasCarga(trackChanges(rows));   // novedades, avisos, rutas cambiadas e hilos nuevos (dia.js)
    guardarJornada(); revisarSLA();        // informe semanal y caducidades (herramientas.js)
    refreshVisible();
  } else updateDiaBadge();
}
// ---- No repintar mientras escribes o eliges algo ----
// Si llega una actualización de ATGO con un campo en uso (buscador, filtro, técnico, fecha…), se aplica al soltarlo.
// Si el campo se queda en uso más de 4 min, se aplica igualmente para no trabajar con datos viejos.
function ocupado(){
  const a = document.activeElement;
  return !!a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && a.type !== 'checkbox' && !!a.closest('main, #cfgMenu');
}
let atgoEnCola = null, atgoEnColaDesde = 0;
function aplicarDatosAtgo(m){
  const y = window.scrollY;
  applyAtgo(m, false); recibirPool(m);
  if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);   // mantener el sitio de la página
}
function aplicarPendiente(){
  if (ocupado()) return;
  if (atgoEnCola){ const m = atgoEnCola; atgoEnCola = null; aplicarDatosAtgo(m); }
  else if (refrescoPendiente) refreshVisible();
}
document.addEventListener('focusout', () => setTimeout(aplicarPendiente, 400));
setInterval(aplicarPendiente, 2000);   // por si el navegador no avisa al soltar el campo (ventana en segundo plano)
window.addEventListener('message', (e) => {
  if (e.origin !== ATGO_ORIGIN || !e.data || typeof e.data !== 'object') return;
  const m = e.data;
  atgoSource = e.source;   // pestaña de ATGO que sincroniza: a ella se le piden los hilos
  if (m.type === 'atgo-data'){
    recibirCapacidades(m); configurarAtgo(e.source);
    if (!m.partial){ ultimaCarga = { s: m.seconds, ops: Array.isArray(m.ops) ? m.ops.length : null, at: m.at }; syncVieja = m.v === SYNC_VERSION ? false : (!m.v || cmpVer(m.v, SYNC_VERSION) < 0) ? 'atgo' : 'app'; if (perfilEsperando && (mismaLista(m.ops) || !m.ops)) perfilListo(); else renderSyncAviso(); }   // sin "ops" = sincronización antigua: manda su aviso de recargar
    if (!m.partial && ocupado() && (!atgoEnCola || Date.now() - atgoEnColaDesde < 4 * 60000)){ if (!atgoEnCola) atgoEnColaDesde = Date.now(); atgoEnCola = m; return; }
    atgoEnCola = null; aplicarDatosAtgo(m);
  }
  else if (m.type === 'atgo-editado') recibirEdicion(m);
  else if (m.type === 'atgo-hilo') recibirHilos(m.hilos);
  else if (m.type === 'atgo-estado') recibirEstados(m.estados);
  else if (m.type === 'atgo-status') setAtgoStatus(String(m.text||''), m.error ? 'err' : '');
  else if (m.type === 'atgo-hello'){ e.source.postMessage({type:'despacho-ready'}, ATGO_ORIGIN); configurarAtgo(e.source); }
});
// Versión de la sincronización que espera esta app. Si la pestaña de ATGO trae otra (la cargó antes de una
// actualización), se avisa de que hay que recargarla. Debe coincidir con SYNC_VERSION de atgo-sync.js.
const SYNC_VERSION = '1.20.0';
let syncVieja = false;   // 'atgo': la pestaña de ATGO es más antigua · 'app': Despacho es más antiguo · false: iguales
function cmpVer(a, b){ const x = String(a || '0').split('.').map(Number), y = String(b || '0').split('.').map(Number); for (let i = 0; i < 3; i++){ if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; }
// Borra la copia guardada de Despacho y recarga desde el servidor (notas, perfiles y ajustes no se tocan)
async function actualizarDespacho(){
  try{ for (const k of await caches.keys()) await caches.delete(k); }catch(e){}
  try{ const regs = await navigator.serviceWorker.getRegistrations(); for (const r of regs) await r.unregister(); }catch(e){}
  location.reload();
}
let ultimaCarga = null;   // duración de la última carga de ATGO (se ve en ⚙ › General)
// Tras cambiar de perfil (o si los datos guardados son de otro perfil) se avisa «Cargando DSPx…» hasta que
// llega una carga de ATGO hecha con los técnicos de este perfil (la sincronización manda su lista en "ops").
const mismaLista = l => Array.isArray(l) && l.slice().sort().join() === OPERARIOS.slice().sort().join();
let perfilEsperando = (() => {
  try { if (sessionStorage.getItem('despacho_perfil_cambiado') === PERFIL) return true; } catch (e) {}
  try { const c = JSON.parse(localStorage.getItem(ATGO_KEY) || 'null'); return !!(c && Array.isArray(c.ops) && !mismaLista(c.ops)); } catch (e) { return false; }
})();
function perfilListo(){ perfilEsperando = false; try { sessionStorage.removeItem('despacho_perfil_cambiado'); } catch (e) {} renderSyncAviso(); }
if (perfilEsperando) setTimeout(() => { if (perfilEsperando) perfilListo(); }, 3 * 60000);   // por si la pestaña de ATGO no responde
// La lista de técnicos que sincroniza la pestaña de ATGO sale de aquí (ZONAS_BASE): así no puede quedar desfasada.
// atgo-sync.js mantiene su propia lista solo como respaldo si esta no llega.
let atgoConfigurada = null;
function configurarAtgo(src){
  if (!src || atgoConfigurada === src) return;
  atgoConfigurada = src;
  // operarios: los que se sincronizan (los del perfil activo). permitidos: a quién se puede asignar (todos los perfiles)
  try{ src.postMessage({ type:'despacho-config', operarios: OPERARIOS, permitidos: TODOS_OPS }, ATGO_ORIGIN); }catch(e){}
}
// Si esta ventana la abrió ATGO (con el marcador), avisamos de que estamos listos.
if (window.opener){ try{ window.opener.postMessage({type:'despacho-ready'}, ATGO_ORIGIN); }catch(e){} }

let atgoWin = null;
document.getElementById('atgoBtn').addEventListener('click', () => {
  if (atgoWin && !atgoWin.closed){
    try{ atgoWin.postMessage({type:'despacho-refresh'}, ATGO_ORIGIN); }catch(e){}
    try{ atgoWin.focus(); }catch(e){}
    return;
  }
  // Sin "noopener": ATGO necesita esta referencia para enviar los datos de vuelta.
  atgoWin = window.open(ATGO_URL, 'atgo-tier1');
  if (!atgoWin) toast('El navegador bloqueó la ventana. Abre ' + ATGO_URL);
});

// Marcador: carga atgo-sync.js (de esta misma web) dentro de la pestaña de ATGO.
(function(){
  const src = new URL('atgo-sync.js', location.href.split('#')[0]).href;
  const code = "(function(){if(location.hostname!=='atgo.tier1.es'){alert('Abre primero https://atgo.tier1.es e inicia sesión.');return;}var s=document.createElement('script');s.src='" + src + "?v='+Date.now();document.body.appendChild(s);})();";
  const a = document.getElementById('bookmarklet');
  a.href = 'javascript:' + encodeURIComponent(code);
  a.addEventListener('click', e => { e.preventDefault(); toast('Arrástralo a la barra de favoritos (Ctrl+Mayús+B para mostrarla)'); });
})();

// ===== Incidencias: un técnico por fila con el progreso de su ruta de hoy =====
const ST_LAB = { d: 'Terminada', t: 'En trámite', c: 'En curso', p: 'Pendiente' };
const ST_ICO = { d: '✓', t: '◑', c: '◐', p: '○' };
let renderedOps = [];
function isCol(op){ return collapsed[op] !== false; }

function render(){
  const data = filteredRows();
  const panel = document.getElementById('groupsPanel');
  const rutaAll = rutaHoy();
  const rutaZona = rutaAll.filter(x => (!zonaSel || zonaDe(x.op) === zonaSel));
  const rutaTec = rutaZona.filter(x => TECNICOS.includes(cleanInitials(x.op)));
  const n = { d: 0, t: 0, c: 0, p: 0 }; rutaTec.forEach(x => n[x.st]++);
  const tot = rutaTec.length, late = rutaTec.filter(x => x.late).length;
  const pc = v => tot ? Math.round(v / tot * 100) : 0;
  document.getElementById('countLabel').innerHTML = tot ? `
    <div class="kpis inc-kpis">
      <div class="kpi"><b>${tot}</b>visitas hoy</div>
      <div class="kpi"><b style="color:var(--done-tx)">${n.d}</b>terminadas</div>
      <div class="kpi"><b style="color:var(--tra-tx)">${n.t}</b>en trámite</div>
      <div class="kpi"><b style="color:var(--cur-tx)">${n.c}</b>en curso</div>
      <div class="kpi"><b>${n.p}</b>pendientes${late ? ` · <span style="color:#d9614f">${late} con retraso</span>` : ''}</div>
    </div>
    <div class="dayprog"><div class="pbar big"><i class="d" style="width:${pc(n.d)}%"></i><i class="t" style="width:${pc(n.t)}%"></i><i class="c" style="width:${pc(n.c)}%"></i></div><span>${pc(n.d)}% del día</span></div>`
    : `<div class="dempty">Sin visitas enrutadas para hoy${zonaSel ? ' en ' + esc(zonaSel) : ''}.</div>`;

  const byOp = {}; data.forEach(r => { (byOp[r.operario] = byOp[r.operario] || []).push(r); });
  const rutaOp = {}; rutaZona.filter(x => !filtroActivo() || (!x.salio && pasaFiltro(x.r))).forEach(x => { (rutaOp[x.op] = rutaOp[x.op] || []).push(x); });
  const ops = [...new Set([...Object.keys(byOp), ...Object.keys(rutaOp)])];
  renderedOps = ops;
  updToggle();
  if (!ops.length){ panel.innerHTML = `<div class="empty"><h2>Nada con este filtro</h2>${filtroActivo() || zonaSel ? `<div class="acts" style="justify-content:center;margin-top:10px"><button class="btn" onclick="filtroInc={est:'',cad:false,q:''};zonaSel=null;renderFilters();render()">Quitar filtros</button></div>` : '<div>Este perfil no tiene incidencias abiertas ahora mismo.</div>'}</div>`; return; }

  panel.innerHTML = ZONAS.map(z => {
    const zops = ops.filter(op => zonaDe(op) === z.nombre).sort((a, b) => opIndex(a) - opIndex(b));
    if (!zops.length) return '';
    const zr = zops.flatMap(op => rutaOp[op] || []);
    const head = z.dispatcher
      ? `<div class="zhead" style="color:var(--amber)">${esc(z.nombre)} <span>${plural(zops.reduce((s2, op) => s2 + (byOp[op] || []).length, 0), 'incidencia')} a tu nombre</span></div>`
      : `<div class="zhead">${esc(z.nombre)} <span>${zr.length ? zr.filter(x => x.st === 'd').length + '/' + plural(zr.length, 'visita') + ' hechas hoy' : 'sin visitas hoy'}</span></div>`;
    return head + zops.map(op => tecRow(op, byOp[op] || [], rutaOp[op] || [], z.dispatcher)).join('');
  }).join('');
}

function tecRow(op, items, ruta, esDisp){
  const tot = ruta.length, d = ruta.filter(x => x.st === 'd').length, t = ruta.filter(x => x.st === 't').length, c = ruta.filter(x => x.st === 'c').length;
  const late = ruta.filter(x => x.late).length;
  const pc = v => tot ? Math.round(v / tot * 100) : 0;
  const ref = items[0] || (ruta[0] && ruta[0].r) || {};
  const esc1 = items.filter(r => norm(r.estado) === norm('ESCALADO TIER1')).length;
  const sinF = items.filter(r => esPresencial(r) && !r.fVisita).length;
  const enRuta = new Set(ruta.map(x => tkey(x.r)));
  const resto = items.filter(r => !enRuta.has(tkey(r))).sort((a, b) => (parseEs(a.fVisita) || 9e15) - (parseEs(b.fVisita) || 9e15));
  return `<div class="tg${isCol(op) ? ' collapsed' : ''}" data-op="${esc(op)}">
    <div class="tg-h" onclick="toggleGroup('${jsq(op)}')">
      <div class="av">${esc(op)}</div>
      <div class="tg-n"><b>${esc(op)}</b><span>${esc(nombreTecnico(ref) || zonaDe(op))}</span></div>
      <div class="tg-m">
        ${esDisp ? '<span class="tg-none">Pendientes de asignar</span>'
          : tot ? `<div class="pbar"><i class="d" style="width:${pc(d)}%"></i><i class="t" style="width:${pc(t)}%"></i><i class="c" style="width:${pc(c)}%"></i></div>`
          : '<span class="tg-none">Sin visitas hoy</span>'}
        <div class="tg-ch" title="${esc([plural(items.length, 'abierta'), esc1 && plural(esc1, 'escalado'), sinF && sinF + ' sin fecha', late && late + ' con retraso'].filter(Boolean).join(' · '))}">${late ? `<span class="ch2 late">${late} retraso${late === 1 ? '' : 's'}</span>` : ''}${esc1 ? `<span class="ch2 w">${esc1} escal.</span>` : ''}<span class="ch2">${plural(items.length, 'abierta')}</span>${sinF ? `<span class="ch2">${sinF} sin fecha</span>` : ''}</div>
      </div>
      <div class="tg-c">${esDisp ? `<b>${items.length}</b><small>tuyas</small>` : tot ? `<b>${d}/${tot}</b><small>hoy</small>` : '<b style="color:var(--ink-faint)">—</b><small>hoy</small>'}</div>
      <span class="chev">▾</span>
    </div>
    <div class="tg-b">
      ${!esDisp && ruta.some(x => esPresencial(x.r) && !x.salio) ? `<div class="tg-acts"><button class="btn sm" onclick="abrirRuta('${jsq(op)}', todayStr())" title="GLS 9:00-10:00, citas con hora en su orden, sin hora a mediodía">Ruta de hoy en Maps</button></div>` : ''}
      ${tot ? '<div class="tg-l">Hoy</div>' + sortByHora(ruta.map(x => Object.assign({}, x.r, { _x: x }))).map(r => visitaHoyHtml(r._x)).join('') : ''}
      ${resto.length ? `<div class="tg-l">${tot ? 'Resto de incidencias' : 'Incidencias'}</div>` + resto.map(lineHtml).join('') : ''}
      ${esDisp ? '' : cerradasHtml(op)}
    </div>
  </div>`;
}

function visitaHoyHtml(x){
  const r = x.r, mot = typeof motivoTexto === 'function' ? motivoTexto(tkey(r)) : '';
  const hora = (r.desdeHora || '--:--') + (r.hastaHora ? '–' + r.hastaHora : '');
  const lab = x.label || ST_LAB[x.st];
  return `<div class="vh" data-key="${esc(tkey(r))}">
    <span class="vh-i st-${x.st}" title="${esc(ST_LAB[x.st])}">${ST_ICO[x.st]}</span>
    <span class="vh-h${x.late ? ' late' : ''}" title="${x.late ? 'Ya debería haber empezado' : ''}">${esc(hora)}</span>
    <span class="vh-n">${numHtml(r)}${segBadges(r)}${cadBadge(r)}</span>
    <span class="vh-s">${esc(r.descSede || r.domicilio || '—')}${mot ? ` · <span class="vh-m">${esc(mot.slice(0, 90))}</span>` : ''}</span>
    <span class="vh-st st-${x.st}">${esc(lab)}${x.ts ? ' ' + hhmm(x.ts) : ''} ${x.salio ? '' : estadoPill(r.estado)}</span>
  </div>`;
}

// Estado como globo de color (mismo color en todas las vistas)
const ESTADO_COLOR = { 'presencial':'#2f8f87', 'puesto operativo':'#4f9a5b', 'fuera de mantenimiento':'#7d8790', 'material pte. fabricante':'#8e6cc4', 'pte. mover material':'#c9862b', 'en fabricante':'#4a7fcf', 'escalado tier1':'#d0544a', 'cerrado':'#5f8f6a' };
function estadoColor(e){ const n = norm(e); return ESTADO_COLOR[n] || (/cerrad|operativo/.test(n) ? '#5f8f6a' : colorFor(e)); }
function estadoPill(e){ return e ? `<span class="est-pill" style="--c:${estadoColor(e)}">${esc(e)}</span>` : ''; }
function lineHtml(r){
  const fecha = r.fVisita ? r.fVisita.slice(0, 5) + (r.desdeHora ? ' ' + r.desdeHora : '') + (r.hastaHora ? '–' + r.hastaHora : '') : 'Sin fecha';
  const txt = [r.tipo, r.descSede || '—', r.referencia && 'Ref ' + r.referencia, r.descCliente, r.domicilio].filter(Boolean);
  return `<div class="line" data-key="${esc(tkey(r))}" style="border-left-color:${estadoColor(r.estado)}" title="${esc(txt.join(' · '))}">
    <span class="ln-tx">${numHtml(r)}${segBadges(r)}${cadBadge(r)}${reincBadge(r)}
    ${r.fCaducidad || r.estCaducidad ? `<span>· Caduca <b>${esc(r.fCaducidad || '—')}</b> (${esc(r.estCaducidad || '—')})</span>` : ''}
    <span>· ${esc(txt.join(' · '))}</span></span>
    <span class="ln-end">${estadoPill(r.estado || '—')}<span class="ln-f${r.fVisita ? '' : ' sin'}" title="Fecha de visita asignada">${esc(fecha)}</span></span>
  </div>`;
}

function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }

// Hora "09:30" → minutos para ordenar; sin hora, al final.
function horaMin(h){ const m = /^(\d{1,2}):(\d{2})/.exec(h || ''); return m ? (+m[1])*60 + (+m[2]) : 9999; }
function sortByHora(list){ return list.slice().sort((a,b) => horaMin(a.desdeHora) - horaMin(b.desdeHora)); }

function numHtml(r){
  const n = esc(r.num || '—');
  if (r.url && String(r.url).startsWith(ATGO_ORIGIN + '/'))
    return `<a class="num mono" href="${esc(r.url)}" target="atgo-ticket" rel="noopener" title="Abrir en ATGO">Nº ${n}</a>`;
  return `<span class="num mono">Nº ${n}</span>`;
}

function toggleGroup(op){
  collapsed[op] = !isCol(op);
  const el = document.querySelector(`.tg[data-op="${CSS.escape(op)}"]`);
  if (el) el.classList.toggle('collapsed', isCol(op));
  updToggle();
}
const ICON_EXPAND = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>';
const ICON_COLLAPSE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/></svg>';
function updToggle(){
  const b = document.getElementById('toggleAll'); if (!b) return;
  const all = renderedOps.length && renderedOps.every(isCol);
  b.innerHTML = all ? ICON_EXPAND : ICON_COLLAPSE;
  b.title = all ? 'Desplegar todos' : 'Plegar todos';
}
function toggleAll(){
  const all = renderedOps.length && renderedOps.every(isCol);
  renderedOps.forEach(o => collapsed[o] = !all ? true : false);
  render();
}
// ===== Mañana: visitas presenciales por técnico para preparar el día siguiente =====
const CARGA_ALTA = 5, CARGA_MUY = 7;   // nº de visitas a partir del cual la barra se pone naranja / roja
const TEC_KEY = 'dispatcher_tecnicos_v1';
const TEC_DEF = {
  tel: {},          // teléfono por siglas (opcional): si falta, WhatsApp abre el selector de contacto
  modo: 'app',      // 'app' = WhatsApp de escritorio, 'web' = WhatsApp Web
  saludo: 'Hola {nombre}, tu planificación para el {dia}:',
  despedida: 'Total: {total}. Cualquier cosa me dices. ¡Gracias!'
};
// Datos de los técnicos (teléfonos, GLS) y preferencias (mensajes, tema, horas, plantillas…) se guardan aparte:
// un error o una copia restaurada en uno no afecta al otro. Antes todo iba en TEC_KEY: se lee y se separa solo.
const PREF_KEY = 'dispatcher_preferencias_v1';
const TEC_DATOS = ['tel', 'gls'];
let tecCfg = (() => {
  const leer = k => { try{ const v = JSON.parse(localStorage.getItem(k) || '{}'); return v && typeof v === 'object' ? v : {}; }catch(e){ return {}; } };
  const t = leer(TEC_KEY), p = leer(PREF_KEY);
  return { ...TEC_DEF, ...t, ...p, tel: t.tel && typeof t.tel === 'object' ? t.tel : {}, gls: t.gls && typeof t.gls === 'object' ? t.gls : {} };
})();
function saveTec(){
  const tec = {}, pref = {};
  Object.entries(tecCfg).forEach(([k, v]) => { (TEC_DATOS.includes(k) ? tec : pref)[k] = v; });
  let ok = true;
  try{ localStorage.setItem(TEC_KEY, JSON.stringify(tec)); }catch(e){ ok = false; }
  try{ localStorage.setItem(PREF_KEY, JSON.stringify(pref)); }catch(e){ ok = false; }
  if (!ok) toast('No se pudo guardar en este equipo');
}

const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
function ddmmyyyy(d){ return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear(); }
// Siguiente día laborable (viernes y sábado → lunes).
// ===== Festivos =====
// Nacionales (fijos y Viernes Santo, calculado) y los que añadas en ⚙ › Festivos, para todas las zonas o para una.
// El "próximo laborable" se salta los fines de semana y los festivos de todas las zonas.
function pascua(y){
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1, 12);
}
const festCache = {};
function festivosNacionales(y){
  if (festCache[y]) return festCache[y];
  const vs = pascua(y); vs.setDate(vs.getDate() - 2);
  const f = (m, d, n) => [y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'), n];
  return festCache[y] = [f(1, 1, 'Año Nuevo'), f(1, 6, 'Reyes'), [isoHoy(vs), 'Viernes Santo'], f(5, 1, 'Fiesta del Trabajo'), f(8, 15, 'Asunción'),
    f(10, 12, 'Fiesta Nacional'), f(11, 1, 'Todos los Santos'), f(12, 6, 'Constitución'), f(12, 8, 'Inmaculada'), f(12, 25, 'Navidad')];
}
// Nombre del festivo de ese día (para una zona concreta, o solo los de todas las zonas si no se indica), o ''
function festivo(d, zona){
  const iso = isoHoy(d), nac = festivosNacionales(d.getFullYear()).find(x => x[0] === iso);
  if (nac) return nac[1];
  const loc = ((typeof tecCfg !== 'undefined' && tecCfg.festivos) || []).find(x => x.f === iso && (!x.z || x.z === zona));
  return loc ? (loc.n || 'Festivo') + (loc.z ? ' (' + loc.z + ')' : '') : '';
}
function nextWorkday(from){ const d = new Date(from || Date.now()); d.setHours(12,0,0,0); do { d.setDate(d.getDate()+1); } while (d.getDay()===0 || d.getDay()===6 || festivo(d)); return d; }
let manDate = nextWorkday();
let manPhones = false;
function diaLargo(d){ return DIAS[d.getDay()] + ' ' + ddmmyyyy(d).slice(0,5); }
function esPresencial(r){ return norm(r.estado).includes('presencial'); }
function visitasDe(d){ const f = ddmmyyyy(d); return rows.filter(r => esPresencial(r) && r.fVisita === f); }
// "GARCIA SUTIL, JESUS" → "Jesús"; si no hay nombre, las siglas.
function nombrePila(r){
  const n = String(r && r.desOperario || '').split(',')[1];
  const first = n ? n.trim().split(/\s+/)[0] : '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : (r ? r.operario : '');
}

function moveDay(delta){
  const d = new Date(manDate); d.setDate(d.getDate() + delta); manDate = d; renderManana();
}
function setDay(which){ manDate = which === 'hoy' ? (() => { const d = new Date(); d.setHours(12,0,0,0); return d; })() : nextWorkday(); renderManana(); }

function renderManana(){
  const root = document.getElementById('viewMan');
  if (!root.dataset.shell){
    root.dataset.shell = '1';
    root.innerHTML = `<div style="display:grid;gap:10px">
      <div class="toprow">
        <div class="daynav">
          <button class="btn sm ghost" onclick="showTab('sem')" title="Volver a la semana">← Semana</button>
          <button class="iconbtn" onclick="moveDay(-1)" title="Día anterior" aria-label="Día anterior">◀</button>
          <span class="day" id="manDay"></span>
          <button class="iconbtn" onclick="moveDay(1)" title="Día siguiente" aria-label="Día siguiente">▶</button>
          <button class="btn sm" onclick="setDay('man')">Próximo laborable</button>
          <button class="btn sm" onclick="setDay('hoy')">Hoy</button>
        </div>
        <div class="acts">
          <button class="btn sm wa" onclick="enviarTodasRutas()" title="Abre WhatsApp técnico a técnico con su ruta (solo los que aún no la tienen)">Enviar todas las rutas</button>
          <button class="btn sm" onclick="copyResumenDia()" title="Copia la carga de todos los técnicos visibles">Copiar resumen</button>
          <button class="btn sm" onclick="abrirMapa(manDate)" title="Visitas del día en el mapa, en orden de ruta">Mapa</button>
          <button class="btn sm" onclick="toggleCorreos()" title="Correos de confirmación de las visitas del día en Outlook">Correos del día</button>
          <button class="btn sm" id="phonesBtn" onclick="togglePhones()">Técnicos y mensaje</button>
        </div>
      </div>
      <div id="phonesPanel" class="mpanel" style="display:none"></div>
      <div id="mailPanel" class="mpanel" style="display:none"></div>
      <div id="manBody" style="display:grid;gap:10px"></div>
    </div>`;
  }
  document.getElementById('manDay').textContent = diaLargo(manDate).replace(/^./, c => c.toUpperCase()) + '/' + manDate.getFullYear() + (festivo(manDate) ? ' · festivo: ' + festivo(manDate) : '');
  const body = document.getElementById('manBody');
  if (!rows.length){
    body.innerHTML = '<div class="empty"><h2>Sin incidencias cargadas</h2><div>Abre ATGO (⚙ › General › Abrir ATGO) y deja su pestaña abierta, o importa un Excel desde ⚙ › General.</div></div>';
    return;
  }
  if (zonaSel && !ZONAS_TEC.some(z => z.nombre === zonaSel)) zonaSel = null;   // la zona Dispatcher no aplica aquí
  const todas = visitasDe(manDate);
  const esDisp = r => !TECNICOS.includes(cleanInitials(r.operario));
  const disp = todas.filter(esDisp);
  const vis = todas.filter(r => !esDisp(r) && enZona(r) && enDsp(r.operario));
  const zonas = zonasVisibles();
  // Todos los técnicos de las zonas visibles, también los que no tienen visitas (para ver huecos).
  const byOp = {}; vis.forEach(r => { (byOp[r.operario] = byOp[r.operario] || []).push(r); });
  const opsZona = zonas.flatMap(z => z.ops);
  const conVis = opsZona.filter(op => byOp[op]).length;
  const max = Math.max(CARGA_MUY, ...Object.values(byOp).map(l => l.length));

  body.innerHTML = `
    <div class="kpis">
      <div class="kpi"><b>${vis.length}</b>visitas presenciales</div>
      <div class="kpi"><b>${conVis}</b>técnicos con visitas</div>
      <div class="kpi"><b>${opsZona.length - conVis}</b>técnicos libres</div>
      <div class="kpi"><b>${conVis ? (vis.length / conVis).toFixed(1) : '0'}</b>media por técnico</div>
    </div>
    <div id="manChips"></div>
    ${disp.length ? `<div class="zhead" style="color:var(--amber)">DISPATCHER <span>${disp.length} visita${disp.length===1?' presencial':'s presenciales'} a tu nombre: asígnala${disp.length===1?'':'s'} a un técnico</span></div>
      <div class="tgrid">${[...new Set(disp.map(r => r.operario))].map(op => tecCard(op, disp.filter(r => r.operario === op), max, true)).join('')}</div>` : ''}
    ${zonas.map(z => {
      const nz = z.ops.reduce((s, op) => s + (byOp[op] ? byOp[op].length : 0), 0);
      return `<div class="zhead">${esc(z.nombre)} <span>${nz} visita${nz===1?'':'s'}</span></div>
      <div class="tgrid">${z.ops.slice().sort((a,b) => (byOp[b]||[]).length - (byOp[a]||[]).length || opIndex(a) - opIndex(b)).map(op => tecCard(op, byOp[op] || [], max)).join('')}</div>`;
    }).join('')}`;
  const chipsHost = document.getElementById('manChips');
  if (dspsDelPerfil().length > 1){ const d = document.createElement('div'); d.innerHTML = dspChipsHtml('renderManana()'); chipsHost.appendChild(d.firstChild); }
  chipsHost.appendChild(zoneChips(() => renderManana(), Object.fromEntries(ZONAS_TEC.map(z => [z.nombre, todas.filter(r => zonaDe(r.operario) === z.nombre).length || '0'])), ZONAS_TEC.filter(z => z.ops.some(op => enDsp(op)))));
  renderCorreos();
}

function tecCard(op, items, max, sinEnvio){
  const n = items.length;
  const cls = n >= CARGA_MUY ? 'muy' : n >= CARGA_ALTA ? 'alta' : '';
  const tel = tecCfg.tel[op];
  return `<div class="tcard${n ? '' : ' empty0'}">
    <div class="thead">
      <span class="op">${esc(op)}</span>
      <span class="nm">${esc(items[0] && items[0].desOperario || '')}</span>
      <span class="count" style="color:var(--teal);font-weight:600;font-size:12px">${n ? n + ' visita' + (n===1?'':'s') : 'Libre'}</span>
    </div>
    ${n ? `<div class="tc-extra">${cargaHtml(op, ddmmyyyy(manDate))}${conflictos(ddmmyyyy(manDate)).filter(c => c.op === op).map(c => `<span class="tc-conf" title="${esc(c.texto)}">⚠ ${esc(c.texto)}</span>`).join('')}</div>` : ''}
    ${n && !sinEnvio ? envioBadge(op) : ''}
    <div class="load"><i class="${cls}" style="width:${Math.round(n / max * 100)}%"></i></div>
    ${sortByHora(items).map(r => `<div class="vis" data-key="${esc(tkey(r))}">
      <span class="h">${esc(r.desdeHora || '--:--')}${r.hastaHora ? '–' + esc(r.hastaHora) : ''}</span>
      <span class="t">${numHtml(r).replace('class="num mono"', 'class="num mono" style="color:var(--amber);font-weight:600;text-decoration:none"')}${segBadges(r)}${cadBadge(r)} · ${esc(r.descSede || '—')}</span>
      <span class="d">${esc(r.domicilio || '—')}</span>
      <span class="d">${esc([r.tipo, r.referencia && 'Ref ' + r.referencia, r.descCliente].filter(Boolean).join(' · '))}</span>
    </div>`).join('')}
    ${n && !sinEnvio ? `<div class="acts" style="padding:8px 10px;border-top:1px solid var(--line)">
      <button class="btn wa" onclick="sendWhatsApp('${jsq(op)}')" title="${tel ? 'Enviar a ' + esc(tel) : 'Sin teléfono: WhatsApp te pedirá elegir el contacto ' + esc(op)}">WhatsApp${tel ? '' : ' · elegir contacto'}</button>
      <button class="btn sm" onclick="abrirRuta('${jsq(op)}')" title="GLS 9:00-10:00, citas con hora en su orden, sin hora a mediodía">Ruta</button>
      <button class="btn sm" onclick="copyText(mensajeTecnico('${jsq(op)}'))">Copiar</button>
      <button class="btn sm ghost" onclick="toggleEnviado('${jsq(op)}')" title="Si la enviaste por otro medio">${estadoEnvio(op, ddmmyyyy(manDate)) ? 'Desmarcar' : 'Marcar enviada'}</button>
    </div>` : ''}
  </div>`;
}

function mensajeTecnico(op){
  const items = sortByHora(visitasDe(manDate).filter(r => r.operario === op));
  const dia = diaLargo(manDate);
  const vars = { nombre: nombrePila(items[0]) || op, dia, total: items.length + ' visita' + (items.length===1?'':'s'), tecnico: op };
  const fillV = s => String(s || '').replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  const lines = items.map((r, i) => {
    const hora = (r.desdeHora || 'Sin hora') + (r.hastaHora ? '–' + r.hastaHora : '');
    return [
      `*${i+1}) ${hora}* · Nº ${r.num}`,
      r.descSede, r.domicilio,
      [r.tipo, r.referencia && 'Ref: ' + r.referencia].filter(Boolean).join(' · ')
    ].filter(Boolean).join('\n');
  });
  const ruta = tecCfg.rutaEnWa !== false ? urlRuta(op, ddmmyyyy(manDate)) : '';
  return [fillV(tecCfg.saludo), '', lines.join('\n\n'), ruta ? '\nRuta en Google Maps (recogida en GLS de 9:00 a 10:00):\n' + ruta : '', '', fillV(tecCfg.despedida)].join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function telWa(t){
  let d = String(t || '').replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^00/, '');
  if (/^[6789]\d{8}$/.test(d)) d = '34' + d;   // móvil español sin prefijo
  return d;
}
function abrirWa(op, msg){
  const tel = telWa(tecCfg.tel[op]);
  copyText(msg);   // por si WhatsApp no recoge el texto, queda en el portapapeles
  let url;
  if (tecCfg.modo === 'web') url = tel ? `https://web.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(msg)}` : `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  else url = `whatsapp://send?${tel ? 'phone=' + tel + '&' : ''}text=${encodeURIComponent(msg)}`;
  if (tecCfg.modo === 'web') window.open(url, 'whatsapp-web');
  else { const a = document.createElement('a'); a.href = url; a.click(); }
  toast(tel ? `Abriendo WhatsApp con ${op}…` : `Elige el contacto «${op}» en WhatsApp (el mensaje también está copiado)`);
}
function sendWhatsApp(op){
  abrirWa(op, mensajeTecnico(op));
  registrarEnvio(op);   // si su ruta cambia después en ATGO, Despacho avisa (dia.js)
  renderManana(); updateDiaBadge();
}
// ---- Plantillas de WhatsApp por tipo (desde la ficha) ----
const WA_PLANT_DEF = {
  cambio: 'Hola {nombre}, cambio en tu visita Nº {num} ({sede}): ahora es el {fecha} a las {hora}. ¡Gracias!',
  recordatorio: 'Hola {nombre}, recuerda finalizar en ATGO el ticket Nº {num} ({sede}) cuando termines. ¡Gracias!',
  ticket: 'Hola {nombre}, sobre el ticket Nº {num} ({sede}): '
};
const WA_PLANT_LAB = { cambio: 'Cambio de visita', recordatorio: 'Recordar finalizar', ticket: 'Sobre este ticket' };
function waPlant(t){ return ((tecCfg.waPlant || {})[t]) || WA_PLANT_DEF[t]; }
function waTexto(t, r){
  const vars = { nombre: nombrePila(r) || cleanInitials(r.operario), num: r.num, sede: r.descSede || '', fecha: r.fVisita || 'sin fecha', hora: r.desdeHora || 'sin hora', cliente: r.descCliente || '', direccion: r.domicilio || '' };
  return waPlant(t).replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
}
function waFichaHtml(r){
  const op = cleanInitials(r.operario);
  if (!TECNICOS.includes(op)) return '';
  return `<div class="dw-sec"><div class="dw-h">WhatsApp a ${esc(op)}</div>
    <div class="dw-quick">${Object.keys(WA_PLANT_DEF).map(t => `<button class="chip sm" onclick="abrirWa('${jsq(op)}', waTexto('${t}', ticketDe(fichaKey)))" title="${esc(waTexto(t, r))}">${esc(WA_PLANT_LAB[t])}</button>`).join('')}</div>
    <div class="dw-empty">Los textos se cambian en ⚙ › WhatsApp.</div></div>`;
}
// ---- Enviar las rutas de todos, uno tras otro (WhatsApp solo deja abrir una conversación cada vez) ----
let rutasCola = null;
function enviarTodasRutas(){
  const f = ddmmyyyy(manDate);
  const ops = ZONAS_TEC.filter(z => !zonaSel || z.nombre === zonaSel).flatMap(z => z.ops).filter(op => visitasDe(manDate).some(r => r.operario === op) && !estadoEnvio(op, f));
  if (!ops.length){ toast('No quedan rutas por enviar para ese día'); return; }
  rutasCola = { ops, i: 0 };
  colaRutasHtml();
}
function colaRutasHtml(){
  let bar = document.getElementById('rutasBar');
  if (!bar){ bar = document.createElement('div'); bar.id = 'rutasBar'; bar.className = 'undo-bar'; document.body.appendChild(bar); }
  if (!rutasCola || rutasCola.i >= rutasCola.ops.length){ bar.hidden = true; if (rutasCola) toast('Rutas enviadas'); rutasCola = null; return; }
  const op = rutasCola.ops[rutasCola.i];
  bar.hidden = false;
  bar.innerHTML = `<span>Rutas ${rutasCola.i + 1}/${rutasCola.ops.length}: <b>${esc(op)}</b></span><button class="btn sm wa" onclick="sendWhatsApp('${jsq(op)}');rutasCola.i++;colaRutasHtml()">Abrir WhatsApp</button><button class="btn sm ghost" onclick="rutasCola.i++;colaRutasHtml()">Saltar</button><button class="iconbtn sm" onclick="rutasCola=null;colaRutasHtml()" aria-label="Terminar">✕</button>`;
}

function copyResumenDia(){
  const vis = visitasDe(manDate).filter(r => TECNICOS.includes(cleanInitials(r.operario)) && enZona(r) && enDsp(r.operario));
  const zonas = zonasVisibles();
  const out = [`Carga presencial · ${diaLargo(manDate)}${zonaSel ? ' · ' + zonaSel : ''}`, ''];
  zonas.forEach(z => {
    const ls = z.ops.map(op => { const n = vis.filter(r => r.operario === op).length; return `  ${op}: ${n ? n + ' visita' + (n===1?'':'s') : 'libre'}`; });
    out.push(z.nombre, ...ls, '');
  });
  out.push(`Total: ${vis.length} visitas`);
  copyText(out.join('\n'));
}

function togglePhones(){
  manPhones = !manPhones;
  const p = document.getElementById('phonesPanel');
  p.style.display = manPhones ? '' : 'none';
  if (!manPhones) return;
  p.innerHTML = `<div class="mhead"><span>Técnicos: teléfono y recogida en GLS <em>opcional</em></span><button class="btn sm" onclick="togglePhones()">Cerrar</button></div>
  <div class="mbody">
    <div class="hint">Con teléfono, WhatsApp abre directamente el chat del técnico. Sin teléfono, abre el selector y eliges el contacto (búscalo por sus siglas). Se guarda solo en este equipo y se incluye en "Exportar copia".</div>
    <div class="phones">${TECNICOS.map(op => `<label><b>${esc(op)}</b><input inputmode="tel" placeholder="600 000 000" value="${esc(tecCfg.tel[op] || '')}" oninput="tecCfg.tel['${jsq(op)}']=this.value.trim();saveTec()" onchange="renderManana()"><input placeholder="${esc(GLS_ZONA[zonaDe(op)] || 'GLS')}" title="Dónde recoge el material (por defecto, GLS de su zona). Puede ser una dirección." value="${esc((tecCfg.gls || {})[op] || '')}" oninput="tecCfg.gls={...(tecCfg.gls||{}),['${jsq(op)}']:this.value.trim()};saveTec()"></label>`).join('')}</div>
    <div class="cfg-ck" style="font-size:12px">
      <label><input type="checkbox" ${tecCfg.rutaGls !== false ? 'checked' : ''} onchange="tecCfg.rutaGls=this.checked;saveTec()"> Incluir la recogida en GLS (9:00-10:00) en la ruta</label>
      <label><input type="checkbox" ${tecCfg.rutaEnWa !== false ? 'checked' : ''} onchange="tecCfg.rutaEnWa=this.checked;saveTec()"> Añadir el enlace de la ruta en Google Maps al WhatsApp</label>
    </div>
    <div class="fgrid">
      <label class="fl">Abrir en<select onchange="tecCfg.modo=this.value;saveTec()"><option value="app"${tecCfg.modo==='app'?' selected':''}>WhatsApp de escritorio</option><option value="web"${tecCfg.modo==='web'?' selected':''}>WhatsApp Web</option></select></label>
    </div>
    <label class="fl">Saludo (campos: {nombre}, {dia}, {tecnico})<input value="${esc(tecCfg.saludo)}" oninput="tecCfg.saludo=this.value;saveTec()"></label>
    <label class="fl">Despedida (campos: {total}, {nombre})<input value="${esc(tecCfg.despedida)}" oninput="tecCfg.despedida=this.value;saveTec()"></label>
  </div>`;
}

// ===== Utilidades comunes (Mi día, notas, avisos y búsqueda están en dia.js) =====

// Pide al navegador que no borre los datos guardados (notas, rutina…) aunque falte espacio.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{});

function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
let toastTimer=null;
function toast(m){ const e=document.getElementById('toast'); if(!e)return; e.textContent=m; e.style.opacity=1; clearTimeout(toastTimer); toastTimer=setTimeout(()=>e.style.opacity=0, Math.max(1400, m.length*45)); }
function copyText(s){
  const fb=()=>{ const a=document.createElement('textarea'); a.value=s; document.body.appendChild(a); a.select(); try{document.execCommand('copy'); toast('Copiado');}catch(e){toast('No se pudo copiar');} a.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(()=>toast('Copiado'), fb); else fb();
}

function showTab(t){
  for (const [k, v, tab] of [['dia','viewDia','tabDia'], ['sin','viewSin','tabSin'], ['inc','viewInc','tabInc'], ['sem','viewSem','tabSem'], ['man','viewMan','tabSem']]){
    document.getElementById(v).style.display = t===k ? '' : 'none';
    if (k !== 'man') document.getElementById(tab).classList.toggle('active', t===k || (t==='man' && k==='sem'));   // el detalle del día va dentro de Planificación
  }
  if (location.hash !== '#'+t) history.replaceState(null, '', '#'+t);
  if (t==='dia') renderDia(true);
  if (t==='man') renderManana();
  if (t==='sin') renderSin();
  if (t==='sem') renderSemana();
  if (t==='inc' && rows.length){ renderFilters(); render(); }
  window.scrollTo(0, 0);
}

// ===== PWA: instalación, funcionamiento sin conexión y actualizaciones =====
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
  document.getElementById('installBtn').style.display = 'inline-block';
});
document.getElementById('installBtn').addEventListener('click', async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  document.getElementById('installBtn').style.display = 'none';
});
window.addEventListener('appinstalled', () => {
  document.getElementById('installBtn').style.display = 'none';
  toast('App instalada. Búscala en el menú Inicio como "Despacho".');
});

if ('serviceWorker' in navigator && location.protocol !== 'file:'){
  window.addEventListener('load', async () => {
    try{
      const reg = await navigator.serviceWorker.register('sw.js');
      const offerUpdate = (worker) => {
        const bar = document.getElementById('updateBar');
        bar.style.display = 'flex';
        document.getElementById('updateBtn').onclick = () => worker.postMessage('skipWaiting');
      };
      // Actualización silenciosa: si no estás haciendo nada (ningún campo en uso, ni ficha, ventana, buscador,
      // envío a ATGO o cola de rutas abiertos), se aplica sola; si no, se reintenta cada 20 s.
      const libre = () => !ocupado() && document.getElementById('modal').hidden && document.getElementById('drawer').hidden && document.getElementById('palette').hidden
        && document.getElementById('cfgMenu').hidden && !editPend && !loteEnCurso && !rutasCola && !(document.getElementById('undoBar') && !document.getElementById('undoBar').hidden);
      const offerUpdate0 = offerUpdate;
      const offerUpdateSolo = (worker) => {
        offerUpdate0(worker);
        const intentar = () => {
          if (document.getElementById('updateBar').style.display !== 'flex') return;
          if (libre()){ try{ sessionStorage.setItem('despacho_actualizado', '1'); }catch(e){} worker.postMessage('skipWaiting'); }
          else setTimeout(intentar, 20000);
        };
        setTimeout(intentar, 15000);
      };
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdateSolo(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw && nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) offerUpdateSolo(nw);
        });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading){ reloading = true; location.reload(); } });
    }catch(e){ console.warn('Service worker no registrado:', e); }
  });
}

// Al abrir, mostramos la última carga de ATGO mientras llega la nueva.
try{
  const cached = JSON.parse(localStorage.getItem(ATGO_KEY));
  if (cached && Array.isArray(cached.rows) && !rows.length){ applyAtgo(cached, true); recibirPool({ ...cached, desdeCache: true }); }
}catch(e){}

showTab(['#inc','#man','#sin','#sem'].includes(location.hash) ? location.hash.slice(1) : 'dia');
updateDiaBadge();
odIniciar();   // copia automática en OneDrive (herramientas.js)
