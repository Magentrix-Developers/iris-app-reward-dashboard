import { createApp, h, type App } from 'vue';
import { config } from './config';
import { router } from './main'; 
import AppRoot from './App.vue';

let appInstance: App | null = null;

export function mount(elementOrId: string | Element) {
  if (appInstance)
    return;

  appInstance = createApp({
    render: () => h(AppRoot)
  });

  appInstance.use(router);
  
  // The host app may pass either a string ID or an actual DOM element
  if (typeof elementOrId === 'string')
    appInstance.mount(`#${elementOrId}`);
  else
    appInstance.mount(elementOrId);

  console.log(`${config.appSlug} mounted successfully!`);
}

export function unmount() {
  if (appInstance) {
    appInstance.unmount();
    appInstance = null;
    console.log(`${config.appSlug} unmounted.`);
  }
}