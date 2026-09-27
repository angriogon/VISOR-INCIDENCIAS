import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'index.html', 'README.md', '.gitignore', 'public/manifest.webmanifest', 'public/sw.js',
  'public/icons/icon-192.png', 'public/icons/icon-512.png', 'src/App.tsx', 'src/main.tsx',
  'src/components', 'src/pages', 'src/services', 'src/hooks', 'src/utils', 'src/types', 'src/data', 'src/workers', 'src/storage',
  '.github/workflows/deploy.yml'
];

const columns = ['NUM.', 'F. VISITA', 'DESDE HORA', 'FECHA CADUCIDAD', 'DESC. SEDE', 'REFERENCIA', 'OPERARIO', 'ESTADO', 'DES. CLIENTE', 'DOMICILIO'];
const technicians = ['ACAB','JMOG','DSG','CLH','ADJC','LGV','JCGM','LEOC','IFF','JVR','FMNT','MMHG','ILG','JRHG','AAR','EACL','MLOR','PHEP','JIFC'];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Falta: ${file}`);
}
for (const forbidden of ['node_modules', 'dist']) {
  if (fs.existsSync(path.join(root, forbidden))) throw new Error(`No debe incluirse: ${forbidden}`);
}

const model = fs.readFileSync(path.join(root, 'src/types/models.ts'), 'utf8');
for (const tech of technicians) if (!model.includes(`'${tech}'`)) throw new Error(`Técnico no encontrado: ${tech}`);
const worker = fs.readFileSync(path.join(root, 'src/workers/excelWorker.ts'), 'utf8');
for (const column of columns) if (!worker.includes(`'${column}'`)) throw new Error(`Columna no encontrada: ${column}`);

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const dep of ['react','react-dom','xlsx','idb','lucide-react','leaflet']) if (!pkg.dependencies[dep]) throw new Error(`Dependencia ausente: ${dep}`);
for (const dep of ['vite','typescript','@vitejs/plugin-react','vite-plugin-pwa']) if (!pkg.devDependencies[dep]) throw new Error(`DevDependency ausente: ${dep}`);
if (!pkg.scripts?.build) throw new Error('Falta script build');

console.log(`OK · ${requiredFiles.length} rutas requeridas presentes`);
console.log(`OK · ${technicians.length} técnicos autorizados`);
console.log(`OK · ${columns.length} columnas de importación`);
console.log('OK · PWA, service worker y workflow de GitHub Pages presentes');
