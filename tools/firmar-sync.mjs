// Firma atgo-sync.js y movil.js para que la extensión y el favorito del móvil solo ejecuten lo publicado por el responsable. Sin dependencias.
// Uso: node tools/firmar-sync.mjs            → escribe atgo-sync.firma.json
//      node tools/firmar-sync.mjs --generar  → crea la clave (solo la primera vez) e imprime la parte pública
// La clave privada vive fuera del repositorio y nunca se imprime ni se sube a GitHub (ruta: FIRMA_CLAVE o la de abajo).
import { webcrypto as wc } from 'node:crypto';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rutaClave = process.env.FIRMA_CLAVE || path.join(os.homedir(), '.despacho', 'firma-atgo-sync.jwk');
const ALG = { name: 'ECDSA', namedCurve: 'P-256' };

if (process.argv.includes('--generar')) {
  if (fs.existsSync(rutaClave)) { console.error('Ya existe una clave en ' + rutaClave + '. No se sobrescribe.'); process.exit(1); }
  const par = await wc.subtle.generateKey(ALG, true, ['sign', 'verify']);
  fs.mkdirSync(path.dirname(rutaClave), { recursive: true });
  fs.writeFileSync(rutaClave, JSON.stringify(await wc.subtle.exportKey('jwk', par.privateKey)));
  const pub = await wc.subtle.exportKey('jwk', par.publicKey);
  console.log('Clave creada en ' + rutaClave);
  console.log('Pública: ' + JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }));
  process.exit(0);
}

if (!fs.existsSync(rutaClave)) { console.error('No encuentro la clave privada en ' + rutaClave); process.exit(1); }
const clave = await wc.subtle.importKey('jwk', JSON.parse(fs.readFileSync(rutaClave, 'utf8')), ALG, false, ['sign']);
for (const [archivo, salida, re, prefijo] of [['atgo-sync.js', 'atgo-sync.firma.json', /const SYNC_VERSION = '([\d.]+)'/, 'despacho-sync|'], ['movil.js', 'movil.firma.json', /const MOVIL_VERSION = '([\d.]+)'/, 'despacho-movil|']]) {
  const codigo = fs.readFileSync(path.join(raiz, archivo), 'utf8').replace(/\r\n/g, '\n');
  const v = (re.exec(codigo) || [])[1];
  if (!v) { console.error(archivo + ' no indica su versión'); process.exit(1); }
  const firma = await wc.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, clave, new TextEncoder().encode(prefijo + v + '|' + codigo));
  fs.writeFileSync(path.join(raiz, salida), JSON.stringify({ v, firma: Buffer.from(firma).toString('base64') }) + '\n');
  console.log('Firmado ' + archivo + ' ' + v);
}
