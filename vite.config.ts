import { defineConfig, loadEnv } from 'vite';
import { federation } from '@module-federation/vite';
import { config } from './src/config';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  // In development mode, use '/' for normal local URLs
  // In production (build), use VITE_BASE_PATH or default to '/contents/iris-app/{appSlug}/'
  const isDev = mode === 'development';
  const base = isDev ? '/' : `/contents/iris-app/${config.appSlug}/`;
  const env = loadEnv(mode, process.cwd());

  return {
    server: {
      https: {
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.crt')
      },
      proxy: {
        '/proxy': {
          target: env.VITE_SITE_URL,
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/proxy/, '')
        }
      }
    },
    plugins: [
      vue(),
      federation({
        name: isDev ? 'app_dev_remote' : (process.env.VITE_REMOTE_NAME || `${config.appSlug}_remote`),
        filename: 'remoteEntry.js',
        exposes: {
          './AppEntry': './src/main.ts',
        },
        shared: {
          vue: { singleton: true, requiredVersion: '^3.5.0' },
          'vue-router': { singleton: true, requiredVersion: '^4.5.0' },
        },
        dts: false
      }),
    ],
    base: base, 
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        onwarn(warning, warn) {
          // Check if the warning is the specific eval warning from the module federation sdk file
          if (
            warning.code === 'EVAL' &&
            /node_modules\/@module-federation\/sdk\/dist\/index\.cjs\.cjs/.test(warning.loc?.file || '')
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  };
});