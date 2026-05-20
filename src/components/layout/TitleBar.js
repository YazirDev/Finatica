// ============================================================
// TitleBar.js — Barra de título con usuario y logout
// ============================================================

import React from 'react';
import './TitleBar.css';

export default function TitleBar({ usuario, onCerrarSesion }) {
  return (
    <div className="titlebar">

      {/* Logo y nombre */}
      <div className="titlebar-drag">
        <span className="titlebar-icono">🦎</span>
        <span className="titlebar-nombre">FINATICA CR</span>
      </div>

      {/* Derecha: usuario + controles */}
      <div className="titlebar-derecha">

        {/* Info del usuario y botón logout */}
        {usuario && (
          <div className="titlebar-usuario">
            <span className="usuario-icono">👤</span>
            <span className="usuario-nombre">
              {usuario.displayName || usuario.email}
            </span>
            <button
              className="btn-logout"
              onClick={onCerrarSesion}
              title="Cerrar sesión"
            >
              ⏻ Cerrar sesión
            </button>
          </div>
        )}

        {/* Controles de ventana */}
        <div className="titlebar-controles">
          <button className="tb-btn minimizar" onClick={() => window.api.minimize()}>_</button>
          <button className="tb-btn maximizar" onClick={() => window.api.maximize()}>□</button>
          <button className="tb-btn cerrar"    onClick={() => window.api.close()}>✕</button>
        </div>

      </div>
    </div>
  );
}