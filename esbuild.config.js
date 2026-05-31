import esbuild from 'esbuild';
const builds = [
  {
    entryPoints: ['./src/index.ts'],
    format: 'esm',
    outfile: './dist/index.min.js',
  },
  {
    entryPoints: ['./src/core.ts'],
    format: 'esm',
    outfile: './dist/core.js',
  },
  {
    entryPoints: ['./src/core.ts'],
    format: 'esm',
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
