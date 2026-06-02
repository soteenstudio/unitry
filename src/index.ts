/**
 * Copyright 2026 SoTeen Studio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { Command } from 'commander';
import { Worker } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const distDir = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.join(distDir, 'worker.js');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  whiteBold: '\x1b[1m\x1b[37m',
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  bgPass: '\x1b[42m\x1b[30m',
  bgFail: '\x1b[41m\x1b[37m',
  bgWhite: '\x1b[47m\x1b[30m',
};

const TEST_TIMEOUT_MS = 5000;

const program = new Command();

program
  .version('0.1.0')
  .argument('<dir>', 'directory to discover tests')
  .action(async (dir) => {
    const config = await loadConfig();
    const files = findTestFiles(path.resolve(dir));

    const runFile = (file: string) =>
      new Promise<void>((resolve) => {
        const fileName = path.basename(file);
        const results: any[] = [];
        let fileHasFailed = false;

        const discoverWorker = new Worker(workerPath, {
          workerData: { filePath: file, discoverOnly: true },
        });

        discoverWorker.on('message', async (discoverMsg) => {
          if (discoverMsg.type === 'DISCOVERED') {
            const targetTests = discoverMsg.tests;

            for (const target of targetTests) {
              await new Promise<void>((nextTestResolve) => {
                let isCurrentTestDone = false;

                const executionWorker = new Worker(workerPath, {
                  workerData: {
                    filePath: file,
                    targetTestName: target.name,
                    discoverOnly: false,
                  },
                });

                const timeoutTimer = setTimeout(() => {
                  if (!isCurrentTestDone) {
                    isCurrentTestDone = true;
                    fileHasFailed = true;

                    executionWorker.terminate();

                    results.push({
                      status: 'FAIL',
                      name: target.name,
                      suiteName: target.suiteName,
                      error: `ERR_TIMEOUT: Test exceeded safe limits of ${TEST_TIMEOUT_MS}ms and was forcefully terminated.`,
                    });
                    nextTestResolve();
                  }
                }, TEST_TIMEOUT_MS);

                executionWorker.on('message', (msg) => {
                  if (msg.type === 'RESULT') {
                    results.push(msg);
                    if (msg.status === 'FAIL') fileHasFailed = true;
                  } else if (msg.type === 'DONE') {
                    if (!isCurrentTestDone) {
                      isCurrentTestDone = true;
                      clearTimeout(timeoutTimer);
                      executionWorker.terminate();
                      nextTestResolve();
                    }
                  }
                });

                executionWorker.on('error', (err: Error) => {
                  if (!isCurrentTestDone) {
                    isCurrentTestDone = true;
                    clearTimeout(timeoutTimer);
                    fileHasFailed = true;
                    results.push({
                      status: 'FAIL',
                      name: target.name,
                      suiteName: target.suiteName,
                      error: `Worker Runtime Crash: ${err.message}`,
                    });
                    executionWorker.terminate();
                    nextTestResolve();
                  }
                });
              });
            }

            const badge = fileHasFailed
              ? `${COLORS.bgFail}${COLORS.bold} FAIL ${COLORS.reset}`
              : `${COLORS.bgPass}${COLORS.bold} PASS ${COLORS.reset}`;

            console.log(
              `\n${badge} ${COLORS.gray}${path.relative(process.cwd(), file)}${COLORS.reset}`,
            );

            let currentSuite: string | null = null;
            for (const res of results) {
              if (res.suiteName !== currentSuite) {
                currentSuite = res.suiteName;
                if (currentSuite)
                  console.log(`  ${COLORS.bold}${currentSuite}${COLORS.reset}`);
              }

              const indent = res.suiteName ? '    ' : '  ';
              if (res.status === 'PASS') {
                console.log(
                  `${indent}${COLORS.green}●${COLORS.reset} ${COLORS.gray}${res.name}${COLORS.reset} ${COLORS.green}(${res.duration})${COLORS.reset}`,
                );
              } else if (res.status === 'FAIL') {
                console.log(
                  `${indent}${COLORS.red}● ${res.name}${COLORS.reset}`,
                );
                console.log(
                  `${indent}  ${COLORS.red}Error: ${res.error}${COLORS.reset}`,
                );
              } else if (res.status === 'SKIP') {
                console.log(
                  `${indent}${COLORS.gray}○ ${res.name} (skipped)${COLORS.reset}`,
                );
              }
            }
            resolve();
          }
        });

        discoverWorker.on('error', (err: Error) => {
          console.error(
            `\n${COLORS.bgFail}${COLORS.bold} ERROR ${COLORS.reset} ${fileName}\n  ${COLORS.red}Discovery Error: ${err.message}${COLORS.reset}`,
          );
          resolve();
        });
      });

    const queue = [...files];
    const workers = Array(config.concurrency)
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const file = queue.shift();
          if (file) await runFile(file);
        }
      });

    await Promise.all(workers);
    console.log(`\n${COLORS.bold}Done!${COLORS.reset}\n`);
  });

function findTestFiles(dir: string): string[] {
  let results: string[] = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(findTestFiles(fullPath));
    } else if (
      file.endsWith('.test.ts') ||
      file.endsWith('.test.js') ||
      file.endsWith('.test.cjs') ||
      file.endsWith('.test.mjs')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

async function loadConfig() {
  const configPath = path.resolve(process.cwd(), 'unitry.config.js');
  if (fs.existsSync(configPath)) {
    const config = await import(pathToFileURL(configPath).href);
    return { concurrency: 2, ...config.default };
  }
  return { concurrency: 1 };
}

program.parse(process.argv);
