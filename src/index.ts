#!/usr/bin/env node
import { Command } from 'commander';
import { Worker } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
  gray: "\x1b[90m"
};

const program = new Command();

program
  .version('0.1.0')
  .argument('<dir>', 'directory to discover tests')
  .action(async (dir) => {
    const files = findTestFiles(path.resolve(dir));
    
for (const file of files) {
  const fileName = path.basename(file);
  // Header file yang estetik
  console.log(`\n${COLORS.bold} PASS ${COLORS.reset} ${fileName}`);

  await new Promise<void>((resolve) => {
    const worker = new Worker(path.join(path.dirname(fileURLToPath(import.meta.url)), 'worker.js'), {
      workerData: { filePath: file }
    });
    
    worker.on('message', (msg) => {
      if (msg.type === 'RESULT') {
        if (msg.status === 'PASS') {
          console.log(`  ${COLORS.green}●${COLORS.reset} ${msg.name} ${COLORS.gray}(${msg.duration})${COLORS.reset}`);
        } else {
          console.log(`  ${COLORS.red}●${COLORS.reset} ${msg.name}`);
          console.log(`    ${COLORS.red}Error: ${msg.error}${COLORS.reset}\n`);
          if (msg.stack) console.log(`    ${COLORS.gray}${msg.stack.split('\n')[1].trim()}${COLORS.reset}`);
        }
      }
    });
    
    worker.on('exit', () => resolve());
  });
}
  });

function findTestFiles(dir: string): string[] {
  let results: string[] = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(findTestFiles(fullPath));
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  program.parse(process.argv);
}