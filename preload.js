const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {

  // ── Controles de ventana ──
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close:    () => ipcRenderer.invoke('window:close'),

  // ── Cuentas ──
  getCuentas:     ()     => ipcRenderer.invoke('cuentas:getAll'),
  crearCuenta:    (data) => ipcRenderer.invoke('cuentas:crear', data),
  eliminarCuenta: (id)   => ipcRenderer.invoke('cuentas:eliminar', id),

  // ── Categorías ──
  getCategorias:     ()     => ipcRenderer.invoke('categorias:getAll'),
  crearCategoria:    (data) => ipcRenderer.invoke('categorias:crear', data),
  eliminarCategoria: (id)   => ipcRenderer.invoke('categorias:eliminar', id),

  // ── Movimientos ──
  getMovimientos:      (opts) => ipcRenderer.invoke('movimientos:getAll', opts),
  registrarMovimiento: (data) => ipcRenderer.invoke('movimientos:registrar', data),
  eliminarMovimiento:  (id)   => ipcRenderer.invoke('movimientos:eliminar', id),

  // ── Recurrentes ──
  getRecurrentes:      ()     => ipcRenderer.invoke('recurrentes:getAll'),
  crearRecurrente:     (data) => ipcRenderer.invoke('recurrentes:crear', data),
  eliminarRecurrente:  (id)   => ipcRenderer.invoke('recurrentes:eliminar', id),
  toggleRecurrente:    (id)   => ipcRenderer.invoke('recurrentes:toggleActivo', id),
  procesarRecurrentes: ()     => ipcRenderer.invoke('recurrentes:procesar'),

});
