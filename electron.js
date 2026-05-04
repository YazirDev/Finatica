// ============================================================
// electron.js — Proceso principal de Electron
// Maneja: ventana y autenticación OAuth con Google
// usando un servidor HTTP local temporal para capturar el token
// ============================================================

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path    = require('path');
const http    = require('http');
const https   = require('https');
const crypto  = require('crypto');
const { URL } = require('url');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// ─── CREDENCIALES OAUTH ───────────────────────────────────────
const GOOGLE_CLIENT_ID     = '392306051208-21o454lk3r8q5p8uhean60ecb6ntri02.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const REDIRECT_PORT        = 9876;
const REDIRECT_URI         = `http://localhost:${REDIRECT_PORT}/callback`;

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
  if (process.platform !== 'darwin') app.quit();
});

// ============================================================
// OAUTH CON GOOGLE
// ============================================================

/**
 * Genera un string aleatorio para el state de OAuth (seguridad CSRF)
 */
function generarState() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Paso 1: Abre el navegador con Google y espera el código de autorización
 */
function esperarCodigoOAuth() {
  return new Promise((resolve, reject) => {
    const state = generarState();

    // Servidor HTTP local temporal para capturar el callback de Google
    const server = http.createServer((req, res) => {
      const urlObj = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      if (urlObj.pathname !== '/callback') { res.end('OK'); return; }

      const code          = urlObj.searchParams.get('code');
      const error         = urlObj.searchParams.get('error');
      const returnedState = urlObj.searchParams.get('state');

      // HTML que ve el usuario en el navegador después de autenticar
      const htmlExito = `<!DOCTYPE html><html><body style="background:#0d1f0f;color:#e8f5e2;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:16px;margin:0">
        <div style="font-size:64px">🦎</div>
        <h1 style="color:#f1c40f;font-size:24px">¡Autenticación exitosa!</h1>
        <p style="color:#7aad70">Podés cerrar esta pestaña y volver a Finatica CR.</p>
      </body></html>`;

      const htmlError = `<!DOCTYPE html><html><body style="background:#0d1f0f;color:#e8f5e2;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:16px;margin:0">
        <div style="font-size:64px">❌</div>
        <h1 style="color:#e74c3c">Error de autenticación</h1>
        <p style="color:#7aad70">Cerrá esta pestaña y volvé a intentarlo en Finatica CR.</p>
      </body></html>`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

      if (error || returnedState !== state || !code) {
        res.end(htmlError);
        server.close();
        reject(new Error(error || 'Autenticación fallida'));
        return;
      }

      res.end(htmlExito);
      server.close();
      resolve(code);
    });

    server.listen(REDIRECT_PORT, 'localhost', () => {
      // Construir URL de Google OAuth
      const params = new URLSearchParams({
        client_id:     GOOGLE_CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        response_type: 'code',
        scope:         'openid email profile',
        state,
        access_type:   'offline',
        prompt:        'select_account',
      });

      // Abrir en el navegador del sistema (Chrome, Edge, etc.)
      shell.openExternal(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    });

    // Timeout de 5 minutos si el usuario no completa el login
    setTimeout(() => {
      server.close();
      reject(new Error('Tiempo de espera agotado'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Paso 2: Intercambia el código de autorización por tokens de acceso
 */
function intercambiarCodigo(code) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    }).toString();

    const options = {
      hostname: 'oauth2.googleapis.com',
      path:     '/token',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error_description || parsed.error));
          } else {
            resolve(parsed); // { access_token, id_token, ... }
          }
        } catch (e) {
          reject(new Error('Error al procesar respuesta de Google'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── IPC HANDLERS ─────────────────────────────────────────────
function setupIpcHandlers() {

  // Controles de ventana
  ipcMain.handle('window:minimize', () => mainWindow.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow.close());

  /**
   * Inicia el flujo completo de OAuth con Google:
   * 1. Abre el navegador → usuario acepta
   * 2. Captura el código de autorización
   * 3. Intercambia el código por tokens
   * 4. Devuelve el id_token a React para autenticar con Firebase
   */
  ipcMain.handle('auth:iniciarGoogle', async () => {
    try {
      const code   = await esperarCodigoOAuth();
      const tokens = await intercambiarCodigo(code);
      return { ok: true, idToken: tokens.id_token };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}