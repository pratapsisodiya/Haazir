import { defineConfig } from 'tsup'

// One ESM file for the Docker image. Workspace packages ship as TypeScript
// source, so they are bundled in. npm packages stay external, which only
// works if they're listed in this app's own package.json: a workspace
// package's dependencies must be repeated here (pnpm doesn't hoist them).
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  sourcemap: true,
  clean: true,
  noExternal: [/^@haazir\//],
})
