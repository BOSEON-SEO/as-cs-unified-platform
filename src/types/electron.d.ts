/**
 * Electron preload에서 contextBridge로 노출한 API 타입
 * 웹 모드에서는 window.electronAPI === undefined
 */
interface ElectronAPI {
  getVersion: () => Promise<string>;
  platform: NodeJS.Platform;
}

interface Window {
  electronAPI?: ElectronAPI;
}
