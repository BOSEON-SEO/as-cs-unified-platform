/**
 * Electron Preload Script
 * contextIsolation: true 환경에서 renderer에 안전하게 API 노출
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** 앱 버전 */
  getVersion: () => ipcRenderer.invoke('get-version'),

  /** 플랫폼 (win32 | darwin | linux) */
  platform: process.platform,

  /**
   * 향후 확장:
   * - 알림 (Notification)
   * - 파일 다이얼로그 (dialog.showOpenDialog)
   * - 자동 업데이트 (autoUpdater)
   */
});
