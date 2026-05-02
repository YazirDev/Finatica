// ============================================================
// NuevoMovimiento.js — Modal para registrar un movimiento
// Maneja: ingresos, egresos y transferencias con categoría
// ============================================================

import React, { useState } from 'react';

// Tipos de movimiento disponibles
const TIPOS = [
  { value: 'ingreso',       label: '▲ INGRESO',      color: 'var(--green)' },
  { value: 'egreso',        label: '▼ EGRESO',        color: 'var(--rojo)'  },
  { value: 'transferencia', label: '◄► TRANSF.',      color: 'var(--azul)'  },
];

export default function NuevoMovimiento({ cuentas, categorias, onClose, onSaved }) {

  // Fecha y hora actual como valor inicial
  const ahora = new Date().toISOString().slice(0, 16);

  // ── Estado del formulario ──
  const [tipo,      setTipo]      = useState('egreso');
  const [monto,     setMonto]     = useState('');
  const [motivo,    setMotivo]    = useState('');
  const [origen,    setOrigen]    = useState('');
  const [destino,   setDestino]   = useState('');
  const [catId,     setCatId]     = useState('');
  const [fecha,     setFecha]     = useState(ahora);
  const [notas,     setNotas]     = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');

  // Filtrar categorías según el tipo seleccionado
  const categoriasFiltradas = categorias.filter(c =>
    c.tipo === tipo || c.tipo === 'ambos'
  );

  /**
   * Valida el formulario antes de guardar.
   * Devuelve un mensaje de error o null si todo está bien.
   */
  function validar() {
    if (!monto || parseFloat(monto) <= 0) {
      return 'Ingresá un monto válido.';
    }
    if (!motivo.trim()) {
      return 'Escribí el motivo, mae.';
    }
    if (tipo === 'ingreso' && !destino) {
      return 'Seleccioná la cuenta destino.';
    }
    if (tipo === 'egreso' && !origen) {
      return 'Seleccioná la cuenta origen.';
    }
    if (tipo === 'transferencia' && (!origen || !destino)) {
      return 'Seleccioná origen y destino.';
    }
    if (tipo === 'transferencia' && origen === destino) {
      return 'Origen y destino deben ser distintos.';
    }
    return null;
  }

  /**
   * Guarda el movimiento en la base de datos
   */
  async function guardar() {
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    await window.api.registrarMovimiento({
      tipo,
      monto:            parseFloat(monto),
      motivo:           motivo.trim(),
      cuenta_origen_id:  origen  ? parseInt(origen)  : null,
      cuenta_destino_id: destino ? parseInt(destino) : null,
      categoria_id:      catId   ? parseInt(catId)   : null,
      fecha:             fecha.replace('T', ' '),
      notas,
    });
    setGuardando(false);
    onSaved();
  }

  // Color del tipo seleccionado
  const colorTipo = TIPOS.find(t => t.value === tipo)?.color;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2>🇨🇷 NUEVO MOVIMIENTO</h2>

        {/* ── Selector de tipo ── */}
        <div className="form-group">
          <label>Tipo de movimiento</label>
          <div className="tipo-selector-mov">
            {TIPOS.map(t => (
              <button
                key={t.value}
                className={`tipo-mov-btn ${tipo === t.value ? 'activo' : ''}`}
                style={{
                  '--color-tipo': t.color,
                  borderColor:    tipo === t.value ? t.color : 'var(--border)',
                  boxShadow:      tipo === t.value ? `2px 2px 0 ${t.color}` : '2px 2px 0 var(--border)',
                  background:     tipo === t.value ? `${t.color}22` : 'var(--bg3)',
                  color:          tipo === t.value ? t.color : 'var(--muted)',
                }}
                onClick={() => {
                  setTipo(t.value);
                  setCatId('');
                  setError('');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cuenta origen (egreso y transferencia) ── */}
        {(tipo === 'egreso' || tipo === 'transferencia') && (
          <div className="form-group">
            <label>Cuenta origen</label>
            <select value={origen} onChange={e => setOrigen(e.target.value)}>
              <option value="">— Seleccioná —</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Cuenta destino (ingreso y transferencia) ── */}
        {(tipo === 'ingreso' || tipo === 'transferencia') && (
          <div className="form-group">
            <label>Cuenta destino</label>
            <select value={destino} onChange={e => setDestino(e.target.value)}>
              <option value="">— Seleccioná —</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Monto y categoría ── */}
        <div className="form-row">
          <div className="form-group">
            <label>Monto (₡)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0"
              style={{ color: colorTipo, fontSize: '20px' }}
            />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select value={catId} onChange={e => setCatId(e.target.value)}>
              <option value="">— Sin categoría —</option>
              {categoriasFiltradas.map(c => (
                <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Motivo ── */}
        <div className="form-group">
          <label>Motivo *</label>
          <input
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: Sueldo, mercado, bus..."
          />
        </div>

        {/* ── Fecha y notas ── */}
        <div className="form-row">
          <div className="form-group">
            <label>Fecha y hora</label>
            <input
              type="datetime-local"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Notas (opcional)</label>
            <input
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Detalles..."
            />
          </div>
        </div>

        {/* ── Mensaje de error ── */}
        {error && (
          <div className="error-box">
            ► {error}
          </div>
        )}

        {/* ── Botones ── */}
        <button
          className="btn-primary"
          onClick={guardar}
          disabled={guardando}
          style={{ background: colorTipo, borderColor: 'rgba(0,0,0,0.4)' }}
        >
          {guardando ? 'GUARDANDO...' : '► REGISTRAR'}
        </button>
        <button className="btn-ghost" onClick={onClose}>
          ✕ CANCELAR
        </button>
      </div>
    </div>
  );
}
