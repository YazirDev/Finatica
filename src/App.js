// ============================================================
// App.js — Componente raíz con autenticación Firebase
// Maneja: login, estado global y navegación entre vistas
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import {
  getCuentas,
  getCategorias,
  getMovimientos,
  procesarRecurrentes,
  inicializarUsuario
} from './db';

import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Cuentas from './components/Cuentas';
import Movimientos from './components/Movimientos';
import Estadisticas from './components/Estadisticas';
import NuevoMovimiento from './components/NuevoMovimiento';
import Login from './components/Login';
import './App.css';

export default function App() {

  // ── Estado de autenticación ──
  const [usuario, setUsuario] = useState(null);   // Usuario de Firebase
  const [authListo, setAuthListo] = useState(false);  // Firebase terminó de verificar

  // ── Estado de datos ──
  const [view, setView] = useState('dashboard');
  const [cuentas, setCuentas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      setAuthListo(true);
    });
    return unsubscribe; // Limpiar el listener al desmontar
  }, []);

  /**
   * Recarga todos los datos del usuario desde Firestore
   */
  const reload = useCallback(async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    const [c, m, cat] = await Promise.all([
      getCuentas(),
      getMovimientos(),
      getCategorias(),
    ]);

    setCuentas(c);
    setMovimientos(m);
    setCategorias(cat);
    setLoading(false);
  }, []);

  // Al iniciar sesión: inicializar datos y cargar todo
  useEffect(() => {
    if (!usuario) return;

    const init = async () => {
      await inicializarUsuario();
      await procesarRecurrentes();
      await reload();
    };

    init();
  }, [usuario, reload]);

  /**
   * Cierra la sesión del usuario
   */
  async function cerrarSesion() {
    await signOut(auth);
    setCuentas([]);
    setMovimientos([]);
    setCategorias([]);
    setView('dashboard');
  }

  // ── Mientras Firebase verifica la sesión ──
  if (!authListo) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🦎</div>
        <p className="loading-texto">CARGANDO...</p>
      </div>
    );
  }

  // ── Si no hay sesión, mostrar login ──
  if (!usuario) {
    return <Login />;
  }

  // ── Pantalla de carga de datos ──
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🦎</div>
        <p className="loading-texto">CARGANDO DATOS...</p>
      </div>
    );
  }

  // ── Interfaz principal ──
  return (
    <div className="app-shell">

      <TitleBar usuario={usuario} onCerrarSesion={cerrarSesion} />

      <div className="app-body">

        <Sidebar
          view={view}
          setView={setView}
          onNuevo={() => setShowModal(true)}
        />

        <main className="app-main">
          {view === 'dashboard' && (
            <Dashboard
              cuentas={cuentas}
              movimientos={movimientos}
              onNuevo={() => setShowModal(true)}
              usuario={usuario}
            />
          )}
          {view === 'cuentas' && (
            <Cuentas
              cuentas={cuentas}
              categorias={categorias}
              reload={reload}
            />
          )}
          {view === 'movimientos' && (
            <Movimientos
              movimientos={movimientos}
              categorias={categorias}
              reload={reload}
            />
          )}
          {view === 'estadisticas' && (
            <Estadisticas
              movimientos={movimientos}
              categorias={categorias}
            />
          )}
        </main>
      </div>

      {showModal && (
        <NuevoMovimiento
          cuentas={cuentas}
          categorias={categorias}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); reload(); }}
        />
      )}
    </div>
  );
}
