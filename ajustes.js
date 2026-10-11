// ===== Ajustes, perfiles, novedades de versión y comodidades de uso =====
// ⚙ por secciones, perfiles DSP1–DSP5 y COORD, tema y densidad, atajos de teclado, menú contextual,
// asistente de inicio, diagnóstico, resumen matinal, aviso de técnico sin actividad y exportar a Excel.
// Usa utilidades de app.js, dia.js, herramientas.js, edicion.js y panel.js solo en tiempo de llamada.

const APP_VERSION = '1.14.0';   // súbela a la vez que VERSION en sw.js
const NOVEDADES = [
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

// ---- Perfiles ----
function guardarPerfiles() { try { localStorage.setItem(PERFIL_KEY, JSON.stringify(perfilCfg)); } catch (e) { toast('No se pudo guardar en este equipo'); } }
// Al cambiar de perfil se reinicia la foto de seguimiento: así no salen como «nuevos» ni «salieron» los tickets del otro perfil
function setPerfil(p) { if (p === PERFIL) return; perfilCfg.activo = p; guardarPerfiles(); lsSet(SNAP_KEY, { start: 0, items: {} }); location.reload(); }
let perfilesCambiados = false;
function togglePerfilTec(p, op, si) {
  const l = perfilCfg.tecs[p]; const i = l.indexOf(op);
  if (si && i < 0) l.push(op); if (!si && i >= 0) l.splice(i, 1);
  guardarPerfiles(); perfilesCambiados = perfilesCambiados || p === PERFIL; renderCfg();
}
function perfilTodos(p, si) { perfilCfg.tecs[p] = si ? TODOS_OPS.slice() : []; guardarPerfiles(); perfilesCambiados = perfilesCambiados || p === PERFIL; renderCfg(); }
function perfilesHtml() {
  return `<div class="cfg-t">Cada perfil ve solo sus técnicos (incidencias, planificación, sin asignar de sus zonas, avisos…). Un técnico puede estar en varios perfiles.</div>
    <div class="seg mini perf-act">${PERFILES.map(p => `<button class="segb${p === PERFIL ? ' on' : ''}" onclick="setPerfil('${p}')" title="Usar este perfil en este equipo">${p} <small>${perfilCfg.tecs[p].length}</small></button>`).join('')}</div>
    <div class="perf-tab"><table><thead><tr><th></th>${PERFILES.map(p => `<th${p === PERFIL ? ' class="on"' : ''}>${p}</th>`).join('')}</tr></thead><tbody>
    ${ZONAS_BASE.map(z => `<tr class="pz"><td>${esc(z.nombre)}</td>${PERFILES.map(() => '<td></td>').join('')}</tr>` + z.ops.map(op => `<tr><td>${esc(op)}</td>${PERFILES.map(p => `<td><input type="checkbox" ${perfilCfg.tecs[p].includes(op) ? 'checked' : ''} onchange="togglePerfilTec('${p}','${op}',this.checked)" aria-label="${op} en ${p}"></td>`).join('')}</tr>`).join('')).join('')}
    <tr class="pz"><td></td>${PERFILES.map(p => `<td><button class="chip sm" onclick="perfilTodos('${p}',${perfilCfg.tecs[p].length !== TODOS_OPS.length})">${perfilCfg.tecs[p].length === TODOS_OPS.length ? 'Ninguno' : 'Todos'}</button></td>`).join('')}</tr>
    </tbody></table></div>
    ${perfilesCambiados ? '<div class="acts"><button class="btn sm pri" onclick="lsSet(SNAP_KEY,{start:0,items:{}});location.reload()">Aplicar cambios (recarga)</button></div>' : ''}`;
}
function updatePerfilBtn() { const b = document.getElementById('perfilBtn'); if (b) { b.textContent = PERFIL; b.title = `Perfil ${PERFIL}: ${plural(OPERARIOS.length, 'técnico')}. Pulsa para cambiar.`; } }
function menuPerfil(ev) { cfgTab = 'perf'; const m = document.getElementById('cfgMenu'); if (m.hidden) toggleCfg(ev); else { renderCfg(); if (ev) ev.stopPropagation(); } }

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
    h = `<div class="cfg-h">Perfiles · ahora ${esc(PERFIL)}</div>${perfilesHtml()}`;
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
      <div class="cfg-h">Diagnóstico</div>
      <div class="cfg-t">Versión ${esc(APP_VERSION)} · ${plural(diagLista().length, 'error')} registrado${diagLista().length === 1 ? '' : 's'}.</div>
      <div class="acts"><button class="btn sm" onclick="copiarDiagnostico()">Copiar diagnóstico</button>${diagLista().length ? '<button class="btn sm ghost" onclick="lsSet(DIAG_KEY,[]);renderCfg()">Vaciar</button>' : ''}</div>`;
  }
  m.innerHTML = `<div class="cfg-tabs">${tabs.map(([t, l]) => `<button class="${cfgTab === t ? 'on' : ''}" onclick="event.stopPropagation();cfgTab='${t}';renderCfg()">${l}</button>`).join('')}</div><div class="cfg-body">${h}</div>`;
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
function exportarExcel(que) {
  if (!window.XLSX) { toast('No se pudo cargar el módulo de Excel (sin conexión)'); return; }
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
  XLSX.writeFile(wb, `despacho-${nombre}-${isoHoy()}.xlsx`);
}

// ---- Arranque (cuando ya están cargados todos los scripts) ----
window.addEventListener('DOMContentLoaded', () => {
  aplicarApariencia(); updatePerfilBtn(); marcarNovedades();
  try { revisarEspacio(); } catch (e) {}
  let visto = null; try { visto = localStorage.getItem(BIENV_KEY); } catch (e) {}
  if (!visto && !lsGet(ATGO_KEY, null)) setTimeout(() => { if (document.getElementById('modal').hidden) abrirAsistente(1); }, 800);
  else if (!visto) { try { localStorage.setItem(BIENV_KEY, '1'); } catch (e) {} }
  if (!OPERARIOS.length) toast(`El perfil ${PERFIL} no tiene técnicos: añádelos en ⚙ › Perfiles`);
});
