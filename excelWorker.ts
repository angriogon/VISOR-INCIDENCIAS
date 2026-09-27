import * as XLSX from 'xlsx';
import type { ParseResult, RawIncidentRow } from '../types/models';

const REQUIRED = ['NUM.', 'F. VISITA', 'DESDE HORA', 'FECHA CADUCIDAD', 'DESC. SEDE', 'REFERENCIA', 'OPERARIO', 'ESTADO', 'DES. CLIENTE', 'DOMICILIO'];
const AUTHORIZED = new Set(['ACAB','JMOG','DSG','CLH','ADJC','LGV','JCGM','LEOC','IFF','JVR','FMNT','MMHG','ILG','JRHG','AAR','EACL','MLOR','PHEP','JIFC']);

function cleanHeader(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
}

function value(row: unknown[], index: number): unknown {
  return index >= 0 ? row[index] : '';
}

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try {
    const workbook = XLSX.read(event.data, { type: 'array', cellDates: true, raw: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('El Excel no contiene ninguna hoja.');
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as unknown[][];
    if (!rows.length) throw new Error('El Excel está vacío.');

    const headers = rows[0].map(cleanHeader);
    const indexes = new Map<string, number>();
    headers.forEach((header, index) => { if (header) indexes.set(header, index); });
    const missingColumns = REQUIRED.filter((column) => !indexes.has(column));
    if (missingColumns.length) {
      const result: ParseResult = { rows: [], missingColumns, discardedByOperator: 0 };
      self.postMessage({ ok: true, result });
      return;
    }

    const resultRows: RawIncidentRow[] = [];
    let discardedByOperator = 0;
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row.some((cell) => String(cell ?? '').trim() !== '')) continue;
      const operario = String(value(row, indexes.get('OPERARIO') ?? -1)).trim().toUpperCase();
      if (!AUTHORIZED.has(operario)) {
        discardedByOperator += 1;
        continue;
      }
      resultRows.push({
        num: String(value(row, indexes.get('NUM.') ?? -1)).trim(),
        fVisita: value(row, indexes.get('F. VISITA') ?? -1),
        desdeHora: value(row, indexes.get('DESDE HORA') ?? -1),
        fechaCaducidad: value(row, indexes.get('FECHA CADUCIDAD') ?? -1),
        descSede: String(value(row, indexes.get('DESC. SEDE') ?? -1)).trim(),
        referencia: String(value(row, indexes.get('REFERENCIA') ?? -1)).trim(),
        operario,
        estado: String(value(row, indexes.get('ESTADO') ?? -1)).trim(),
        descCliente: String(value(row, indexes.get('DES. CLIENTE') ?? -1)).trim(),
        domicilio: String(value(row, indexes.get('DOMICILIO') ?? -1)).trim()
      });
    }
    const result: ParseResult = { rows: resultRows, missingColumns: [], discardedByOperator };
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : 'No se ha podido leer el Excel.' });
  }
};
