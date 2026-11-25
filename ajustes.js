// ===== Ajustes, perfiles, novedades de versión y comodidades de uso =====
// por secciones, perfiles DSP1–DSP5 y COORD, tema y densidad, atajos de teclado, menú contextual,
// asistente de inicio, diagnóstico, resumen matinal, aviso de técnico sin actividad y exportar a Excel.
// Usa utilidades de app.js, dia.js, herramientas.js, edicion.js y panel.js solo en tiempo de llamada.

const APP_VERSION = '1.47.0';   // súbela a la vez que VERSION en sw.js
const NOVEDADES = [
  { v: '1.47.0', f: '2026-11-25', l: ['Tablet y equipos sin extensión: ya se puede actuar en ATGO a través del servidor (comentar, cambiar estado, asignar, asignar varias, rellenar el día y nueva incidencia). Igual que en el PC: confirmas, se comprueba campo a campo y nunca se repite solo. La respuesta llega en unos segundos.'] },
  { v: '1.46.0', f: '2026-11-25', l: ['Despacho en la tablet, el móvil o cualquier PC sin la extensión: si pones en ⚙ › Servidor la dirección y la clave, las incidencias, Sin asignar, hilos y estados llegan de tu servidor cada 30 s. Arriba sale «Desde el servidor · hora».', 'Es solo lectura: comentar, cambiar estado y asignar siguen necesitando el PC con ATGO abierto. En el PC con la extensión no cambia nada; si su pestaña de ATGO deja de sincronizar 6 min, entra el servidor de respaldo.'] },
  { v: '1.45.0', f: '2026-11-25', l: ['⚙ Ajustes renovado: ventana propia con las secciones a la izquierda (Conexión, Servidor, Avisos, Apariencia, Equipo, Festivos, WhatsApp y Datos) y cada opción en una fila con su explicación e interruptor. Los recordatorios del día pasan a Avisos; perfiles y técnicos, a Equipo. Se cierra con ✕, Escape o pulsando fuera.', 'Servidor: con el acceso a ATGO ya guardado solo sale «Guardado en el servidor ✓» y un botón Cambiar. No hace falta volver a iniciar sesión.'] },
  { v: '1.44.0', f: '2026-11-25', l: ['Menú lateral: debajo de «ATGO conectado» (la pestaña de este equipo) sale «Servidor» con su propio color: verde al día, ámbar cargando, rojo sin conexión o sin sesión. Pulsándolo se abre ⚙ › Servidor.', '⚙ › Servidor pide también la Instancia de ATGO.'] },
  { v: '1.43.0', f: '2026-11-25', l: ['⚙ › Servidor: estado del motor que mantiene ATGO abierto en tu servidor día y noche (sesión, última carga, historial). Por ahora solo lee: es la base del piloto automático de asignaciones.'] },
];
// Resumen de lo más importante de las versiones anteriores a las 5 últimas (se ve en ⓘ › Anteriores)
const ANTERIORES = [
  'Mi día con novedades, avisos de Windows y buscador Ctrl+K',
  'Ficha con hilo, motivo, material, caducidad, contacto e historial de la sede',
  'Actuar en ATGO: comentar, cambiar estado, asignar técnico y fecha de visita',
  'Sin asignar y buzón, con técnico recomendado y asignación masiva',
  'Planificación de la semana con arrastrar y soltar, y detalle de cada día',
  'Mapa de rutas por técnico',
  'Perfiles DSP1–DSP5 y COORD con su lista matriz de técnicos',
  'Filtro por DSP y resumen por DSP para COORD',
  'Duración de las visitas leída del hilo',
  'WhatsApp con plantillas y envío de todas las rutas',
  'Copia en OneDrive, informe semanal y exportar a Excel',
  'Festivos, «Rellenar el día», «Mis cambios» y aviso de visitas sin cerrar',
  'Nómina de técnicos con altas, zona/DSP y bajas',
  'Colores, tamaños y modo accesible',
  'Incidencias agrupadas por estado, con visita y caducidad junto al Nº',
  'Reincidencias por equipo (mismo equipo en 10 días) y «Forzar reconexión»',
  'Asignación en bloque de 4 en 4 con una sola recarga',
  'Panel de CONTROL para COORD con informes en Excel',
  'Vacaciones y bajas de técnicos fuera de los paneles',
  'Planificación con zonas plegables y días más visibles',
  'Mapa al momento con las direcciones situadas en segundo plano',
  'Extensión para Chrome y Edge que sincroniza ATGO sola',
  'Actualización silenciosa y sincronización cada 2 minutos',
  'Caducidad de Control sin contar FUERA DE MANTENIMIENTO',
  'Control con listas Presencial y Todas',
  'Filtro por proyecto en Control',
  'Proyecto en la ficha y orden por columnas en Control',
  'Extensión: guardián de la pestaña de ATGO e inicio de sesión automático',
  'Conflictos sede-técnicos en Mi día',
  'Revisión de la mañana',
  'Qué hacer ahora, Propuesta del día y Mañana listo',
  'Nueva incidencia: alta de tickets en ATGO',
  'Sincronización con ATGO firmada que se actualiza sola',
  'Nueva incidencia: Sede y Proyecto solo con lo del cliente',
  'Botones fijos arriba, informes de Control y primera visita resuelta',
  'Horas del hilo de ATGO sin la hora de más',
  'Incidencias: seleccionar varias y reasignarlas de una vez',
  'Mi día con herramientas arriba y lo pendiente debajo',
  'Las rutas ya no piden enviarse por WhatsApp',
  'Diseño nuevo (prueba) con menú lateral y tonos claros',
  'ATGO no deja quitar la fecha de visita: Despacho lo avisa',
  'Comentario y estado en un solo envío y logo nuevo',
  'Caducidades y avisos solo de los estados presenciales',
  'Mi día sin «Hoy en directo»'
];
const NOV_VISIBLES = 5, ANTERIORES_HASTA = '1.42.7';   // al añadir una versión, quita la más antigua de NOVEDADES y resúmela aquí si importa
const NOV_KEY = 'dispatcher_version_vista_v1', BIENV_KEY = 'dispatcher_bienvenida_v1', DATOS_VER_KEY = 'dispatcher_datos_version_v1';

// ---- Novedades de la versión ----
function abrirNovedades() {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-nov"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Despacho ${esc(APP_VERSION)}</div><div class="dw-sub">Novedades de cada versión</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    ${NOVEDADES.slice(0, NOV_VISIBLES).map((n, i) => `<details class="nov"${i === 0 ? ' open' : ''}><summary><b>${esc(n.v)}</b><span>${esc(new Date(n.f + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))}</span></summary><ul>${n.l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
    ${ANTERIORES.length ? `<details class="nov nov-ant"><summary><b>Anteriores</b><span>1.4 – ${esc(ANTERIORES_HASTA)}</span></summary><ul>${ANTERIORES.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
    <div class="dw-empty">Atajos de teclado: pulsa <kbd>?</kbd></div></div>`;
  m.hidden = false;
  lsPonTexto(NOV_KEY, APP_VERSION);
  const d = document.getElementById('novDot'); if (d) d.hidden = true;
}
function marcarNovedades() { const v = lsTexto(NOV_KEY), d = document.getElementById('novDot'); if (d) d.hidden = v === APP_VERSION; }

// ---- Perfiles: ventana para gestionar los técnicos de cada DSP ----
function guardarPerfiles() { lsSet(PERFIL_KEY, perfilCfg); }
// Al cambiar de perfil se reinicia la foto de seguimiento: así no salen como «nuevos» ni «salieron» los tickets del otro perfil
function setPerfil(p) {
  if (p === PERFIL) return; perfilCfg.activo = p; if (perfilCfg.usuario) perfilCfg.porUsuario = { ...(perfilCfg.porUsuario || {}), [perfilCfg.usuario]: p }; guardarPerfiles(); lsSet(SNAP_KEY, { start: 0, items: {} });
  ssPon('despacho_perfil_cambiado', p);   // muestra «Cargando DSPx…» hasta que lleguen sus datos
  location.reload();
}

// ---- Exportar / importar solo los perfiles (para pasárselos a otro dispatcher sin el resto de tus datos) ----
function exportarPerfiles() {
  const data = { app: 'panel-despacho-perfiles', version: 1, fecha: new Date().toISOString(), tecs: perfilCfg.tecs, nomina: perfilCfg.nomina };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = `despacho-perfiles-${isoHoy()}.json`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Perfiles exportados');
}
function importarPerfiles() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
  i.onchange = () => { const f = i.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { importarPerfilesDatos(JSON.parse(rd.result)); } catch (e) { toast('No es un archivo de perfiles válido'); } }; rd.readAsText(f); };
  i.click();
}
async function importarPerfilesDatos(d) {
  const tecs = d && (d.app === 'panel-despacho-perfiles' ? d.tecs : d.app === 'panel-despacho' && d.perfiles ? d.perfiles.tecs : null);
  if (!tecs || typeof tecs !== 'object') { toast('No es un archivo de perfiles de Despacho'); return; }
  const limpio = Object.fromEntries(PERFILES.map(p => [p, [...new Set((Array.isArray(tecs[p]) ? tecs[p] : []).map(x => cleanInitials(x)).filter(x => /^[A-Z0-9]{2,12}$/.test(x)))]]));
  const ok = await confirmar(`<b>Importar perfiles</b><p>${PERFILES.map(p => `${p}: ${limpio[p].length}`).join(' · ')}</p><p class="hint">Sustituye los técnicos de todos los perfiles de este equipo. El perfil en uso no cambia.</p>`, 'Importar');
  if (ok) { perfilCfg.tecs = limpio; const nm = d.app === 'panel-despacho-perfiles' ? d.nomina : d.perfiles && d.perfiles.nomina; if (nm && typeof nm === 'object') { Object.keys(perfilCfg.nomina).forEach(k => delete perfilCfg.nomina[k]); Object.assign(perfilCfg.nomina, nm); } guardarPerfiles(); perfilesCambiados = true; toast('Perfiles importados'); }
  abrirPerfiles(perfSel || PERFIL);
}
let perfilesCambiados = false, perfSel = null, perfBusca = '';
function perfCambio(p) { guardarPerfiles(); if (p === PERFIL) perfilesCambiados = true; renderPerfiles(); }
// Nombre del técnico si aparece en alguna incidencia cargada ("APELLIDOS, NOMBRE" → "Nombre Apellidos")
function zonaBaseDe(op) { const z = ZONAS_BASE.find(x => x.ops.includes(op)); return z && !z.dispatcher ? z.nombre : ''; }
function nombresTecnicos() {
  const m = {}; [...rows, ...poolRows].forEach(r => { const op = cleanInitials(r.operario); if (!m[op] && r.desOperario && !/^XXX/.test(op)) m[op] = nombreTecnico(r); });
  return m;
}
// Añade uno o varios códigos (separados por comas, espacios o saltos de línea), conocidos o nuevos
function perfAnadir(p, texto) {
  const l = perfilCfg.tecs[p], nuevos = String(texto || '').toUpperCase().split(/[\s,;]+/).map(s => s.replace(/[^A-Z0-9]/g, '')).filter(s => s.length >= 2 && s.length <= 12 && !/^XXX/.test(s));
  const add = nuevos.filter(op => !l.includes(op)); if (!add.length) { toast(nuevos.length ? 'Ya estaban en ' + p : 'Escribe el código del técnico (p. ej. RUFB)'); return; }
  l.push(...add); perfBusca = ''; perfCambio(p); toast(`${plural(add.length, 'técnico')} añadido${add.length === 1 ? '' : 's'} a ${p}`);
}
function perfQuitar(p, op) { perfilCfg.tecs[p] = perfilCfg.tecs[p].filter(x => x !== op); perfCambio(p); }
function perfZona(p, nombre) { const z = ZONAS_BASE.find(x => x.nombre === nombre); if (z) perfAnadir(p, z.ops.join(' ')); }
function perfCopiar(p, desde) { if (desde && perfilCfg.tecs[desde]) perfAnadir(p, perfilCfg.tecs[desde].join(' ')); }
function perfTodos(p) { perfAnadir(p, TODOS_OPS.join(' ')); }
async function perfVaciar(p) {
  if (!await confirmar(`<b>¿Quitar todos los técnicos de ${esc(p)}?</b><p>El perfil se queda vacío. Los técnicos siguen en los demás perfiles.</p>`, 'Vaciar')) { abrirPerfiles(p); return; }
  perfilCfg.tecs[p] = []; guardarPerfiles(); if (p === PERFIL) perfilesCambiados = true; abrirPerfiles(p);
}
// Lista matriz: la que diste para cada DSP (ZONAS_BASE) y COORD con todos. Restablecer vuelve a ella.
function perfDifiere(p) { return perfilCfg.tecs[p].slice().sort().join() !== perfilesPorDefecto()[p].slice().sort().join(); }
async function perfRestablecer(p) {
  const todos = !p, def = perfilesPorDefecto();
  const ok = await confirmar(`<b>${todos ? 'Restablecer todos los perfiles' : 'Restablecer ' + esc(p)}</b><p>${todos ? 'Cada perfil' : esc(p)} vuelve a la lista matriz: los técnicos de sus zonas${todos || p === 'COORD' ? ' (COORD, con todos)' : ''}. Se pierden los cambios que hayas hecho${todos ? ' en los perfiles' : ''}.</p>`, 'Restablecer');
  if (ok) {
    (todos ? PERFILES : [p]).forEach(x => { perfilCfg.tecs[x] = def[x].slice(); if (x === PERFIL) perfilesCambiados = true; });
    guardarPerfiles(); toast(todos ? 'Perfiles restablecidos' : p + ' restablecido');
  }
  abrirPerfiles(p || perfSel);
}
function abrirPerfiles(p) {
  perfSel = PERFILES.includes(p) ? p : perfSel || PERFIL;
  const cfg = document.getElementById('cfgMenu'); if (cfg) cfg.hidden = true;
  const m = document.getElementById('modal');
  m.innerHTML = '<div class="md-box md-perf" id="perfBox"></div>';
  m.hidden = false;
  renderPerfiles();
}
function renderPerfiles() {
  const box = document.getElementById('perfBox'); if (!box) return;
  const p = perfSel, l = perfilCfg.tecs[p], nom = nombresTecnicos();
  // Agrupados: zonas de Andalucía/Extremadura y, aparte, el resto por el perfil donde se dieron de alta
  const grupos = ZONAS_BASE.map(z => ({ t: z.nombre, ops: z.ops.filter(op => l.includes(op)) })).filter(g => g.ops.length);
  const otros = l.filter(op => !BASE_OPS.includes(op));
  if (otros.length) grupos.push({ t: 'Otros técnicos', ops: otros });
  const enOtros = op => PERFILES.filter(x => x !== p && x !== 'COORD' && perfilCfg.tecs[x].includes(op));   // COORD los tiene a todos: no se indica
  const chip = op => `<span class="pf-tec" title="${esc([nom[op], enOtros(op).length ? 'También en ' + enOtros(op).join(', ') : ''].filter(Boolean).join(' · '))}"><b>${esc(op)}</b>${nom[op] ? `<small>${esc(nom[op])}</small>` : ''}${enOtros(op).length ? `<i>${esc(enOtros(op).join(' '))}</i>` : ''}<button onclick="perfQuitar('${p}','${jsq(op)}')" aria-label="Quitar ${esc(op)}" title="Quitar de ${p}">×</button></span>`;
  const sugeridos = TODOS_OPS.filter(op => !l.includes(op));
  // Zonas que aún no están completas: las de este perfil como botones; las de otros perfiles, en un desplegable
  const zonasQuedan = ZONAS_BASE.filter(z => z.ops.some(op => !l.includes(op)));
  const propias = zonasQuedan.filter(z => (z.dsp || 'DSP1') === p), ajenas = zonasQuedan.filter(z => (z.dsp || 'DSP1') !== p);
  box.innerHTML = `
    <div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Perfiles y técnicos</div><div class="dw-sub">Cada perfil ve solo sus técnicos. Un técnico puede estar en varios. Se puede asignar a cualquiera desde cualquier perfil.</div></div>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    <div class="pf-grid">
      <nav class="pf-lista">${PERFILES.map(x => `<button class="${x === p ? 'on' : ''}" onclick="perfSel='${x}';renderPerfiles()"><b>${x}</b><span>${plural(perfilCfg.tecs[x].length, 'técnico')}${perfDifiere(x) ? ' · <i>modificado</i>' : ''}</span>${x === PERFIL ? '<em>en uso</em>' : ''}</button>`).join('')}
        <button class="pf-rest" onclick="perfRestablecer()" title="Todos los perfiles vuelven a la lista matriz">↺ Restablecer todos por defecto</button></nav>
      <section class="pf-det">
        <div class="pf-cab"><h3>${p} <small>${plural(l.length, 'técnico')} · ${esc([...new Set(l.map(op => zonaBaseDe(op)).filter(Boolean))].join(', ') || 'sin zonas')}</small></h3>
          <span class="acts">${perfDifiere(p) ? `<button class="btn sm ghost" onclick="perfRestablecer('${p}')" title="Vuelve a la lista matriz de ${p}">↺ Restablecer ${p}</button>` : '<span class="pf-uso" style="color:var(--ink-faint)">Lista por defecto</span>'}
          ${p === PERFIL ? '<span class="pf-uso">En uso en este equipo</span>' : `<button class="btn sm" onclick="setPerfil('${p}')">Usar este perfil</button>`}</span></div>
        <div class="pf-add">
          <input id="pfIn" list="pfLista" placeholder="Añadir técnicos: código o varios separados por comas (RUFB, GAS…)" value="${esc(perfBusca)}" oninput="perfBusca=this.value" onkeydown="if(event.key==='Enter')perfAnadir('${p}',this.value)">
          <datalist id="pfLista">${sugeridos.map(op => `<option value="${esc(op)}">${esc(nom[op] || zonaDe(op))}</option>`).join('')}</datalist>
          <button class="btn sm pri" onclick="perfAnadir('${p}',document.getElementById('pfIn').value)">Añadir</button>
        </div>
        <div class="pf-rapido">
          ${propias.length ? `<span>Añadir zona:</span>${propias.map(z => `<button class="chip sm" onclick="perfZona('${p}','${jsq(z.nombre)}')">${esc(z.nombre)}</button>`).join('')}` : ''}
          ${ajenas.length ? `<select onchange="perfZona('${p}',this.value)"><option value="">Añadir zona de otro perfil…</option>${PERFILES.filter(x => x !== 'COORD').map(x => { const zs = ajenas.filter(z => (z.dsp || 'DSP1') === x); return zs.length ? `<optgroup label="${x}">${zs.map(z => `<option value="${esc(z.nombre)}">${esc(z.nombre)} (${z.ops.length})</option>`).join('')}</optgroup>` : ''; }).join('')}</select>` : ''}
          <select onchange="perfCopiar('${p}',this.value)"><option value="">Copiar técnicos de…</option>${PERFILES.filter(x => x !== p && perfilCfg.tecs[x].length).map(x => `<option value="${x}">${x} (${perfilCfg.tecs[x].length})</option>`).join('')}</select>
          ${sugeridos.length ? `<button class="chip sm" onclick="perfTodos('${p}')" title="Añade todos los técnicos de todos los perfiles">Todos</button>` : ''}
          ${l.length ? `<button class="chip sm pf-vaciar" onclick="perfVaciar('${p}')">Vaciar</button>` : ''}
        </div>
        <div class="pf-tecs">${grupos.length ? grupos.map(g => `<div class="pf-g"><div class="pf-gt">${esc(g.t)} <small>${g.ops.length}</small></div><div class="pf-chips">${g.ops.map(chip).join('')}</div></div>`).join('') : '<div class="dempty">Sin técnicos. Añádelos arriba escribiendo su código, por zonas o copiándolos de otro perfil.</div>'}</div>
      </section>
    </div>
    <div class="pf-pie"><button class="btn sm" onclick="abrirNomina()" title="Altas, zona o DSP de cada técnico y bajas">${ico('equipo')} Técnicos (nómina)…</button><span>Para pasar los perfiles a otro equipo:</span><button class="btn sm ghost" onclick="exportarPerfiles()">Exportar perfiles</button><button class="btn sm ghost" onclick="importarPerfiles()">Importar perfiles</button></div>
    ${perfilesCambiados ? `<div class="pf-aplicar"><span>Has cambiado los técnicos del perfil en uso (${PERFIL}).</span><button class="btn sm pri" onclick="lsSet(SNAP_KEY,{start:0,items:{}});ssPon('despacho_perfil_cambiado',PERFIL);location.reload()">Aplicar cambios (recarga)</button></div>` : ''}`;
  const i = document.getElementById('pfIn'); if (i && perfBusca) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function updatePerfilBtn() { const b = document.getElementById('perfilBtn'); if (b) { b.textContent = PERFIL; b.title = `Perfil ${PERFIL}: ${plural(OPERARIOS.length, 'técnico')}. Pulsa para gestionar los perfiles.`; } }
function menuPerfil(ev) { if (ev) ev.stopPropagation(); abrirPerfiles(PERFIL); }

// ---- Nómina de técnicos (Ajustes › Técnicos): altas, zona/DSP de cada uno y bajas, sin tocar el código ----
// Se guarda en perfilCfg.nomina (ver NOMINA en app.js). Las bajas se aplican al momento; las altas y los cambios
// de zona, al recargar (cambian las zonas y los perfiles).
let nomBusca = '', nomFiltro = '';
function nomDato(op) { return perfilCfg.nomina[op] = perfilCfg.nomina[op] || {}; }
function nomTodos() {
  const disp = ZONAS_BASE.filter(z => z.dispatcher).flatMap(z => z.ops);
  return [...new Set([...TODOS_OPS, ...Object.keys(perfilCfg.nomina)])].filter(op => !disp.includes(op) && !/^XXX/.test(op));
}
function nomZona(op) { const z = ZONAS_BASE.find(x => !x.dispatcher && x.ops.includes(op)); return z ? z.nombre : ''; }
function nomDsp(op) { const z = ZONAS_BASE.find(x => !x.dispatcher && x.ops.includes(op)); if (z) return dspZona(z); const n = perfilCfg.nomina[op]; return n && n.dsp || PERFILES.filter(p => p !== 'COORD').find(p => perfilCfg.tecs[p].includes(op)) || ''; }
// Valor del selector: el nombre de la zona o «@DSPx» (sin zona, solo en ese DSP)
function nomOpciones(sel) {
  return PERFILES.filter(p => p !== 'COORD').map(p => `<optgroup label="${p}">${ZONAS_BASE.filter(z => !z.dispatcher && dspZona(z) === p).map(z => `<option value="${esc(z.nombre)}"${sel === z.nombre ? ' selected' : ''}>${esc(z.nombre)}</option>`).join('')}<option value="@${p}"${sel === '@' + p ? ' selected' : ''}>${p} · sin zona</option></optgroup>`).join('');
}
function nomPoner(op, val) {
  const zona = val.startsWith('@') ? '' : val, dsp = zona ? dspZona(ZONAS_BASE.find(z => z.nombre === zona)) : val.slice(1);
  const antes = nomDsp(op);
  moverEnZonas(op, zona);
  const n = nomDato(op); n.z = zona; if (zona) delete n.dsp; else n.dsp = dsp;
  // Cambia de DSP: sale del perfil anterior y entra en el nuevo (COORD los tiene a todos)
  if (antes && antes !== dsp && perfilCfg.tecs[antes]) perfilCfg.tecs[antes] = perfilCfg.tecs[antes].filter(x => x !== op);
  [dsp, 'COORD'].forEach(p => { if (perfilCfg.tecs[p] && !perfilCfg.tecs[p].includes(op)) perfilCfg.tecs[p].push(op); });
  if (!perfilCfg.conocidos.includes(op)) perfilCfg.conocidos.push(op);
  perfilesCambiados = true; guardarPerfiles();
}
function nomCambiarZona(op, val) { nomPoner(op, val); renderNomina(); toast(`${op} → ${val.startsWith('@') ? val.slice(1) + ' (sin zona)' : val}`); }
function nomAlta() {
  const c = document.getElementById('nomCod'), nombre = document.getElementById('nomNom').value.trim(), val = document.getElementById('nomZona').value;
  const op = String(c.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (op.length < 2 || op.length > 12 || /^XXX/.test(op)) { toast('Escribe el código del técnico en ATGO (p. ej. RUFB)'); c.focus(); return; }
  if (nomTodos().includes(op)) { toast(op + ' ya está en la nómina: cambia su zona en la lista'); nomBusca = op; renderNomina(); return; }
  if (!val) { toast('Elige su zona o su DSP'); return; }
  nomPoner(op, val); const n = nomDato(op); n.alta = true; if (nombre) n.n = nombre; guardarPerfiles();
  nomBusca = ''; renderNomina(); toast(`${op} dado de alta. Pulsa «Aplicar cambios» para verlo en las listas.`);
}
async function nomQuitar(op) {
  if (!await confirmar(`<b>¿Quitar a ${esc(op)} de la nómina?</b><p>Sale de todos los perfiles. Si solo no está disponible, mejor márcalo «De baja».</p>`, 'Quitar')) { abrirNomina(); return; }
  delete perfilCfg.nomina[op]; moverEnZonas(op, '');
  PERFILES.forEach(p => { perfilCfg.tecs[p] = perfilCfg.tecs[p].filter(x => x !== op); });
  perfilesCambiados = true; guardarPerfiles(); abrirNomina();
}
function nomBaja(op, si) {
  const n = nomDato(op); if (si) n.baja = true; else delete n.baja;
  if (!Object.keys(n).length) delete perfilCfg.nomina[op];
  guardarPerfiles(); renderNomina(); refreshVisible();
  const abiertas = rows.filter(r => r.operario === op).length;
  toast(si ? `${op} de baja: ya no se propone al asignar${abiertas ? ` · tiene ${plural(abiertas, 'incidencia')} abierta${abiertas === 1 ? '' : 's'}` : ''}` : `${op} activo de nuevo`);
}
// Vacaciones: se añaden con fecha de inicio y fin; los periodos ya pasados se borran solos
function nomHab(op, val) {
  const n = nomDato(op), l = val.split(',').map(x => x.trim()).filter(Boolean);
  if (l.length) n.hab = l; else delete n.hab;
  if (!Object.keys(n).length) delete perfilCfg.nomina[op];
  guardarPerfiles();
}
function nomVacAnadir(op) {
  const d = (document.getElementById('vd-' + op) || {}).value, h = (document.getElementById('vh-' + op) || {}).value, medio = (document.getElementById('vp-' + op) || {}).value || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '') || !/^\d{4}-\d{2}-\d{2}$/.test(h || '')) { toast('Pon la fecha de inicio y la de fin'); return; }
  if (h < d) { toast('La fecha de fin es anterior a la de inicio'); return; }
  const n = nomDato(op); n.vac = [...(n.vac || []).filter(v => v.h >= isoHoy()), { d, h, ...(medio ? { p: medio } : {}) }].sort((a, b) => a.d < b.d ? -1 : 1);
  guardarPerfiles(); renderNomina(); refreshVisible();
  const fecha = x => x.slice(8) + '/' + x.slice(5, 7);
  const vis = rows.filter(r => r.operario === op && esPresencial(r) && (() => { const f = parseEs(r.fVisita); return f && isoHoy(f) >= d && isoHoy(f) <= h; })()).length;
  toast(`${op} ${medio ? 'no está por la ' + (medio === 'm' ? 'mañana' : 'tarde') : 'de vacaciones'} del ${fecha(d)} al ${fecha(h)}${vis ? ` · tiene ${plural(vis, 'visita')} esos días: reasígnalas` : ''}`);
}
function nomVacQuitar(op, d, h) {
  const n = nomDato(op); n.vac = (n.vac || []).filter(v => !(v.d === d && v.h === h)); if (!n.vac.length) delete n.vac;
  if (!Object.keys(n).length) delete perfilCfg.nomina[op];
  guardarPerfiles(); renderNomina(); refreshVisible();
}
function abrirNomina() {
  const cfg = document.getElementById('cfgMenu'); if (cfg) cfg.hidden = true;
  const m = document.getElementById('modal');
  m.innerHTML = '<div class="md-box md-perf" id="nomBox"></div>'; m.hidden = false;
  renderNomina();
}
function renderNomina() {
  const box = document.getElementById('nomBox'); if (!box) return;
  const nom = nombresTecnicos(), q = nomBusca.trim().toUpperCase();
  const atgoBaja = {}; rows.forEach(r => { if (/\bBAJA\b/i.test(r.desOperario || '')) atgoBaja[r.operario] = 1; });   // ATGO pone «BAJA» en el nombre
  const todos = nomTodos().map(op => ({ op, nombre: nom[op] || (perfilCfg.nomina[op] || {}).n || '', zona: nomZona(op), dsp: nomDsp(op), baja: enBaja(op), vac: ((perfilCfg.nomina[op] || {}).vac || []).filter(v => v.h >= isoHoy()), vacHoy: vacacionesDe(op), abiertas: rows.filter(r => r.operario === op).length, n: perfilCfg.nomina[op] || {} }));
  const l = todos.filter(t => (!q || (t.op + ' ' + t.nombre + ' ' + t.zona).toUpperCase().includes(q)) && (!nomFiltro || (nomFiltro === 'BAJA' ? t.baja || t.vacHoy : t.dsp === nomFiltro)))
    .sort((a, b) => (PERFILES.indexOf(a.dsp) - PERFILES.indexOf(b.dsp)) || a.zona.localeCompare(b.zona) || a.op.localeCompare(b.op));
  const bajas = todos.filter(t => t.baja || t.vacHoy).length;
  const fila = t => `<tr class="${t.baja ? 'nm-baja' : t.vacHoy ? 'nm-vac-hoy' : ''}">
      <td><b class="mono">${esc(t.op)}</b>${t.n.alta ? ' <span class="nm-tag" title="Dado de alta por ti">alta</span>' : ''}${t.nombre ? `<small>${esc(t.nombre)}</small>` : ''}</td>
      <td><select aria-label="Zona de ${esc(t.op)}" onchange="nomCambiarZona('${jsq(t.op)}',this.value)">${t.zona ? '' : t.dsp ? '' : '<option value="">Sin zona…</option>'}${nomOpciones(t.zona || (t.dsp ? '@' + t.dsp : ''))}</select><input class="nm-hab" aria-label="Habilidades de ${esc(t.op)}" placeholder="Habilidades: BALANZA, TPV… (vacío = todo)" value="${esc((t.n.hab || []).join(', '))}" onchange="nomHab('${jsq(t.op)}',this.value)"></td>
      <td class="nm-perf">${esc(PERFILES.filter(p => perfilCfg.tecs[p].includes(t.op)).join(' · ') || '—')}</td>
      <td>${t.abiertas ? plural(t.abiertas, 'abierta') : '<span class="dim">—</span>'}${!t.baja && atgoBaja[t.op] ? '<br><small class="nm-aviso">ATGO lo marca de baja</small>' : ''}</td>
      <td><button class="nm-est ${t.baja ? 'off' : 'on'}" onclick="nomBaja('${jsq(t.op)}',${!t.baja})" aria-pressed="${t.baja}" title="${t.baja ? 'Volver a activo' : 'Marcar de baja: no se propone al asignar'}">${t.baja ? 'De baja' : t.vacHoy ? 'De vacaciones' : 'Activo'}</button>
        <details class="nm-vac"${t.vac.length ? ' open' : ''}><summary>${ico('ausente')} Vacaciones${t.vac.length ? ' (' + t.vac.length + ')' : ''}</summary>${t.vac.map(v => `<span class="nm-vac-p">${esc(v.d.slice(8) + '/' + v.d.slice(5, 7))}–${esc(v.h.slice(8) + '/' + v.h.slice(5, 7))}${v.p ? (v.p === 'm' ? ' · mañana' : ' · tarde') : ''}<button onclick="nomVacQuitar('${jsq(t.op)}','${v.d}','${v.h}')" aria-label="Quitar vacaciones">×</button></span>`).join('')}<span class="nm-vac-n"><select id="vp-${esc(t.op)}" aria-label="Duración de la ausencia de ${esc(t.op)}"><option value="">Día completo</option><option value="m">Solo mañana</option><option value="t">Solo tarde</option></select><input type="date" id="vd-${esc(t.op)}" aria-label="Inicio de vacaciones de ${esc(t.op)}"><input type="date" id="vh-${esc(t.op)}" aria-label="Fin de vacaciones de ${esc(t.op)}"><button class="btn sm" onclick="nomVacAnadir('${jsq(t.op)}')">Añadir</button></span></details></td>
      <td>${t.n.alta ? `<button class="iconbtn sm" onclick="nomQuitar('${jsq(t.op)}')" aria-label="Quitar ${esc(t.op)} de la nómina" title="Quitar de la nómina">×</button>` : ''}</td></tr>`;
  box.innerHTML = `
    <div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Técnicos (nómina)</div><div class="dw-sub">Da de alta técnicos, cambia su zona o DSP, marca las bajas y pon sus vacaciones. Mientras esté de baja o de vacaciones, el técnico no sale en los paneles ni se propone al asignar; sus incidencias se avisan en Incidencias para reasignarlas.</div></div>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    <fieldset class="nm-alta"><legend>Dar de alta</legend>
      <input id="nomCod" placeholder="Código ATGO (p. ej. RUFB)" aria-label="Código del técnico en ATGO" maxlength="12" onkeydown="if(event.key==='Enter')nomAlta()">
      <input id="nomNom" placeholder="Nombre (opcional)" aria-label="Nombre del técnico" onkeydown="if(event.key==='Enter')nomAlta()">
      <select id="nomZona" aria-label="Zona o DSP del técnico"><option value="">Zona o DSP…</option>${nomOpciones('')}</select>
      <button class="btn sm pri" onclick="nomAlta()">Dar de alta</button></fieldset>
    <div class="nm-filtros">
      <input type="search" placeholder="Buscar código, nombre o zona" aria-label="Buscar técnico" value="${esc(nomBusca)}" oninput="nomBusca=this.value;renderNomina()" id="nomQ">
      <span class="seg mini">${[['', 'Todos'], ...PERFILES.filter(p => p !== 'COORD').map(p => [p, p]), ['BAJA', `No disponibles${bajas ? ' (' + bajas + ')' : ''}`]].map(([v, t]) => `<button class="segb${nomFiltro === v ? ' on' : ''}" onclick="nomFiltro='${v}';renderNomina()" aria-pressed="${nomFiltro === v}">${t}</button>`).join('')}</span>
      <span class="dim">${plural(l.length, 'técnico')}</span></div>
    <div class="nm-tabla"><table><thead><tr><th scope="col">Técnico</th><th scope="col">Zona / DSP</th><th scope="col">Perfiles</th><th scope="col">Incidencias</th><th scope="col">Estado</th><th scope="col"><span class="sr">Quitar</span></th></tr></thead>
      <tbody>${l.map(fila).join('') || '<tr><td colspan="6" class="dempty">Ningún técnico con ese filtro.</td></tr>'}</tbody></table></div>
    <div class="pf-pie"><button class="btn sm ghost" onclick="abrirPerfiles()">Perfiles…</button><span>La zona decide su DSP y sus recomendaciones. Los cambios van en la copia de seguridad y en «Exportar perfiles».</span></div>
    ${perfilesCambiados ? `<div class="pf-aplicar"><span>Has dado de alta o cambiado de zona técnicos.</span><button class="btn sm pri" onclick="lsSet(SNAP_KEY,{start:0,items:{}});location.reload()">Aplicar cambios (recarga)</button></div>` : ''}`;
  const i = document.getElementById('nomQ'); if (i && nomBusca) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}

// ---- Apariencia ----
// Color de acento: naranja (el de siempre), azul ATGO y tres más. Los avisos siguen en naranja.
const ACENTOS = [['', 'Naranja', '#c9862b'], ['atgo', 'Azul ATGO', '#0b8ad6'], ['verde', 'Verde', '#1d8a5a'], ['morado', 'Morado', '#7c5cc4'], ['grafito', 'Grafito', '#4b5563']];
// Tamaño: compacto · normal · amplio (tecCfg.densa = true de versiones anteriores = compacto)
function densidad() { return tecCfg.densidad || (tecCfg.densa ? 'compacta' : 'normal'); }
// Accesibilidad (WCAG 2.2 AA / EN 301 549): cada opción se activa sola o todas con «Modo accesible»
const ACC_OPS = [
  ['contraste', 'Alto contraste', 'Texto más oscuro (o más claro en tema oscuro), bordes y color de acento más marcados.'],
  ['foco', 'Foco muy visible', 'Un recuadro grueso señala dónde estás al moverte con el teclado (Tab).'],
  ['grandes', 'Botones y casillas grandes', 'Más fáciles de pulsar con el ratón o en pantalla táctil.'],
  ['enlaces', 'Subrayar enlaces', 'Los enlaces y los números de ticket se distinguen sin depender del color.'],
  ['mov', 'Sin animaciones', 'Quita transiciones y parpadeos (también si Windows lo pide).'],
  ['lectura', 'Letra de lectura fácil', 'Atkinson Hyperlegible, con más espacio entre letras y líneas. Necesita conexión la primera vez.']
];
const ACC_TEXTO = [100, 115, 130, 150];
function accCfg() { return tecCfg.acc || {}; }
function accActivo() { const a = accCfg(); return ACC_OPS.some(([k]) => a[k]) || (a.texto || 100) > 100; }
function setAcc(k, v) { tecCfg.acc = { ...accCfg(), [k]: v }; saveTec(); aplicarApariencia(); renderCfg(); }
function modoAccesible(on) {
  tecCfg.acc = on ? { texto: 115, contraste: true, foco: true, grandes: true, enlaces: true, mov: true } : {};
  saveTec(); aplicarApariencia(); renderCfg();
  toast(on ? 'Modo accesible activado' : 'Modo accesible desactivado');
}
function cargarLetraLectura() {
  if (document.getElementById('letraLectura')) return;
  const l = document.createElement('link'); l.id = 'letraLectura'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';
  document.head.appendChild(l);
}
function aplicarApariencia() {
  const h = document.documentElement, t = tecCfg.tema || 'auto';
  if (t === 'auto') delete h.dataset.theme; else h.dataset.theme = t;
  if (tecCfg.acento) h.dataset.acento = tecCfg.acento; else delete h.dataset.acento;
  const d = densidad();
  document.body.classList.toggle('densa', d === 'compacta'); document.body.classList.toggle('amplia', d === 'amplia');
  const a = accCfg();
  ACC_OPS.forEach(([k]) => h.classList.toggle('acc-' + k, !!a[k]));
  if (a.lectura) cargarLetraLectura();
  document.body.style.zoom = (a.texto || 100) > 100 ? String(a.texto / 100) : '';
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { const osc = t === 'auto' ? /dark/.test(m.media) : t === 'dark'; m.content = osc ? '#1b2126' : tecCfg.disenoNuevo ? '#ffffff' : '#f7f5f0'; });   // barra de la ventana de la app
  disenoNuevo(!!tecCfg.disenoNuevo);
}
// ---- Diseño nuevo (prueba): menú lateral, tonos claros y Mi día en dos columnas. Todo cuelga de html.dn (styles.css) ----
// Activarlo mueve las pestañas de la cabecera al menú lateral; desactivarlo las devuelve.
const DN_TABS = { tabCtl: 'alerta', tabDia: 'casa', tabSin: 'bandeja', tabInc: 'lista', tabSem: 'calendario' };
function disenoNuevo(on) {
  const h = document.documentElement, tabs = document.querySelector('.tabs');
  h.classList.toggle('dn', on);
  let side = document.getElementById('dnSide');
  if (!on) { if (side) { document.querySelector('header').prepend(tabs); side.remove(); } return; }
  if (!side) {
    side = document.createElement('aside'); side.id = 'dnSide'; side.className = 'dn-side'; side.setAttribute('aria-label', 'Menú');
    side.innerHTML = `<div class="dn-marca"><span class="dn-logo">D</span><b>Despacho</b></div><div class="dn-g">Trabajo</div><div class="dn-tabs"></div><div class="dn-g">Herramientas</div><nav class="dn-herr" id="dnHerr" aria-label="Herramientas del día"></nav><div class="dn-pie" id="dnPie"></div>`;
    document.body.prepend(side);
    side.querySelector('.dn-tabs').appendChild(tabs);
    Object.entries(DN_TABS).forEach(([id, i]) => { const b = document.getElementById(id); if (b && !b.querySelector('.dn-ico')) b.insertAdjacentHTML('afterbegin', `<span class="dn-ico" aria-hidden="true">${ico(i)}</span>`); });
  }
  dnMenu();
}
function dnMenu() {
  const herr = document.getElementById('dnHerr'); if (!herr) return;
  herr.innerHTML = herramientasDia().filter(x => x[2] !== '' && x[2] !== 0 || /Propuesta|Informe/.test(x[1])).map(([i, l, n, aviso, fn, tit]) => `<button class="dn-b${aviso ? ' aviso' : ''}" onclick="${fn}" title="${esc(tit)}"><span class="dn-ico" aria-hidden="true">${ico(i)}</span><span>${esc(l)}</span>${n !== '' && n !== 0 ? `<i>${esc(String(n))}</i>` : ''}</button>`).join('');
  const pie = document.getElementById('dnPie'), ok = source === 'atgo' && rows.length;
  const ru = rows.length ? rutaHoy().filter(x => TECNICOS.includes(cleanInitials(x.op))) : [];
  const hechas = ru.filter(x => x.st === 'd' || x.st === 't').length;
  pie.innerHTML = `<div class="dn-est${ok ? ' ok' : ''}" title="La pestaña de ATGO de este equipo: de ella salen los datos de Despacho"><i></i>${ok ? 'ATGO conectado' : rows.length ? 'Datos de Excel' : 'Sin datos de ATGO'}</div>${srvPildora()}${ru.length ? `<div class="dn-vis"><span>Visitas de hoy</span><b>${hechas} de ${ru.length}</b><span class="dn-bar"><i style="width:${Math.round(hechas * 100 / ru.length)}%"></i></span></div>` : ''}<div class="dn-ver">Despacho ${esc(APP_VERSION)}</div>`;
}
function setPref(k, v) { tecCfg[k] = v; if (k === 'densidad') delete tecCfg.densa; saveTec(); aplicarApariencia(); renderCfg(); }

// ---- Accesibilidad que va siempre: nombres para botones de icono, foco en ventanas y vuelta al cerrarlas ----
// Los botones con solo un icono (✕, ×, ⟳…) toman su nombre del «title»; los campos sin etiqueta, del «placeholder».
function a11yNombres(root) {
  (root || document).querySelectorAll('button:not([aria-label]), a:not([aria-label]), input:not([aria-label]):not([type="hidden"]), select:not([aria-label]), textarea:not([aria-label])').forEach(el => {
    if (el.labels && el.labels.length) return;
    const txt = (el.textContent || '').trim();
    if ((el.tagName === 'BUTTON' || el.tagName === 'A') && txt.length > 2 && /[A-Za-zÁÉÍÓÚáéíóúñÑ]{3}/.test(txt)) return;   // ya tiene texto legible
    const n = el.getAttribute('title') || el.getAttribute('placeholder');
    if (n) el.setAttribute('aria-label', n);
  });
}
let a11yPend = false;
const a11yObs = new MutationObserver(() => { if (a11yPend) return; a11yPend = true; requestAnimationFrame(() => { a11yPend = false; a11yNombres(); }); });
// Ventanas (modal, ficha, buscador, Ajustes): al abrir, el foco entra; Tab no se sale; al cerrar, vuelve a donde estaba
const FOCO_SEL = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function visiblesFoco(c) { return [...c.querySelectorAll(FOCO_SEL)].filter(el => el.offsetParent !== null || el === document.activeElement); }
function vigilarVentana(id) {
  const el = document.getElementById(id); if (!el) return;
  let antes = null;
  new MutationObserver(() => {
    const abierto = !el.hidden;
    if (abierto && !el.__abierto) {
      el.__abierto = true; antes = document.activeElement;
      if (id === 'modal') el.setAttribute('aria-label', (el.querySelector('.dw-num, .md-txt b, h2, h3') || {}).textContent || 'Ventana');
      setTimeout(() => { if (el.hidden || el.contains(document.activeElement)) return; const f = el.querySelector('[autofocus], .cfg-nav button.on') || visiblesFoco(el).find(x => !/iconbtn/.test(x.className)) || visiblesFoco(el)[0]; if (f) f.focus({ preventScroll: true }); }, 30);
    } else if (!abierto && el.__abierto) {
      el.__abierto = false;
      if (antes && document.body.contains(antes) && (!document.activeElement || document.activeElement === document.body || el.contains(document.activeElement))) { enfocar(antes, { preventScroll: true }); }
    }
  }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  el.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const l = visiblesFoco(el); if (!l.length) return;
    const i = l.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); l[l.length - 1].focus(); }
    else if (!e.shiftKey && i === l.length - 1) { e.preventDefault(); l[0].focus(); }
  });
}

// ---- ⚙ Ajustes: ventana con secciones a la izquierda y tarjetas a la derecha ----
let cfgTab = 'gen';
const CFG_SEC = [
  ['gen', 'Conexión', 'enlace', 'ATGO, extensión y otras fuentes de datos'],
  ['srv', 'Servidor', 'servidor', 'El motor que mantiene ATGO abierto en tu servidor'],
  ['avi', 'Avisos', 'campana', 'Avisos de Windows y recordatorios del día'],
  ['apa', 'Apariencia', 'paleta', 'Diseño, tema, tamaño y accesibilidad'],
  ['equ', 'Equipo', 'equipo', 'Perfiles y técnicos'],
  ['fes', 'Festivos', 'calendario', 'Los nacionales ya están; añade los autonómicos y locales'],
  ['wa', 'WhatsApp', 'mensaje', 'Plantillas de los mensajes'],
  ['dat', 'Datos', 'datos', 'Copias de seguridad, exportar y diagnóstico']
];
function toggleCfg(ev) {
  const m = document.getElementById('cfgMenu');
  m.hidden = !m.hidden; if (!m.hidden) renderCfg();
  if (ev) ev.stopPropagation();
}
function cerrarCfg() { const m = document.getElementById('cfgMenu'); if (m) m.hidden = true; }
function cfgIr(t) { cfgTab = t; srvEditar = false; renderCfg(); const c = document.querySelector('#cfgMenu .cfg-main'); if (c) c.scrollTop = 0; }
// Piezas de la ventana: interruptor, fila (título, explicación y control) y tarjeta
const cfgSw = (on, cambio, nombre) => `<input type="checkbox" class="sw" role="switch" ${on ? 'checked' : ''} aria-label="${esc(nombre)}" onchange="${cambio}">`;
const cfgIt = (titulo, desc, ctrl, cls) => `<div class="cfg-it${cls ? ' ' + cls : ''}"><div class="cfg-it-t"><b>${titulo}</b>${desc ? `<small>${desc}</small>` : ''}</div>${ctrl ? `<div class="cfg-ctl">${ctrl}</div>` : ''}</div>`;
const cfgCard = (titulo, cuerpo) => `${titulo ? `<div class="cfg-h">${titulo}</div>` : ''}<div class="cfg-sec">${cuerpo}</div>`;
const cfgPad = h => `<div class="cfg-pad">${h}</div>`;
const cfgHora = (k, v, nombre) => `<input type="time" class="cfg-in" aria-label="${esc(nombre)}" value="${esc(v)}" onchange="setPref('${k}',this.value)">`;
function cfgPunto(t) {
  if (t === 'gen') return source === 'atgo' && rows.length ? 'ok' : 'off';
  if (t === 'srv') return srvCfg().url && srvCfg().clave ? srvEstadoCorto().c : '';
  return '';
}
function renderCfg() {
  const m = document.getElementById('cfgMenu'); if (!m || m.hidden) return;
  if (!CFG_SEC.some(s => s[0] === cfgTab)) cfgTab = 'gen';
  const sec = CFG_SEC.find(s => s[0] === cfgTab);
  let h = '';
  if (cfgTab === 'gen') {
    const ok = source === 'atgo' && rows.length;
    const estado = (document.getElementById('fileStatus').textContent + document.getElementById('atgoStatus').textContent).replace(/^\s*·\s*/, '');
    h = `<div class="cfg-hero${ok ? ' ok' : ''}"><i></i><div><b>${ok ? 'ATGO conectado' : rows.length ? 'Datos de Excel' : 'Sin datos de ATGO'}</b><small>${esc(estado || 'La pestaña de ATGO de este equipo da los datos a Despacho')}</small>
        ${ultimaCarga && ultimaCarga.s != null ? `<small>Última carga: ${ultimaCarga.ops != null ? plural(ultimaCarga.ops, 'técnico') + ' en ' : ''}${ultimaCarga.s} s${ultimaCarga.s > 90 ? ' · lenta: avisa si pasa a menudo' : ''}</small>` : ''}</div></div>
      <div class="acts"><button class="btn pri" onclick="event.stopPropagation();actualizarAhora()" title="Trae ya los datos de ATGO, sin esperar a los 2 minutos ni recargar, y busca una versión nueva de Despacho">⟳ Actualizar ahora</button><button class="btn" onclick="abrirAtgo()">Abrir ATGO</button><button class="btn ghost" onclick="forzarAtgo()" title="Si ATGO se queda pillado: lo recarga desde cero y rehace la conexión">Forzar reconexión</button></div>
      ${cfgCard('Más opciones',
        cfgIt('Extensión para Chrome y Edge', 'Descomprímela, sustituye la carpeta anterior y pulsa ⟳ en chrome://extensions. La sincronización se actualiza sola.', '<a class="btn sm" href="despacho-extension.zip" download>Descargar</a>') +
        cfgIt('Importar Excel', 'Carga incidencias desde un Excel en lugar de ATGO.', '<button class="btn sm" onclick="elegirExcel()">Elegir archivo</button>') +
        cfgIt('Asistente de inicio', 'Repasa la puesta en marcha paso a paso.', '<button class="btn sm" onclick="abrirAsistente()">Abrir</button>'))}`;
  } else if (cfgTab === 'srv') {
    h = srvHtml();
    srvRevisar();
  } else if (cfgTab === 'avi') {
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const ck = (k, l) => cfgIt(l, '', cfgSw(avisos[k], `avisos['${k}']=this.checked;lsSet(AVI_KEY,avisos)`, l));
    const win = avisos.on && perm === 'granted'
      ? cfgIt('Avisos de Windows', 'Te avisa aunque estés en otra ventana. Necesita la pestaña de ATGO abierta.', '<button class="btn sm" onclick="notificarPrueba()">Probar</button>' + cfgSw(true, 'avisos.on=false;lsSet(AVI_KEY,avisos);renderCfg()', 'Avisos de Windows')) +
        ck('miNombre', 'Tickets nuevos o reasignados a mi nombre') + ck('escalado', 'Escalados a TIER1') + ck('ruta', 'Cambios en las rutas de mañana') + ck('material', 'PTE. MOVER MATERIAL y su vuelta a PRESENCIAL') +
        ck('sla', 'Caducidad en menos de ' + SLA_AVISO_HORAS + ' h') + ck('sinAsignar', 'Nuevos sin asignar en mi zona') + ck('comentarios', 'Comentarios de técnicos en el hilo') + ck('nuevos', 'Cualquier ticket nuevo')
      : perm === 'denied' ? cfgIt('Avisos de Windows', 'Windows tiene bloqueados los avisos de esta app. Actívalos en el candado de la barra de direcciones › Notificaciones.', '')
      : cfgIt('Avisos de Windows', 'Te avisa aunque estés en otra ventana. Necesita la pestaña de ATGO abierta.', cfgSw(false, 'this.checked=false;activarAvisos()', 'Avisos de Windows'));
    h = cfgCard('Windows', win) +
      cfgCard('Recordatorios del día',
        cfgIt('Resumen matinal', '', cfgHora('resumenHora', tecCfg.resumenHora || '08:00', 'Hora del resumen matinal') + cfgSw(tecCfg.resumenOn !== false, "setPref('resumenOn',this.checked)", 'Resumen matinal')) +
        cfgIt('Técnico sin actividad', 'Avisa si un técnico no ha iniciado nada a esa hora.', cfgHora('inactHora', tecCfg.inactHora || '11:00', 'Hora del aviso de técnico sin actividad') + cfgSw(tecCfg.inactOn !== false, "setPref('inactOn',this.checked)", 'Técnico sin actividad')) +
        cfgIt('Visitas de hoy sin cerrar', '', cfgHora('cierreHora', horaCierre(), 'Hora del aviso de visitas sin cerrar') + cfgSw(tecCfg.cierreOn !== false, "setPref('cierreOn',this.checked)", 'Visitas de hoy sin cerrar')) +
        cfgIt('Sin asignar olvidadas', 'Marca con ⏰ las de tu zona que llevan más horas sin técnico.', `<input type="number" class="cfg-in num" aria-label="Horas sin técnico para avisar" min="1" max="72" value="${horasOlvido()}" onchange="setPref('olvidoHoras',Math.max(1,Number(this.value)||4))"><span class="cfg-ud">h</span>`) +
        (esCoord() ? cfgIt('Informe de control diario', 'Va a la carpeta de la copia en OneDrive si hay una elegida; si no, se descarga. La segunda hora es opcional.', cfgHora('informeHora', tecCfg.informeHora || '09:00', 'Primera hora del informe') + cfgHora('informeHora2', tecCfg.informeHora2 || '', 'Segunda hora del informe (opcional)') + cfgSw(!!tecCfg.informeOn, "setPref('informeOn',this.checked)", 'Informe de control diario')) : ''));
  } else if (cfgTab === 'apa') {
    const a = accCfg(), on = accActivo(), seg = (k, ops, cur) => `<span class="seg mini" role="group">${ops.map(([v, l]) => `<button class="segb${cur === v ? ' on' : ''}" aria-pressed="${cur === v}" onclick="event.stopPropagation();${k.replace('@', String(v))}">${l}</button>`).join('')}</span>`;
    h = cfgCard('', cfgIt('Diseño nuevo (prueba)', 'Menú lateral, tonos claros, Mi día en dos columnas y líneas de Incidencias sombreadas con el color de su estado.', cfgSw(!!tecCfg.disenoNuevo, "setPref('disenoNuevo',this.checked)", 'Diseño nuevo')) +
        cfgIt('Tema', '', seg("setPref('tema','@')", [['auto', 'Como Windows'], ['light', 'Claro'], ['dark', 'Oscuro']], tecCfg.tema || 'auto')) +
        cfgIt('Color', '', '', 'col') + cfgPad(`<div class="acentos" role="group" aria-label="Color de la aplicación">${ACENTOS.map(([v, l, c]) => `<button class="acento-b${(tecCfg.acento || '') === v ? ' on' : ''}" aria-pressed="${(tecCfg.acento || '') === v}" onclick="event.stopPropagation();setPref('acento','${v}')"><i style="background:${c}"></i>${l}</button>`).join('')}</div>`)) +
      cfgCard('Tamaño', cfgIt('Densidad', 'Espacio entre filas y letra.', seg("setPref('densidad','@')", [['compacta', 'Compacto'], ['normal', 'Normal'], ['amplia', 'Amplio']], densidad())) +
        cfgIt('Zoom', 'De toda la aplicación.', seg("setAcc('texto',@)", ACC_TEXTO.map(n => [n, n + ' %']), a.texto || 100))) +
      cfgCard('Accesibilidad', cfgIt('Modo accesible', on ? 'Activado. Ajusta abajo cada opción.' : 'Letra más grande, alto contraste, foco visible, botones grandes y sin animaciones, de una vez.', `<button class="btn sm${on ? '' : ' pri'}" aria-pressed="${on}" onclick="event.stopPropagation();modoAccesible(${!on})">${on ? 'Desactivar' : 'Activar'}</button>`, on ? 'resalta' : '') +
        ACC_OPS.map(([k, l, d]) => cfgIt(l, d, cfgSw(!!a[k], `setAcc('${k}',this.checked)`, l))).join('')) +
      '<p class="cfg-nota">Siempre activo: navegación completa con teclado (pulsa <kbd>?</kbd>), enlace «Saltar al contenido» con Tab, nombres para lectores de pantalla y foco que vuelve a su sitio al cerrar ventanas.</p>';
  } else if (cfgTab === 'equ') {
    h = cfgCard('', cfgIt('Perfil activo: ' + esc(PERFIL), 'Qué técnicos y zonas ves y sincronizas.', '<button class="btn sm pri" onclick="abrirPerfiles()">Gestionar perfiles</button>') +
        cfgIt('Elegir el perfil según mi usuario de ATGO', perfilCfg.usuario ? 'Usuario: ' + esc(perfilCfg.usuario) : '', cfgSw(tecCfg.perfilAuto !== false, "setPref('perfilAuto',this.checked)", 'Elegir el perfil según mi usuario de ATGO')) +
        cfgIt('Técnicos', plural(TECNICOS.length, 'técnico') + ' en tu perfil. Altas, zona, bajas y vacaciones.', '<button class="btn sm" onclick="abrirNomina()">Abrir nómina</button>'));
  } else if (cfgTab === 'fes') {
    const y = new Date().getFullYear(), hoy = isoHoy();
    const prox = [...festivosNacionales(y), ...festivosNacionales(y + 1)].filter(x => x[0] >= hoy).slice(0, 4);
    const loc = (tecCfg.festivos || []).slice().sort((a, b) => a.f < b.f ? -1 : 1);
    h = cfgCard('Añadir', cfgPad(`<p class="cfg-nota">Los de todas las zonas cuentan para el «próximo laborable»; los de una zona marcan sus casillas en Planificación. Próximos nacionales: ${esc(prox.map(x => x[1] + ' ' + x[0].slice(8) + '/' + x[0].slice(5, 7)).join(', '))}.</p>
        <div class="fes-add"><input type="date" id="fesF" aria-label="Fecha"><select id="fesZ" aria-label="Zona"><option value="">Todas las zonas</option>${ZONAS_BASE.filter(z => !z.dispatcher).map(z => `<option>${esc(z.nombre)}</option>`).join('')}</select><input id="fesN" placeholder="Nombre (opcional)"><button class="btn sm pri" onclick="event.stopPropagation();anadirFestivo()">Añadir</button></div>`)) +
      cfgCard('Tus festivos', loc.length ? `<ul class="fes-l">${loc.map(x => `<li${x.f < hoy ? ' class="pasado"' : ''}><span class="mono">${esc(x.f.split('-').reverse().join('/'))}</span><b>${esc(x.n || 'Festivo')}</b><small>${esc(x.z || 'Todas las zonas')}</small><button class="iconbtn sm" onclick="event.stopPropagation();quitarFestivo('${x.f}','${jsq(x.z || '')}')" aria-label="Quitar">×</button></li>`).join('')}</ul>` : cfgPad('<p class="cfg-nota">Aún no has añadido festivos locales.</p>'));
  } else if (cfgTab === 'wa') {
    h = cfgCard('Desde la ficha › Actuar', cfgPad(`<p class="cfg-nota">Campos: {nombre} {num} {sede} {fecha} {hora} {cliente} {direccion}</p>
        ${Object.keys(WA_PLANT_DEF).map(t => `<label class="cfg-ta"><span>${esc(WA_PLANT_LAB[t])}</span><textarea rows="2" onchange="tecCfg.waPlant={...(tecCfg.waPlant||{}),'${t}':this.value.trim()};saveTec()">${esc(waPlant(t))}</textarea></label>`).join('')}
        <label class="cfg-ta"><span>Confirmar visita a la tienda</span><small class="cfg-nota">{tecnico} {fecha} {franja} {sede} {num} {cliente} {direccion}</small><textarea rows="5" onchange="tecCfg.confirmaTpl=this.value.trim();saveTec()">${esc(confirmaPlant())}</textarea></label>
        <div class="acts"><button class="btn sm ghost" onclick="tecCfg.waPlant={};saveTec();renderCfg()">Restaurar textos</button></div>`)) +
      '<p class="cfg-nota">El mensaje de la ruta se cambia en Planificación › día › «Técnicos y mensaje».</p>';
  } else {
    const comodines = Object.entries(poolOpsDesc).filter(([op]) => !zonaComodin(op));
    h = cfgCard('Copias de seguridad', cfgIt('Copia automática en OneDrive', '', '', 'col') + cfgPad(odCfgHtml()) +
        cfgIt('Copia manual', 'Notas, teléfonos, nómina y perfiles, filtros, preferencias, cerradas e informes.', '<button class="btn sm" onclick="exportBackup()">Exportar</button><button class="btn sm" onclick="document.getElementById(\'backupInput\').click()">Restaurar</button>')) +
      cfgCard('Exportar a Excel', cfgIt('Incidencias', '', '<button class="btn sm" onclick="exportarExcel(\'inc\')">Exportar</button>') +
        cfgIt('Planificación de la semana', '', '<button class="btn sm" onclick="exportarExcel(\'sem\')">Exportar</button>') +
        cfgIt('Informe semanal', '', '<button class="btn sm" onclick="abrirInforme()">Abrir</button>')) +
      cfgCard('Este equipo', cfgIt('Datos cargados', `${esc(document.getElementById('fileStatus').textContent)} · ${Math.round(espacioUsado() / 1024)} KB guardados (límite ~5 MB; lo antiguo se limpia solo).`, `${rows.length ? '<button class="btn sm ghost" onclick="quitarDatos()">Quitar datos</button>' : ''}<button class="btn sm ghost" onclick="liberarEspacio();renderCfg();toast(\'Espacio liberado\')">Liberar espacio</button>`) +
        cfgIt('Diagnóstico', `Versión ${esc(APP_VERSION)} · ${diagLista().length} error${diagLista().length === 1 ? ' registrado' : 'es registrados'}.`, `<button class="btn sm" onclick="copiarDiagnostico()">Copiar</button>${diagLista().length ? '<button class="btn sm ghost" onclick="lsSet(DIAG_KEY,[]);renderCfg()">Vaciar</button>' : ''}`)) +
      (comodines.length ? cfgCard('Comodines sin zona', cfgPad(`<p class="cfg-nota">Estos «PENDIENTE ASIGNAR» de ATGO no se asocian a ninguna zona por su nombre (sus incidencias usan la provincia del ticket): ${esc(comodines.map(([op, d]) => op + ' (' + d + ')').join(', '))}. Si alguno debería ser de una zona, dímelo.</p>`)) : '');
  }
  // Repintar sin perder dónde estabas (cada interruptor vuelve a pintar la ventana)
  const prev = m.querySelector('.cfg-main'), scroll = prev ? prev.scrollTop : 0;
  m.innerHTML = `<div class="cfg-win">
    <nav class="cfg-nav" aria-label="Secciones de ajustes"><div class="cfg-nav-t">Ajustes</div>
      ${CFG_SEC.map(([t, l, i]) => { const p = cfgPunto(t); return `<button class="${cfgTab === t ? 'on' : ''}" aria-current="${cfgTab === t ? 'page' : 'false'}" onclick="event.stopPropagation();cfgIr('${t}')"><span class="dn-ico" aria-hidden="true">${ico(i)}</span><span>${l}</span>${p ? `<i class="cfg-p ${p}" aria-hidden="true"></i>` : ''}</button>`; }).join('')}
      <button class="cfg-ver" onclick="event.stopPropagation();cerrarCfg();abrirNovedades()">Despacho ${esc(APP_VERSION)} · Novedades</button></nav>
    <section class="cfg-main"><header class="cfg-head"><div><h2>${sec[1]}</h2><p>${esc(sec[3])}</p></div><button class="iconbtn" onclick="event.stopPropagation();cerrarCfg()" aria-label="Cerrar ajustes">✕</button></header>
      <div class="cfg-body">${h}</div></section></div>`;
  const nuevo = m.querySelector('.cfg-main'); if (nuevo) nuevo.scrollTop = scroll;
}
// La ventana cuelga del body: dentro de la cabecera (que tiene desenfoque de fondo) «fixed» no cubriría la pantalla
document.body.appendChild(document.getElementById('cfgMenu'));
// Fuera de la ventana o Escape: se cierra
document.getElementById('cfgMenu').addEventListener('click', e => { if (e.target.id === 'cfgMenu') cerrarCfg(); });
document.addEventListener('keydown', e => { const m = document.getElementById('cfgMenu'); if (e.key === 'Escape' && m && !m.hidden && document.getElementById('modal').hidden) { cerrarCfg(); document.getElementById('cfgBtn').focus(); } });

// ---- Servidor (⚙ › Servidor): el motor que vive en «automation» (servidor/motor.mjs). Piloto en fase 0: no asigna por su cuenta ----
// Dirección y clave en tecCfg (srvUrl, srvClave). El usuario de ATGO se manda una vez al servidor y no se guarda aquí.
let srvUltimo = null, srvAt = 0, srvPidiendo = false;
const srvCfg = () => ({ url: String(tecCfg.srvUrl || '').trim().replace(/\/+$/, ''), clave: String(tecCfg.srvClave || '').trim() });
async function srvPedir(ruta, cuerpo, espera = 10000) {
  const c = srvCfg();
  if (!c.url || !c.clave) throw new Error('Falta la dirección o la clave');
  let r;
  try {
    r = await fetch(c.url + ruta, { method: cuerpo ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(espera),
      headers: { Authorization: 'Bearer ' + c.clave, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  } catch (e) { throw new Error(e.name === 'TimeoutError' ? 'El servidor no responde' : 'No se llega al servidor (revisa la dirección)'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || 'Error ' + r.status); e.respondio = true; throw e; }
  return d;
}
async function srvRevisar(forzar) {
  if (srvPidiendo || (!forzar && Date.now() - srvAt < 20000)) return;
  if (!srvCfg().url || !srvCfg().clave) { srvUltimo = null; return; }
  srvPidiendo = true;
  try {
    srvUltimo = { ok: true, d: await srvPedir('/estado') };
    // El servidor sincroniza los mismos técnicos que esta PWA (perfil activo)
    if (source === 'atgo' && OPERARIOS.length && OPERARIOS.length <= 200) srvPedir('/config', { operarios: OPERARIOS, permitidos: TODOS_OPS }).catch(() => {});
  } catch (e) { srvUltimo = { ok: false, error: e.message }; }
  finally {
    srvPidiendo = false; srvAt = Date.now();
    const m = document.getElementById('cfgMenu');
    if (m && !m.hidden && cfgTab === 'srv' && !ocupado()) renderCfg();
    if (document.getElementById('dnPie')) dnMenu();
  }
}
// Píldora del menú lateral (diseño nuevo): verde al día, ámbar arrancando o cargando, rojo sin conexión o sin sesión
function srvEstadoCorto() {
  const u = srvUltimo;
  if (!u) return { c: 'load', t: 'Comprobando…', d: '' };
  if (!u.ok) return { c: 'err', t: 'Sin conexión', d: u.error };
  const d = u.d, ca = d.ultimaCarga;
  if (d.sesion === 'sin-credenciales') return { c: 'err', t: 'Sin usuario de ATGO', d: 'Guárdalo en ⚙ › Servidor' };
  if (/fall|pausa/.test(d.sesion)) return { c: 'err', t: 'Sin sesión', d: 'ATGO rechazó el inicio de sesión' };
  if (d.sesion !== 'ok') return { c: 'load', t: 'Iniciando…', d: '' };
  if (!ca) return { c: 'load', t: 'Cargando…', d: d.texto || '' };
  if (Date.now() - ca.at > 10 * 60000) return { c: 'err', t: 'Sin datos nuevos', d: 'Última carga ' + srvHace(ca.at) };
  return { c: 'ok', t: 'Al día', d: 'Última carga ' + srvHace(ca.at) + ' · ' + plural(ca.filas, 'incidencia') + (ca.pool != null ? ' · ' + ca.pool + ' sin asignar' : '') };
}
function srvPildora() {
  if (!srvCfg().url || !srvCfg().clave) return '';
  const e = srvEstadoCorto();
  return `<button class="dn-est dn-srv ${e.c}" onclick="srvAbrir(event)" title="Motor del servidor. ${esc(e.d)} · Abre ⚙ › Servidor"><i></i><span>Servidor · ${esc(e.t)}</span></button>`;
}
function srvAbrir(ev) {
  if (ev) ev.stopPropagation();
  cfgTab = 'srv'; const m = document.getElementById('cfgMenu'); m.hidden = false; renderCfg();
}
function srvHace(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  return m < 1 ? 'ahora' : m < 60 ? 'hace ' + m + ' min' : 'a las ' + hhmm(ts) + (new Date(ts).toDateString() === new Date().toDateString() ? '' : ' del ' + new Date(ts).toLocaleDateString('es-ES'));
}
// ---- Datos desde el servidor: la PWA en la tablet, el móvil o un PC sin la extensión ----
// Si este equipo no tiene una pestaña de ATGO que sincronice (atgoDirectoAt, app.js), las incidencias, hilos y estados
// llegan del motor. SRV_ATGO hace de «ventana de ATGO» para el resto del código, como ATGO_PUENTE.
// Los cambios (comentar, estado, asignar, alta) siguen el mismo camino que en el PC: confirmación aquí, comprobación
// campo a campo en atgo-sync y sin repetir (el servidor rechaza un id ya enviado). Mientras hay uno en curso, la
// respuesta se espera con /mensajes?espera (llega al momento, sin esperar al siguiente sondeo).
const SRV_MSGS = ['despacho-hilo', 'despacho-estado', 'despacho-refresh', 'despacho-ready', 'despacho-config',
  'despacho-editar', 'despacho-editar-lote', 'despacho-alta-lista', 'despacho-alta'];
let srvRapidoHasta = 0;
const SRV_ATGO = {
  get closed() { return !srvViaActiva(); },
  postMessage(msg) {
    if (!msg || !SRV_MSGS.includes(msg.type)) return;
    srvRapidoHasta = Date.now() + (/^despacho-(editar|alta)/.test(msg.type) ? 120000 : 20000);
    srvPedir('/pedir', { msg }, 20000).then(() => srvSondear()).catch(e => {
      diagLog('Servidor › ' + msg.type + ': ' + e.message);
      if (!e.respondio) return;   // sin respuesta del servidor no se sabe si llegó: la PWA avisa de comprobarlo en ATGO
      // El servidor contestó con un error: seguro que no lo ha enviado a ATGO
      const error = 'el servidor no lo ha enviado (' + e.message + '). No se ha cambiado nada';
      const resp = msg.type === 'despacho-editar' ? [{ type: 'atgo-editado', id: msg.id, ok: false, error }]
        : msg.type === 'despacho-editar-lote' ? (msg.items || []).map(i => ({ type: 'atgo-editado', id: i.id, ok: false, error }))
        : msg.type === 'despacho-alta' ? [{ type: 'atgo-alta', id: msg.id, ok: false, error }] : [];
      resp.forEach(r => recibirDeAtgo({ origin: ATGO_ORIGIN, data: r, source: SRV_ATGO }));
    });
  },
  focus() { abrirAtgo(); }
};
// Hay algo esperando respuesta de ATGO: se escucha al servidor sin pausa
const srvEnCurso = () => Date.now() < srvRapidoHasta || !!editPend || lotePend.size > 0 || !!(altaEst && altaEst.enviando);
const srvArranque = Date.now();
// Con la extensión (o si ATGO abrió esta ventana) se dan 90 s a la pestaña de este equipo antes de tirar del servidor
function srvViaActiva() {
  const c = srvCfg(); if (!c.url || !c.clave) return false;
  if (Date.now() - atgoDirectoAt < 6 * 60000) return false;
  return !((puenteAtgo || window.opener) && Date.now() - srvArranque < 90000);
}
let srvN = 0, srvSondeando = false, srvSondeoAt = 0;
async function srvSondear() {
  if (srvSondeando || !srvViaActiva()) return;
  srvSondeando = true; srvSondeoAt = Date.now();
  let seguir = false;
  try {
    const rapido = srvEnCurso() && !document.hidden;
    const d = await srvPedir('/mensajes?desde=' + srvN + (rapido ? '&espera=20' : ''), null, rapido ? 30000 : 10000);
    srvN = Number(d.n) || 0;
    for (const m of d.msgs || []) {
      if (!m || typeof m !== 'object') continue;
      if (!srvViaActiva()) break;   // mientras tanto ha vuelto la pestaña de ATGO de este equipo
      const x = m.type === 'atgo-data' ? { ...m, desdeServidor: true }
        : m.type === 'atgo-status' ? { ...m, text: 'Desde el servidor' + (/^\s*·/.test(m.text || '') ? m.text : ' · ' + (m.text || '')) } : m;
      recibirDeAtgo({ origin: ATGO_ORIGIN, data: x, source: SRV_ATGO });
    }
    seguir = srvEnCurso() && !document.hidden;
  } catch (e) { diagLog('Servidor › datos: ' + e.message); }
  finally { srvSondeando = false; }
  if (seguir) setTimeout(srvSondear, 300);
}
// Cada 30 s con la app a la vista y cada 2 min en segundo plano; al volver a la app, en el momento
setInterval(() => { if (Date.now() - srvSondeoAt > (document.hidden ? 120000 : 30000)) srvSondear(); }, 10000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) srvSondear(); });

let srvEditar = false;   // muestra el formulario de acceso a ATGO aunque ya esté guardado
function srvHtml() {
  const c = srvCfg(), u = srvUltimo, d = u && u.ok ? u.d : null;
  const SES = { ok: 'Sesión de ATGO abierta', 'sin-credenciales': 'Faltan los datos de acceso a ATGO', iniciando: 'Iniciando sesión en ATGO…', arrancando: 'Arrancando…',
    'login-pausa': 'ATGO rechazó el inicio de sesión: lo reintenta más tarde', 'login-fallido': 'ATGO rechaza el usuario: guárdalo de nuevo' };
  const e = c.url && c.clave ? srvEstadoCorto() : { c: 'off', t: 'Sin configurar', d: '' };
  let det = '';
  if (!c.url || !c.clave) det = '<small>Pon abajo la dirección y la clave que te dio la instalación del servidor.</small>';
  else if (u && !u.ok) det = `<small>${esc(u.error)}</small>`;
  else if (d) {
    const ca = d.ultimaCarga, hi = d.historial || {};
    det = `<small>${esc(SES[d.sesion] || d.sesion)}${d.usuario ? ' · ' + esc(d.usuario) : ''} · motor ${esc(d.motor)} · piloto en fase ${d.fase}${d.fase === 0 ? ' (observa)' : ''}</small>
      <small>${ca ? `Última carga ${srvHace(ca.at)}: ${plural(ca.filas, 'incidencia')}${ca.pool != null ? ' · ' + ca.pool + ' sin asignar' : ''} · ${ca.segundos} s${ca.sospechosa ? ' · incompleta' : ''}` : 'Aún sin datos de ATGO'}${/^Cargando/.test(d.texto || '') ? ' · ' + esc(d.texto) : ''}</small>`;
  }
  const hi = d && d.historial || {};
  const resumen = d ? cfgCard('Hoy', cfgIt('Historial', `${hi.desde ? 'Desde el ' + new Date(hi.desde).toLocaleDateString('es-ES') + ' · ' : ''}${plural(hi.cargasHoy || 0, 'carga')} hoy · ${plural(hi.eventosHoy || 0, 'cambio')} · ${hi.asignacionesHoy || 0} reasignaci${hi.asignacionesHoy === 1 ? 'ón' : 'ones'}`, '') +
      cfgIt('Calendario', d.laborable ? 'Hoy es laborable.' : 'Hoy es fin de semana: el piloto no actuará.', '') +
      cfgIt('Técnicos sincronizados', plural(d.tecnicos || 0, 'técnico') + ' de tu perfil · ' + d.memoriaMB + ' MB de memoria', '') +
      (d.errores || []).slice(0, 3).map(x => cfgIt('Aviso ' + srvHace(x.at), esc(x.t), '', 'err')).join('')) : '';
  const guardado = d && d.credenciales && !srvEditar;
  return `<div class="cfg-hero ${e.c}"><i></i><div><b>Servidor · ${esc(e.t)}</b>${det}</div><button class="btn sm" onclick="event.stopPropagation();srvRevisar(true)">⟳ Comprobar</button></div>
    <p class="cfg-nota">ATGO abierto día y noche en tu servidor. Da los datos a Despacho en la tablet o sin extensión y guarda los cambios que confirmes allí. El piloto de momento solo observa; más adelante asignará solo de lunes a viernes. No hace falta volver a iniciar sesión: el servidor la renueva solo.</p>
    ${resumen}
    ${cfgCard('Conexión con el servidor', cfgIt('Dirección', '', `<input id="srvUrl" class="cfg-in largo" type="url" aria-label="Dirección del servidor" placeholder="https://….ts.net:8443" value="${esc(tecCfg.srvUrl || '')}" onchange="setPref('srvUrl',this.value.trim());srvRevisar(true)">`) +
      cfgIt('Clave de acceso', 'Se guarda en este equipo.', `<input id="srvClave" class="cfg-in largo" type="password" aria-label="Clave de acceso" autocomplete="off" value="${esc(tecCfg.srvClave || '')}" onchange="setPref('srvClave',this.value.trim());srvRevisar(true)">`))}
    ${cfgCard('Acceso del servidor a ATGO', guardado
      ? cfgIt('Guardado en el servidor ✓', `${d.usuario ? 'Usuario ' + esc(d.usuario) + '. ' : ''}Solo hace falta cambiarlo si cambias la contraseña de ATGO.`, '<button class="btn sm" onclick="event.stopPropagation();srvEditar=true;renderCfg()">Cambiar</button>')
      : cfgIt('Instancia', '', '<input id="srvI" class="cfg-in largo" type="text" aria-label="Instancia de ATGO" autocomplete="off">') +
        cfgIt('Usuario', '', '<input id="srvU" class="cfg-in largo" type="text" aria-label="Usuario de ATGO" autocomplete="off">') +
        cfgIt('Contraseña', '', '<input id="srvP" class="cfg-in largo" type="password" aria-label="Contraseña de ATGO" autocomplete="new-password">') +
        cfgIt('', 'Se manda cifrado solo a tu servidor y se guarda allí, fuera del repositorio. Aquí no se guarda.', `${srvEditar ? '<button class="btn sm ghost" onclick="event.stopPropagation();srvEditar=false;renderCfg()">Cancelar</button>' : ''}<button class="btn sm pri" onclick="event.stopPropagation();srvCredenciales()">Guardar en el servidor</button>`))}`;
}
async function srvCredenciales() {
  const i = document.getElementById('srvI'), u = document.getElementById('srvU'), p = document.getElementById('srvP');
  if (!i.value.trim() || !u.value.trim() || !p.value) { toast('Escribe la instancia, el usuario y la contraseña de ATGO'); return; }
  try { await srvPedir('/credenciales', { instancia: i.value.trim(), usuario: u.value.trim(), clave: p.value }); i.value = u.value = p.value = ''; srvEditar = false; renderCfg(); toast('Guardado en el servidor: inicia sesión en ATGO en unos segundos'); setTimeout(() => srvRevisar(true), 8000); }
  catch (e) { toast('No se pudo guardar: ' + e.message); }
}
document.addEventListener('click', e => { const m = document.getElementById('cfgMenu'); if (m && !m.hidden && !m.contains(e.target) && e.target.id !== 'cfgBtn' && e.target.id !== 'perfilBtn' && document.body.contains(e.target)) m.hidden = true; });

// ---- Festivos locales (Ajustes › Festivos) ----
function anadirFestivo() {
  const f = document.getElementById('fesF').value, z = document.getElementById('fesZ').value, n = document.getElementById('fesN').value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) { toast('Elige la fecha'); return; }
  const l = (tecCfg.festivos || []).filter(x => !(x.f === f && (x.z || '') === z));
  l.push({ f, z, n }); tecCfg.festivos = l; saveTec(); renderCfg(); refreshVisible();
  toast('Festivo añadido');
}
function quitarFestivo(f, z) { tecCfg.festivos = (tecCfg.festivos || []).filter(x => !(x.f === f && (x.z || '') === z)); saveTec(); renderCfg(); refreshVisible(); }

// ---- Diagnóstico: registro local de errores ----
function copiarDiagnostico() {
  const txt = [`Despacho ${APP_VERSION} · perfil ${PERFIL} · ${new Date().toLocaleString('es-ES')}`, navigator.userAgent,
    `Datos: ${source || 'ninguno'} · ${rows.length} incidencias · ${poolRows.length} sin asignar · última sincronización ${syncUltima ? new Date(syncUltima).toLocaleString('es-ES') : '—'}`,
    `ATGO: ${document.getElementById('atgoStatus').textContent} · capacidades ${atgoCaps.join(',') || '—'}`,
    '', 'Errores recientes:', ...diagLista().map(d => `${new Date(d.ts).toLocaleString('es-ES')} · ${d.msg}${d.src ? ' (' + d.src + ')' : ''}`)].join('\n');
  copyText(txt);
}

// ---- Espacio guardado en el equipo ----
// El navegador deja ~5 MB por web. Si se acerca al límite (o falla un guardado), se borra lo prescindible
// y nunca notas, perfiles, ajustes ni cerradas.
const ESPACIO_LIMITE = 3.5e6;
function espacioUsado() {
  let n = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^dispatcher_/.test(k)) n += k.length + (localStorage.getItem(k) || '').length; } } catch (e) { /* sin acceso: se informa de lo contado */ }
  return n * 2;   // el navegador guarda en UTF-16: 2 bytes por carácter
}
function liberarEspacio() {
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento lleno: se sigue liberando el resto */ } };
  const vivos = new Set([...rows, ...poolRows].map(tkey));
  // 1) Hilos de tickets que ya no están (salvo con nota) y mensajes muy largos recortados
  Object.keys(hilos).forEach(k => { if (!vivos.has(k) && !notas[k]) delete hilos[k]; else hilos[k].items = hilos[k].items.slice(0, 60).map(i => ({ ...i, t: i.t.slice(0, 1500) })); });
  guardar(HILO_KEY, hilos);
  // 2) Direcciones del mapa: las 600 más recientes
  const g = Object.keys(geoCache); if (g.length > 600) { g.slice(0, g.length - 600).forEach(k => delete geoCache[k]); guardar(GEO_KEY, geoCache); }
  // 3) Novedades, historial de ediciones y diagnóstico más cortos
  eventos = eventos.slice(0, 300); guardar(EVT_KEY, eventos);
  ediciones = ediciones.slice(0, 150); guardar(EDIT_KEY, ediciones);
  guardar(DIAG_KEY, diagLista().slice(0, 15));
  diagLog('Espacio liberado: ' + Math.round(espacioUsado() / 1024) + ' KB en uso');
}
function revisarEspacio() { if (espacioUsado() > ESPACIO_LIMITE) liberarEspacio(); }
setInterval(() => { try { revisarEspacio(); } catch (e) { diagLog('Revisión de espacio: ' + e.message); } }, 3600000);

// ---- Versionado de los datos guardados (migraciones en orden, una sola vez) ----
const MIGRACIONES = [
  () => {},   // 1: perfiles (se crean solos en app.js con todos los técnicos en DSP1)
  () => saveTec(),   // 2: separa datos de técnicos (teléfonos, GLS) y preferencias en dos claves
  () => ['dispatcher_plantillas_v2', 'dispatcher_clientes_v1', 'dispatcher_recordatorios_v1', 'dispatcher_rutina_v1', 'dispatcher_tpl_cliente'].forEach(k => { lsQuita(k); }),   // 3: datos de funciones retiradas
  () => lsQuita('dispatcher_alta_sedes_v1'),   // 4: sedes guardadas que podían mezclar clientes
];
(function migrar() {
  let v = Number(lsTexto(DATOS_VER_KEY)) || 0;
  for (; v < MIGRACIONES.length; v++) { try { MIGRACIONES[v](); } catch (e) { diagLog('Migración ' + (v + 1) + ': ' + e.message); break; } }
  lsPonTexto(DATOS_VER_KEY, String(v));
})();

// ---- Asistente de primera vez ----
function abrirAsistente(paso) {
  paso = paso || 1;
  const m = document.getElementById('modal');
  const pasos = [
    ['Conecta ATGO', 'Instala la extensión (o arrastra el favorito «⟳ Despacho ATGO» de la pestaña Incidencias) y abre ATGO con tu usuario. Despacho se actualiza solo cada 2 minutos.', `<button class="btn sm pri" onclick="abrirAtgo()">Abrir ATGO</button>`],
    ['Activa los avisos', 'Windows te avisará de escalados, sin asignar de tu zona, caducidades y cambios en las rutas, aunque estés en otra ventana.', `<button class="btn sm pri" onclick="activarAvisos()">Activar avisos</button>`],
    ['Copia en OneDrive', 'Elige una carpeta de OneDrive y Despacho guardará ahí tus notas y ajustes cada 10 minutos.', `<button class="btn sm pri" onclick="odElegir()">Elegir carpeta</button>`]
  ];
  const [t, d, b] = pasos[paso - 1];
  m.innerHTML = `<div class="md-box md-asis"><div class="asis-n">Paso ${paso} de ${pasos.length}</div><h2>${esc(t)}</h2><p>${esc(d)}</p><div class="acts">${b}</div>
    <div class="acts" style="justify-content:space-between;margin-top:14px"><button class="btn sm ghost" onclick="finAsistente()">Saltar</button>${paso < pasos.length ? `<button class="btn sm" onclick="abrirAsistente(${paso + 1})">Siguiente →</button>` : '<button class="btn sm pri" onclick="finAsistente()">Empezar</button>'}</div></div>`;
  m.hidden = false;
}
function finAsistente() { lsPonTexto(BIENV_KEY, '1'); cerrarModal(); }

// ---- Atajos de teclado ----
const ATAJOS = [['1 – 4', 'Mi día · Sin asignar · Incidencias · Planificación'], ['J / K', 'Bajar / subir por los tickets'], ['Enter', 'Abrir la ficha del ticket marcado'], ['A', 'Asignar o planificar (ficha › Actuar)'], ['C', 'Comentar en el hilo (ficha › Actuar)'], ['Ctrl + K  o  /', 'Buscar ticket o acción (→ para ver acciones)'], ['Clic derecho', 'Menú rápido sobre un ticket'], ['Esc', 'Cerrar'], ['?', 'Esta chuleta']];
function abrirAtajos() {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-nov"><div class="dw-head"><div class="dw-num" style="color:var(--ink)">Atajos de teclado</div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    <table class="atajos">${ATAJOS.map(([k, d]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(d)}</td></tr>`).join('')}</table></div>`;
  m.hidden = false;
}
let kbSel = null;
function kbFilas() { const v = ['viewDia', 'viewSin', 'viewInc', 'viewSem', 'viewMan'].map(id => document.getElementById(id)).find(d => d && d.style.display !== 'none'); return v ? [...v.querySelectorAll('[data-key]')].filter(el => el.offsetParent) : []; }
function kbMover(d) {
  const l = kbFilas(); if (!l.length) return;
  let i = l.indexOf(kbSel); i = i < 0 ? (d > 0 ? 0 : l.length - 1) : Math.max(0, Math.min(l.length - 1, i + d));
  if (kbSel) kbSel.classList.remove('kb-sel');
  kbSel = l[i]; kbSel.classList.add('kb-sel'); kbSel.scrollIntoView({ block: 'nearest' });
}
function fichaActuar(key, foco) {
  if (!key) return;
  openTicket(key, 'act');
  setTimeout(() => { const el = document.getElementById(foco); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); } else if (foco === 'asOp') toast('Planificar en ATGO necesita la pestaña de ATGO conectada'); }, 60);
}
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  if (typing || !document.getElementById('palette').hidden || !document.getElementById('modal').hidden) return;
  const ficha = !document.getElementById('drawer').hidden;
  const k = e.key;
  if (k === '?') { e.preventDefault(); abrirAtajos(); return; }
  if (!ficha && /^[1-4]$/.test(k)) { e.preventDefault(); showTab((esCoord() ? ['ctl', 'inc', 'sem', 'sem'] : ['dia', 'sin', 'inc', 'sem'])[+k - 1]); kbSel = null; return; }
  if (!ficha && (k === 'j' || k === 'J')) { e.preventDefault(); kbMover(1); return; }
  if (!ficha && (k === 'k' || k === 'K')) { e.preventDefault(); kbMover(-1); return; }
  if (!ficha && k === 'Enter' && kbSel && document.body.contains(kbSel)) { e.preventDefault(); openTicket(kbSel.dataset.key); return; }
  const key = ficha ? fichaKey : kbSel && document.body.contains(kbSel) ? kbSel.dataset.key : null;
  if ((k === 'a' || k === 'A') && key) { e.preventDefault(); fichaActuar(key, 'asOp'); return; }
  if ((k === 'c' || k === 'C') && key) { e.preventDefault(); fichaActuar(key, 'edCom'); return; }
});

// ---- Menú contextual (clic derecho sobre un ticket) ----
function accionesTicket(key) {
  const r = ticketDe(key) || {};
  const url = r.url && String(r.url).startsWith(ATGO_ORIGIN + '/') ? r.url : ATGO_URL + key;
  const op = cleanInitials(r.operario);
  return [
    ['Abrir ficha', () => openTicket(key)],
    ['Asignar o planificar…', () => fichaActuar(key, 'asOp')],
    ['Comentar en el hilo…', () => fichaActuar(key, 'edCom')],
    ['Abrir en ATGO', () => window.open(url, 'atgo-ticket')],
    ['Copiar Nº', () => copyText(r.num || key)],
    ...(r.num ? [['Copiar ficha', () => copiarFicha(key)]] : []),
    ...(TECNICOS.includes(op) ? [['WhatsApp a ' + op, () => abrirWa(op, waTexto('ticket', r))]] : [])
  ];
}
function cerrarCtx() { const c = document.getElementById('ctxMenu'); if (c) c.remove(); }
document.addEventListener('contextmenu', e => {
  const el = e.target.closest('main [data-key], #dwPanel [data-key]'); if (!el || e.target.closest('a[href]:not(.num)')) return;
  e.preventDefault(); cerrarCtx();
  const acc = accionesTicket(el.dataset.key);
  const c = document.createElement('div'); c.id = 'ctxMenu'; c.className = 'ctx-menu';
  c.innerHTML = acc.map(([l], i) => `<button data-i="${i}">${esc(l)}</button>`).join('');
  document.body.appendChild(c);
  const w = c.offsetWidth, h = c.offsetHeight;
  c.style.left = Math.min(e.clientX, innerWidth - w - 8) + 'px'; c.style.top = Math.min(e.clientY, innerHeight - h - 8) + 'px';
  c.onclick = ev => { const b = ev.target.closest('button[data-i]'); if (b) { cerrarCtx(); acc[+b.dataset.i][1](); } };
});
document.addEventListener('click', e => { if (!e.target.closest('#ctxMenu')) cerrarCtx(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarCtx(); });
window.addEventListener('scroll', cerrarCtx, true);

// ---- Buscador: acciones sobre el ticket elegido (→) ----
function palAcciones(it) {
  if (!it || it.type !== 't') return false;
  const key = tkey(it.r);
  palItems = accionesTicket(key).map(([t, run]) => ({ type: 'a', a: { t: t + ' · Nº ' + String(it.r.num).slice(-5), run } }));
  palSel = 0;
  document.getElementById('palList').innerHTML = palItems.map((x, i) => `<li class="${i === 0 ? 'on' : ''}" data-i="${i}"><span class="pa">→</span>${esc(x.a.t)}</li>`).join('');
  return true;
}

// ---- Mis cambios en ATGO (todo lo hecho desde Despacho, con su resultado) ----
let misCambiosRango = 'hoy';
function misCambios(rango) {
  const desde = (rango || misCambiosRango) === 'hoy' ? new Date().setHours(0, 0, 0, 0) : Date.now() - 7 * 86400000;
  return ediciones.filter(e => e.ts >= desde);
}
function abrirMisCambios(rango) {
  if (rango) misCambiosRango = rango;
  const l = misCambios(), mal = l.filter(e => !e.ok).length;
  const ACC = { comentario: 'Comentario', estado: 'Estado', asignar: 'Planificación', alta: 'Nueva incidencia' };
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-camb"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Mis cambios en ATGO</div>
      <div class="dw-sub">${l.length ? `${plural(l.length, 'cambio')} · ${l.length - mal} comprobado${l.length - mal === 1 ? '' : 's'}${mal ? ` · <b style="color:#d9614f">${mal} sin aplicar</b>` : ''}` : 'Ninguno'}</div></div>
      <div class="acts"><span class="seg mini">${[['hoy', 'Hoy'], ['7d', '7 días']].map(([v, t]) => `<button class="segb${misCambiosRango === v ? ' on' : ''}" onclick="abrirMisCambios('${v}')">${t}</button>`).join('')}</span>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div></div>
    ${l.length ? `<table class="inf camb"><thead><tr><th>Hora</th><th>Nº</th><th>Cambio</th><th>Resultado</th></tr></thead><tbody>${l.map(e => `<tr class="${e.ok ? '' : 'ko'}">
      <td class="mono">${esc(misCambiosRango === 'hoy' ? hhmm(e.ts) : cuando(e.ts))}</td>
      <td>${e.key ? `<a href="#" onclick="cerrarModal();openTicket('${jsq(e.key)}','his');return false" class="mono">${esc(String(e.num || e.key).slice(-5))}</a>` : '—'}</td>
      <td><b>${esc(ACC[e.accion] || e.accion)}</b> · ${esc(String(e.detalle || '').slice(0, 140))}</td>
      <td>${e.ok ? '<span class="ok">✓ comprobado</span>' : `<span class="mal">✕ ${esc(e.error || 'no aplicado')}</span>`}</td></tr>`).join('')}</tbody></table>`
      : `<div class="dempty">${misCambiosRango === 'hoy' ? 'Hoy no has cambiado nada en ATGO desde Despacho.' : 'Sin cambios en los últimos 7 días.'}</div>`}
  </div>`;
  m.hidden = false;
}

// ---- Visitas de hoy sin cerrar (aviso al final del día) ----
// Visitas enrutadas para hoy que siguen en PRESENCIAL sin "finalizado" del técnico (pendientes o en curso).
function sinCerrarHoy() { return rutaHoy().filter(x => TECNICOS.includes(cleanInitials(x.op)) && !x.salio && (x.st === 'p' || x.st === 'c')); }
function horaCierre() { return tecCfg.cierreHora || '19:00'; }
function abrirSinCerrar() {
  const l = sinCerrarHoy(), porOp = {};
  l.forEach(x => (porOp[x.op] = porOp[x.op] || []).push(x));
  const ops = Object.keys(porOp).sort((a, b) => opIndex(a) - opIndex(b));
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-camb"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Visitas de hoy sin cerrar</div>
      <div class="dw-sub">${l.length ? `${plural(l.length, 'visita')} sigue${l.length === 1 ? '' : 'n'} en PRESENCIAL sin «finalizado» del técnico` : 'Todas las visitas de hoy están cerradas o en trámite.'}</div></div>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    ${ops.map(op => `<div class="sc-tec"><div class="sc-h"><b>${esc(op)}</b><span>${plural(porOp[op].length, 'visita')}</span>
        <button class="btn sm wa" onclick="recordarCierre('${jsq(op)}')" title="Un WhatsApp con todas sus visitas sin cerrar">Recordar a ${esc(op)}</button></div>
      ${porOp[op].map(x => `<div class="sc-it"><span class="mono">${esc(x.r.desdeHora || '--:--')}</span><a href="#" class="mono" onclick="cerrarModal();openTicket('${jsq(tkey(x.r))}');return false">${esc(String(x.r.num).slice(-5))}</a><span>${esc(x.r.descSede || '')}</span><em>${x.st === 'c' ? 'en curso' : 'sin iniciar'}</em></div>`).join('')}</div>`).join('')}
  </div>`;
  m.hidden = false;
}
// Un solo WhatsApp por técnico con todas sus visitas sin cerrar (plantilla "Recordar finalizar" si es una)
function recordarCierre(op) {
  const l = sinCerrarHoy().filter(x => x.op === op); if (!l.length) return;
  const nombre = nombrePila(l[0].r) || op;
  const msg = l.length === 1 ? waTexto('recordatorio', l[0].r)
    : `Hola ${nombre}, recuerda finalizar en ATGO las visitas de hoy:\n${l.map(x => `· Nº ${x.r.num} (${x.r.descSede || ''})`).join('\n')}\n¡Gracias!`;
  abrirWa(op, msg);
}

// ---- Revisión de la mañana: incidencias sin cerrar con fecha de visita de los últimos 7 días ----
// DSP: las asignadas a los técnicos de su perfil. COORD: todas, asignadas o en «pendiente asignar» (sin fecha no salen).
// «Revisada» la oculta solo hoy: si sigue abierta, mañana vuelve a salir.
const REV_KEY = 'dispatcher_revision_v1', REV_DIAS = 7;
let revSel = new Set(), revDsp = '', revVerHechas = false;
function revHechas() { const g = lsGet(REV_KEY, null); return g && g.dia === isoHoy() ? g.keys : []; }
function revisionLista() {
  const hoy = parseEs(todayStr()), lim = new Date(hoy); lim.setDate(lim.getDate() - REV_DIAS);
  const base = esCoord() ? todasAbiertas() : rows.filter(r => TECNICOS.includes(cleanInitials(r.operario)) && !esCierre(r.estado));
  return base.filter(r => { const d = parseEs(r.fVisita); return d && d >= lim && d < hoy; });
}
function revisionPendientes() { const h = revHechas(); return revisionLista().filter(r => !h.includes(tkey(r))); }
// Qué hizo el técnico asignado desde el día de la visita, según el hilo: 'd' finalizó, 'c' inició, 'p' nada; null si no se sabe
function huellaVisita(r) {
  const h = hilos[tkey(r)], d = parseEs(r.fVisita); if (!h || !d) return null;
  const desde = new Date(d); desde.setHours(0, 0, 0, 0);
  const tec = cleanInitials(r.operario); let last = null;
  h.items.forEach(i => {
    if (!i.ts || i.ts < desde.getTime()) return;
    const m = /el usuario (\S+) ha (finalizado|iniciado) el ticket/i.exec(i.t || '');
    if (!m || cleanInitials(m[1]) !== tec) return;
    if (!last || i.ts > last.ts) last = { k: /^fin/i.test(m[2]) ? 'd' : 'c', ts: i.ts };
  });
  return last ? last.k : 'p';
}
function revisionBotonHtml() {
  const n = revisionPendientes().length;
  return `<button class="btn sm${n ? ' warn' : ''}" onclick="abrirRevision()" title="Incidencias sin cerrar con fecha de visita de los últimos ${REV_DIAS} días">Revisión de la mañana · ${n}</button>`;
}
function abrirRevision() {
  const m = document.getElementById('modal');
  m.innerHTML = '<div class="md-box md-rev" id="revBox"></div>'; m.hidden = false;
  renderRevision();
}
function revMarcar(k, si) { if (si) revSel.add(k); else revSel.delete(k); revBarra(); }
function revTodas(si) { document.querySelectorAll('#revBox .rev-ck').forEach(c => { c.checked = si; revMarcar(c.dataset.k, si); }); }
function revBarra() {
  const b = document.getElementById('revBarra'); if (!b) return;
  const n = revSel.size, txt = b.querySelector('span'); if (txt) txt.textContent = n ? plural(n, 'marcada') : 'Marca las que quieras replanificar';
  b.querySelectorAll('.pri, select').forEach(x => { x.disabled = !n; });
}
function revRevisada(k) {
  const l = revHechas(); if (l.includes(k)) lsSet(REV_KEY, { dia: isoHoy(), keys: l.filter(x => x !== k) }); else lsSet(REV_KEY, { dia: isoHoy(), keys: [...l, k] });
  revSel.delete(k); renderRevision(); refreshVisible();
}
async function revReplanificar() {
  const f = document.getElementById('revFecha').value, vivas = new Set(revisionLista().map(tkey)), items = [...revSel].filter(k => vivas.has(k)).map(key => ({ key, fechaVisita: f }));
  if (!items.length) return;
  const res = await asignarLote(items, 'Replanificar las de días anteriores');
  if (res) { res.okKeys.forEach(k => revSel.delete(k)); refreshVisible(); if (res.mal.length) return; }   // si algo falló, se queda a la vista la ventana con el motivo
  abrirRevision();
}
function revWa(k) { const r = ticketDe(k); if (r) abrirWa(cleanInitials(r.operario), waTexto('recordatorio', r)); }
async function revExcel() {
  try { await cargarXLSX(); } catch (e) { toast('No se pudo cargar el módulo de Excel (sin conexión)'); return; }
  const datos = revisionLista().filter(r => !revDsp || dspTicket(r) === revDsp).map(ctlFilaExcel);
  if (!datos.length) { toast('No hay datos que exportar'); return; }
  const ws = XLSX.utils.json_to_sheet(datos), wb = XLSX.utils.book_new(); ctlAnchos(ws, datos);
  XLSX.utils.book_append_sheet(wb, ws, 'Revisión'); XLSX.writeFile(wb, ctlArchivo('revision'));
}
function renderRevision() {
  const box = document.getElementById('revBox'); if (!box) return;
  const coord = esCoord(), todas = revisionLista(), hechas = revHechas();
  const delDsp = todas.filter(r => !revDsp || dspTicket(r) === revDsp);
  const vis = delDsp.filter(r => revVerHechas || !hechas.includes(tkey(r)));
  const nHechas = delDsp.filter(r => hechas.includes(tkey(r))).length;
  const cad = vis.filter(r => { const c = caducidad(r); return c && !sinSla(r) && c.ts < Date.now(); }).length;
  const hoy = parseEs(todayStr()), porDia = new Map();
  vis.forEach(r => { if (!porDia.has(r.fVisita)) porDia.set(r.fVisita, []); porDia.get(r.fVisita).push(r); });
  const dias = [...porDia.keys()].sort((a, b) => parseEs(b) - parseEs(a));
  const huella = { d: 'Finalizada sin cerrar', c: 'Iniciada sin finalizar', p: 'Sin iniciar' };
  const fila = r => {
    const k = tkey(r), op = cleanInitials(r.operario), sin = /^XXX/.test(op), hu = sin ? null : huellaVisita(r), hecha = hechas.includes(k);
    return `<div class="rev-it${hecha ? ' hecha' : ''}" style="--c:${estadoColor(r.estado)}">
      ${sin ? '<span></span>' : `<input type="checkbox" class="rev-ck" data-k="${esc(k)}" ${revSel.has(k) ? 'checked' : ''} onchange="revMarcar('${jsq(k)}',this.checked)" aria-label="Marcar ${esc(r.num)}">`}
      <a href="#" class="mono rev-n" onclick="cerrarModal();openTicket('${jsq(k)}');return false" title="Abrir la ficha">${esc(String(r.num).slice(-5))}</a>
      <b class="${sin ? 'ctl-sin' : ''}">${esc(sin ? 'Sin asignar' : op)}${noDisponible(op) ? ` <span class="baja-tag" title="${esc(ausenciaTexto(op))}">${enBaja(op) ? 'BAJA' : 'VAC.'}</span>` : ''}</b>
      <span class="rev-s" title="${esc([r.descCliente, r.domicilio].filter(Boolean).join(' · '))}">${esc(r.descSede || r.domicilio || '—')}<small>${esc(r.descCliente || '')}</small></span>
      <span class="rev-h${hu === 'p' ? ' mal' : ''}">${huella[hu] || ''}</span>
      <span class="rev-e">${estadoPill(r.estado)}</span>
      <span class="rev-c">${cadBadge(r)}</span>
      <span class="rev-a">${sin ? '<span></span>' : `<button class="btn sm wa" onclick="revWa('${jsq(k)}')" title="Recordar por WhatsApp a ${esc(op)}">WhatsApp</button>`}<button class="btn sm${hecha ? ' ghost' : ''}" onclick="revRevisada('${jsq(k)}')" title="${hecha ? 'Volver a la lista' : 'Ocultar hoy; si sigue abierta, mañana volverá a salir'}">${hecha ? 'Deshacer' : 'Revisada'}</button></span></div>`;
  };
  const prox = nextWorkday();
  box.innerHTML = `<div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Revisión de la mañana</div>
      <div class="dw-sub">${vis.length ? `${plural(vis.length, 'incidencia')} sin cerrar con fecha de los últimos ${REV_DIAS} días${cad ? ` · ${plural(cad, 'caducada')}` : ''}` : `Nada pendiente de los últimos ${REV_DIAS} días.`}${nHechas ? ` · ${plural(nHechas, 'revisada')} hoy` : ''}</div></div>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    ${coord || nHechas ? `<div class="rev-f">${coord ? `<span class="seg mini" role="group" aria-label="DSP">${[['', 'Todos'], ...PERFILES.filter(p => p !== 'COORD').map(p => [p, p])].map(([v, t]) => `<button class="segb${revDsp === v ? ' on' : ''}" aria-pressed="${revDsp === v}" onclick="revDsp='${v}';renderRevision()">${t}</button>`).join('')}</span><button class="btn sm" onclick="revExcel()">↓ Excel</button>` : ''}${nHechas ? `<button class="btn sm ghost" onclick="revVerHechas=!revVerHechas;renderRevision()">${revVerHechas ? 'Ocultar revisadas' : 'Ver revisadas'}</button>` : ''}</div>` : ''}
    ${dias.map(f => { const d = parseEs(f), n = Math.round((hoy - d) / 86400000); return `<section class="rev-d"><h3>${esc(DIAS[d.getDay()])} ${esc(f.slice(0, 5))} <small>${n === 1 ? 'ayer' : 'hace ' + n + ' días'} · ${porDia.get(f).length}</small></h3>${porDia.get(f).slice().sort((a, b) => String(a.operario).localeCompare(String(b.operario)) || horaMin(a.desdeHora) - horaMin(b.desdeHora)).map(fila).join('')}</section>`; }).join('') || '<div class="dempty">Todo al día.</div>'}
    ${vis.some(r => !/^XXX/.test(cleanInitials(r.operario))) ? `<div class="rev-barra" id="revBarra"><label><input type="checkbox" onchange="revTodas(this.checked)"> Marcar todas</label><span></span>
      <select id="revFecha" aria-label="Nueva fecha de visita"><option value="${isoHoy()}">Hoy</option><option value="${isoHoy(prox)}">${esc(diaLargo(prox))}</option></select>
      <button class="btn sm pri" onclick="revReplanificar()">Replanificar marcadas</button></div>` : ''}`;
  revBarra();
}

// ---- Sin asignar olvidadas: de tu zona y con más de X horas sin técnico ----
// (OLVIDO_KEY, olvidada y olvidoBadge están en panel.js: Sin asignar los usa al pintar, incluso al arrancar)
function revisarOlvidadas() {
  if (!poolCargado || avisos.sinAsignar === false) return;
  const av = lsGet(OLVIDO_KEY, {}), vivos = new Set(poolRows.map(tkey));
  Object.keys(av).forEach(k => { if (!vivos.has(k)) delete av[k]; });   // las que ya se asignaron se olvidan
  const nuevas = poolRows.filter(r => olvidada(r) && !av[tkey(r)]);
  if (nuevas.length) {
    nuevas.forEach(r => { av[tkey(r)] = Date.now(); });
    notificarLista(nuevas.map(r => ({ num: r.num, op: zonaPool(r), a: `Sin asignar desde hace ${Math.floor(horasSinAsignar(r))} h · ${r.descSede || ''}` })));
  }
  lsSet(OLVIDO_KEY, av);
}
// Botones de Mi día: mis cambios de hoy y, a partir de la hora de cierre, las visitas sin cerrar

// ---- Resumen matinal y técnico sin actividad (se revisa cada minuto) ----
const DIA_AVISOS_KEY = 'dispatcher_avisos_dia_v1';
function horaPasada(hhmm) { const [h, m] = String(hhmm || '').split(':').map(Number); const d = new Date(); return d.getHours() * 60 + d.getMinutes() >= h * 60 + (m || 0); }
function revisarAvisosDia() {
  if (!rows.length || source !== 'atgo') return;
  const hoy = isoHoy(), hecho = lsGet(DIA_AVISOS_KEY, {});
  if (hecho.dia !== hoy) { hecho.dia = hoy; hecho.resumen = false; hecho.inact = []; }
  const d = new Date(); if (!(d.getDay() % 6) || festivo(d)) return;   // fines de semana y festivos, nada
  revisarInformeAuto();
  if (tecCfg.resumenOn !== false && !hecho.resumen && horaPasada(tecCfg.resumenHora || '08:00')) {
    hecho.resumen = true;
    const sin = sinListas().mias.length;
    const cad = rows.filter(r => { const c = caducidad(r); return c && ['venc', 'urg'].includes(cadNivel(c)); }).length;
    const ruta = rutaHoy().filter(x => TECNICOS.includes(cleanInitials(x.op)));
    const porTec = {}; ruta.forEach(x => porTec[x.op] = (porTec[x.op] || 0) + 1);
    notificarLista([{ num: '—', op: 'Resumen', a: `${plural(ruta.length, 'visita')} hoy · ${plural(sin, 'sin asignar')} en tu zona · ${plural(cad, 'caducidad')} en 24 h o vencida${cad === 1 ? '' : 's'}` },
      { num: '—', op: 'Rutas', a: Object.entries(porTec).sort((a, b) => opIndex(a[0]) - opIndex(b[0])).map(([o, n]) => o + ' ' + n).join(' · ') || 'Sin visitas enrutadas' }]);
  }
  if (tecCfg.cierreOn !== false && !hecho.cierre && horaPasada(horaCierre())) {
    hecho.cierre = true;
    const l = sinCerrarHoy();
    if (l.length) { const ops = [...new Set(l.map(x => x.op))]; notificarLista([{ num: '—', op: 'Cierre del día', a: `${plural(l.length, 'visita')} de hoy sin cerrar · ${ops.join(', ')}. Ábrelo en Mi día › «Sin cerrar hoy».` }]); }
  }
  if (tecCfg.inactOn !== false && horaPasada(tecCfg.inactHora || '11:00')) {
    const ruta = rutaHoy().filter(x => TECNICOS.includes(cleanInitials(x.op)));
    const ops = [...new Set(ruta.map(x => x.op))].filter(op => !hecho.inact.includes(op) && ruta.filter(x => x.op === op).every(x => x.st === 'p'));
    if (ops.length) { hecho.inact.push(...ops); notificarLista(ops.map(op => ({ num: '—', op, a: `${op} no ha iniciado ninguna de sus ${plural(ruta.filter(x => x.op === op).length, 'visita')} de hoy` }))); }
  }
  lsSet(DIA_AVISOS_KEY, hecho);
}
setInterval(() => { try { revisarAvisosDia(); } catch (e) { diagLog('Avisos del día: ' + e.message); } try { revisarOlvidadas(); } catch (e) { diagLog('Olvidadas: ' + e.message); } }, 60000);

// ---- Exportar a Excel ----
async function exportarExcel(que) {
  try { await cargarXLSX(); } catch (e) { toast('No se pudo cargar el módulo de Excel (sin conexión)'); return; }
  let datos, nombre;
  if (que === 'sem') {
    const dias = diasSemana();
    datos = rows.filter(r => esPresencial(r) && dias.some(d => ddmmyyyy(d) === r.fVisita)).sort((a, b) => (parseEs(a.fVisita) - parseEs(b.fVisita)) || opIndex(a.operario) - opIndex(b.operario) || horaMin(a.desdeHora) - horaMin(b.desdeHora))
      .map(r => ({ Fecha: r.fVisita, Desde: r.desdeHora, Hasta: r.hastaHora, Técnico: r.operario, Zona: zonaDe(r.operario), 'Nº': r.num, Sede: r.descSede, Cliente: r.descCliente, Dirección: r.domicilio, Tipo: r.tipo, Duración: estimarMin(r) ? fmtMin(estimarMin(r)) : '' }));
    nombre = 'planificacion';
  } else {
    datos = filteredRows().sort((a, b) => opIndex(a.operario) - opIndex(b.operario)).map(r => {
      const c = caducidad(r);
      return { 'Nº': r.num, Estado: r.estado, Técnico: r.operario, Zona: zonaDe(r.operario), Visita: r.fVisita, Desde: r.desdeHora, Hasta: r.hastaHora, Sede: r.descSede, Cliente: r.descCliente, Dirección: r.domicilio, Tipo: r.tipo, Referencia: r.referencia, Caducidad: c ? new Date(c.ts).toLocaleString('es-ES') : '', Motivo: motivoTexto(tkey(r)).slice(0, 300), Enlace: r.url || ATGO_URL + tkey(r) };
    });
    nombre = 'incidencias';
  }
  if (!datos.length) { toast('No hay datos que exportar'); return; }
  const ws = XLSX.utils.json_to_sheet(datos), wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nombre);
  XLSX.writeFile(wb, `despacho-${PERFIL}-${nombre}-${isoHoy()}.xlsx`);   // con el perfil: para enviarlo al responsable de cada DSP
}

// ---- Arranque (cuando ya están cargados todos los scripts) ----
window.addEventListener('DOMContentLoaded', () => {
  aplicarApariencia(); updatePerfilBtn(); marcarNovedades();
  ['modal', 'drawer', 'palette', 'cfgMenu'].forEach(vigilarVentana);
  a11yNombres(); a11yObs.observe(document.body, { childList: true, subtree: true });
  // Mi día se pintó antes de cargar este archivo (sin «Mis cambios» ni el resumen de COORD): se repinta
  if (document.getElementById('viewDia').style.display !== 'none') renderDia(true);
  if (document.getElementById('viewCtl').style.display !== 'none') renderControl();   // también Control (usa horasOlvido de este archivo)
  // Tras una actualización silenciosa (app.js), un aviso discreto con la versión nueva
  if (ssLee('despacho_actualizado')) { ssQuita('despacho_actualizado'); setTimeout(() => toast(`Despacho se ha actualizado a la versión ${APP_VERSION} · novedades en ⓘ`), 1200); }
  try { revisarEspacio(); } catch (e) { diagLog('Revisión de espacio: ' + e.message); }
  // Estado del servidor para la píldora del menú lateral: al arrancar y cada minuto (si está configurado)
  srvRevisar(true); setInterval(() => srvRevisar(), 60000);
  const visto = lsTexto(BIENV_KEY);
  if (!visto && !lsGet(ATGO_KEY, null)) setTimeout(() => { if (document.getElementById('modal').hidden) abrirAsistente(1); }, 800);
  else if (!visto) lsPonTexto(BIENV_KEY, '1');
  if (!OPERARIOS.length) toast(`El perfil ${PERFIL} no tiene técnicos: añádelos en Ajustes › Perfiles`);
});
