/**
 * Electron Main Process
 * A/S & CS 통합 관리 플랫폼
 *
 * - dev 모드: Vite dev server (http://localhost:5173) 로드
 * - prod 모드: dist/index.html 로드
 */
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

/** Vite dev server URL (dev 모드 전용) */
const DEV_SERVER_URL = 'http://localhost:5173';

/** 메인 윈도우 참조 */
let mainWindow = null;

function createWindow() {
  // dev 모드 판별: electron-builder 패키징 시 app.isPackaged === true
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'A/S & CS 통합 관리 플랫폼',
    icon: path.join(__dirname, '..', 'public', 'favicon.svg'),

    // prototype-v2 타이틀바 재현: 커스텀 titlebar 사용
    titleBarStyle: 'hidden',
    titleBarOverlay: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // 콘텐츠 로드: dev vs prod
  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'right' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // 외부 링크는 기본 브라우저로 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===== IPC Handlers =====

ipcMain.handle('get-version', () => app.getVersion());

// ===== App Lifecycle =====

app.whenReady().then(() => {
  createWindow();

  // macOS: dock 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Windows/Linux: 모든 윈도우 닫으면 앱 종료
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
