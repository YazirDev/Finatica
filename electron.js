// ============================================================
// electron.js — Proceso principal de Electron
// Con Firebase Auth y Google OAuth
// ============================================================

require('dotenv').config(); // ← SIEMPRE primera línea

console.log('process.versions.electron:', process.versions.electron);
console.log('process.versions.node:', process.versions.node);
const _electronModule = require('electron');
console.log('electron module type:', typeof _electronModule);
const { app, BrowserWindow, ipcMain } = _electronModule;
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const clientId     = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Error: Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en el .env');
}
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d1f0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }
}


app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function setupIpcHandlers() {
  ipcMain.handle('window:minimize', () => mainWindow.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow.close());

  ipcMain.handle('auth:google', async () => {
    try {
      const ElectronGoogleOAuth2 = require('electron-google-oauth2').default;
      const googleOauth = new ElectronGoogleOAuth2(clientId, clientSecret, ['openid', 'profile', 'email']);
      const tokens = await googleOauth.openAuthWindowAndGetTokens();
      return { success: true, tokens };
    } catch (error) {
      console.error('Error en autenticación Google:', error);
      return { success: false, error: error.message };
    }
  });
}