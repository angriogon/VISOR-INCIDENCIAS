// ===== Plantillas de correo por cliente =====
// Pensado para "elegir y copiar": chips de cliente, lista, vista previa y botón Copiar.
// Importa plantillas de Outlook (.oft/.msg) y también .eml, .html y .txt, conservando el formato.
// Depende de utilidades de index.html (esc, toast, rows, tecCfg, telWa, norm) que existen al llamarse.

const TPL_CLIENTES = [
  { id: 'CRF COMMS',    match: /CARREFOUR|\bCRF\b/i },
  { id: 'EMO',          match: /\bEMO\b/i },
  { id: 'TRANSGOURMET', match: /TRANSGOURMET/i },
  { id: 'JPC',          match: /\bJPC\b/i },
  { id: 'PUNTOS VUELA', match: /VUELA/i },
  { id: 'VEIASA',       match: /VEIASA|\bITV\b/i },
  { id: 'TÉCNICOS',     match: null }   // avisos y recordatorios a técnicos
];
const TPL_KEY = 'dispatcher_plantillas_v2';
const TPL_CLI_KEY = 'dispatcher_tpl_cliente';
const TPL_EXT = /\.(oft|msg|eml|html?|txt)$/i;
const MLAB = { cliente:'Cliente', tecnico:'Técnico', num:'Nº incidencia', sede:'Sede', fecha:'Fecha visita', hora:'Hora', direccion:'Dirección', tiempo:'Tiempo estimado', referencia:'Referencia' };

let plantillas = tplLoad();
let tplCli = (() => { try { return localStorage.getItem(TPL_CLI_KEY) || TPL_CLIENTES[0].id; } catch (e) { return TPL_CLIENTES[0].id; } })();
let tplSel = null, tplQuery = '', tplVals = {}, tplDraft = null, tplDelArm = false;

function tplUid() { return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function tplSave() { try { localStorage.setItem(TPL_KEY, JSON.stringify(plantillas)); } catch (e) { toast('No se pudo guardar: quizá hay demasiadas plantillas con imágenes'); } }
function tplNormCli(name) {
  const n = String(name || '').trim();
  const hit = TPL_CLIENTES.find(c => c.id.toLowerCase() === n.toLowerCase() || (c.match && c.match.test(n)));
  return hit ? hit.id : (n || TPL_CLIENTES[0].id);
}
// Carga v2; si no existe, migra las plantillas de la versión anterior (clientes + recordatorios).
function tplLoad() {
  try { const v = JSON.parse(localStorage.getItem(TPL_KEY)); if (Array.isArray(v)) return v; } catch (e) {}
  const out = [];
  try {
    (JSON.parse(localStorage.getItem('dispatcher_clientes_v1')) || []).forEach(c => (c.tpls || []).forEach(t =>
      out.push({ id: t.id || tplUid(), cliente: tplNormCli(c.nombre), nombre: t.nombre, asunto: t.asunto || '', texto: t.cuerpo || '', html: '' })));
    (JSON.parse(localStorage.getItem('dispatcher_recordatorios_v1')) || []).forEach(t =>
      out.push({ id: t.id || tplUid(), cliente: 'TÉCNICOS', nombre: t.nombre, asunto: t.asunto || '', texto: t.cuerpo || '', html: '' }));
  } catch (e) {}
  if (out.length) { try { localStorage.setItem(TPL_KEY, JSON.stringify(out)); } catch (e) {} }
  return out;
}
function tplCategorias() {
  const extra = [...new Set(plantillas.map(t => t.cliente))].filter(c => !TPL_CLIENTES.some(k => k.id === c));
  return [...TPL_CLIENTES.map(c => c.id), ...extra];
}
function tplVisibles() {
  const q = norm(tplQuery);
  const list = q
    ? plantillas.filter(t => norm(t.nombre + ' ' + t.asunto + ' ' + t.cliente + ' ' + (t.texto || '').slice(0, 400)).includes(q))
    : plantillas.filter(t => t.cliente === tplCli);
  return list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
function tplCur() { return plantillas.find(t => t.id === tplSel); }

// ---- Campos {variables} ----
function tplCampos(t) {
  const set = new Set();
  ((t.asunto || '') + ' ' + (t.html || t.texto || '')).replace(/\{(\w+)\}/g, (m, k) => set.add(k));
  return [...set];
}
function tplValsFor(t) { return { ...tplVals, cliente: tplVals.cliente || (t.cliente !== 'TÉCNICOS' ? t.cliente : '') }; }
function tplFill(s, vals, mark) {
  return String(s || '').replace(/\{(\w+)\}/g, (m, k) => {
    if (vals[k]) return vals[k];
    const lab = '[' + (MLAB[k] || k) + ']';
    return mark ? '\u0001' + lab + '\u0002' : lab;
  });
}
function tplFillHtml(html, vals, mark) {
  return String(html || '').replace(/\{(\w+)\}/g, (m, k) => vals[k] ? esc(vals[k])
    : (mark ? `<span style="background:#ffe9a8;border-radius:3px;padding:0 2px">[${esc(MLAB[k] || k)}]</span>` : '[' + esc(MLAB[k] || k) + ']'));
}
function tplFaltan(t) { const v = tplValsFor(t); return tplCampos(t).filter(k => !v[k]); }

// Incidencias del cliente seleccionado (por nombre en ATGO); si no hay coincidencias, todas.
function tplIncidencias(t) {
  const cli = TPL_CLIENTES.find(c => c.id === (t && t.cliente));
  const own = cli && cli.match ? rows.filter(r => cli.match.test(r.descCliente || '')) : [];
  return own.length ? own : rows;
}
function tplPickInc(num) {
  const r = rows.find(x => String(x.num) === String(num).trim());
  if (!r) return false;
  // "GARCIA SUTIL, JESUS" → "Jesus Garcia Sutil" (en correos a clientes queda mejor que las siglas)
  const tc = s => s.toLowerCase().replace(/(^|[\s-])\S/g, c => c.toUpperCase());
  const [ap, nom] = String(r.desOperario || '').split(',').map(s => s.trim());
  const nombre = nom ? tc(nom + ' ' + ap) : (ap ? tc(ap) : r.operario);
  Object.assign(tplVals, { tecnico: tplCur() && tplCur().cliente === 'TÉCNICOS' ? r.operario : nombre, num: r.num, sede: r.descSede, fecha: r.fVisita, hora: r.desdeHora, direccion: r.domicilio, referencia: r.referencia });
  return true;
}

// ---- HTML seguro ----
// Para el editor (dentro de nuestra página): sin scripts, estilos globales ni eventos.
function tplSanitize(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  doc.querySelectorAll('script,style,link,meta,iframe,object,embed,form,base,title,xml').forEach(n => n.remove());
  doc.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(a => {
      if (/^on/i.test(a.name) || (/^(href|src|action|formaction)$/i.test(a.name) && /^\s*(javascript|vbscript|data:text)/i.test(a.value))) el.removeAttribute(a.name);
    });
  });
  return doc.body.innerHTML;
}
function tplDocHtml(t, vals, mark) {
  const filled = tplFillHtml(t.html, vals, mark);
  if (/<html[\s>]/i.test(filled)) return filled;
  return '<!doctype html><html><head><meta charset="utf-8"><style>body{font:11pt Calibri,Arial,sans-serif;color:#222;margin:14px;background:#fff}p{margin:0 0 .6em}</style></head><body>' + filled + '</body></html>';
}
function tplTextToHtml(s) { return esc(s).replace(/\n/g, '<br>'); }

// ---- Copiar / abrir ----
async function tplCopyRich(html, text) {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })]);
      return true;
    }
  } catch (e) {}
  // Alternativa: seleccionar un bloque oculto con el formato y copiarlo.
  const div = document.createElement('div');
  div.contentEditable = 'true';
  div.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  div.innerHTML = tplSanitize(html);
  document.body.appendChild(div);
  const r = document.createRange(); r.selectNodeContents(div);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  s.removeAllRanges(); div.remove();
  return ok;
}
function tplPlain(t, vals) {
  if (t.texto) return tplFill(t.texto, vals);
  const d = new DOMParser().parseFromString(tplFillHtml(t.html, vals), 'text/html');
  return (d.body.innerText || d.body.textContent || '').trim();
}
async function tplCopyBody() {
  const t = tplCur(); if (!t) return;
  const v = tplValsFor(t);
  const text = tplPlain(t, v);
  const ok = t.html ? await tplCopyRich(tplFillHtml(t.html, v), text) : await tplCopyRich(tplTextToHtml(text), text);
  const f = tplFaltan(t);
  if (!ok) { copyText(text); return; }
  toast(f.length ? `Copiado · sin rellenar: ${f.map(k => MLAB[k] || k).join(', ')}` : 'Correo copiado ✓');
  tplFlash('copyBody');
}
function tplCopySubject() {
  const t = tplCur(); if (!t) return;
  const s = tplFill(t.asunto, tplValsFor(t));
  const done = () => { toast('Asunto copiado ✓'); tplFlash('copySubj'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, () => copyText(s)); else copyText(s);
}
function tplFlash(id) { const b = document.getElementById(id); if (!b) return; b.classList.add('ok'); setTimeout(() => b.classList.remove('ok'), 900); }
function tplOpenOutlook() {
  const t = tplCur(); if (!t) return;
  const v = tplValsFor(t);
  const q = [];
  if (t.cc) q.push('cc=' + encodeURIComponent(t.cc));
  q.push('subject=' + encodeURIComponent(tplFill(t.asunto, v)));
  q.push('body=' + encodeURIComponent(tplPlain(t, v)));
  const a = document.createElement('a');
  a.href = 'mailto:' + encodeURIComponent(t.para || '').replace(/%40/g, '@').replace(/%2C/gi, ',') + '?' + q.join('&');
  a.click();
  if (t.html) toast('Se abre sin formato. Para conservarlo usa Copiar y pega en Outlook.');
}
function tplWhatsApp() {
  const t = tplCur(); if (!t) return;
  const v = tplValsFor(t);
  const msg = [tplFill(t.asunto, v), tplPlain(t, v)].filter(Boolean).join('\n\n');
  const op = cleanInitials(v.tecnico || '');
  const tel = telWa(tecCfg.tel[op]);
  copyText(msg);
  const url = tecCfg.modo === 'web'
    ? `https://web.whatsapp.com/send?${tel ? 'phone=' + tel + '&' : ''}text=${encodeURIComponent(msg)}`
    : `whatsapp://send?${tel ? 'phone=' + tel + '&' : ''}text=${encodeURIComponent(msg)}`;
  if (tecCfg.modo === 'web') window.open(url, 'whatsapp-web'); else { const a = document.createElement('a'); a.href = url; a.click(); }
}

// ---- Interfaz ----
function renderTpl() {
  const root = document.getElementById('viewTpl');
  if (!root.dataset.shell) {
    root.dataset.shell = '1';
    root.innerHTML = `<div class="tp">
      <div class="tp-top">
        <div class="seg" id="tpSeg"></div>
        <div class="tp-tools">
          <input id="tpSearch" class="tp-search" type="search" placeholder="Buscar en todas…" autocomplete="off">
          <button class="iconbtn" data-act="new" title="Nueva plantilla" aria-label="Nueva plantilla">+</button>
          <button class="iconbtn" data-act="import" title="Importar de Outlook (.oft, .msg)" aria-label="Importar">⤓</button>
          <button class="iconbtn" data-act="more" title="Copia de seguridad" aria-label="Más opciones">⋯</button>
          <div class="tp-menu" id="tpMenu" hidden>
            <button data-act="export">Exportar copia (.json)</button>
            <button data-act="restore">Restaurar copia</button>
          </div>
          <input type="file" id="tpFile" accept=".oft,.msg,.eml,.html,.htm,.txt" multiple hidden>
        </div>
      </div>
      <div class="tp-main">
        <div class="tp-list" id="tpList"></div>
        <div class="tp-view" id="tpView"></div>
      </div>
    </div>`;
    const s = document.getElementById('tpSearch');
    s.addEventListener('input', () => { tplQuery = s.value; tplSel = null; tplRenderList(); tplRenderView(); });
    s.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); s.blur(); tplMove(tplSel ? 0 : 1); } if (e.key === 'Escape') { s.value = ''; s.dispatchEvent(new Event('input')); s.blur(); } });
    document.getElementById('tpFile').addEventListener('change', e => { importTemplateFiles([...e.target.files]); e.target.value = ''; });
    root.addEventListener('click', tplOnClick);
  }
  tplRenderSeg();
  tplRenderList();
  tplRenderView();
}
function tplOnRows() { if (!tplDraft) tplRenderView(); }

function tplRenderSeg() {
  const counts = {}; plantillas.forEach(t => counts[t.cliente] = (counts[t.cliente] || 0) + 1);
  document.getElementById('tpSeg').innerHTML = tplCategorias().map(c =>
    `<button class="segb${c === tplCli && !tplQuery ? ' on' : ''}" data-act="cli" data-v="${esc(c)}">${esc(c)}${counts[c] ? `<i>${counts[c]}</i>` : ''}</button>`).join('');
}
function tplRenderList() {
  const list = tplVisibles();
  if (!tplSel || !list.some(t => t.id === tplSel)) tplSel = !tplDraft && list[0] ? list[0].id : (tplDraft ? tplSel : null);
  const el = document.getElementById('tpList');
  el.innerHTML = list.length
    ? list.map(t => `<button class="tp-item${t.id === tplSel ? ' on' : ''}" data-act="sel" data-v="${t.id}">
        <b>${esc(t.nombre)}</b><span>${tplQuery ? esc(t.cliente) + ' · ' : ''}${esc(t.asunto || 'Sin asunto')}</span></button>`).join('')
    : `<div class="tp-none">${tplQuery ? 'Nada coincide con la búsqueda.' : 'Sin plantillas todavía.'}</div>`;
  const on = el.querySelector('.tp-item.on'); if (on) on.scrollIntoView({ block: 'nearest' });
}

function tplRenderView() {
  const v = document.getElementById('tpView');
  if (!v) return;
  if (tplDraft) { tplRenderEditor(); return; }
  const t = tplCur();
  if (!t) {
    v.innerHTML = `<div class="tp-empty">
      <div class="tp-drop">
        <b>Arrastra aquí tus plantillas de Outlook</b>
        <span>Se guardan en <b>${esc(tplQuery ? tplCli : tplCli)}</b>. Admite .oft, .msg, .eml, .html y .txt (varias a la vez).</span>
        <div class="acts" style="justify-content:center"><button class="btn pri" data-act="import">Elegir archivos</button><button class="btn" data-act="new">Crear o pegar una</button></div>
      </div>
      <details class="tp-help"><summary>¿Cómo saco las plantillas de Outlook?</summary>
        <ul>
          <li><b>Outlook clásico:</b> abre la plantilla o el correo → <i>Archivo → Guardar como</i> → tipo <i>Plantilla de Outlook (*.oft)</i> o <i>Formato de mensaje de Outlook (*.msg)</i>. También puedes arrastrar el correo desde Outlook al escritorio y de ahí aquí.</li>
          <li><b>Outlook nuevo / web ("Mis plantillas"):</b> no deja exportarlas a archivo. Pulsa <i>Crear o pegar una</i>, copia el texto de la plantilla en Outlook y pégalo: se conserva el formato.</li>
        </ul>
      </details>
    </div>`;
    return;
  }
  const vals = tplValsFor(t);
  const campos = tplCampos(t).filter(k => k !== 'cliente' || t.cliente === 'TÉCNICOS');
  const incs = campos.length ? tplIncidencias(t) : [];
  const subj = tplFill(t.asunto, vals, true);
  v.innerHTML = `<div class="tp-card">
    <div class="tp-head">
      <div class="tp-subj" title="Asunto">${t.asunto ? esc(subj).replace(/\u0001/g, '<mark>').replace(/\u0002/g, '</mark>') : '<span class="tp-muted">Sin asunto</span>'}</div>
      ${t.asunto ? '<button class="btn sm" id="copySubj" data-act="copySubj">Copiar asunto</button>' : ''}
    </div>
    ${t.para || t.cc ? `<div class="tp-rcpt">${t.para ? 'Para: ' + esc(t.para) : ''}${t.para && t.cc ? ' · ' : ''}${t.cc ? 'CC: ' + esc(t.cc) : ''}</div>` : ''}
    ${campos.length ? `<div class="tp-fields">
      ${rows.length ? `<label class="tp-f tp-inc"><span>${campos.includes('num') ? 'Nº incidencia · rellena el resto' : 'Rellenar con incidencia'}</span><input list="tpIncs" id="tpInc" placeholder="Nº o sede…" value="${esc(tplVals.num || '')}" autocomplete="off"></label>
        <datalist id="tpIncs">${incs.slice(0, 400).map(r => `<option value="${esc(r.num)}">${esc([r.operario, r.descSede, r.fVisita].filter(Boolean).join(' · '))}</option>`).join('')}</datalist>` : ''}
      ${campos.filter(k => !(k === 'num' && rows.length)).map(k => `<label class="tp-f"><span>${esc(MLAB[k] || k)}</span><input data-k="${esc(k)}" value="${esc(vals[k] || '')}" autocomplete="off"></label>`).join('')}
      ${Object.keys(tplVals).length ? '<button class="tp-clear" data-act="clearVals" title="Vaciar campos">Vaciar</button>' : ''}
    </div>` : ''}
    <div class="tp-body" id="tpBody"></div>
    <div class="tp-actions">
      <button class="btn pri big" id="copyBody" data-act="copyBody">Copiar correo</button>
      ${t.cliente === 'TÉCNICOS' ? '<button class="btn wa" data-act="wa">WhatsApp</button>' : ''}
      <button class="btn" data-act="outlook" title="Abre un correo nuevo con asunto y texto">Abrir en Outlook</button>
      <span class="spacer"></span>
      <button class="btn ghost sm" data-act="edit">Editar</button>
      <button class="btn ghost sm${tplDelArm ? ' danger' : ''}" data-act="del">${tplDelArm ? '¿Eliminar?' : 'Eliminar'}</button>
    </div>
    <div class="tp-keys">Enter copia el correo · ↑ ↓ cambia de plantilla · / busca</div>
  </div>`;
  tplRenderBody(t);
  const upd = () => {
    tplRenderBody(t);
    const s = v.querySelector('.tp-subj'); if (s && t.asunto) s.innerHTML = esc(tplFill(t.asunto, tplValsFor(t), true)).replace(/\u0001/g, '<mark>').replace(/\u0002/g, '</mark>');
  };
  v.querySelectorAll('.tp-fields input[data-k]').forEach(inp => inp.addEventListener('input', () => { tplVals[inp.dataset.k] = inp.value; upd(); }));
  const inc = document.getElementById('tpInc');
  if (inc) {
    inc.addEventListener('input', () => { if (campos.includes('num')) { tplVals.num = inc.value; upd(); } });
    inc.addEventListener('change', () => { if (tplPickInc(inc.value)) { tplRenderView(); toast('Campos rellenados desde la incidencia'); } });
  }
}
function tplRenderBody(t) {
  const host = document.getElementById('tpBody'); if (!host) return;
  const vals = tplValsFor(t);
  if (t.html) {
    let fr = host.querySelector('iframe');
    if (!fr) { fr = document.createElement('iframe'); fr.setAttribute('sandbox', 'allow-same-origin'); fr.title = 'Vista previa'; host.innerHTML = ''; host.appendChild(fr); }
    fr.onload = () => { try { fr.style.height = Math.min(620, fr.contentDocument.documentElement.scrollHeight + 4) + 'px'; } catch (e) {} };
    fr.srcdoc = tplDocHtml(t, vals, true);
  } else {
    host.innerHTML = `<div class="tp-text">${esc(tplFill(t.texto, vals, true)).replace(/\u0001/g, '<mark>').replace(/\u0002/g, '</mark>') || '<span class="tp-muted">Sin texto</span>'}</div>`;
  }
}

// ---- Editor (crear / editar / pegar desde Outlook) ----
function tplNew() {
  tplDraft = { id: tplUid(), cliente: tplCli, nombre: '', asunto: '', para: '', cc: '', texto: '', html: '', isNew: true, dirty: false };
  tplRenderView();
}
function tplEditCur() { const t = tplCur(); if (!t) return; tplDraft = { ...t, isNew: false, dirty: false }; tplRenderView(); }
function tplRenderEditor() {
  const d = tplDraft, v = document.getElementById('tpView');
  v.innerHTML = `<div class="tp-card tp-edit">
    <div class="tp-erow">
      <label class="tp-f grow"><span>Nombre</span><input id="eNombre" value="${esc(d.nombre)}" placeholder="p. ej. Confirmación de visita"></label>
      <label class="tp-f"><span>Cliente</span><select id="eCli">${tplCategorias().map(c => `<option${c === d.cliente ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
    </div>
    <label class="tp-f"><span>Asunto</span><input id="eAsunto" value="${esc(d.asunto)}"></label>
    <details class="tp-det"${d.para || d.cc ? ' open' : ''}><summary>Destinatarios (opcional)</summary>
      <div class="tp-erow"><label class="tp-f grow"><span>Para</span><input id="ePara" value="${esc(d.para || '')}" placeholder="correo@cliente.com; otro@…"></label>
      <label class="tp-f grow"><span>CC</span><input id="eCc" value="${esc(d.cc || '')}"></label></div>
    </details>
    <div class="tp-f"><span>Texto · pega desde Outlook y se conserva el formato</span>
      <div id="eBody" class="tp-editor" contenteditable="true"></div></div>
    <div class="tp-ins"><span>Insertar campo:</span>${Object.keys(MLAB).map(k => `<button class="chip sm" data-act="ins" data-v="${k}" title="${esc(MLAB[k])}">{${k}}</button>`).join('')}</div>
    <div class="tp-actions">
      <button class="btn pri" data-act="saveDraft">Guardar</button>
      <button class="btn" data-act="cancelDraft">Cancelar</button>
    </div>
  </div>`;
  const body = document.getElementById('eBody');
  body.innerHTML = d.html ? tplSanitize(d.html) : tplTextToHtml(d.texto);
  body.addEventListener('input', () => { d.dirty = true; });
  body.addEventListener('focus', () => tplLastFocus = body);
  ['eAsunto'].forEach(id => document.getElementById(id).addEventListener('focus', e => tplLastFocus = e.target));
  document.getElementById(d.nombre ? 'eAsunto' : 'eNombre').focus();
}
let tplLastFocus = null;
function tplInsertField(k) {
  const el = tplLastFocus || document.getElementById('eBody');
  el.focus();
  if (el.isContentEditable) { document.execCommand('insertText', false, '{' + k + '}'); tplDraft.dirty = true; }
  else { const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s; el.value = el.value.slice(0, s) + '{' + k + '}' + el.value.slice(e); el.setSelectionRange(s + k.length + 2, s + k.length + 2); }
}
function tplSaveDraft() {
  const d = tplDraft;
  d.nombre = document.getElementById('eNombre').value.trim();
  d.cliente = document.getElementById('eCli').value;
  d.asunto = document.getElementById('eAsunto').value;
  d.para = document.getElementById('ePara').value.trim();
  d.cc = document.getElementById('eCc').value.trim();
  if (!d.nombre) { toast('Ponle un nombre'); document.getElementById('eNombre').focus(); return; }
  const body = document.getElementById('eBody');
  // Si el texto no se tocó, se conserva el HTML original de Outlook completo (con sus estilos).
  if (d.dirty || d.isNew || !d.html) {
    const clean = tplSanitize(body.innerHTML);
    const rich = /<(b|strong|i|em|u|table|img|a|span|font|ul|ol|h\d)[\s>]/i.test(clean);
    d.html = rich ? clean : '';
    d.texto = body.innerText.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }
  const isNew = d.isNew; delete d.isNew; delete d.dirty;
  if (isNew) plantillas.push(d); else plantillas = plantillas.map(t => t.id === d.id ? d : t);
  tplSave();
  tplCli = d.cliente; tplSel = d.id; tplDraft = null; tplQuery = '';
  const s = document.getElementById('tpSearch'); if (s) s.value = '';
  renderTpl();
  toast(isNew ? 'Plantilla creada' : 'Plantilla guardada');
}

// ---- Acciones ----
function tplOnClick(e) {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, val = b.dataset.v;
  const menu = document.getElementById('tpMenu');
  if (act !== 'more' && menu) menu.hidden = true;
  switch (act) {
    case 'cli': tplCli = val; tplQuery = ''; document.getElementById('tpSearch').value = ''; tplSel = null; tplDraft = null; tplDelArm = false; try { localStorage.setItem(TPL_CLI_KEY, val); } catch (er) {} renderTpl(); break;
    case 'sel': tplSel = val; tplDraft = null; tplDelArm = false; tplRenderList(); tplRenderView(); break;
    case 'new': tplNew(); break;
    case 'import': document.getElementById('tpFile').click(); break;
    case 'more': menu.hidden = !menu.hidden; break;
    case 'export': exportBackup(); break;
    case 'restore': document.getElementById('backupInput').click(); break;
    case 'copyBody': tplCopyBody(); break;
    case 'copySubj': tplCopySubject(); break;
    case 'outlook': tplOpenOutlook(); break;
    case 'wa': tplWhatsApp(); break;
    case 'edit': tplEditCur(); break;
    case 'del':
      if (!tplDelArm) { tplDelArm = true; tplRenderView(); setTimeout(() => { if (tplDelArm) { tplDelArm = false; tplRenderView(); } }, 3000); break; }
      tplDelArm = false; plantillas = plantillas.filter(t => t.id !== tplSel); tplSave(); tplSel = null; renderTpl(); toast('Plantilla eliminada'); break;
    case 'clearVals': tplVals = {}; tplRenderView(); break;
    case 'ins': tplInsertField(val); break;
    case 'saveDraft': tplSaveDraft(); break;
    case 'cancelDraft': tplDraft = null; tplRenderList(); tplRenderView(); break;
  }
}
function tplMove(delta) {
  const list = tplVisibles(); if (!list.length) return;
  const i = list.findIndex(t => t.id === tplSel);
  const n = Math.max(0, Math.min(list.length - 1, (i === -1 ? -1 : i) + delta));
  tplSel = list[n].id; tplDelArm = false; tplRenderList(); tplRenderView();
}
document.addEventListener('keydown', e => {
  if (document.getElementById('viewTpl').style.display === 'none' || tplDraft) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); tplMove(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); tplMove(-1); }
  else if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && tag !== 'button') { e.preventDefault(); tplCopyBody(); }
  else if (e.key === '/') { e.preventDefault(); document.getElementById('tpSearch').focus(); }
});

// ===== Copia de seguridad (.json) =====
function exportBackup() {
  const data = { app: 'panel-despacho', version: 2, fecha: new Date().toISOString(), plantillas, tecnicos: tecCfg };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'), d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = `despacho-plantillas-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Copia exportada');
}
document.getElementById('backupInput').addEventListener('change', e => { const f = e.target.files[0]; if (f) restoreBackup(f); e.target.value = ''; });
function restoreBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      let inc = [];
      if (Array.isArray(d.plantillas)) inc = d.plantillas;
      else if (Array.isArray(d.clientes) || Array.isArray(d.recordatorios)) {   // copia de la versión anterior
        (d.clientes || []).forEach(c => (c.tpls || []).forEach(t => inc.push({ id: t.id, cliente: tplNormCli(c.nombre), nombre: t.nombre, asunto: t.asunto || '', texto: t.cuerpo || '', html: '' })));
        (d.recordatorios || []).forEach(t => inc.push({ id: t.id, cliente: 'TÉCNICOS', nombre: t.nombre, asunto: t.asunto || '', texto: t.cuerpo || '', html: '' }));
      } else throw new Error('formato no reconocido');
      const m = new Map(plantillas.map(x => [x.id, x]));
      inc.filter(x => x && x.nombre).forEach(x => m.set(x.id || tplUid(), { ...x, id: x.id || tplUid() }));
      plantillas = [...m.values()]; tplSave();
      if (d.tecnicos && typeof d.tecnicos === 'object') { tecCfg = { ...tecCfg, ...d.tecnicos, tel: { ...tecCfg.tel, ...(d.tecnicos.tel || {}) } }; saveTec(); }
      showTab('tpl');
      toast(`Restauradas ${inc.length} plantillas`);
    } catch (err) { toast('No se pudo restaurar: ' + err.message); }
  };
  reader.readAsText(file);
}

// ===== Importación de archivos de Outlook =====
async function importTemplateFiles(files) {
  const ok = [], fail = [];
  for (const f of files) {
    if (!TPL_EXT.test(f.name)) { fail.push(f.name); continue; }
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const ext = f.name.split('.').pop().toLowerCase();
      const p = ext === 'oft' || ext === 'msg' ? tplParseMsg(buf)
        : ext === 'eml' ? tplParseEml(tplDecode(buf))
        : ext === 'txt' ? tplParseTxt(tplDecode(buf))
        : tplParseHtmlFile(tplDecode(buf));
      if (!p.html && !p.texto && !p.asunto) throw new Error('vacía');
      const html = p.html ? tplCleanOutlookHtml(p.html) : '';
      ok.push({ id: tplUid(), cliente: tplCli, nombre: f.name.replace(/\.[^.]+$/, ''), asunto: p.asunto || '', para: p.para || '', cc: p.cc || '', html, texto: (p.texto || '').replace(/\r\n/g, '\n').trim() });
    } catch (e) { console.warn('No se pudo importar', f.name, e); fail.push(f.name); }
  }
  if (ok.length) {
    plantillas.push(...ok); tplSave();
    tplSel = ok[0].id; tplQuery = ''; tplDraft = null;
    const s = document.getElementById('tpSearch'); if (s) s.value = '';
  }
  showTab('tpl');
  toast(ok.length ? `${ok.length} plantilla${ok.length === 1 ? '' : 's'} importada${ok.length === 1 ? '' : 's'} en ${tplCli}${fail.length ? ` · ${fail.length} con error: ${fail.join(', ')}` : ''}` : `No se pudo importar: ${fail.join(', ')}`);
}

function tplDecode(buf, charset) {
  if (charset) { try { return new TextDecoder(charset).decode(buf); } catch (e) {} }
  if (buf[0] === 0xFF && buf[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf);
  const head = new TextDecoder('ascii').decode(buf.slice(0, 2048));
  const m = /charset=["']?([\w-]+)/i.exec(head);
  if (m) { try { return new TextDecoder(m[1]).decode(buf); } catch (e) {} }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return new TextDecoder('windows-1252').decode(buf); }
}
// Quita lo que no aporta al pegar en Outlook (comentarios condicionales, imágenes incrustadas cid:).
// También quita scripts y atributos de eventos, pero conserva los estilos del <head>.
function tplCleanOutlookHtml(html) {
  const src = String(html).replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '').replace(/<img[^>]+src=["']?cid:[^>]*>/gi, '');
  const doc = new DOMParser().parseFromString(src, 'text/html');
  doc.querySelectorAll('script,iframe,object,embed,form,base,link[rel=import],meta[http-equiv=refresh]').forEach(n => n.remove());
  doc.querySelectorAll('*').forEach(el => [...el.attributes].forEach(a => {
    if (/^on/i.test(a.name) || (/^(href|src|action)$/i.test(a.name) && /^\s*(javascript|vbscript|data:text)/i.test(a.value))) el.removeAttribute(a.name);
  }));
  return '<!doctype html>' + doc.documentElement.outerHTML;
}

// .oft / .msg: archivos de Outlook (formato Compound File). Se usa el lector CFB incluido en SheetJS.
function tplParseMsg(buf) {
  if (typeof XLSX === 'undefined' || !XLSX.CFB) throw new Error('lector no disponible');
  const cfb = XLSX.CFB.read(buf, { type: 'array' });
  const paths = cfb.FullPaths, files = cfb.FileIndex;
  const root = paths[0];
  const at = (dir, name) => { const i = paths.findIndex(p => p.toLowerCase() === (dir + name).toLowerCase()); return i >= 0 ? files[i].content : null; };
  const bytes = c => c ? (c instanceof Uint8Array ? c : Uint8Array.from(c)) : null;
  const str = (dir, id) => {
    const u = bytes(at(dir, '__substg1.0_' + id + '001F'));
    if (u) return new TextDecoder('utf-16le').decode(u).replace(/\0+$/, '');
    const a = bytes(at(dir, '__substg1.0_' + id + '001E'));
    return a ? new TextDecoder('windows-1252').decode(a).replace(/\0+$/, '') : '';
  };
  const asunto = str(root, '0037');
  const texto = str(root, '1000');
  let html = '';
  const hb = bytes(at(root, '__substg1.0_10130102'));
  if (hb) html = tplDecode(hb);
  else if (str(root, '1013')) html = str(root, '1013');
  if (!html) {
    const rtf = bytes(at(root, '__substg1.0_10090102'));
    if (rtf) { const r = tplRtf(tplLzfu(rtf)); if (r.html) html = r.html; else if (!texto) return { asunto, texto: r.text, html: '', para: '', cc: '' }; }
  }
  // Destinatarios guardados en la plantilla (Para / CC)
  const para = [], cc = [];
  paths.forEach((p, i) => {
    if (!/__recip_version1\.0_#[0-9a-f]{8}\/$/i.test(p) || p.split('/').length !== root.split('/').length + 1) return;
    const mail = str(p, '39FE') || str(p, '3003') || str(p, '3001');
    if (!mail) return;
    let tipo = 1;
    const props = bytes(at(p, '__properties_version1.0'));
    if (props) { const dv = new DataView(props.buffer, props.byteOffset, props.byteLength); for (let o = 8; o + 16 <= props.length; o += 16) if (dv.getUint32(o, true) === 0x0C150003) { tipo = dv.getInt32(o + 8, true); break; } }
    (tipo === 2 ? cc : tipo === 1 ? para : []).push(mail);
  });
  return { asunto, texto, html, para: para.join('; '), cc: cc.join('; ') };
}

// Descompresión LZFu del cuerpo RTF de Outlook (MS-OXRTFCP).
function tplLzfu(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const comp = dv.getUint32(0, true), raw = dv.getUint32(4, true), magic = dv.getUint32(8, true);
  if (magic === 0x414C454D) return buf.slice(16, 16 + raw);   // "MELA": sin comprimir
  const PRE = '{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\fswiss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New RomanCourier{\\colortbl\\red0\\green0\\blue0\r\n\\par \\pard\\plain\\f0\\fs20\\b\\i\\u\\tab\\tx';
  const dict = new Uint8Array(4096); for (let i = 0; i < PRE.length; i++) dict[i] = PRE.charCodeAt(i);
  let wp = PRE.length, p = 16; const end = Math.min(buf.length, comp + 4), out = [];
  while (p < end) {
    const flags = buf[p++];
    for (let b = 0; b < 8 && p < end; b++) {
      if (flags & (1 << b)) {
        const v = (buf[p] << 8) | buf[p + 1]; p += 2;
        const off = v >> 4, len = (v & 15) + 2;
        if (off === wp) return Uint8Array.from(out);
        for (let k = 0; k < len; k++) { const c = dict[(off + k) & 4095]; out.push(c); dict[wp] = c; wp = (wp + 1) & 4095; }
      } else { const c = buf[p++]; out.push(c); dict[wp] = c; wp = (wp + 1) & 4095; }
    }
  }
  return Uint8Array.from(out);
}
// RTF → HTML (si Outlook lo encapsuló con \fromhtml) o texto plano.
function tplRtf(bytes) {
  const s = new TextDecoder('latin1').decode(bytes);
  const fromHtml = /\\fromhtml1/.test(s.slice(0, 400));
  const cp = new TextDecoder('windows-1252');
  const SKIP = /^(fonttbl|colortbl|stylesheet|info|pict|object|header|footer|xmlnstbl|listtable|listoverridetable|rsidtbl|generator|themedata|colorschememapping|latentstyles|datastore)$/;
  let out = '', i = 0, uc = 1;
  const stack = []; let st = { skip: false, dest: false, html: false };
  while (i < s.length) {
    const ch = s[i];
    if (ch === '{') { stack.push(st); st = { ...st, first: true }; i++; continue; }
    if (ch === '}') { st = stack.pop() || { skip: false, dest: false, html: false }; i++; continue; }
    if (ch === '\\') {
      const nx = s[i + 1];
      if (nx === '\\' || nx === '{' || nx === '}') { if (!st.dest && !st.skip) out += nx; i += 2; st.first = false; continue; }
      if (nx === "'") { if (!st.dest && !st.skip) out += cp.decode(Uint8Array.of(parseInt(s.substr(i + 2, 2), 16))); i += 4; st.first = false; continue; }
      if (nx === '*') { st.star = true; i += 2; continue; }
      const m = /^\\([a-z]+)(-?\d+)? ?/i.exec(s.slice(i, i + 40));
      if (!m) { i++; continue; }
      i += m[0].length;
      const w = m[1], n = m[2] != null ? +m[2] : null;
      if (st.first || st.star) {
        if (w === 'htmltag') { st.dest = false; st.skip = false; st.html = true; }
        else if (st.star || SKIP.test(w)) st.dest = true;
      }
      st.first = false; st.star = false;
      if (st.dest) continue;
      if (w === 'htmlrtf') { st.skip = n !== 0; continue; }
      if (st.skip) continue;
      if (w === 'par' || w === 'line') out += fromHtml && !st.html ? '' : '\n';
      else if (w === 'tab') out += '\t';
      else if (w === 'uc') uc = n || 1;
      else if (w === 'u') { out += String.fromCharCode(n < 0 ? n + 65536 : n); i += uc; }
      continue;
    }
    if (ch === '\r' || ch === '\n') { i++; continue; }
    if (!st.dest && !st.skip) out += ch;
    st.first = false; i++;
  }
  return fromHtml ? { html: out, text: '' } : { html: '', text: out.trim() };
}

// .eml (correo guardado): cabeceras + partes MIME.
function tplParseEml(src) {
  const [head, ...rest] = src.split(/\r?\n\r?\n/);
  const hdr = tplHeaders(head);
  const part = tplMimeBest(hdr, rest.join('\n\n'));
  return { asunto: tplWord(hdr.subject || ''), para: tplWord(hdr.to || ''), cc: tplWord(hdr.cc || ''), html: part.html, texto: part.text };
}
function tplHeaders(h) {
  const o = {};
  h.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/).forEach(l => { const m = /^([\w-]+):\s*(.*)$/.exec(l); if (m) o[m[1].toLowerCase()] = m[2]; });
  return o;
}
function tplWord(s) {   // =?utf-8?B?...?= / =?iso-8859-1?Q?...?=
  return s.replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi, (m, cs, enc, txt) => {
    try {
      const bytes = enc.toLowerCase() === 'b' ? Uint8Array.from(atob(txt), c => c.charCodeAt(0))
        : Uint8Array.from(txt.replace(/_/g, ' ').replace(/=([0-9a-f]{2})/gi, (x, h) => String.fromCharCode(parseInt(h, 16))), c => c.charCodeAt(0));
      return new TextDecoder(cs).decode(bytes);
    } catch (e) { return txt; }
  }).replace(/\?=\s+=\?/g, '');
}
function tplMimeBest(hdr, body) {
  const ct = hdr['content-type'] || 'text/plain';
  const bnd = /boundary="?([^";]+)"?/i.exec(ct);
  if (/multipart/i.test(ct) && bnd) {
    let html = '', text = '';
    body.split('--' + bnd[1]).slice(1).forEach(chunk => {
      if (/^--/.test(chunk)) return;
      const c = chunk.replace(/^\r?\n/, '');
      const idx = c.search(/\r?\n\r?\n/); if (idx < 0) return;
      const r = tplMimeBest(tplHeaders(c.slice(0, idx)), c.slice(idx).replace(/^\r?\n\r?\n/, ''));
      html = html || r.html; text = text || r.text;
    });
    return { html, text };
  }
  const cs = (/charset="?([\w-]+)/i.exec(ct) || [])[1] || 'utf-8';
  const te = (hdr['content-transfer-encoding'] || '').toLowerCase();
  let bytes;
  if (te === 'base64') bytes = Uint8Array.from(atob(body.replace(/\s+/g, '')), c => c.charCodeAt(0));
  else if (te === 'quoted-printable') bytes = Uint8Array.from(body.replace(/=\r?\n/g, '').replace(/=([0-9a-f]{2})/gi, (x, h) => String.fromCharCode(parseInt(h, 16))), c => c.charCodeAt(0) & 255);
  else bytes = Uint8Array.from(body, c => c.charCodeAt(0) & 255);
  const dec = tplDecode(bytes, cs);
  return /text\/html/i.test(ct) ? { html: dec, text: '' } : /text\/plain/i.test(ct) ? { html: '', text: dec } : { html: '', text: '' };
}
// .txt guardado desde Outlook: cabecera "Asunto:" / "Para:" y luego el texto.
function tplParseTxt(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const o = { asunto: '', para: '', cc: '', html: '' };
  let i = 0;
  for (; i < Math.min(lines.length, 12); i++) {
    const m = /^(Asunto|Subject|Para|To|CC|De|From|Enviado|Sent|Importancia|Importance)\s*:\s*(.*)$/i.exec(lines[i]);
    if (!m) break;
    const k = m[1].toLowerCase();
    if (k === 'asunto' || k === 'subject') o.asunto = m[2].trim();
    else if (k === 'para' || k === 'to') o.para = m[2].trim();
    else if (k === 'cc') o.cc = m[2].trim();
  }
  o.texto = lines.slice(i).join('\n').trim();
  return o;
}
function tplParseHtmlFile(src) {
  const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(src);
  const tmp = document.createElement('textarea'); tmp.innerHTML = t ? t[1].trim() : '';
  return { asunto: tmp.value, html: src, texto: '' };
}
