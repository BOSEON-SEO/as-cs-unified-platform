import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function enableMocking(): Promise<void> {
  // Only activate MSW in dev mode when explicitly enabled via .env
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser.ts');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });

  console.log('[MSW] Mocking enabled');
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
