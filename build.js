import { build } from 'esbuild'
import { rmSync, mkdirSync } from 'fs'

// Clean dist directory
rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })

// Build main package
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  target: 'es2020',
  external: [],
  sourcemap: true,
  minify: false,
  platform: 'node'
})

// Build testing package
await build({
  entryPoints: ['src/testing/index.ts'],
  bundle: true,
  outfile: 'dist/testing.js',
  format: 'esm',
  target: 'es2020',
  external: [],
  sourcemap: true,
  minify: false,
  platform: 'node'
})

// Generate type declarations
import { execSync } from 'child_process'
execSync('npx tsc --emitDeclarationOnly --outDir dist', { stdio: 'inherit' })

console.log('Build completed successfully!')
