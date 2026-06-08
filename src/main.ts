import { createApp } from 'vue';
import { createAppRouter } from './router';
import { config } from './config';
import type { Router } from 'vue-router';
import App from './App.vue';

let app: ReturnType<typeof createApp> | null = null;
export let router: Router

export function mount(container: string | Element, basePath: string) {
  router = createAppRouter(basePath)

  app = createApp(App);
  app.use(router);
  app.mount(container);

  console.log(`${config.appSlug} mounted with base: ${basePath}`);
}

export function unmount() {
    if (app) {
        app.unmount();
        app = null;
    }
}

const appElement = document.getElementById('app');

if (appElement && !appElement.hasChildNodes())
  mount('#app', import.meta.env.PROD ? `/iris-app/${config.appSlug}/` : '/');