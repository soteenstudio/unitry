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
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  gray: '\x1b[90m',
};

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
        console.log(`\n${COLORS.bold} PASS ${COLORS.reset} ${fileName}`);

        const worker = new Worker(workerPath, {
          workerData: { filePath: file },
        });

        worker.on('error', (err: Error) => {
          console.error(
            `${COLORS.red}Worker Error: ${err.message}${COLORS.reset}`,
          );
          resolve();
        });

        worker.on('message', (msg) => {
          if (msg.type === 'RESULT') {
            if (msg.status === 'PASS') {
              console.log(
                `  ${COLORS.green}●${COLORS.reset} ${msg.name} ${COLORS.gray}(${msg.duration})${COLORS.reset}`,
              );
            } else {
              console.log(`  ${COLORS.red}●${COLORS.reset} ${msg.name}`);
              console.log(
                `    ${COLORS.red}Error: ${msg.error}${COLORS.reset}\n`,
              );
              if (msg.stack)
                console.log(
                  `    ${COLORS.gray}${msg.stack.split('\n')[1].trim()}${COLORS.reset}`,
                );
            }
          } else if (msg.type === 'DONE') {
            resolve();
          } else if (msg.type === 'ERROR') {
            console.error(
              `  ${COLORS.red}Worker Error: ${msg.message}${COLORS.reset}`,
            );
            worker.terminate();
            resolve();
          }
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
