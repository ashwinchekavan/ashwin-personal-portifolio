
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Loads .env for astro dev and astro build.
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://ashwinchekavan.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: ({ command }) => ({ host: command !== 'dev' }),
  security: { checkOrigin: false },
});
