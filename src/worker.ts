/**
 * Copyright 2026 SoTeen Studio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { workerData, parentPort } from 'node:worker_threads';
import { getTests } from './core.js';
import { pathToFileURL } from 'node:url';

async function run() {
  const { filePath } = workerData;

  try {
    await import(pathToFileURL(filePath).href);
    const tests = getTests();

    for (const t of tests) {
      if (t.skip) {
        parentPort?.postMessage({
          type: 'RESULT',
          status: 'SKIP',
          name: t.name,
        });
        continue;
      }

      const start = performance.now();
      try {
        await t.fn();
        parentPort?.postMessage({
          type: 'RESULT',
          status: 'PASS',
          name: t.name,
          duration: `${(performance.now() - start).toFixed(2)}ms`,
        });
      } catch (err: any) {
        parentPort?.postMessage({
          type: 'RESULT',
          status: 'FAIL',
          name: t.name,
          error: err.message,
          stack: err.stack,
        });
      }
    }
  } catch (err: any) {
    parentPort?.postMessage({ type: 'ERROR', message: err.message });
  } finally {
    parentPort?.postMessage({ type: 'DONE' });
  }
}

run();
