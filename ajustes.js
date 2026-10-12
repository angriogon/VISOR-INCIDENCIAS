// ===== Ajustes, perfiles, novedades de versión y comodidades de uso =====
// ⚙ por secciones, perfiles DSP1–DSP5 y COORD, tema y densidad, atajos de teclado, menú contextual,
// asistente de inicio, diagnóstico, resumen matinal, aviso de técnico sin actividad y exportar a Excel.
// Usa utilidades de app.js, dia.js, herramientas.js, edicion.js y panel.js solo en tiempo de llamada.

const APP_VERSION = '1.18.0';   // súbela a la vez que VERSION en sw.js
const NOVEDADES = [
  { v: '1.18.0', f: '2026-10-12', l: ['Filtro por DSP (Todos · DSP1…DSP5) en Planificación, el día y Sin asignar, igual que en Incidencias, cuando el perfil tiene varios DSP (COORD).', 'Sin asignar ordenado por urgencia: primero las que caducan antes y, después, las más antiguas.', 'Actualización silenciosa: las versiones nuevas se instalan solas cuando no estás haciendo nada.'] },
  { v: '1.17.2', f: '2026-10-12', l: ['Corregido: al actualizar, Despacho podía quedarse con archivos de la versión anterior (y avisar de recargar ATGO sin motivo).', 'El aviso de versión dice quién está desactualizado y «Actualizar Despacho» lo arregla en un clic.'] },
  { v: '1.17.1', f: '2026-10-12', l: ['Comodines de Galicia y Guipúzcoa reconocidos (probado con la lista real de ATGO: 37 de 42; los demás son de Canarias o genéricos).', 'Carga medida con ATGO: COORD tarda ~65 s; DSP1, ~20 s.'] },
  { v: '1.17.0', f: '2026-10-12', l: ['COORD: resumen por DSP en Mi día (visitas de hoy, retrasos, sin asignar, caducidades y escalados); al pulsar uno se ven solo sus incidencias.', 'Sin asignar: los comodines de todas las zonas se reconocen por su nombre en ATGO.', 'Al cambiar de perfil sale «Cargando DSPx…» hasta que llegan sus datos.', 'Perfiles: exportar e importar solo los perfiles para pasarlos a otro equipo.', 'Excel, informe semanal e histórico con el nombre y los técnicos del perfil activo.', 'Carga más rápida con perfiles grandes y su duración visible en ⚙ › General.', 'Corregido: un técnico quitado de un perfil ya no vuelve a aparecer al recargar.'] },
  { v: '1.16.2', f: '2026-10-12', l: ['Cada DSP queda con su lista matriz de técnicos por zonas; COORD con todos.', 'Perfiles: «Restablecer» (todos o el perfil abierto) vuelve a la lista matriz. Los perfiles cambiados se marcan como «modificado».'] },
  { v: '1.16.1', f: '2026-10-12', l: ['Zonas de DSP2 (Murcia, Alicante, Valencia/Castellón, Cataluña), DSP3 (Madrid, Ciudad Real), DSP4 (Castilla y León, Aragón, Galicia, Asturias/Cantabria, Norte) y DSP5 (Baleares, Portugal).', 'En esas zonas, Sin asignar ya recomienda técnico y «Mi zona» funciona como en Andalucía.'] },
  { v: '1.16.0', f: '2026-10-12', l: ['Se puede asignar cualquier técnico de cualquier perfil a cualquier incidencia, también en «Todas las zonas» y en el buzón.', 'Técnicos de DSP2, DSP3, DSP4 y DSP5 dados de alta.', 'Nueva ventana de Perfiles: añadir técnicos por código (o varios a la vez), por zonas o copiándolos de otro perfil, y quitarlos con ×.'] },
  { v: '1.15.1', f: '2026-10-11', l: ['Extensión 1.1.0: corregido el bloqueo de Chrome/Edge que impedía sincronizar. Hay que volver a cargarla.', 'Si caduca la sesión de ATGO, la sincronización sigue sola al volver a iniciarla.'] },
  { v: '1.15.0', f: '2026-10-11', l: ['Progreso del día corregido: «en curso» y «terminada» solo cuentan si lo marca el técnico asignado, no el soporte remoto.', 'Tras guardar en ATGO la lista se actualiza enseguida, aunque coincida con una carga.', 'Aviso si la pestaña de ATGO tiene una sincronización antigua y hay que recargarla.', 'Arranque más rápido: el módulo de Excel se carga solo al importar o exportar.', 'Correcciones: Esc en una confirmación cancela, quitar datos refresca todo, notas y copiar ficha en tickets sin asignar.'] },
  { v: '1.14.0', f: '2026-10-11', l: ['Más estable: la actualización de ATGO ya no borra lo que estás escribiendo ni te mueve la página.', 'Errores de ATGO más claros (sesión caducada, sin respuesta) y aviso si un cambio se confirmó tarde.', 'Limpieza automática de lo guardado en el equipo para que nunca se llene.', 'Mismo selector de técnico y misma confirmación al asignar desde cualquier sitio.', 'La lista de técnicos que sincroniza ATGO sale de Despacho.', '«Quitar datos» pasa a ⚙ › Datos (con confirmación).'] },
  { v: '1.13.1', f: '2026-10-11', l: ['Sin asignar: asignar en masivo (marca varias, cada una con su técnico y fecha).', 'ATGO se sincroniza siempre cada 2 minutos.'] },
  { v: '1.13.0', f: '2026-10-11', l: [
    'Perfiles DSP1–DSP5 y COORD: cada uno ve solo sus técnicos (⚙ › Perfiles).',
    'Mapa: al pulsar un técnico salen todas sus incidencias; las del día, numeradas en orden de ruta.',
    'Duración de las visitas leída del hilo; si no se sabe, solo cuenta la hora de inicio.',
    'Sin asignar: vuelve el campo de fecha y aviso 📍 si un técnico ya va a esa sede.',
    'Ceuta y Melilla admiten técnicos de Cádiz y Málaga.',
    'Ficha flotante y más ancha, con pestañas Resumen, Actuar e Historial.',
    'Estado en color y fecha de visita al final de cada incidencia.',
    'Planificación une Semana y Mañana; atajos de teclado (?), menú con clic derecho y deshacer asignación.',
    'Filtros guardados, resumen matinal, enviar todas las rutas, plantillas de WhatsApp y exportar a Excel.'] },
  { v: '1.12.0', f: '2026-10-10', l: ['Mapa con una burbuja por técnico.', 'Semana y Sin asignar más compactos.', 'Mi día más corto.'] },
  { v: '1.11.0', f: '2026-10-07', l: ['Sin asignar y buzón.', 'Vista Semana con arrastrar y soltar.', 'Mi día plegable.'] },
  { v: '1.10.0', f: '2026-10-07', l: ['Planificar en ATGO: técnico y fecha/hora de visita.'] },
  { v: '1.9.0', f: '2026-10-07', l: ['Comentar en el hilo y cambiar el estado desde Despacho.'] },
  { v: '1.8.0', f: '2026-10-05', l: ['Cerradas 15 días, material, caducidad, OneDrive, ruta en Maps, técnico sugerido, correos e informe semanal.'] },
  { v: '1.7.0', f: '2026-10-05', l: ['«Terminada» solo con los estados de cierre; el resto, «En trámite».'] },
  { v: '1.6.0', f: '2026-10-04', l: ['Incidencias por técnico con el progreso de su ruta de hoy.'] },
  { v: '1.5.0', f: '2026-10-04', l: ['Motivo de apertura e hilo en la ficha.'] },
  { v: '1.4.0', f: '2026-10-04', l: ['Mi día, novedades, avisos de Windows y buscador Ctrl+K.'] }
];
const NOV_KEY = 'dispatcher_version_vista_v1', DIAG_KEY = 'dispatcher_diag_v1', BIENV_KEY = 'dispatcher_bienvenida_v1', DATOS_VER_KEY = 'dispatcher_datos_version_v1';

// ---- Novedades de la versión ----
function abrirNovedades() {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-nov"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Despacho ${esc(APP_VERSION)}</div><div class="dw-sub">Novedades de cada versión</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    ${NOVEDADES.map((n, i) => `<details class="nov"${i === 0 ? ' open' : ''}><summary><b>${esc(n.v)}</b><span>${esc(new Date(n.f + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))}</span></summary><ul>${n.l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
    <div class="dw-empty">Atajos de teclado: pulsa <kbd>?</kbd></div></div>`;
  m.hidden = false;
  try { localStorage.setItem(NOV_KEY, APP_VERSION); } catch (e) {}
  const d = document.getElementById('novDot'); if (d) d.hidden = true;
}
function marcarNovedades() { let v = null; try { v = localStorage.getItem(NOV_KEY); } catch (e) {} const d = document.getElementById('novDot'); if (d) d.hidden = v === APP_VERSION; }

// ---- Perfiles: ventana para gestionar los técnicos de cada DSP ----
function guardarPerfiles() { try { localStorage.setItem(PERFIL_KEY, JSON.stringify(perfilCfg)); } catch (e) { toast('No se pudo guardar en este equipo'); } }
// Al cambiar de perfil se reinicia la foto de seguimiento: así no salen como «nuevos» ni «salieron» los tickets del otro perfil
function setPerfil(p) {
  if (p === PERFIL) return; perfilCfg.activo = p; guardarPerfiles(); lsSet(SNAP_KEY, { start: 0, items: {} });
  try { sessionStorage.setItem('despacho_perfil_cambiado', p); } catch (e) {}   // muestra «Cargando DSPx…» hasta que lleguen sus datos
  location.reload();
}
// ---- Resumen por DSP (Mi día del coordinador) ----
// Una tarjeta por DSP: visitas de hoy hechas/total, retrasos, sin asignar de sus zonas, caducidades y escalados.
// Al pulsarla se abre Incidencias con solo los técnicos de ese DSP.
function resumenCoordHtml() {
  const ruta = rutaHoy(), sin = sinListas().pend;
  const cards = PERFILES.filter(p => p !== 'COORD' && perfilCfg.tecs[p].length).map(p => {
    const ops = perfilCfg.tecs[p], zonas = ZONAS_BASE.filter(z => dspZona(z) === p).map(z => z.nombre);
    const r = ruta.filter(x => ops.includes(cleanInitials(x.op)));
    const hechas = r.filter(x => x.st === 'd').length, tarde = r.filter(x => x.late).length;
    const mias = rows.filter(x => ops.includes(cleanInitials(x.operario)));
    const cad = mias.filter(x => { const c = caducidad(x); return c && ['venc', 'urg'].includes(cadNivel(c)); }).length;
    const esc1 = mias.filter(x => norm(x.estado) === norm('ESCALADO TIER1')).length;
    const sa = sin.filter(x => zonas.includes(zonaPool(x))).length;
    const pc = r.length ? Math.round(hechas / r.length * 100) : 0;
    const hot = tarde || cad || esc1;
    return `<button class="coord-card${hot ? ' hot' : ''}" onclick="verDsp('${p}')" title="Ver las incidencias de ${p}">
      <div class="cc-h"><b>${p}</b><small>${esc(zonas.join(' · ') || plural(ops.length, 'técnico'))}</small></div>
      <div class="cc-prog"><div class="pbar"><i class="d" style="width:${pc}%"></i></div><span>${r.length ? `${hechas}/${r.length} hoy` : 'sin visitas hoy'}</span></div>
      <div class="cc-kpi"><span${tarde ? ' class="w"' : ''}>${tarde} retraso${tarde === 1 ? '' : 's'}</span><span${sa ? ' class="a"' : ''}>${sa} sin asignar</span><span${cad ? ' class="w"' : ''}>${cad} caducan</span><span${esc1 ? ' class="w"' : ''}>${esc1} escal.</span></div>
    </button>`;
  });
  return cards.length ? `<section class="coord-res"><div class="cc-tit">Resumen por DSP <small>pulsa uno para ver sus incidencias</small></div><div class="coord-grid">${cards.join('')}</div></section>` : '';
}
function verDsp(p) { filtroInc = { est: '', cad: false, q: '', dsp: p }; zonaSel = null; showTab('inc'); }

// ---- Exportar / importar solo los perfiles (para pasárselos a otro dispatcher sin el resto de tus datos) ----
function exportarPerfiles() {
  const data = { app: 'panel-despacho-perfiles', version: 1, fecha: new Date().toISOString(), tecs: perfilCfg.tecs };
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
  if (ok) { perfilCfg.tecs = limpio; guardarPerfiles(); perfilesCambiados = true; toast('Perfiles importados'); }
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
    <div class="pf-pie"><span>Para pasar los perfiles a otro equipo:</span><button class="btn sm ghost" onclick="exportarPerfiles()">Exportar perfiles</button><button class="btn sm ghost" onclick="importarPerfiles()">Importar perfiles</button></div>
    ${perfilesCambiados ? `<div class="pf-aplicar"><span>Has cambiado los técnicos del perfil en uso (${PERFIL}).</span><button class="btn sm pri" onclick="lsSet(SNAP_KEY,{start:0,items:{}});try{sessionStorage.setItem('despacho_perfil_cambiado',PERFIL)}catch(e){};location.reload()">Aplicar cambios (recarga)</button></div>` : ''}`;
  const i = document.getElementById('pfIn'); if (i && perfBusca) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function updatePerfilBtn() { const b = document.getElementById('perfilBtn'); if (b) { b.textContent = PERFIL; b.title = `Perfil ${PERFIL}: ${plural(OPERARIOS.length, 'técnico')}. Pulsa para gestionar los perfiles.`; } }
function menuPerfil(ev) { if (ev) ev.stopPropagation(); abrirPerfiles(PERFIL); }

// ---- Apariencia ----
function aplicarApariencia() {
  const t = tecCfg.tema || 'auto';
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  document.body.classList.toggle('densa', !!tecCfg.densa);
}
function setPref(k, v) { tecCfg[k] = v; saveTec(); aplicarApariencia(); renderCfg(); }

// ---- ⚙ Ajustes por secciones ----
let cfgTab = 'gen';
function toggleCfg(ev) {
  const m = document.getElementById('cfgMenu');
  m.hidden = !m.hidden; if (!m.hidden) renderCfg();
  if (ev) ev.stopPropagation();
}
function renderCfg() {
  const m = document.getElementById('cfgMenu'); if (!m || m.hidden) return;
  const tabs = [['gen', 'General'], ['avi', 'Avisos'], ['perf', 'Perfiles'], ['wa', 'WhatsApp'], ['dat', 'Datos']];
  let h = '';
  if (cfgTab === 'gen') {
    h = `<div class="cfg-h">Conexión</div>
      <div class="cfg-t">${esc(document.getElementById('fileStatus').textContent)}${esc(document.getElementById('atgoStatus').textContent)}</div>
      ${ultimaCarga && ultimaCarga.s != null ? `<div class="cfg-t">Última carga: ${ultimaCarga.ops != null ? plural(ultimaCarga.ops, 'técnico') + ' en ' : ''}${ultimaCarga.s} s${ultimaCarga.s > 90 ? ' · lenta: avisa si pasa a menudo' : ''}</div>` : ''}
      <div class="acts"><button class="btn sm pri" onclick="document.getElementById('atgoBtn').click()">Abrir ATGO</button><button class="btn sm" onclick="document.getElementById('importBtn').click()">Importar Excel</button><button class="btn sm ghost" onclick="abrirAsistente()">Asistente de inicio</button></div>
      <div class="cfg-h">Apariencia</div>
      <div class="cfg-row"><span>Tema</span><span class="seg mini">${[['auto', 'Windows'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([v, l]) => `<button class="segb${(tecCfg.tema || 'auto') === v ? ' on' : ''}" onclick="setPref('tema','${v}')">${l}</button>`).join('')}</span></div>
      <div class="cfg-row"><span>Tamaño</span><span class="seg mini">${[[false, 'Cómodo'], [true, 'Denso']].map(([v, l]) => `<button class="segb${!!tecCfg.densa === v ? ' on' : ''}" onclick="setPref('densa',${v})">${l}</button>`).join('')}</span></div>
      <div class="cfg-h">Resúmenes y avisos del día</div>
      <div class="cfg-row"><label><input type="checkbox" ${tecCfg.resumenOn !== false ? 'checked' : ''} onchange="setPref('resumenOn',this.checked)"> Resumen matinal a las</label><input type="time" value="${esc(tecCfg.resumenHora || '08:00')}" onchange="setPref('resumenHora',this.value)"></div>
      <div class="cfg-row"><label><input type="checkbox" ${tecCfg.inactOn !== false ? 'checked' : ''} onchange="setPref('inactOn',this.checked)"> Avisar si un técnico no ha iniciado nada a las</label><input type="time" value="${esc(tecCfg.inactHora || '11:00')}" onchange="setPref('inactHora',this.value)"></div>
      <div class="cfg-h">Planificar en ATGO (técnico y visita)</div>
      <div class="cfg-t">${tecCfg.fase2 !== 'prueba' ? 'Activo en todos los tickets (validado).' : 'Limitado al ticket de prueba 2026/00/97784.'}</div>
      <div class="acts"><button class="btn sm ghost" onclick="tecCfg.fase2=tecCfg.fase2==='prueba'?'todos':'prueba';saveTec();renderCfg();if(fichaKey)renderFicha()">${tecCfg.fase2 !== 'prueba' ? 'Limitar al ticket de prueba' : 'Activar para todos los tickets'}</button></div>`;
  } else if (cfgTab === 'avi') {
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const ck = (k, l) => `<label><input type="checkbox" ${avisos[k] ? 'checked' : ''} onchange="avisos['${k}']=this.checked;lsSet(AVI_KEY,avisos)"> ${l}</label>`;
    h = `<div class="cfg-h">Avisos de Windows</div>
    ${avisos.on && perm === 'granted'
      ? `<div class="cfg-ck">${ck('miNombre', 'Tickets nuevos o reasignados a mi nombre')}${ck('escalado', 'Escalados a TIER1')}${ck('ruta', 'Cambios en las rutas de mañana')}${ck('material', 'PTE. MOVER MATERIAL y su vuelta a PRESENCIAL')}${ck('sla', 'Caducidad en menos de ' + SLA_AVISO_HORAS + ' h')}${ck('sinAsignar', 'Nuevos sin asignar en mi zona')}${ck('comentarios', 'Comentarios de técnicos en el hilo')}${ck('nuevos', 'Cualquier ticket nuevo')}</div>
         <div class="acts"><button class="btn sm" onclick="notificarPrueba()">Probar</button><button class="btn sm ghost" onclick="avisos.on=false;lsSet(AVI_KEY,avisos);renderCfg()">Desactivar</button></div>`
      : perm === 'denied' ? '<div class="cfg-t">Windows tiene bloqueados los avisos de esta app. Actívalos en el candado de la barra de direcciones → Notificaciones.</div>'
      : `<div class="cfg-t">Te avisa aunque estés en otra ventana. Necesita la pestaña de ATGO abierta.</div><button class="btn sm pri" onclick="activarAvisos()">Activar avisos</button>`}`;
  } else if (cfgTab === 'perf') {
    h = `<div class="cfg-h">Perfiles · ahora ${esc(PERFIL)}</div><div class="acts"><button class="btn sm pri" onclick="abrirPerfiles()">Gestionar perfiles y técnicos</button></div>`;
  } else if (cfgTab === 'wa') {
    h = `<div class="cfg-h">Plantillas de WhatsApp (desde la ficha › Actuar)</div>
      <div class="cfg-t">Campos: {nombre} {num} {sede} {fecha} {hora} {cliente} {direccion}</div>
      ${Object.keys(WA_PLANT_DEF).map(t => `<label class="cfg-ta"><span>${esc(WA_PLANT_LAB[t])}</span><textarea rows="2" onchange="tecCfg.waPlant={...(tecCfg.waPlant||{}),'${t}':this.value.trim()};saveTec()">${esc(waPlant(t))}</textarea></label>`).join('')}
      <div class="acts"><button class="btn sm ghost" onclick="tecCfg.waPlant={};saveTec();renderCfg()">Restaurar textos</button></div>
      <div class="cfg-t">El mensaje de la ruta se cambia en Planificación › día › «Técnicos y mensaje».</div>`;
  } else {
    h = `<div class="cfg-h">Copia automática en OneDrive</div>
      ${odCfgHtml()}
      <div class="cfg-h">Copia de seguridad manual</div>
      <div class="cfg-t">Notas, teléfonos, perfiles, filtros, cerradas, informes y plantillas.</div>
      <div class="acts"><button class="btn sm" onclick="exportBackup()">Exportar</button><button class="btn sm" onclick="document.getElementById('backupInput').click()">Restaurar</button></div>
      <div class="cfg-h">Exportar a Excel</div>
      <div class="acts"><button class="btn sm" onclick="exportarExcel('inc')">Incidencias</button><button class="btn sm" onclick="exportarExcel('sem')">Planificación de la semana</button><button class="btn sm" onclick="abrirInforme()">Informe semanal</button></div>
      <div class="cfg-h">Datos cargados</div>
      <div class="cfg-t">${esc(document.getElementById('fileStatus').textContent)} · ${Math.round(espacioUsado() / 1024)} KB guardados en este equipo (límite ~5 MB; lo antiguo se limpia solo).</div>
      <div class="acts">${rows.length ? '<button class="btn sm ghost" onclick="document.getElementById(\'clearBtn\').click()">Quitar datos cargados</button>' : ''}<button class="btn sm ghost" onclick="liberarEspacio();renderCfg();toast(\'Espacio liberado\')">Liberar espacio ahora</button></div>
      ${(() => { const l = Object.entries(poolOpsDesc).filter(([op]) => !zonaComodin(op)); return l.length ? `<div class="cfg-h">Comodines sin zona</div><div class="cfg-t">Estos «PENDIENTE ASIGNAR» de ATGO no se asocian a ninguna zona por su nombre (sus incidencias usan la provincia del ticket): ${esc(l.map(([op, d]) => op + ' (' + d + ')').join(', '))}. Si alguno debería ser de una zona, dímelo.</div>` : ''; })()}
      <div class="cfg-h">Diagnóstico</div>
      <div class="cfg-t">Versión ${esc(APP_VERSION)} · ${plural(diagLista().length, 'error')} registrado${diagLista().length === 1 ? '' : 's'}.</div>
      <div class="acts"><button class="btn sm" onclick="copiarDiagnostico()">Copiar diagnóstico</button>${diagLista().length ? '<button class="btn sm ghost" onclick="lsSet(DIAG_KEY,[]);renderCfg()">Vaciar</button>' : ''}</div>`;
  }
  m.innerHTML = `<div class="cfg-tabs">${tabs.map(([t, l]) => `<button class="${cfgTab === t ? 'on' : ''}" onclick="event.stopPropagation();${t === 'perf' ? 'abrirPerfiles()' : `cfgTab='${t}';renderCfg()`}">${l}</button>`).join('')}</div><div class="cfg-body">${h}</div>`;
}
document.addEventListener('click', e => { const m = document.getElementById('cfgMenu'); if (m && !m.hidden && !m.contains(e.target) && e.target.id !== 'cfgBtn' && e.target.id !== 'perfilBtn' && document.body.contains(e.target)) m.hidden = true; });

// ---- Diagnóstico: registro local de errores ----
function diagLista() { return lsGet(DIAG_KEY, []) || []; }
function diagLog(msg, src) { const l = diagLista(); l.unshift({ ts: Date.now(), msg: String(msg).slice(0, 300), src: String(src || '').slice(0, 120) }); lsSet(DIAG_KEY, l.slice(0, 40)); }
window.addEventListener('error', e => diagLog(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno));
window.addEventListener('unhandledrejection', e => diagLog('Promesa: ' + (e.reason && e.reason.message || e.reason)));
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
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^dispatcher_/.test(k)) n += k.length + (localStorage.getItem(k) || '').length; } } catch (e) {}
  return n * 2;   // el navegador guarda en UTF-16: 2 bytes por carácter
}
function liberarEspacio() {
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
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
setInterval(() => { try { revisarEspacio(); } catch (e) {} }, 3600000);

// ---- Versionado de los datos guardados (migraciones en orden, una sola vez) ----
const MIGRACIONES = [
  () => {},   // 1: perfiles (se crean solos en app.js con todos los técnicos en DSP1)
  () => saveTec(),   // 2: separa datos de técnicos (teléfonos, GLS) y preferencias en dos claves
];
(function migrar() {
  let v = 0; try { v = Number(localStorage.getItem(DATOS_VER_KEY)) || 0; } catch (e) {}
  for (; v < MIGRACIONES.length; v++) { try { MIGRACIONES[v](); } catch (e) { diagLog('Migración ' + (v + 1) + ': ' + e.message); break; } }
  try { localStorage.setItem(DATOS_VER_KEY, String(v)); } catch (e) {}
})();

// ---- Asistente de primera vez ----
function abrirAsistente(paso) {
  paso = paso || 1;
  const m = document.getElementById('modal');
  const pasos = [
    ['Conecta ATGO', 'Instala la extensión (o arrastra el favorito «⟳ Despacho ATGO» de la pestaña Incidencias) y abre ATGO con tu usuario. Despacho se actualiza solo cada 2 minutos.', `<button class="btn sm pri" onclick="document.getElementById('atgoBtn').click()">Abrir ATGO</button>`],
    ['Activa los avisos', 'Windows te avisará de escalados, sin asignar de tu zona, caducidades y cambios en las rutas, aunque estés en otra ventana.', `<button class="btn sm pri" onclick="activarAvisos()">Activar avisos</button>`],
    ['Copia en OneDrive', 'Elige una carpeta de OneDrive y Despacho guardará ahí tus notas y ajustes cada 10 minutos.', `<button class="btn sm pri" onclick="odElegir()">Elegir carpeta</button>`]
  ];
  const [t, d, b] = pasos[paso - 1];
  m.innerHTML = `<div class="md-box md-asis"><div class="asis-n">Paso ${paso} de ${pasos.length}</div><h2>${esc(t)}</h2><p>${esc(d)}</p><div class="acts">${b}</div>
    <div class="acts" style="justify-content:space-between;margin-top:14px"><button class="btn sm ghost" onclick="finAsistente()">Saltar</button>${paso < pasos.length ? `<button class="btn sm" onclick="abrirAsistente(${paso + 1})">Siguiente →</button>` : '<button class="btn sm pri" onclick="finAsistente()">Empezar</button>'}</div></div>`;
  m.hidden = false;
}
function finAsistente() { try { localStorage.setItem(BIENV_KEY, '1'); } catch (e) {} cerrarModal(); }

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
  if (!ficha && /^[1-4]$/.test(k)) { e.preventDefault(); showTab(['dia', 'sin', 'inc', 'sem'][+k - 1]); kbSel = null; return; }
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

// ---- Resumen matinal y técnico sin actividad (se revisa cada minuto) ----
const DIA_AVISOS_KEY = 'dispatcher_avisos_dia_v1';
function horaPasada(hhmm) { const [h, m] = String(hhmm || '').split(':').map(Number); const d = new Date(); return d.getHours() * 60 + d.getMinutes() >= h * 60 + (m || 0); }
function revisarAvisosDia() {
  if (!rows.length || source !== 'atgo') return;
  const hoy = isoHoy(), hecho = lsGet(DIA_AVISOS_KEY, {});
  if (hecho.dia !== hoy) { hecho.dia = hoy; hecho.resumen = false; hecho.inact = []; }
  const d = new Date(); if (!(d.getDay() % 6)) return;   // fines de semana, nada
  if (tecCfg.resumenOn !== false && !hecho.resumen && horaPasada(tecCfg.resumenHora || '08:00')) {
    hecho.resumen = true;
    const sin = sinListas().mias.length;
    const cad = rows.filter(r => { const c = caducidad(r); return c && ['venc', 'urg'].includes(cadNivel(c)); }).length;
    const ruta = rutaHoy().filter(x => TECNICOS.includes(cleanInitials(x.op)));
    const porTec = {}; ruta.forEach(x => porTec[x.op] = (porTec[x.op] || 0) + 1);
    notificarLista([{ num: '—', op: 'Resumen', a: `${plural(ruta.length, 'visita')} hoy · ${plural(sin, 'sin asignar')} en tu zona · ${plural(cad, 'caducidad')} en 24 h o vencida${cad === 1 ? '' : 's'}` },
      { num: '—', op: 'Rutas', a: Object.entries(porTec).sort((a, b) => opIndex(a[0]) - opIndex(b[0])).map(([o, n]) => o + ' ' + n).join(' · ') || 'Sin visitas enrutadas' }]);
  }
  if (tecCfg.inactOn !== false && horaPasada(tecCfg.inactHora || '11:00')) {
    const ruta = rutaHoy().filter(x => TECNICOS.includes(cleanInitials(x.op)));
    const ops = [...new Set(ruta.map(x => x.op))].filter(op => !hecho.inact.includes(op) && ruta.filter(x => x.op === op).every(x => x.st === 'p'));
    if (ops.length) { hecho.inact.push(...ops); notificarLista(ops.map(op => ({ num: '—', op, a: `${op} no ha iniciado ninguna de sus ${plural(ruta.filter(x => x.op === op).length, 'visita')} de hoy` }))); }
  }
  lsSet(DIA_AVISOS_KEY, hecho);
}
setInterval(() => { try { revisarAvisosDia(); } catch (e) { diagLog('Avisos del día: ' + e.message); } }, 60000);

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
  // Tras una actualización silenciosa (app.js), un aviso discreto con la versión nueva
  try { if (sessionStorage.getItem('despacho_actualizado')) { sessionStorage.removeItem('despacho_actualizado'); setTimeout(() => toast(`Despacho se ha actualizado a la versión ${APP_VERSION} · novedades en ⓘ`), 1200); } } catch (e) {}
  try { revisarEspacio(); } catch (e) {}
  let visto = null; try { visto = localStorage.getItem(BIENV_KEY); } catch (e) {}
  if (!visto && !lsGet(ATGO_KEY, null)) setTimeout(() => { if (document.getElementById('modal').hidden) abrirAsistente(1); }, 800);
  else if (!visto) { try { localStorage.setItem(BIENV_KEY, '1'); } catch (e) {} }
  if (!OPERARIOS.length) toast(`El perfil ${PERFIL} no tiene técnicos: añádelos en ⚙ › Perfiles`);
});
