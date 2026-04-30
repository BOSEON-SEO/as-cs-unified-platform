/**
 * MSW Browser Worker -- for development mode (Vite dev server)
 *
 * Activated conditionally in main.tsx when VITE_ENABLE_MSW=true.
 * Intercepts fetch/XHR in the browser via Service Worker.
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.ts';

export const worker = setupWorker(...handlers);
