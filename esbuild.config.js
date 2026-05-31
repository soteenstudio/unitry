import esbuild from 'esbuild';
const builds = [
  {
    entryPoints: ['./src/index.ts'],
    format: 'esm',
    outfile: './dist/index.min.js',
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    entryPoints: ['./src/core.ts'],
    format: 'esm',
    outfile: './dist/core.mjs',
  },
  {
    entryPoints: ['./src/core.ts'],
    format: 'cjs',
    outfile: './dist/core.cjs',
  },
  {
    entryPoints: ['./src/worker.ts'],
    format: 'esm',
    outfile: './dist/worker.js',
    external: ['./core.js'],
  },
];
for (const config of builds) {
  esbuild
    .build({
      bundle: true,
      minify: true,
      sourcemap: true,
      platform: 'node',
      ...config,
    })
    .catch(() => process.exit(1));
}
