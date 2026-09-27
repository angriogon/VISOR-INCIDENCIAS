import type { ParseResult } from '../types/models';

export async function parseExcel(file: File, onProgress?: (value: number) => void): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  onProgress?.(10);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/excelWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ ok: boolean; result?: ParseResult; error?: string }>) => {
      worker.terminate();
      if (event.data.ok && event.data.result) {
        onProgress?.(30);
        resolve(event.data.result);
      } else {
        reject(new Error(event.data.error ?? 'Error procesando el Excel.'));
      }
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('No se ha podido procesar el archivo Excel.'));
    };
    worker.postMessage(buffer, [buffer]);
  });
}

export function isSupportedExcel(file: File): boolean {
  return /\.(xlsx|xls|csv)$/i.test(file.name);
}
