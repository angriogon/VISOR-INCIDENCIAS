// Sincronización ATGO → Panel de Despacho.
// Se ejecuta DENTRO de la pestaña de https://atgo.tier1.es (lanzado con el marcador "Despacho ATGO"),
// usa la sesión ya iniciada, descarga los tickets de los estados y operarios configurados
// y los envía a la ventana de Despacho con postMessage. El token de ATGO nunca sale de esta pestaña.
(function () {
  'use strict';

  // ===== Configuración =====
  const OPERARIOS = ['DSG','ACAB','CLH','JGAM','JCGM','LGV','ADJC','LEOC','IFF','JVR','ILG','MMHG','FMNT','EACL','AAR','DSJ','JRHG','JIFC','PHEP','MLOR','AMRG'];
  // PRESENCIAL, PUESTO OPERATIVO, FUERA DE MANTENIMIENTO, MATERIAL PTE. FABRICANTE,
  // PTE. MOVER MATERIAL, EN FABRICANTE, ESCALADO TIER1
  const ESTADOS = [10, 20, 30, 40, 80, 100, 110];
  const PAGE_SIZE = 20;            // páginas más grandes provocan 504 en el servidor de ATGO
  const PARALELO = 2;              // peticiones simultáneas (no sobrecargar ATGO)
  const REFRESCO_MIN = 5;          // minutos entre el final de una carga y el inicio de la siguiente
  const TIMEOUT_MS = 120000;

  if (location.hostname !== 'atgo.tier1.es') { alert('Abre primero https://atgo.tier1.es e inicia sesión.'); return; }

  // Si ya está en marcha, solo forzamos una actualización.
  if (window.__despachoSync) { window.__despachoSync.refreshNow(); return; }

  const scriptSrc = (document.currentScript && document.currentScript.src) || window.__despachoPwaUrl || 'https://angriogon.github.io/VISOR-INCIDENCIAS/atgo-sync.js';
  const PWA_URL = new URL('./', scriptSrc).href;
  const PWA_ORIGIN = new URL(PWA_URL).origin;
  const WIN_NAME = 'despacho-visor';

  let pwaWin = null;
  let lastPayload = null;
  let running = false;
  let timer = null;
  let stopped = false;

  // ===== Indicador flotante dentro de ATGO =====
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483647;background:#1b2126;color:#e8ecef;font:12px/1.4 system-ui,sans-serif;border:1px solid #c9862b;border-radius:9px;padding:8px 10px;box-shadow:0 4px 16px rgba(0,0,0,.3);display:flex;gap:8px;align-items:center;max-width:360px';
  box.innerHTML = '<b style="color:#c9862b">Despacho</b><span data-s>Iniciando…</span>' +
    '<button data-r style="font:inherit;background:none;color:#e8ecef;border:1px solid #2c353c;border-radius:6px;padding:2px 7px;cursor:pointer" title="Actualizar ahora">⟳</button>' +
    '<button data-o style="font:inherit;background:none;color:#e8ecef;border:1px solid #2c353c;border-radius:6px;padding:2px 7px;cursor:pointer" title="Abrir Despacho">↗</button>' +
    '<button data-x style="font:inherit;background:none;color:#8b98a3;border:1px solid #2c353c;border-radius:6px;padding:2px 7px;cursor:pointer" title="Detener sincronización">✕</button>';
  document.body.appendChild(box);
  const statusEl = box.querySelector('[data-s]');
  const setStatus = (t, err) => { statusEl.textContent = t; statusEl.style.color = err ? '#ff8a7a' : ''; send({ type: 'atgo-status', text: t, error: !!err }); };
  box.querySelector('[data-r]').onclick = () => refreshNow();
  box.querySelector('[data-o]').onclick = () => openPwa(true);
  box.querySelector('[data-x]').onclick = () => { stopped = true; clearTimeout(timer); send({ type: 'atgo-status', text: 'Sincronización detenida', error: true }); box.remove(); delete window.__despachoSync; };

  // ===== Comunicación con Despacho =====
  function openPwa(focus) {
    // Reutiliza la ventana de Despacho si ya existe; si no, la abre.
    if (!pwaWin || pwaWin.closed) {
      const w = window.open('', WIN_NAME);
      if (!w) { setStatus('El navegador bloqueó la ventana de Despacho. Pulsa ↗.', true); return; }
      let blank = false;
      try { blank = w.location.href === 'about:blank'; } catch (e) { blank = false; /* ya es Despacho (otro origen) */ }
      if (blank) w.location.href = PWA_URL + '#inc';
      pwaWin = w;
    }
    if (focus) try { pwaWin.focus(); } catch (e) {}
  }
  function targets() {
    const t = [];
    if (window.opener && !window.opener.closed) t.push(window.opener); // Despacho abrió esta pestaña
    if (pwaWin && !pwaWin.closed && pwaWin !== window.opener) t.push(pwaWin);
    return t;
  }
  function send(msg) {
    for (const w of targets()) { try { w.postMessage(msg, PWA_ORIGIN); } catch (e) {} }
  }
  window.addEventListener('message', (e) => {
    if (e.origin !== PWA_ORIGIN || !e.data) return;
    if (e.data.type === 'despacho-ready') {
      if (!targets().includes(e.source)) pwaWin = e.source;
      if (lastPayload) e.source.postMessage(lastPayload, PWA_ORIGIN);
      else if (running) e.source.postMessage({ type: 'atgo-status', text: statusEl.textContent }, PWA_ORIGIN);
    } else if (e.data.type === 'despacho-refresh') {
      refreshNow();
    }
  });

  // ===== Lectura de la API de ATGO =====
  function token() {
    let t = localStorage.getItem('token');
    try { const j = JSON.parse(t); if (typeof j === 'string') t = j; } catch (e) {}
    return t;
  }
  function sessionExpired() {
    const exp = Number(localStorage.getItem('expires'));
    return !token() || (exp && exp * 1000 < Date.now());
  }
  async function getPage(page) {
    const q = 'estado.in=' + ESTADOS.join('-');
    const url = '/api/v1/atgo/incidencias/listado?page=' + page + '&size=' + PAGE_SIZE + '&sort=fechaRegistro,asc&q=' + q;
    for (let intento = 1; intento <= 2; intento++) {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token(), Accept: 'application/json' }, signal: ctrl.signal });
        if (r.status === 401 || r.status === 403) throw Object.assign(new Error('Sesión de ATGO caducada. Vuelve a iniciar sesión y pulsa ⟳.'), { fatal: true });
        if (!r.ok) throw new Error('ATGO respondió ' + r.status);
        return await r.json();
      } catch (e) {
        if (e.fatal || intento === 2) throw e;
      } finally { clearTimeout(to); }
    }
  }
  const ymdToEs = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
  const hhmm = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
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
      descSede: t.sedeDescripcion || '',
      referencia: t.suReferencia || t.referencia || '',
      operario: String(t.codOpe || '').trim().toUpperCase(),
      desOperario: t.desOpe || '',
      estado: t.desEstado || '',
      descCliente: t.desCli || '',
      tipo: t.desTipoEle || '',
      domicilio: dir
    };
  }

  async function syncOnce() {
    if (running || stopped) return;
    if (sessionExpired()) { setStatus('Sesión de ATGO caducada. Vuelve a iniciar sesión y pulsa ⟳.', true); return; }
    running = true;
    const t0 = Date.now();
    const found = new Map();
    let total = 0, pages = 1, done = 0, firstLoad = !lastPayload;
    try {
      setStatus('Cargando página 1…');
      const first = await getPage(0);
      total = first.totalElements || 0;
      pages = first.totalPages || 1;
      const add = (d) => (d.content || []).forEach(t => { if (OPERARIOS.includes(String(t.codOpe || '').trim().toUpperCase())) { const m = mapTicket(t); found.set(m.key, m); } });
      add(first); done = 1;
      let next = 1;
      const worker = async () => {
        while (next < pages && !stopped) {
          const p = next++;
          add(await getPage(p));
          done++;
          setStatus('Cargando ' + done + '/' + pages + ' páginas · ' + found.size + ' incidencias');
          if (firstLoad) send({ type: 'atgo-data', partial: true, rows: [...found.values()], at: Date.now(), progress: done + '/' + pages });
        }
      };
      await Promise.all(Array.from({ length: Math.min(PARALELO, pages - 1) }, worker));
      if (stopped) return;
      lastPayload = { type: 'atgo-data', partial: false, rows: [...found.values()], at: Date.now(), totalAtgo: total, seconds: Math.round((Date.now() - t0) / 1000) };
      send(lastPayload);
      const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      setStatus(found.size + ' incidencias · ' + hora + ' · próxima en ' + REFRESCO_MIN + ' min');
    } catch (e) {
      setStatus('Error: ' + e.message, true);
    } finally {
      running = false;
      clearTimeout(timer);
      if (!stopped) timer = setTimeout(syncOnce, REFRESCO_MIN * 60000);
    }
  }
  function refreshNow() { clearTimeout(timer); syncOnce(); }

  window.__despachoSync = { refreshNow };
  let opened = false;
  const sinOpener = !window.opener || window.opener.closed;
  if (sinOpener) { openPwa(false); opened = true; }
  else {
    // ¿La pestaña la abrió Despacho? Si responde, no hace falta abrir otra ventana.
    try { window.opener.postMessage({ type: 'atgo-hello' }, PWA_ORIGIN); } catch (e) {}
    setTimeout(() => {
      if (!opened && !pwaWin) setStatus('No encuentro Despacho. Pulsa ↗ para abrirlo.', true);
    }, 2500);
  }
  window.addEventListener('message', (e) => { if (e.origin === PWA_ORIGIN) opened = true; });
  syncOnce();
})();
