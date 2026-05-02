import React, { useState, useEffect, useCallback } from 'react';
import TitleBar        from './components/TitleBar';
import Sidebar         from './components/Sidebar';
import Dashboard       from './components/Dashboard';
import Cuentas         from './components/Cuentas';
import Movimientos     from './components/Movimientos';
import Estadisticas    from './components/Estadisticas';
import NuevoMovimiento from './components/NuevoMovimiento';
import './App.css';

export default function App() {

  // ── Estado global ──
  const [view,        setView]        = useState('dashboard'); // Vista activa
  const [cuentas,     setCuentas]     = useState([]);          // Lista de cuentas
  const [movimientos, setMovimientos] = useState([]);          // Lista de movimientos
  const [categorias,  setCategorias]  = useState([]);          // Lista de categorías
  const [showModal,   setShowModal]   = useState(false);       // Modal nuevo movimiento
  const [loading,     setLoading]     = useState(true);        // Pantalla de carga

  /**
   * Recarga todos los datos desde la base de datos.
   * Se ejecuta al iniciar y después de cada cambio.
   */
  const reload = useCallback(async () => {
    const [c, m, cat] = await Promise.all([
      window.api.getCuentas(),
      window.api.getMovimientos({ limit: 500 }),
      window.api.getCategorias(),
    ]);

    setCuentas(c);
    setMovimientos(m);
    setCategorias(cat);
    setLoading(false);
  }, []);

  // Al iniciar: cargar datos y procesar recurrentes automáticos
  useEffect(() => {
    reload();
    window.api.procesarRecurrentes().then(() => reload());
  }, [reload]);

  // ── Pantalla de carga ──
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🦎</div>
        <p className="loading-texto">CARGANDO...</p>
      </div>
    );
  }

  // ── Interfaz principal ──
  return (
    <div className="app-shell">

      {/* Barra de título personalizada */}
      <TitleBar />

      <div className="app-body">

        {/* Menú lateral */}
        <Sidebar
          view={view}
          setView={setView}
          onNuevo={() => setShowModal(true)}
        />

        {/* Contenido principal según la vista activa */}
        <main className="app-main">
          {view === 'dashboard'    && (
            <Dashboard
              cuentas={cuentas}
              movimientos={movimientos}
              onNuevo={() => setShowModal(true)}
            />
          )}
          {view === 'cuentas'      && (
            <Cuentas
              cuentas={cuentas}
              categorias={categorias}
              reload={reload}
            />
          )}
          {view === 'movimientos'  && (
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

      {/* Modal para registrar nuevo movimiento */}
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