// ============================================================
// Sidebar.js — Menú lateral de navegación
// ============================================================

import React from 'react';
import './Sidebar.css';

// Definición de las páginas del menú
const MENU = [
  { id: 'dashboard',    icono: '🏠', label: 'Inicio'       },
  { id: 'cuentas',      icono: '💰', label: 'Cuentas'      },
  { id: 'movimientos',  icono: '📋', label: 'Movimientos'  },
  { id: 'estadisticas', icono: '📊', label: 'Estadísticas' },
];

export default function Sidebar({ view, setView, onNuevo }) {
  return (
    <aside className="sidebar">

      {/* Lagarto decorativo */}
      <div className="sidebar-deco">🦎</div>

      {/* Mini bandera de Costa Rica */}
      <div className="cr-flag">
        <span className="flag-azul" />
        <span className="flag-blanco" />
        <span className="flag-rojo" />
        <span className="flag-blanco" />
        <span className="flag-azul" />
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {MENU.map(item => (
          <button
            key={item.id}
            className={`nav-item ${view === item.id ? 'activo' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="nav-icono">{item.icono}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Botón de nuevo movimiento */}
      <button className="btn-nuevo" onClick={onNuevo}>
        ＋ NUEVO MOV.
      </button>

    </aside>
  );
}
