/**
 * Copyright 2026 SoTeen Studio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import esbuild from 'esbuild';

/**
 * Mentranspilasi file TS/JS menjadi Data URL berbasis Base64 menggunakan ESBuild Build API
 */
export async function transpileToDataUrl(filePath: string): Promise<string> {
  const result = await esbuild.build({
    entryPoints: [filePath],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    sourcemap: 'inline',

    external: [
      'node:*',

      'fs',
      'path',
      'os',
      'crypto',
      'worker_threads',
      'url',
      'vm',
      'process',
      'util',
      'events',
      'stream',
      'assert',
      'buffer',
      'child_process',
      'cluster',
      'dns',
      'http',
      'https',
      'net',
      'tls',
      'zlib',
    ],
  });

  const outputText = result.outputFiles[0].text;

  const base64Code = Buffer.from(outputText).toString('base64');
  return `data:text/javascript;base64,${base64Code}`;
}
