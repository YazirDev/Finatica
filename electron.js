// ============================================================
// electron.js — Proceso principal de Electron
// Con Firebase, la base de datos está en la nube.
// Este archivo solo maneja la ventana y los controles de la misma.
// ============================================================

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// ─── CREAR VENTANA ────────────────────────────────────────────
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

// ─── INICIO ───────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ─── IPC HANDLERS — Solo controles de ventana ─────────────────
// Con Firebase, toda la lógica de datos está en React (renderer)
// y no necesita pasar por el proceso principal de Electron.
function setupIpcHandlers() {

  ipcMain.handle('window:minimize', () => mainWindow.minimize());

  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow.close();
  });
}