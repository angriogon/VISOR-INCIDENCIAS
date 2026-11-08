// ===== Ayudas de decisión del DSP: qué hacer ahora, propuesta del día y «Mañana listo» =====
// Son ventanas que se abren con un botón: no añaden secciones a Mi día. Solo leen datos; lo único que escribe en ATGO
// es «Planificar», y lo hace por asignarLote (confirmación, comprobación campo a campo y sin reintentos).

// La visita (o la fecha iso que se va a poner) es posterior al día en que caduca
function tcBadge(r) {
  if (!r || !r.fVisita || sinSla(r) || !esPresencial(r)) return '';
  const c = caducidad(r);
  return c && c.ts >= Date.now() && visitaTrasCaducar(r) ? `<span class="cad urg" title="La visita (${esc(r.fVisita)}) es posterior a la caducidad">${ico('reloj')} visita tras caducar</span>` : '';
}
function visitaTrasCaducar(r, iso) {
  const c = sinSla(r) ? null : caducidad(r), d = parseEs(r.fVisita), f = iso || (d ? isoHoy(d) : '');
  return !!(c && f && f > isoHoy(new Date(c.ts)));
}
const esPool = r => /^XXX/i.test(r.operario || '');
// Incidencias de las que responde este perfil: las de sus técnicos y las pendientes de asignar de su zona
function abiertasPerfil() { return rows.filter(r => TECNICOS.includes(cleanInitials(r.operario)) && !esCierre(r.estado)); }

// ---- Qué hacer ahora: una sola lista ordenada por riesgo ----
const QH_MAX = 60;
function queHacerLista() {
  const ahora = Date.now(), hoyIso = isoHoy(), hoy = parseEs(todayStr()), lista = new Map();
  const revisadas = revHechas(), olvido = horasOlvido();
  const pon = (r, peso, motivo) => { const k = tkey(r), a = lista.get(k); if (!a || peso > a.peso) lista.set(k, { r, peso, motivo }); };
  [...abiertasPerfil(), ...sinListas().mias].forEach(r => {
    const c = sinSla(r) ? null : caducidad(r), vis = parseEs(r.fVisita), sin = esPool(r), op = cleanInitials(r.operario);
    if (c) {
      if (c.ts < ahora) pon(r, 100, 'Caducada ' + cadTexto(c));
      else if (isoHoy(new Date(c.ts)) === hoyIso) pon(r, 90, 'Caduca ' + cadTexto(c));
      else if (cadNivel(c) === 'urg') pon(r, 75, 'Caduca ' + cadTexto(c));
      if (c.ts >= ahora && !sin && visitaTrasCaducar(r)) pon(r, 85, `La visita (${r.fVisita}) es después de caducar`);
    }
    if (!sin && vis && vis >= hoy && esPresencial(r)) {
      if (noDisponible(op, vis)) pon(r, 80, `${op} ${ausenciaTexto(op, vis)} el día de la visita`);
      else { const p = ausenciaParcial(op, vis); if (p && r.desdeHora && (horaMin(r.desdeHora) < 840) === (p.p === 'm')) pon(r, 80, `${op} no está por la ${p.p === 'm' ? 'mañana' : 'tarde'} del día de la visita`); }
    }
    if (!sin && vis && vis < hoy && !revisadas.includes(tkey(r))) pon(r, 70, `Visita del ${r.fVisita} sin cerrar`);
    if (sin) { const d = registro(r), h = d ? (ahora - d.getTime()) / 3600000 : 0; if (h >= olvido) pon(r, 60, 'Sin asignar desde hace ' + (h < 48 ? Math.round(h) + ' h' : Math.round(h / 24) + ' días')); }
  });
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  rutaHoy().forEach(x => { const r = x.r, op = cleanInitials(x.op); if (x.st === 'p' && r.desdeHora && TECNICOS.includes(op) && horaMin(r.desdeHora) + 30 < nowMin) pon(r, 78, `${op} no ha iniciado la visita de las ${r.desdeHora}`); });
  material().listos.forEach(x => { if (!parseEs(x.r.fVisita)) pon(x.r, 65, 'Material listo: falta planificar la visita'); });
  eventos.filter(e => e.tipo === 'comentario' && !e.visto && ahora - e.ts < 3 * 86400000).forEach(e => { const r = ticketDe(e.key); if (r && TECNICOS.includes(cleanInitials(r.operario))) pon(r, 55, 'Comentario nuevo de ' + (e.autor || e.op)); });
  const fm = ddmmyyyy(nextWorkday());
  Object.keys(envios[fm] || {}).forEach(op => { const st = estadoEnvio(op, fm), r = st && st.cambiada && rows.find(x => x.fVisita === fm && x.operario === op && esPresencial(x)); if (r) pon(r, 68, `La ruta de ${cleanInitials(op)} cambió tras enviarla: reenvíala`); });
  const cad = r => { const c = caducidad(r); return c ? c.ts : 9e15; };
  return [...lista.values()].sort((a, b) => b.peso - a.peso || cad(a.r) - cad(b.r));
}
function queHacerBotonHtml() {
  const l = queHacerLista(), u = l.filter(x => x.peso >= 85).length;
  return `<button class="btn sm${u ? ' warn' : ''}" onclick="abrirQueHacer()" title="Lo que corre más riesgo ahora mismo, de más a menos urgente">Qué hacer ahora · ${l.length}</button>`;
}
function abrirQueHacer() {
  const l = queHacerLista(), vis = l.slice(0, QH_MAX), m = document.getElementById('modal');
  const nivel = p => p >= 85 ? 3 : p >= 70 ? 2 : 1;
  m.innerHTML = `<div class="md-box md-qh"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Qué hacer ahora</div><div class="dw-sub">${l.length ? plural(l.length, 'incidencia') + ' por orden de riesgo. Pulsa una para abrir su ficha.' : 'Nada urgente.'}</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    ${vis.length ? `<div class="qh-lista">${vis.map(x => { const r = x.r, op = cleanInitials(r.operario); return `<button class="qh-it" onclick="cerrarModal();openTicket('${jsq(tkey(r))}')"><span class="qh-dot n${nivel(x.peso)}"></span><span class="mono">${esc(String(r.num).slice(-5))}</span><b>${esc(esPool(r) ? 'Sin asig.' : op)}</b><span class="qh-sede">${esc(r.descCliente || '—')}<small>${esc(r.descSede || '')}${r.poblacion ? ' · ' + esc(r.poblacion) : ''}</small></span><span class="qh-mot">${esc(x.motivo)}</span></button>`; }).join('')}</div>${l.length > QH_MAX ? `<div class="dempty">Y ${l.length - QH_MAX} más de menor riesgo.</div>` : ''}` : '<div class="dempty">Todo al día.</div>'}</div>`;
  m.hidden = false;
}

// ---- Propuesta del día: reparte lo pendiente de asignar de la zona; tú la revisas y la aplicas ----
let propFecha = '', propSel = {};
function propuestaDia(fecha) {
  const extra = {}, juntos = {};
  return sinListas().mias.map(r => {
    const pob = poblacionDe(r);
    const rec = (recomendar(r, fecha) || []).map(x => ({ ...x, total: x.score + (extra[x.op] || 0) - (pob && juntos[x.op + '|' + pob] ? 1.5 : 0) })).sort((a, b) => a.total - b.total);
    const op = rec.length ? rec[0].op : '';
    if (op) { extra[op] = (extra[op] || 0) + 1; if (pob) juntos[op + '|' + pob] = true; }
    return { r, op, rec };
  });
}
function abrirPropuesta() { propFecha = isoHoy(nextWorkday()); propSel = {}; mostrarPropuesta(); }
function mostrarPropuesta() {
  const m = document.getElementById('modal'); m.innerHTML = '<div class="md-box md-qh" id="propBox"></div>'; m.hidden = false; renderPropuesta();
}
function propFechaCambia(v) { if (v) { propFecha = v; propSel = {}; renderPropuesta(); } }
let propVista = 'lista';
function propCambiaVista(v) { propVista = v; renderPropuesta(); }
function propArrastra(ev) { ev.dataTransfer.setData('text/plain', ev.currentTarget.dataset.k); ev.dataTransfer.effectAllowed = 'move'; }
function propSoltar(ev, op) {
  ev.preventDefault();
  const k = ev.dataTransfer.getData('text/plain'); if (!k || !propSel[k]) return;
  propSel[k].op = op; propSel[k].on = !!op; renderPropuesta();
}
function propTableroHtml(l) {
  const f = ddmmyyyy(new Date(propFecha + 'T12:00'));
  l.forEach(x => { const k = tkey(x.r); propSel[k] = propSel[k] || { on: !!x.op, op: x.op }; });
  const ops = [...new Set([...l.map(x => propSel[tkey(x.r)].op).filter(Boolean), ...l.flatMap(x => x.rec.slice(0, 3).map(y => y.op))])].sort();
  const tarj = x => `<div class="pt-t" draggable="true" data-k="${esc(tkey(x.r))}" ondragstart="propArrastra(event)" title="${esc(x.r.descSede || '')}"><b class="mono">${esc(String(x.r.num).slice(-5))}</b><span>${esc(x.r.descSede || x.r.descCliente || '—')}</span><small>${esc(x.r.poblacion || '')}</small></div>`;
  const col = (op, tit, sub, its) => `<section class="pt-c" ondragover="event.preventDefault()" ondrop="propSoltar(event,'${jsq(op)}')"><h4>${esc(tit)} <small>${esc(sub)}</small></h4>${its.map(tarj).join('') || '<div class="pt-v">Suelta aquí</div>'}</section>`;
  const de = op => l.filter(x => propSel[tkey(x.r)].op === op);
  return `<div class="pt">${col('', 'Sin técnico', '', de(''))}${ops.map(op => { const its = de(op), m = cargaMin(op, f) + its.reduce((s, x) => s + (estimarMin(x.r) || 0), 0); return col(op, op, m ? fmtMin(m) : plural(its.length, 'visita'), its); }).join('')}</div>`;
}
function propMarcadas() { return Object.entries(propSel).filter(([, e]) => e.on && e.op); }
function propBarra() { const b = document.getElementById('propOk'); if (b) { const n = propMarcadas().length; b.disabled = !n; b.textContent = n ? 'Planificar ' + plural(n, 'incidencia') + ' en ATGO' : 'Marca alguna incidencia'; } }
function renderPropuesta() {
  const box = document.getElementById('propBox'); if (!box) return;
  const l = propuestaDia(new Date(propFecha + 'T12:00'));
  const fila = x => {
    const r = x.r, k = tkey(r), e = propSel[k] = propSel[k] || { on: !!x.op, op: x.op }, tras = visitaTrasCaducar(r, propFecha);
    return `<div class="pd-fila"><input type="checkbox" ${e.on ? 'checked' : ''} aria-label="Incluir ${esc(r.num)}" onchange="propSel['${jsq(k)}'].on=this.checked;propBarra()">
      <a href="#" class="mono" onclick="cerrarModal();openTicket('${jsq(k)}');return false">${esc(String(r.num).slice(-5))}</a>
      <span>${esc(r.descCliente || '—')}<small>${esc(r.descSede || '')}${r.poblacion ? ' · ' + esc(r.poblacion) : ''}${tras ? ' · <b class="ctl-alta">caduca antes de esa fecha</b>' : ''}</small></span>
      <select aria-label="Técnico para ${esc(r.num)}" onchange="propSel['${jsq(k)}'].op=this.value;propSel['${jsq(k)}'].on=!!this.value;this.closest('.pd-fila').querySelector('input').checked=!!this.value;propBarra()">${opcionesTecnico(x.rec, e.op, 'Sin técnico')}</select></div>`;
  };
  box.innerHTML = `<div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Propuesta del día</div><div class="dw-sub">Reparto de lo pendiente de asignar de tu zona, según carga, población y disponibilidad. No se guarda nada hasta que lo apliques y lo confirmes.</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    <div class="pd-cab"><label>Fecha de visita <input type="date" value="${esc(propFecha)}" onchange="propFechaCambia(this.value)"></label><span class="dim">${plural(l.length, 'incidencia')}</span><span class="seg mini" role="group" aria-label="Vista">${[['lista', 'Lista'], ['tablero', 'Tablero']].map(([v, t]) => `<button class="segb${propVista === v ? ' on' : ''}" aria-pressed="${propVista === v}" onclick="propCambiaVista('${v}')">${t}</button>`).join('')}</span></div>
    ${l.length ? `${propVista === 'tablero' ? propTableroHtml(l) : `<div class="qh-lista">${l.map(fila).join('')}</div>`}<div class="pd-pie"><span class="hint">Se pide confirmación y cada ficha se comprueba en ATGO.</span><button class="btn pri" id="propOk" onclick="propAplicar()"></button></div>` : '<div class="dempty">No hay nada pendiente de asignar en tu zona.</div>'}`;
  propBarra();
}
async function propAplicar() {
  const items = propMarcadas().map(([key, e]) => ({ key, codOpe: e.op, fechaVisita: propFecha }));
  if (!items.length) return;
  const res = await asignarLote(items, 'Propuesta del día');
  if (res) { res.okKeys.forEach(k => delete propSel[k]); refreshVisible(); if (res.mal.length) return; }   // si algo falló, queda a la vista el motivo
  mostrarPropuesta();
}

// ---- Mañana listo: lo que queda por dejar resuelto antes de terminar la jornada ----
function mananaComprobaciones() {
  const M = nextWorkday(), f = ddmmyyyy(M), rt = rutasResumen();
  const visitas = rows.filter(r => r.fVisita === f && esPresencial(r) && TECNICOS.includes(cleanInitials(r.operario)));
  const ver = l => l.map(r => ({ k: tkey(r), t: `${String(r.num).slice(-5)} · ${cleanInitials(r.operario)} · ${r.descSede || r.descCliente || ''}` }));
  const faltan = Math.max(0, rt.total - rt.enviadas) + (rt.cambiadas || 0);
  return { M, visitas: visitas.length, lista: [
    { n: sinListas().mias.length, t: 'Sin asignar en tu zona', ir: "cerrarModal();showTab('sin')", b: 'Ver' },
    { n: visitas.filter(r => noDisponible(cleanInitials(r.operario), M)).length, t: 'Visitas de técnicos no disponibles', l: ver(visitas.filter(r => noDisponible(cleanInitials(r.operario), M))) },
    { n: visitas.filter(r => visitaTrasCaducar(r)).length, t: 'Visitas posteriores a su caducidad', l: ver(visitas.filter(r => visitaTrasCaducar(r))) },
    { n: faltan, t: 'Rutas sin enviar o cambiadas tras enviar', ir: "cerrarModal();showTab('man')", b: 'Ver rutas' },
    { n: sinCerrarHoy().length, t: 'Visitas de hoy sin cerrar', ir: 'abrirSinCerrar()', b: 'Ver' },
    { n: revisionPendientes().length, t: 'Visitas de días anteriores sin revisar', ir: 'abrirRevision()', b: 'Revisar' }
  ] };
}
function mananaBotonHtml() {
  const n = mananaComprobaciones().lista.filter(x => x.n).length;
  return `<button class="btn sm${n ? ' warn' : ''}" onclick="abrirMananaListo()" title="Lo que falta por dejar resuelto para el próximo día laborable">Mañana listo${n ? ' · faltan ' + n : ' ✓'}</button>`;
}
function abrirMananaListo() {
  const c = mananaComprobaciones(), faltan = c.lista.filter(x => x.n).length, m = document.getElementById('modal');
  const fila = x => `<div class="ml-it ${x.n ? 'mal' : 'ok'}"><div><b class="n">${x.n || ico('ok')}</b><span>${esc(x.t)}</span><span class="spacer"></span>${x.n && x.ir ? `<button class="btn sm" onclick="${x.ir}">${x.b}</button>` : ''}</div>
    ${x.n && x.l ? `<ul>${x.l.slice(0, 12).map(i => `<li><a href="#" onclick="cerrarModal();openTicket('${jsq(i.k)}');return false">${esc(i.t)}</a></li>`).join('')}</ul>` : ''}</div>`;
  m.innerHTML = `<div class="md-box md-qh"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Mañana listo</div><div class="dw-sub">${esc(diaLargo(c.M))} · ${plural(c.visitas, 'visita')} de tus técnicos</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    <div class="ml-res">${faltan ? 'Faltan ' + faltan + ' cosas por dejar resueltas' : 'Todo listo para el próximo día.'}</div>
    <div>${c.lista.map(fila).join('')}</div></div>`;
  m.hidden = false;
}

// Entradas del menú «Más» de Mi día
function masDiaHtml() {
  return '<button onclick="abrirPropuesta()" title="Reparte lo pendiente de asignar de tu zona">Propuesta del día</button><button onclick="abrirMananaListo()">Mañana listo</button>';
}
document.addEventListener('click', e => {
  const dentro = e.target.closest && e.target.closest('.mas-lista button');
  document.querySelectorAll('details.mas[open]').forEach(d => { if (dentro || !d.contains(e.target)) d.open = false; });
});

// ---- Confirmar la visita a la tienda (plantilla en Ajustes › WhatsApp) ----
const CONFIRMA_DEF = 'Buenos días:\n\nLes confirmamos la visita de nuestro técnico {tecnico} el {fecha}{franja} en {sede}, por la incidencia {num}.\n\nUn saludo.';
function confirmaPlant() { return tecCfg.confirmaTpl || CONFIRMA_DEF; }
function confirmaTexto(r) {
  const franja = r.desdeHora ? (r.hastaHora ? ` de ${r.desdeHora} a ${r.hastaHora}` : ` a las ${r.desdeHora}`) : '';
  const vars = { tecnico: nombreTecnico(r) || cleanInitials(r.operario), fecha: r.fVisita || '', franja, sede: r.descSede || '', num: r.num || '', cliente: r.descCliente || '', direccion: r.domicilio || '' };
  return confirmaPlant().replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
}
function confirmaFichaHtml(r) {
  if (!r || !r.fVisita || !esPresencial(r)) return '';
  return `<div class="dw-sec"><div class="dw-h">Tienda</div><div class="dw-quick"><button class="chip sm" onclick="abrirConfirma('${jsq(tkey(r))}')">Confirmar visita</button></div></div>`;
}
function abrirConfirma(k) {
  const r = ticketDe(k); if (!r) return;
  const m = document.getElementById('modal'), mail = String(r.email || '').trim(), tel = String(r.telefono || '').replace(/[^\d+]/g, '');
  m.innerHTML = `<div class="md-box md-confirm"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Confirmar visita</div><div class="dw-sub">Nº ${esc(r.num)} · ${esc(r.descSede || '')}</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    <label class="cfg-ta"><span>Correo de la tienda</span><input id="confMail" type="email" value="${esc(/@/.test(mail) ? mail : '')}" autocomplete="off"></label>
    <label class="cfg-ta"><span>Mensaje</span><textarea id="confTxt" rows="7">${esc(confirmaTexto(r))}</textarea></label>
    <div class="acts" style="justify-content:flex-end">${tel.length >= 6 ? `<a class="btn" href="tel:${esc(tel)}">Llamar · ${esc(r.telefono)}</a>` : ''}<button class="btn" onclick="copyText(document.getElementById('confTxt').value)">Copiar</button><button class="btn pri" onclick="confirmaCorreo('${jsq(k)}')">Abrir en el correo</button></div></div>`;
  m.hidden = false;
}
function confirmaCorreo(k) {
  const r = ticketDe(k) || {}, a = document.createElement('a');
  a.href = 'mailto:' + encodeURIComponent(document.getElementById('confMail').value.trim()).replace('%40', '@') + '?subject=' + encodeURIComponent('Confirmación de visita · ' + (r.descSede || '') + ' · ' + (r.num || '')) + '&body=' + encodeURIComponent(document.getElementById('confTxt').value);
  a.click();
}
