// ============================================================
// preload.js — Puente entre Electron y React
// ============================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Controles de ventana
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close:    () => ipcRenderer.invoke('window:close'),

  // Autenticación Google via navegador externo
  iniciarGoogle: () => ipcRenderer.invoke('auth:iniciarGoogle'),
});