import { useRef, useState } from 'react';
import { FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import { isSupportedExcel, parseExcel } from '../services/excelService';
import type { ParseResult } from '../types/models';

export function ExcelImporter({ onParsed, onClose }: { onParsed: (result: ParseResult) => void; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');
  const process = async (file?: File) => {
    if (!file) return;
    if (!isSupportedExcel(file)) { setMessage('Formato no admitido. Utiliza .xlsx, .xls o .csv.'); return; }
    try { setMessage('Importando…'); onParsed(await parseExcel(file)); } catch (error) { setMessage(error instanceof Error ? error.message : 'No se ha podido procesar el archivo.'); }
  };
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}>
    <div className="modal-head"><div><div className="eyebrow">IMPORTACIÓN</div><h2>Cargar planificación</h2><p>Se leerán únicamente las 10 columnas configuradas y los 19 operarios autorizados.</p></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>
    <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); void process(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()}>
      <UploadCloud size={32}/><strong>Arrastra el Excel aquí</strong><span>o pulsa para seleccionar archivo</span><small>.xlsx · .xls · .csv</small><input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => void process(e.target.files?.[0])}/>
    </div>
    <div className="import-note"><FileSpreadsheet size={16}/> Las columnas se detectan por nombre, no por posición.</div>
    {message && <div className="inline-alert">{message}</div>}
  </div></div>;
}
