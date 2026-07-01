import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import fs from 'fs';

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
  '@screens': fileURLToPath(new URL('./src/screens', import.meta.url)),
  '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
  '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  plugins: [
    react(),
    {
      name: 'inject-metadata',
      transformIndexHtml(html) {
        const metadata = fs.readFileSync('./public/metadata.html', 'utf-8');
        return html.replace('<head>', `<head>${metadata}\n`);
      },
    },
  ],
});
