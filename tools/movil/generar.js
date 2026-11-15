// Genera movil.js desde tools/movil/plantilla.js: los marcadores /*@f|@b|@l archivo cabecera*/ se sustituyen por copias
// literales de la PWA y de atgo-sync.js (tests/pruebas.js exige que sigan idénticas). Después: node tools/firmar-sync.mjs
// Uso: node tools/movil/generar.js
const fs = require('fs'), path = require('path'), R = path.resolve(__dirname, '../..') + '/', P = path.join(__dirname, 'plantilla.js');
const leer = f => fs.readFileSync(R + f, 'utf8').replace(/\r\n/g, '\n');
const cogeF = (src, cab) => { const i = src.indexOf(cab); if (i < 0) throw new Error('No encuentro ' + cab); let j = src.indexOf('{', i), p = 0, k = j, c = null; for (; k < src.length; k++) { const x = src[k]; if (c) { if (x === '\\') { k++; continue; } if (x === c) c = null; continue; } if (x === '"' || x === "'" || x === '`') { c = x; continue; } if (x === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; } if (x === '{') p++; if (x === '}' && --p === 0) break; } return src.slice(i, k + 1); };
const cogeL = (src, cab) => { const i = src.indexOf(cab); if (i < 0) throw new Error('No encuentro ' + cab); const m = /;\n/.exec(src.slice(i)); return src.slice(i, i + m.index + 1); };
const cogeB = (src, cab) => { const i = src.indexOf(cab); if (i < 0) throw new Error('No encuentro ' + cab); const m = /[\]}];(?=[ \t]*(\/\/[^\n]*)?\n)/.exec(src.slice(i)); return src.slice(i, i + m.index + 2); };
const COGE = { f: cogeF, l: cogeL, b: cogeB };
let t = fs.readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
if (!t.includes('PROV_ZONA =')) t = t.replace('/*@b herramientas.js const PROV_RE =*/', '/*@l herramientas.js const PROV_ZONA =*/\n/*@b herramientas.js const PROV_RE =*/');
fs.writeFileSync(P, t);
t = t.replace(/\/\*@([fbl]) (\S+) (.+?)\*\//g, (m, modo, f, cab) => { const x = COGE[modo](leer(f), cab); return f === 'atgo-sync.js' && cab === 'const ESTADOS =' ? x.replace(/^const ESTADOS = /, '').replace(/;$/, '') : x; });
fs.writeFileSync(R + 'movil.js', t);
