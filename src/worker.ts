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
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const possibleExtensions = ['.mjs', '.js', '.cjs'];
let corePath = '';

for (const ext of possibleExtensions) {
  const p = path.join(__dirname, `core${ext}`);
  if (fs.existsSync(p)) {
    corePath = p;
    break;
  }
}

if (!corePath) {
  throw new Error(`CRITICAL: core file not found in ${__dirname}`);
}

const { getTests } = await import(pathToFileURL(corePath).href);

async function run() {
  const { filePath } = workerData;

  try {
    await import(pathToFileURL(filePath).href);
    const tests = getTests();

    for (const t of tests) {
      if ((t as any).skip) {
        parentPort?.postMessage({
          type: 'RESULT',
          status: 'SKIP',
          name: t.name,
          suiteName: t.suiteName,
        });
        continue;
      }

      const start = performance.now();

      const result = await t.run();
      const duration = `${(performance.now() - start).toFixed(2)}ms`;

      if (result.passed) {
        parentPort?.postMessage({
          type: 'RESULT',
          status: 'PASS',
          name: t.name,
          suiteName: t.suiteName,
          duration,
        });
      } else {
        parentPort?.postMessage({
          type: 'RESULT',
          status: 'FAIL',
          name: t.name,
          suiteName: t.suiteName,
          error: result.error,
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
