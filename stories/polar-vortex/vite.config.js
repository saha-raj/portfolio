export default {
  root: '.',
  publicDir: 'public',
  base: '/polar-vortex-viz/',
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
    assetsInlineLimit: 4096,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        assetTest: './asset-test.html'
      }
    }
  }
} 