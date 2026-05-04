// ============================================================
// Login.js — Pantalla de inicio de sesión con Google
// Usa el flujo OAuth via navegador externo (funciona en Electron)
// ============================================================

import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

export default function Login() {

  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');
  const [paso,     setPaso]     = useState(''); // Mensaje de estado del proceso

  /**
   * Inicia el flujo de autenticación con Google:
   * 1. Electron abre el navegador con Google
   * 2. Usuario acepta los permisos
   * 3. Electron captura el id_token
   * 4. Firebase autentica con ese token
   */
  async function iniciarSesionGoogle() {
    setCargando(true);
    setError('');
    setPaso('Abriendo Google en tu navegador...');

    try {
      // Paso 1: Pedir a Electron que abra el navegador y capture el token
      const resultado = await window.api.iniciarGoogle();

      if (!resultado.ok) {
        throw new Error(resultado.error || 'No se pudo autenticar');
      }

      setPaso('Verificando tu cuenta...');

      // Paso 2: Usar el id_token de Google para autenticar en Firebase
      const credencial = GoogleAuthProvider.credential(resultado.idToken);
      await signInWithCredential(auth, credencial);

      // El observer en App.js detecta el cambio automáticamente
      setPaso('¡Listo!');

    } catch (err) {
      console.error('Error en login:', err);
      setError('No se pudo iniciar sesión. Intentá de nuevo.');
      setCargando(false);
      setPaso('');
    }
  }

  return (
    <div className="login-screen">

      {/* Logo */}
      <div className="login-logo">🦎</div>
      <h1 className="login-titulo">FINATICA CR</h1>
      <p className="login-subtitulo">Control de finanzas personales</p>

      {/* Mini bandera */}
      <div className="login-flag">
        <span className="lf-azul"  />
        <span className="lf-blanco"/>
        <span className="lf-rojo"  />
        <span className="lf-blanco"/>
        <span className="lf-azul"  />
      </div>

      {/* Botón de Google */}
      <button
        className="btn-google"
        onClick={iniciarSesionGoogle}
        disabled={cargando}
      >
        {cargando ? '⏳ CONECTANDO...' : '🔑 INICIAR CON GOOGLE'}
      </button>

      {/* Mensaje de paso actual */}
      {paso && (
        <p className="login-paso">► {paso}</p>
      )}

      {/* Error */}
      {error && (
        <p className="login-error">► {error}</p>
      )}

      {/* Instrucciones cuando está cargando */}
      {cargando && (
        <div className="login-instrucciones">
          <p>1. Se abrirá tu navegador con Google</p>
          <p>2. Iniciá sesión con tu cuenta</p>
          <p>3. Volvé automáticamente a Finatica</p>
        </div>
      )}

      <p className="login-footer">Pura vida, mae 🇨🇷</p>

    </div>
  );
}