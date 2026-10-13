// ===== Ajustes, perfiles, novedades de versión y comodidades de uso =====
// ⚙ por secciones, perfiles DSP1–DSP5 y COORD, tema y densidad, atajos de teclado, menú contextual,
// asistente de inicio, diagnóstico, resumen matinal, aviso de técnico sin actividad y exportar a Excel.
// Usa utilidades de app.js, dia.js, herramientas.js, edicion.js y panel.js solo en tiempo de llamada.

const APP_VERSION = '1.22.2';   // súbela a la vez que VERSION en sw.js
const NOVEDADES = [
  { v: '1.22.2', f: '2026-10-13', l: ['Corregido: «la sesión de ATGO ha caducado» al guardar aunque ATGO funcionara. Pasaba si quedaba abierta otra pestaña de ATGO antigua: Despacho le mandaba los cambios a ella. Ahora solo los recibe la pestaña que sincroniza, y se avisa si hay otra con error.', 'Error 403 de ATGO (sin permiso) separado de la sesión caducada; el aviso de «No se guardaron» ofrece Forzar reconexión.', 'Recarga una vez la pestaña de ATGO (F5).'] },
  { v: '1.22.1', f: '2026-10-13', l: ['Reincidencias por equipo: 🔁 sale solo si el mismo equipo (IT de la balanza, elemento de ATGO o «caja 131» con su aparato) vuelve a fallar en 10 días, abierto o ya cerrado. Ya no se marcan todas las de una sede con mucho tráfico.', 'Recarga una vez la pestaña de ATGO (F5) para que lea el código del equipo.'] },
  { v: '1.22.0', f: '2026-10-13', l: ['Incidencias: dentro de cada técnico, agrupadas por estado y cada línea iluminada con el color de su estado.', 'Visita y caducidad justo detrás del Nº, con su etiqueta y color (rojo si caduca en menos de 24 h o ya caducó).', 'Técnicos más visibles: avatar de color e iniciales y nombre más grandes.', 'Al guardar en ATGO, el resultado sale dentro de la ficha y el aviso ya no queda tapado.', '«Forzar reconexión» (⚙ › General, aviso de ATGO sin actualizar o clic en el punto de estado) para cuando ATGO se queda pillado.'] },
  { v: '1.21.0', f: '2026-10-12', l: ['⚙ › Técnicos: nómina para dar de alta técnicos, cambiar su zona o DSP y marcar bajas (los de baja no se proponen al asignar).', '⚙ › Apariencia: color de la app (azul ATGO, verde, morado, grafito o naranja) y tamaño Compacto · Normal · Amplio, ahora bien distintos.', 'Accesibilidad: «Modo accesible» de un clic (zoom, alto contraste, foco visible, botones grandes, sin animaciones) y cada opción por separado.', 'Cabecera más limpia: pestañas más grandes y en mayúsculas.', 'Novedades más cortas: las 5 últimas versiones y un resumen de las anteriores.'] },
  { v: '1.20.0', f: '2026-10-12', l: ['Festivos: los nacionales ya cuentan (próximo laborable, Planificación, avisos) y puedes añadir los de cada zona en ⚙ › Festivos.', 'Planificación › detalle de un técnico y día › «Rellenar el día»: propone sus incidencias sin fecha, vencidas y las sin asignar de su zona.', 'Ficha: teléfono y correo del contacto, material con su último comentario y seguimiento GLS, e historial de la sede.', 'Limpieza de estilos sin uso.'] },
  { v: '1.19.0', f: '2026-10-12', l: ['«Mis cambios» en Mi día: todo lo que has hecho hoy (o en 7 días) en ATGO desde Despacho, con su resultado.', 'Aviso de visitas de hoy sin cerrar a las 19:00 (configurable) y «Recordar» por WhatsApp a cada técnico.', 'Sin asignar: las de tu zona con más de 4 h sin técnico se marcan ⏰ y avisan (configurable).', 'Correcciones de la revisión: arranque con COORD o abriendo directamente otra pestaña, perfiles al restaurar copias, Sin asignar más ligero.'] },
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
  'Extensión para Chrome y Edge que sincroniza ATGO sola',
  'Actualización silenciosa y sincronización cada 2 minutos'
];
const NOV_VISIBLES = 5;
const NOV_KEY = 'dispatcher_version_vista_v1', DIAG_KEY = 'dispatcher_diag_v1', BIENV_KEY = 'dispatcher_bienvenida_v1', DATOS_VER_KEY = 'dispatcher_datos_version_v1';

// ---- Novedades de la versión ----
function abrirNovedades() {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-nov"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Despacho ${esc(APP_VERSION)}</div><div class="dw-sub">Novedades de cada versión</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    ${NOVEDADES.slice(0, NOV_VISIBLES).map((n, i) => `<details class="nov"${i === 0 ? ' open' : ''}><summary><b>${esc(n.v)}</b><span>${esc(new Date(n.f + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))}</span></summary><ul>${n.l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
    ${NOVEDADES.length > NOV_VISIBLES ? `<details class="nov nov-ant"><summary><b>Anteriores</b><span>${esc(NOVEDADES[NOVEDADES.length - 1].v)} – ${esc(NOVEDADES[NOV_VISIBLES].v)}</span></summary><ul>${ANTERIORES.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
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
    <div class="pf-pie"><button class="btn sm" onclick="abrirNomina()" title="Altas, zona o DSP de cada técnico y bajas">👥 Técnicos (nómina)…</button><span>Para pasar los perfiles a otro equipo:</span><button class="btn sm ghost" onclick="exportarPerfiles()">Exportar perfiles</button><button class="btn sm ghost" onclick="importarPerfiles()">Importar perfiles</button></div>
    ${perfilesCambiados ? `<div class="pf-aplicar"><span>Has cambiado los técnicos del perfil en uso (${PERFIL}).</span><button class="btn sm pri" onclick="lsSet(SNAP_KEY,{start:0,items:{}});try{sessionStorage.setItem('despacho_perfil_cambiado',PERFIL)}catch(e){};location.reload()">Aplicar cambios (recarga)</button></div>` : ''}`;
  const i = document.getElementById('pfIn'); if (i && perfBusca) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function updatePerfilBtn() { const b = document.getElementById('perfilBtn'); if (b) { b.textContent = PERFIL; b.title = `Perfil ${PERFIL}: ${plural(OPERARIOS.length, 'técnico')}. Pulsa para gestionar los perfiles.`; } }
function menuPerfil(ev) { if (ev) ev.stopPropagation(); abrirPerfiles(PERFIL); }

// ---- Nómina de técnicos (⚙ › Técnicos): altas, zona/DSP de cada uno y bajas, sin tocar el código ----
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
function abrirNomina() {
  const cfg = document.getElementById('cfgMenu'); if (cfg) cfg.hidden = true;
  const m = document.getElementById('modal');
  m.innerHTML = '<div class="md-box md-perf" id="nomBox" role="dialog" aria-label="Técnicos (nómina)"></div>'; m.hidden = false;
  renderNomina();
}
function renderNomina() {
  const box = document.getElementById('nomBox'); if (!box) return;
  const nom = nombresTecnicos(), q = nomBusca.trim().toUpperCase();
  const atgoBaja = {}; rows.forEach(r => { if (/\bBAJA\b/i.test(r.desOperario || '')) atgoBaja[r.operario] = 1; });   // ATGO pone «BAJA» en el nombre
  const todos = nomTodos().map(op => ({ op, nombre: nom[op] || (perfilCfg.nomina[op] || {}).n || '', zona: nomZona(op), dsp: nomDsp(op), baja: enBaja(op), abiertas: rows.filter(r => r.operario === op).length, n: perfilCfg.nomina[op] || {} }));
  const l = todos.filter(t => (!q || (t.op + ' ' + t.nombre + ' ' + t.zona).toUpperCase().includes(q)) && (!nomFiltro || (nomFiltro === 'BAJA' ? t.baja : t.dsp === nomFiltro)))
    .sort((a, b) => (PERFILES.indexOf(a.dsp) - PERFILES.indexOf(b.dsp)) || a.zona.localeCompare(b.zona) || a.op.localeCompare(b.op));
  const bajas = todos.filter(t => t.baja).length;
  const fila = t => `<tr class="${t.baja ? 'nm-baja' : ''}">
      <td><b class="mono">${esc(t.op)}</b>${t.n.alta ? ' <span class="nm-tag" title="Dado de alta por ti">alta</span>' : ''}${t.nombre ? `<small>${esc(t.nombre)}</small>` : ''}</td>
      <td><select aria-label="Zona de ${esc(t.op)}" onchange="nomCambiarZona('${jsq(t.op)}',this.value)">${t.zona ? '' : t.dsp ? '' : '<option value="">Sin zona…</option>'}${nomOpciones(t.zona || (t.dsp ? '@' + t.dsp : ''))}</select></td>
      <td class="nm-perf">${esc(PERFILES.filter(p => perfilCfg.tecs[p].includes(t.op)).join(' · ') || '—')}</td>
      <td>${t.abiertas ? plural(t.abiertas, 'abierta') : '<span class="dim">—</span>'}${!t.baja && atgoBaja[t.op] ? '<br><small class="nm-aviso">ATGO lo marca de baja</small>' : ''}</td>
      <td><button class="nm-est ${t.baja ? 'off' : 'on'}" onclick="nomBaja('${jsq(t.op)}',${!t.baja})" aria-pressed="${t.baja}" title="${t.baja ? 'Volver a activo' : 'Marcar de baja: no se propone al asignar'}">${t.baja ? 'De baja' : 'Activo'}</button></td>
      <td>${t.n.alta ? `<button class="iconbtn sm" onclick="nomQuitar('${jsq(t.op)}')" aria-label="Quitar ${esc(t.op)} de la nómina" title="Quitar de la nómina">×</button>` : ''}</td></tr>`;
  box.innerHTML = `
    <div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Técnicos (nómina)</div><div class="dw-sub">Da de alta técnicos, cambia su zona o DSP y marca las bajas. Los de baja no se proponen al asignar, pero sus incidencias se siguen viendo.</div></div>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    <fieldset class="nm-alta"><legend>Dar de alta</legend>
      <input id="nomCod" placeholder="Código ATGO (p. ej. RUFB)" aria-label="Código del técnico en ATGO" maxlength="12" onkeydown="if(event.key==='Enter')nomAlta()">
      <input id="nomNom" placeholder="Nombre (opcional)" aria-label="Nombre del técnico" onkeydown="if(event.key==='Enter')nomAlta()">
      <select id="nomZona" aria-label="Zona o DSP del técnico"><option value="">Zona o DSP…</option>${nomOpciones('')}</select>
      <button class="btn sm pri" onclick="nomAlta()">Dar de alta</button></fieldset>
    <div class="nm-filtros">
      <input type="search" placeholder="Buscar código, nombre o zona" aria-label="Buscar técnico" value="${esc(nomBusca)}" oninput="nomBusca=this.value;renderNomina()" id="nomQ">
      <span class="seg mini">${[['', 'Todos'], ...PERFILES.filter(p => p !== 'COORD').map(p => [p, p]), ['BAJA', `De baja${bajas ? ' (' + bajas + ')' : ''}`]].map(([v, t]) => `<button class="segb${nomFiltro === v ? ' on' : ''}" onclick="nomFiltro='${v}';renderNomina()" aria-pressed="${nomFiltro === v}">${t}</button>`).join('')}</span>
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
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { const osc = t === 'auto' ? /dark/.test(m.media) : t === 'dark'; m.content = osc ? '#1b2126' : '#f7f5f0'; });   // barra de la ventana de la app
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
// Ventanas (modal, ficha, buscador, ⚙): al abrir, el foco entra; Tab no se sale; al cerrar, vuelve a donde estaba
const FOCO_SEL = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function visiblesFoco(c) { return [...c.querySelectorAll(FOCO_SEL)].filter(el => el.offsetParent !== null || el === document.activeElement); }
function vigilarVentana(id) {
  const el = document.getElementById(id); if (!el) return;
  let antes = null;
  new MutationObserver(() => {
    const abierto = !el.hidden;
    if (abierto && !el.__abierto) {
      el.__abierto = true; antes = document.activeElement;
      setTimeout(() => { if (el.hidden || el.contains(document.activeElement)) return; const f = el.querySelector('[autofocus], .cfg-tabs button.on') || visiblesFoco(el).find(x => !/iconbtn/.test(x.className)) || visiblesFoco(el)[0]; if (f) f.focus({ preventScroll: true }); }, 30);
    } else if (!abierto && el.__abierto) {
      el.__abierto = false;
      if (antes && document.body.contains(antes) && (!document.activeElement || document.activeElement === document.body || el.contains(document.activeElement))) { try { antes.focus({ preventScroll: true }); } catch (e) {} }
    }
  }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  el.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || id === 'cfgMenu') return;
    const l = visiblesFoco(el); if (!l.length) return;
    const i = l.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); l[l.length - 1].focus(); }
    else if (!e.shiftKey && i === l.length - 1) { e.preventDefault(); l[0].focus(); }
  });
}

// ---- ⚙ Ajustes por secciones ----
let cfgTab = 'gen';
function toggleCfg(ev) {
  const m = document.getElementById('cfgMenu');
  m.hidden = !m.hidden; if (!m.hidden) renderCfg();
  if (ev) ev.stopPropagation();
}
function renderCfg() {
  const m = document.getElementById('cfgMenu'); if (!m || m.hidden) return;
  const tabs = [['gen', 'General'], ['apa', 'Apariencia'], ['avi', 'Avisos'], ['tec', 'Técnicos'], ['perf', 'Perfiles'], ['fes', 'Festivos'], ['wa', 'WhatsApp'], ['dat', 'Datos']];
  let h = '';
  if (cfgTab === 'gen') {
    h = `<div class="cfg-h">Conexión</div>
      <div class="cfg-t">${esc(document.getElementById('fileStatus').textContent)}${esc(document.getElementById('atgoStatus').textContent)}</div>
      ${ultimaCarga && ultimaCarga.s != null ? `<div class="cfg-t">Última carga: ${ultimaCarga.ops != null ? plural(ultimaCarga.ops, 'técnico') + ' en ' : ''}${ultimaCarga.s} s${ultimaCarga.s > 90 ? ' · lenta: avisa si pasa a menudo' : ''}</div>` : ''}
      <div class="acts"><button class="btn sm pri" onclick="document.getElementById('atgoBtn').click()">Abrir ATGO</button><button class="btn sm" onclick="forzarAtgo()" title="Si ATGO se queda pillado: lo recarga desde cero y rehace la conexión">⟳ Forzar reconexión</button><button class="btn sm" onclick="document.getElementById('importBtn').click()">Importar Excel</button><button class="btn sm ghost" onclick="abrirAsistente()">Asistente de inicio</button></div>
      <div class="cfg-t">Tema, color, tamaño y accesibilidad: en la pestaña <a href="#" onclick="event.preventDefault();event.stopPropagation();cfgTab='apa';renderCfg()">Apariencia</a>.</div>
      <div class="cfg-h">Resúmenes y avisos del día</div>
      <div class="cfg-row"><label><input type="checkbox" ${tecCfg.resumenOn !== false ? 'checked' : ''} onchange="setPref('resumenOn',this.checked)"> Resumen matinal a las</label><input type="time" aria-label="Hora del resumen matinal" value="${esc(tecCfg.resumenHora || '08:00')}" onchange="setPref('resumenHora',this.value)"></div>
      <div class="cfg-row"><label><input type="checkbox" ${tecCfg.inactOn !== false ? 'checked' : ''} onchange="setPref('inactOn',this.checked)"> Avisar si un técnico no ha iniciado nada a las</label><input type="time" aria-label="Hora del aviso de técnico sin actividad" value="${esc(tecCfg.inactHora || '11:00')}" onchange="setPref('inactHora',this.value)"></div>
      <div class="cfg-row"><label><input type="checkbox" ${tecCfg.cierreOn !== false ? 'checked' : ''} onchange="setPref('cierreOn',this.checked)"> Avisar de visitas de hoy sin cerrar a las</label><input type="time" aria-label="Hora del aviso de visitas sin cerrar" value="${esc(horaCierre())}" onchange="setPref('cierreHora',this.value)"></div>
      <div class="cfg-row"><label>Sin asignar de tu zona: avisar si llevan más de</label><span><input type="number" aria-label="Horas sin técnico para avisar" min="1" max="72" value="${horasOlvido()}" onchange="setPref('olvidoHoras',Math.max(1,Number(this.value)||4))" style="width:56px"> h</span></div>
      <div class="cfg-h">Planificar en ATGO (técnico y visita)</div>
      <div class="cfg-t">${tecCfg.fase2 !== 'prueba' ? 'Activo en todos los tickets (validado).' : 'Limitado al ticket de prueba 2026/00/97784.'}</div>
      <div class="acts"><button class="btn sm ghost" onclick="tecCfg.fase2=tecCfg.fase2==='prueba'?'todos':'prueba';saveTec();renderCfg();if(fichaKey)renderFicha()">${tecCfg.fase2 !== 'prueba' ? 'Limitar al ticket de prueba' : 'Activar para todos los tickets'}</button></div>`;
  } else if (cfgTab === 'apa') {
    const a = accCfg(), on = accActivo(), seg = (k, ops, cur) => `<span class="seg mini" role="group">${ops.map(([v, l]) => `<button class="segb${cur === v ? ' on' : ''}" aria-pressed="${cur === v}" onclick="event.stopPropagation();${k}">${l}</button>`.replace(k, k.replace('@', String(v)))).join('')}</span>`;
    h = `<div class="cfg-h">Tema</div>
      <div class="cfg-row"><span>Claro u oscuro</span>${seg("setPref('tema','@')", [['auto', 'Como Windows'], ['light', 'Claro'], ['dark', 'Oscuro']], tecCfg.tema || 'auto')}</div>
      <div class="cfg-h">Color</div>
      <div class="acentos" role="group" aria-label="Color de la aplicación">${ACENTOS.map(([v, l, c]) => `<button class="acento-b${(tecCfg.acento || '') === v ? ' on' : ''}" aria-pressed="${(tecCfg.acento || '') === v}" onclick="event.stopPropagation();setPref('acento','${v}')"><i style="background:${c}"></i>${l}</button>`).join('')}</div>
      <div class="cfg-h">Tamaño</div>
      <div class="cfg-row"><span>Espacio entre filas y letra</span>${seg("setPref('densidad','@')", [['compacta', 'Compacto'], ['normal', 'Normal'], ['amplia', 'Amplio']], densidad())}</div>
      <div class="cfg-row"><span>Zoom de toda la app</span>${seg("setAcc('texto',@)", ACC_TEXTO.map(n => [n, n + ' %']), a.texto || 100)}</div>
      <div class="cfg-h">Accesibilidad</div>
      <div class="acc-card${on ? ' on' : ''}"><span style="font-size:22px" aria-hidden="true">♿</span><div><b>Modo accesible</b><span>${on ? 'Activado. Ajusta abajo cada opción.' : 'Letra más grande, alto contraste, foco visible, botones grandes y sin animaciones, de una vez.'}</span></div>
        <button class="btn sm${on ? '' : ' pri'}" aria-pressed="${on}" onclick="event.stopPropagation();modoAccesible(${!on})">${on ? 'Desactivar' : 'Activar'}</button></div>
      <div class="acc-l">${ACC_OPS.map(([k, l, d]) => `<label><input type="checkbox" ${a[k] ? 'checked' : ''} onchange="setAcc('${k}',this.checked)"><span>${l}<small>${d}</small></span></label>`).join('')}</div>
      <div class="cfg-t">Siempre activo: navegación completa con teclado (pulsa <kbd>?</kbd>), enlace «Saltar al contenido» con Tab, nombres para lectores de pantalla y foco que vuelve a su sitio al cerrar ventanas.</div>`;
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
  } else if (cfgTab === 'fes') {
    const y = new Date().getFullYear(), hoy = isoHoy();
    const prox = [...festivosNacionales(y), ...festivosNacionales(y + 1)].filter(x => x[0] >= hoy).slice(0, 4);
    const loc = (tecCfg.festivos || []).slice().sort((a, b) => a.f < b.f ? -1 : 1);
    h = `<div class="cfg-h">Festivos</div>
      <div class="cfg-t">Los nacionales ya están (próximos: ${esc(prox.map(x => x[1] + ' ' + x[0].slice(8) + '/' + x[0].slice(5, 7)).join(', '))}). Añade los autonómicos y locales: los de todas las zonas cuentan para el «próximo laborable»; los de una zona marcan sus casillas en Planificación.</div>
      <div class="fes-add"><input type="date" id="fesF"><select id="fesZ"><option value="">Todas las zonas</option>${ZONAS_BASE.filter(z => !z.dispatcher).map(z => `<option>${esc(z.nombre)}</option>`).join('')}</select><input id="fesN" placeholder="Nombre (opcional)"><button class="btn sm pri" onclick="event.stopPropagation();anadirFestivo()">Añadir</button></div>
      ${loc.length ? `<ul class="fes-l">${loc.map(x => `<li${x.f < hoy ? ' class="pasado"' : ''}><span class="mono">${esc(x.f.split('-').reverse().join('/'))}</span><b>${esc(x.n || 'Festivo')}</b><small>${esc(x.z || 'Todas las zonas')}</small><button class="iconbtn sm" onclick="event.stopPropagation();quitarFestivo('${x.f}','${jsq(x.z || '')}')" aria-label="Quitar">×</button></li>`).join('')}</ul>` : '<div class="cfg-t">Aún no has añadido festivos locales.</div>'}`;
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
  m.innerHTML = `<div class="cfg-tabs">${tabs.map(([t, l]) => `<button class="${cfgTab === t ? 'on' : ''}" onclick="event.stopPropagation();${t === 'perf' ? 'abrirPerfiles()' : t === 'tec' ? 'abrirNomina()' : `cfgTab='${t}';renderCfg()`}">${l}</button>`).join('')}</div><div class="cfg-body">${h}</div>`;
}
document.addEventListener('click', e => { const m = document.getElementById('cfgMenu'); if (m && !m.hidden && !m.contains(e.target) && e.target.id !== 'cfgBtn' && e.target.id !== 'perfilBtn' && document.body.contains(e.target)) m.hidden = true; });

// ---- Festivos locales (⚙ › Festivos) ----
function anadirFestivo() {
  const f = document.getElementById('fesF').value, z = document.getElementById('fesZ').value, n = document.getElementById('fesN').value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) { toast('Elige la fecha'); return; }
  const l = (tecCfg.festivos || []).filter(x => !(x.f === f && (x.z || '') === z));
  l.push({ f, z, n }); tecCfg.festivos = l; saveTec(); renderCfg(); refreshVisible();
  toast('Festivo añadido');
}
function quitarFestivo(f, z) { tecCfg.festivos = (tecCfg.festivos || []).filter(x => !(x.f === f && (x.z || '') === z)); saveTec(); renderCfg(); refreshVisible(); }

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

// ---- Mis cambios en ATGO (todo lo hecho desde Despacho, con su resultado) ----
let misCambiosRango = 'hoy';
function misCambios(rango) {
  const desde = (rango || misCambiosRango) === 'hoy' ? new Date().setHours(0, 0, 0, 0) : Date.now() - 7 * 86400000;
  return ediciones.filter(e => e.ts >= desde);
}
function abrirMisCambios(rango) {
  if (rango) misCambiosRango = rango;
  const l = misCambios(), mal = l.filter(e => !e.ok).length;
  const ACC = { comentario: 'Comentario', estado: 'Estado', asignar: 'Planificación' };
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-camb"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Mis cambios en ATGO</div>
      <div class="dw-sub">${l.length ? `${plural(l.length, 'cambio')} · ${l.length - mal} comprobado${l.length - mal === 1 ? '' : 's'}${mal ? ` · <b style="color:#d9614f">${mal} sin aplicar</b>` : ''}` : 'Ninguno'}</div></div>
      <div class="acts"><span class="seg mini">${[['hoy', 'Hoy'], ['7d', '7 días']].map(([v, t]) => `<button class="segb${misCambiosRango === v ? ' on' : ''}" onclick="abrirMisCambios('${v}')">${t}</button>`).join('')}</span>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div></div>
    ${l.length ? `<table class="inf camb"><thead><tr><th>Hora</th><th>Nº</th><th>Cambio</th><th>Resultado</th></tr></thead><tbody>${l.map(e => `<tr class="${e.ok ? '' : 'ko'}">
      <td class="mono">${esc(misCambiosRango === 'hoy' ? hhmm(e.ts) : cuando(e.ts))}</td>
      <td><a href="#" onclick="cerrarModal();openTicket('${jsq(e.key)}','his');return false" class="mono">${esc(String(e.num || e.key).slice(-5))}</a></td>
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
function botonesDiaHtml() {
  const c = misCambios('hoy'), mal = c.filter(e => !e.ok).length, sc = horaPasada(horaCierre()) && tecCfg.cierreOn !== false ? sinCerrarHoy().length : 0;
  return `<button class="btn sm${mal ? ' warn' : ''}" onclick="abrirMisCambios('hoy')" title="Todo lo que has hecho hoy en ATGO desde Despacho, con su resultado">Mis cambios${c.length ? ' · ' + c.length : ''}${mal ? ' (' + mal + ' ✕)' : ''}</button>`
    + (sc ? `<button class="btn sm warn" onclick="abrirSinCerrar()" title="Visitas de hoy que siguen en PRESENCIAL sin «finalizado» del técnico">Sin cerrar hoy · ${sc}</button>` : '');
}

// ---- Resumen matinal y técnico sin actividad (se revisa cada minuto) ----
const DIA_AVISOS_KEY = 'dispatcher_avisos_dia_v1';
function horaPasada(hhmm) { const [h, m] = String(hhmm || '').split(':').map(Number); const d = new Date(); return d.getHours() * 60 + d.getMinutes() >= h * 60 + (m || 0); }
function revisarAvisosDia() {
  if (!rows.length || source !== 'atgo') return;
  const hoy = isoHoy(), hecho = lsGet(DIA_AVISOS_KEY, {});
  if (hecho.dia !== hoy) { hecho.dia = hoy; hecho.resumen = false; hecho.inact = []; }
  const d = new Date(); if (!(d.getDay() % 6) || festivo(d)) return;   // fines de semana y festivos, nada
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
  // Tras una actualización silenciosa (app.js), un aviso discreto con la versión nueva
  try { if (sessionStorage.getItem('despacho_actualizado')) { sessionStorage.removeItem('despacho_actualizado'); setTimeout(() => toast(`Despacho se ha actualizado a la versión ${APP_VERSION} · novedades en ⓘ`), 1200); } } catch (e) {}
  try { revisarEspacio(); } catch (e) {}
  let visto = null; try { visto = localStorage.getItem(BIENV_KEY); } catch (e) {}
  if (!visto && !lsGet(ATGO_KEY, null)) setTimeout(() => { if (document.getElementById('modal').hidden) abrirAsistente(1); }, 800);
  else if (!visto) { try { localStorage.setItem(BIENV_KEY, '1'); } catch (e) {} }
  if (!OPERARIOS.length) toast(`El perfil ${PERFIL} no tiene técnicos: añádelos en ⚙ › Perfiles`);
});
