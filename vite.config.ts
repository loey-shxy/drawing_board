import { defineConfig } from 'vite'
import veaury from 'veaury/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    veaury({
      type: 'vue',
    }),
  ],
  define: {
    'process.env.IS_PREACT': JSON.stringify('true'),
  },
})
