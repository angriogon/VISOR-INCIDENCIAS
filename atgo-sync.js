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
  // ATGO tarda ~0,5 s por ticket devuelto. Pedir por operario (codOpe.equals) trae solo nuestros
  // tickets (~100 de ~600) y las consultas en paralelo no se estorban: la carga baja de ~3 min a ~20 s.
  // (codOpe.in no funciona en ATGO: ignora el filtro; y sin "sort" la consulta es mucho más lenta.)
  const PAGE_SIZE = 100;           // por operario; si alguno tuviera más, se piden más páginas
  const PARALELO = 6;              // consultas simultáneas
  const REFRESCO_MIN = 2;          // minutos entre el final de una carga y el inicio de la siguiente
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
    } else if (e.data.type === 'despacho-hilo' && Array.isArray(e.data.keys)) {
      enviarHilos(e.data.keys, e.source);
    }
  });

  // ===== Hilo de cada ticket (motivo de apertura y comentarios) =====
  // Responde en ~50 ms por ticket; Despacho lo pide solo para tickets nuevos, cambiados o al abrir su ficha.
  const isoTs = (s) => { const d = new Date(String(s || '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2')); return isNaN(d) ? 0 : d.getTime(); };
  async function getHilo(key) {
    const [p, s, c] = key.split('/');
    const url = '/api/v1/atgo/hilo/' + encodeURIComponent(p) + '/' + encodeURIComponent(s) + '/' + encodeURIComponent(c);
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token(), Accept: 'application/json' } });
    if (!r.ok) throw new Error('ATGO respondió ' + r.status);
    const d = await r.json();
    return (Array.isArray(d) ? d : []).map(x => ({
      ts: isoTs(x.hiloIncidenciaId && x.hiloIncidenciaId.fechaRegistro),
      u: x.usuario || '', n: x.nombre || '', e: x.estado || '',
      t: String(x.descripcion || '').trim()
    }));
  }
  async function enviarHilos(keys, dest) {
    const cola = [...new Set(keys)].filter(k => /^\d+\/[^/]+\/\d+$/.test(k)).slice(0, 300);
    const out = {};
    const worker = async () => {
      while (cola.length) {
        const k = cola.shift();
        try { out[k] = { at: Date.now(), items: await getHilo(k) }; } catch (e) { out[k] = { error: e.message }; }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALELO, cola.length) }, worker));
    try { dest.postMessage({ type: 'atgo-hilo', hilos: out }, PWA_ORIGIN); } catch (e) {}
  }

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
  async function getPage(op, page) {
    const q = 'estado.in=' + ESTADOS.join('-') + ',codOpe.equals=' + encodeURIComponent(op);
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
    let done = 0, firstLoad = !lastPayload;
    try {
      setStatus('Cargando 0/' + OPERARIOS.length + ' técnicos…');
      const add = (d) => (d.content || []).forEach(t => { if (OPERARIOS.includes(String(t.codOpe || '').trim().toUpperCase())) { const m = mapTicket(t); found.set(m.key, m); } });
      const cola = OPERARIOS.slice();
      const worker = async () => {
        while (cola.length && !stopped) {
          const op = cola.shift();
          for (let page = 0; ; page++) {
            const d = await getPage(op, page);
            add(d);
            if (d.last !== false || !(d.content || []).length) break;
          }
          done++;
          setStatus('Cargando ' + done + '/' + OPERARIOS.length + ' técnicos · ' + found.size + ' incidencias');
          if (firstLoad) send({ type: 'atgo-data', partial: true, rows: [...found.values()], at: Date.now(), progress: done + '/' + OPERARIOS.length });
        }
      };
      // Si falla algún operario se descarta la carga entera: así nunca parece que sus tickets "salieron".
      await Promise.all(Array.from({ length: Math.min(PARALELO, cola.length) }, worker));
      if (stopped) return;
      lastPayload = { type: 'atgo-data', partial: false, rows: [...found.values()], at: Date.now(), seconds: Math.round((Date.now() - t0) / 1000) };
      send(lastPayload);
      const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      setStatus(found.size + ' incidencias · ' + hora + ' (' + lastPayload.seconds + ' s) · próxima en ' + REFRESCO_MIN + ' min');
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
