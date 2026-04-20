import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

async function bootstrap() {
  // In web mode (no Electron preload), install the web bridge before React mounts
  // Check for window.electron which is set by contextBridge in Electron environment
  if (!window.electron) {
    const { installWebBridge } = await import('./lib/web-bridge');
    installWebBridge();
  }

  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap().catch(console.error);
