// worker.ts
import { workerData, parentPort } from 'node:worker_threads';
import { getTests } from './core.js';
import { pathToFileURL } from 'node:url';

// ... (imports)

async function run() {
  const { filePath } = workerData;

  try {
    await import(pathToFileURL(filePath).href);
    const tests = getTests();

    for (const t of tests) {
      // Fitur SKIP
      if (t.skip) {
        parentPort?.postMessage({ type: 'RESULT', status: 'SKIP', name: t.name });
        continue;
      }

      const start = performance.now();
      try {
        await t.fn();
        parentPort?.postMessage({ 
          type: 'RESULT', status: 'PASS', name: t.name, duration: `${(performance.now() - start).toFixed(2)}ms` 
        });
      } catch (err: any) {
        parentPort?.postMessage({ 
          type: 'RESULT', status: 'FAIL', name: t.name, error: err.message, stack: err.stack 
        });
      }
    }
  } catch (err: any) {
    // Cuma kirim error tanpa akses variabel t
    parentPort?.postMessage({ type: 'ERROR', message: err.message });
  } finally {
    parentPort?.postMessage({ type: 'DONE' });
    process.exit(0);
  }
}

run();
