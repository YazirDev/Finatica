// ============================================================
// TitleBar.js — Barra de título personalizada
// Reemplaza la barra nativa de Windows con controles propios
// ============================================================

import React from 'react';
import './TitleBar.css';

export default function TitleBar() {
  return (
    <div className="titlebar">

      {/* Logo y nombre de la app */}
      <div className="titlebar-drag">
        <span className="titlebar-icono">🦎</span>
        <span className="titlebar-nombre">FINATICA CR</span>
      </div>

      {/* Botones de control de ventana */}
      <div className="titlebar-controles">
        <button
          className="tb-btn minimizar"
          onClick={() => window.api.minimize()}
          title="Minimizar"
        >
          _
        </button>
        <button
          className="tb-btn maximizar"
          onClick={() => window.api.maximize()}
          title="Maximizar"
        >
          □
        </button>
        <button
          className="tb-btn cerrar"
          onClick={() => window.api.close()}
          title="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
