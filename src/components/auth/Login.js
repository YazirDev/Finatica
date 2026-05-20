// ============================================================
// Login.js — Inicio de sesión con email y contraseña
// Permite registrarse e iniciar sesión con Firebase Auth
// ============================================================

import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import './Login.css';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export default function Login() {

  // Modo: 'login', 'registro' o 'recuperar'
  const [modo, setModo] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  /**
   * Traduce los códigos de error de Firebase a español
   */
  function traducirError(code) {
    const errores = {
      'auth/invalid-email': 'El correo no es válido.',
      'auth/user-not-found': 'No existe una cuenta con ese correo.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
    };
    return errores[code] || 'Ocurrió un error. Intentá de nuevo.';
  }

  /**
   * Limpia los mensajes al cambiar de modo
   */
  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setError('');
    setExito('');
  }

  /**
   * Maneja el envío del formulario
   */
  async function handleSubmit() {
    setError('');
    setExito('');

    if (!email.trim()) { setError('Ingresá tu correo.'); return; }

    if (modo === 'recuperar') {
      await recuperarPassword();
      return;
    }

    if (!password) { setError('Ingresá tu contraseña.'); return; }
    if (modo === 'registro' && !nombre.trim()) { setError('Ingresá tu nombre.'); return; }

    setCargando(true);
    try {
      if (modo === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);

      } else {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: nombre.trim() });
      }
      // App.js detecta el cambio de sesión automáticamente
    } catch (err) {
      setError(traducirError(err.code));
      setCargando(false);
    }
  }

  /**
   * Envía un correo para recuperar la contraseña
   */
  async function recuperarPassword() {
    setCargando(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setExito('Te enviamos un correo para recuperar tu contraseña.');
    } catch (err) {
      setError(traducirError(err.code));
    }
    setCargando(false);
  }

  /**
   * Envía el formulario al presionar Enter
   */
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  async function loginConGoogle() {
    setError('');
    setCargando(true);
    try {
      const result = await window.api.loginGoogle();
      if (!result.success) throw new Error(result.error);
      const credential = GoogleAuthProvider.credential(result.tokens.id_token);
      await signInWithCredential(auth, credential);
    } catch (err) {
      console.error('Google login error:', err);
      setError('Error: ' + (err.message || err.code || JSON.stringify(err)));
      setCargando(false);
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
        <span className="lf-azul" />
        <span className="lf-blanco" />
        <span className="lf-rojo" />
        <span className="lf-blanco" />
        <span className="lf-azul" />
      </div>

      {/* Tabs */}
      <div className="login-tabs">
        <button
          className={`login-tab ${modo === 'login' ? 'activo' : ''}`}
          onClick={() => cambiarModo('login')}
        >
          INGRESAR
        </button>
        <button
          className={`login-tab ${modo === 'registro' ? 'activo' : ''}`}
          onClick={() => cambiarModo('registro')}
        >
          REGISTRARSE
        </button>
      </div>

      {/* Formulario */}
      <div className="login-form">

        {/* Nombre — solo en registro */}
        {modo === 'registro' && (
          <div className="login-campo">
            <label>NOMBRE</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tu nombre"
              disabled={cargando}
            />
          </div>
        )}

        {/* Email */}
        <div className="login-campo">
          <label>CORREO</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="correo@gmail.com"
            disabled={cargando}
          />
        </div>

        {/* Contraseña — no en recuperar */}
        {modo !== 'recuperar' && (
          <div className="login-campo">
            <label>CONTRASEÑA</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mínimo 6 caracteres"
              disabled={cargando}
            />
          </div>
        )}

        {/* Mensajes */}
        {error && <p className="login-error">► {error}</p>}
        {exito && <p className="login-exito">► {exito}</p>}

        {/* Botón principal */}
        <button
          className="btn-login"
          onClick={handleSubmit}
          disabled={cargando}
        >
          {cargando ? '⏳ CARGANDO...' :
            modo === 'login' ? '► INGRESAR' :
              modo === 'registro' ? '► CREAR CUENTA' :
                '► ENVIAR CORREO'
          }
        </button>
        {/* Botón Google */}
        <button onClick={loginConGoogle} className="btn-google" disabled={cargando}>
          {cargando ? '⏳ CARGANDO...' : '► INGRESAR CON GOOGLE'}
        </button>

        {/* Link olvidé contraseña */}
        {modo === 'login' && (
          <button
            className="btn-recuperar"
            onClick={() => cambiarModo('recuperar')}
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}

        {/* Link volver al login */}
        {modo === 'recuperar' && (
          <button
            className="btn-recuperar"
            onClick={() => cambiarModo('login')}
          >
            ← Volver al login
          </button>
        )}

      </div>

      <p className="login-footer">Pura vida, mae 🇨🇷</p>

    </div>
  );
}