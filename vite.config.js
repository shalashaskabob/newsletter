// Use CommonJS and avoid importing 'vite' to prevent module resolution
// issues in certain build environments (e.g., Render) when loading the
// config file before local dependencies are linked.
const react = require('@vitejs/plugin-react')

/** @type {import('vite').UserConfig} */
module.exports = {
  plugins: [react({ jsxRuntime: 'automatic' })],
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
}
