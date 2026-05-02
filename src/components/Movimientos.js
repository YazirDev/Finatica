// ============================================================
// Movimientos.js — Historial de movimientos y recurrentes
// Tiene dos pestañas: Historial y Recurrentes
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import './Movimientos.css';

// Mapas de íconos, colores y etiquetas por tipo
const ICONOS  = { ingreso: '▲', egreso: '▼', transferencia: '◄►' };
const COLORES = {
  ingreso:       'var(--green)',
  egreso:        'var(--rojo)',
  transferencia: 'var(--azul)'
};
const ETIQUETAS = {
  ingreso:       'Ingreso',
  egreso:        'Egreso',
  transferencia: 'Transf.'
};

/**
 * Formatea un número como colones
 */
function formatColones(n) {
  return '₡' + new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n);
}

// ── Componente principal ──────────────────────────────────────
export default function Movimientos({ movimientos, categorias, reload }) {

  const [pestana, setPestana] = useState('historial');

  return (
    <div className="movimientos-page">

      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 MOVIMIENTOS</h1>
          <p className="page-subtitle">Historial y recurrentes automáticos</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="tabs-row">
        <button
          className={`tab-btn ${pestana === 'historial' ? 'active' : ''}`}
          onClick={() => setPestana('historial')}
        >
          📋 Historial
        </button>
        <button
          className={`tab-btn ${pestana === 'recurrentes' ? 'active' : ''}`}
          onClick={() => setPestana('recurrentes')}
        >
          🔄 Recurrentes
        </button>
      </div>

      {/* Contenido según pestaña */}
      {pestana === 'historial'   && (
        <PanelHistorial
          movimientos={movimientos}
          reload={reload}
        />
      )}
      {pestana === 'recurrentes' && (
        <PanelRecurrentes
          categorias={categorias}
          reload={reload}
        />
      )}

    </div>
  );
}

// ── Panel Historial ──────────────────────────────────────────
function PanelHistorial({ movimientos, reload }) {

  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda,   setBusqueda]   = useState('');
  const [confirmarId, setConfirmarId] = useState(null);

  // Filtrar movimientos según tipo y búsqueda
  const movFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      const matchTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
      const matchBusq = (
        m.motivo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        (m.categoria_nombre || '').toLowerCase().includes(busqueda.toLowerCase())
      );
      return matchTipo && matchBusq;
    });
  }, [movimientos, filtroTipo, busqueda]);

  /**
   * Elimina un movimiento y revierte los saldos
   */
  async function eliminarMovimiento(id) {
    await window.api.eliminarMovimiento(id);
    setConfirmarId(null);
    reload();
  }

  return (
    <div>

      {/* Barra de filtros */}
      <div className="filtros-bar">

        {/* Tabs de tipo */}
        <div className="tabs-tipo">
          {['todos', 'ingreso', 'egreso', 'transferencia'].map(t => (
            <button
              key={t}
              className={`tab-btn ${filtroTipo === t ? 'active' : ''}`}
              onClick={() => setFiltroTipo(t)}
              style={filtroTipo === t && t !== 'todos' ? { color: COLORES[t] } : {}}
            >
              {t === 'todos' ? 'Todos' : ETIQUETAS[t]}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <input
          className="input-busqueda"
          placeholder="🔍 Buscar motivo o categoría..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        {/* Contador */}
        <span className="contador-registros">
          {movFiltrados.length} registros
        </span>

      </div>

      {/* Tabla de movimientos */}
      {movFiltrados.length === 0
        ? <p className="empty-msg">► Sin movimientos, mae.</p>
        : (
          <div className="tabla-movimientos">

            {/* Encabezado de tabla */}
            <div className="tabla-header">
              <span>Tipo</span>
              <span>Motivo</span>
              <span>Categoría</span>
              <span>Cuenta(s)</span>
              <span>Fecha</span>
              <span className="col-derecha">Monto</span>
              <span></span>
            </div>

            {/* Filas */}
            {movFiltrados.map(m => (
              <div key={m.id} className="tabla-fila">

                {/* Tipo */}
                <span>
                  <span
                    className="badge-tipo"
                    style={{ color: COLORES[m.tipo] }}
                  >
                    {ICONOS[m.tipo]} {ETIQUETAS[m.tipo]}
                  </span>
                </span>

                {/* Motivo */}
                <span className="col-motivo">{m.motivo}</span>

                {/* Categoría */}
                <span>
                  {m.categoria_icono && (
                    <span
                      className="badge-categoria"
                      style={{ borderColor: m.categoria_color }}
                    >
                      {m.categoria_icono} {m.categoria_nombre}
                    </span>
                  )}
                </span>

                {/* Cuentas */}
                <span className="col-cuentas">
                  {m.cuenta_origen_nombre && (
                    <span
                      className="badge-cuenta"
                      style={{ borderColor: m.cuenta_origen_color }}
                    >
                      {m.cuenta_origen_nombre}
                    </span>
                  )}
                  {m.tipo === 'transferencia' && m.cuenta_destino_nombre && (
                    <span className="flecha-transferencia">→</span>
                  )}
                  {(m.tipo === 'transferencia' || m.tipo === 'ingreso') && m.cuenta_destino_nombre && (
                    <span
                      className="badge-cuenta"
                      style={{ borderColor: m.cuenta_destino_color }}
                    >
                      {m.cuenta_destino_nombre}
                    </span>
                  )}
                </span>

                {/* Fecha */}
                <span className="col-fecha">
                  {m.fecha?.slice(0, 16).replace('T', ' ')}
                </span>

                {/* Monto */}
                <span
                  className="col-monto col-derecha"
                  style={{ color: COLORES[m.tipo] }}
                >
                  {m.tipo === 'egreso' ? '-' : '+'}
                  {formatColones(m.monto)}
                </span>

                {/* Botón eliminar */}
                <span>
                  <button
                    className="btn-del-tabla"
                    onClick={() => setConfirmarId(m.id)}
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </span>

              </div>
            ))}
          </div>
        )
      }

      {/* Modal de confirmación de eliminar */}
      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <h2>¿ELIMINAR MOVIMIENTO?</h2>
            <p className="modal-texto">
              El saldo de las cuentas afectadas se revertirá automáticamente.
            </p>
            <button
              className="btn-primary"
              style={{ background: 'var(--rojo)' }}
              onClick={() => eliminarMovimiento(confirmarId)}
            >
              SÍ, ELIMINAR
            </button>
            <button className="btn-ghost" onClick={() => setConfirmarId(null)}>
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Panel Recurrentes ────────────────────────────────────────
function PanelRecurrentes({ categorias, reload }) {

  const [recurrentes,  setRecurrentes]  = useState([]);
  const [cuentas,      setCuentas]      = useState([]);
  const [mostrarForm,  setMostrarForm]  = useState(false);
  const [confirmarId,  setConfirmarId]  = useState(null);
  const [guardando,    setGuardando]    = useState(false);

  // Estado del formulario
  const [form, setForm] = useState({
    nombre:           '',
    tipo:             'egreso',
    monto:            '',
    cuenta_origen_id:  '',
    cuenta_destino_id: '',
    categoria_id:     '',
    dia_del_mes:      '1',
  });

  // Cargar recurrentes y cuentas al montar
  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const [r, c] = await Promise.all([
      window.api.getRecurrentes(),
      window.api.getCuentas(),
    ]);
    setRecurrentes(r);
    setCuentas(c);
  }

  /**
   * Actualiza un campo del formulario
   */
  function actualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  /**
   * Guarda un nuevo recurrente
   */
  async function guardarRecurrente() {
    if (!form.nombre.trim() || !form.monto) return;

    setGuardando(true);
    await window.api.crearRecurrente({
      ...form,
      monto:            parseFloat(form.monto),
      cuenta_origen_id:  form.cuenta_origen_id  ? parseInt(form.cuenta_origen_id)  : null,
      cuenta_destino_id: form.cuenta_destino_id ? parseInt(form.cuenta_destino_id) : null,
      categoria_id:      form.categoria_id      ? parseInt(form.categoria_id)      : null,
      dia_del_mes:       parseInt(form.dia_del_mes) || 1,
    });

    setGuardando(false);
    setMostrarForm(false);
    setForm({
      nombre: '', tipo: 'egreso', monto: '',
      cuenta_origen_id: '', cuenta_destino_id: '',
      categoria_id: '', dia_del_mes: '1'
    });
    cargarDatos();
  }

  /**
   * Activa o desactiva un recurrente
   */
  async function toggleActivo(id) {
    await window.api.toggleRecurrente(id);
    cargarDatos();
  }

  /**
   * Elimina un recurrente
   */
  async function eliminarRecurrente(id) {
    await window.api.eliminarRecurrente(id);
    setConfirmarId(null);
    cargarDatos();
  }

  return (
    <div>

      {/* Descripción y botón */}
      <div className="rec-header">
        <p className="rec-descripcion">
          Se registran automáticamente cada mes en el día que configurés.
        </p>
        <button
          className="btn-agregar"
          onClick={() => setMostrarForm(v => !v)}
        >
          {mostrarForm ? '✕ Cancelar' : '＋ Nuevo recurrente'}
        </button>
      </div>

      {/* Formulario nuevo recurrente */}
      {mostrarForm && (
        <div className="form-card">
          <h3 className="form-titulo">NUEVO RECURRENTE</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input
                value={form.nombre}
                onChange={e => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej: Alquiler, Netflix..."
              />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={form.tipo}
                onChange={e => actualizarCampo('tipo', e.target.value)}
              >
                <option value="egreso">▼ Egreso</option>
                <option value="ingreso">▲ Ingreso</option>
                <option value="transferencia">◄► Transferencia</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Monto (₡)</label>
              <input
                type="number"
                value={form.monto}
                onChange={e => actualizarCampo('monto', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Día del mes (1-28)</label>
              <input
                type="number"
                min="1"
                max="28"
                value={form.dia_del_mes}
                onChange={e => actualizarCampo('dia_del_mes', e.target.value)}
              />
            </div>
          </div>

          {/* Cuenta origen */}
          {(form.tipo === 'egreso' || form.tipo === 'transferencia') && (
            <div className="form-group">
              <label>Cuenta origen</label>
              <select
                value={form.cuenta_origen_id}
                onChange={e => actualizarCampo('cuenta_origen_id', e.target.value)}
              >
                <option value="">— Seleccioná —</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Cuenta destino */}
          {(form.tipo === 'ingreso' || form.tipo === 'transferencia') && (
            <div className="form-group">
              <label>Cuenta destino</label>
              <select
                value={form.cuenta_destino_id}
                onChange={e => actualizarCampo('cuenta_destino_id', e.target.value)}
              >
                <option value="">— Seleccioná —</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Categoría */}
          <div className="form-group">
            <label>Categoría (opcional)</label>
            <select
              value={form.categoria_id}
              onChange={e => actualizarCampo('categoria_id', e.target.value)}
            >
              <option value="">— Sin categoría —</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary"
            onClick={guardarRecurrente}
            disabled={guardando}
          >
            {guardando ? 'GUARDANDO...' : '► GUARDAR RECURRENTE'}
          </button>
        </div>
      )}

      {/* Lista de recurrentes */}
      {recurrentes.length === 0
        ? <p className="empty-msg">► Sin recurrentes. ¡Agregá el primero!</p>
        : (
          <div className="lista-recurrentes">
            {recurrentes.map(r => (
              <div
                key={r.id}
                className="rec-card"
                style={{ '--color-rec': COLORES[r.tipo] }}
              >
                {/* Info del recurrente */}
                <div className="rec-izq">
                  <span className="rec-icono">{r.categoria_icono || '🔄'}</span>
                  <div>
                    <div className="rec-nombre">{r.nombre}</div>
                    <div className="rec-meta">
                      Día {r.dia_del_mes} de cada mes
                      {r.cuenta_origen_nombre  && ` · ${r.cuenta_origen_nombre}`}
                      {r.cuenta_destino_nombre && ` → ${r.cuenta_destino_nombre}`}
                    </div>
                  </div>
                </div>

                {/* Controles */}
                <div className="rec-der">
                  <span className="rec-monto">{formatColones(r.monto)}</span>
                  <button
                    className={`rec-toggle ${r.activo ? 'activo' : 'inactivo'}`}
                    onClick={() => toggleActivo(r.id)}
                  >
                    {r.activo ? '✓ ON' : '✗ OFF'}
                  </button>
                  <button
                    className="btn-del"
                    onClick={() => setConfirmarId(r.id)}
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Modal de confirmación */}
      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <h2>¿ELIMINAR RECURRENTE?</h2>
            <p className="modal-texto">
              Los movimientos ya registrados no se eliminarán.
            </p>
            <button
              className="btn-primary"
              style={{ background: 'var(--rojo)' }}
              onClick={() => eliminarRecurrente(confirmarId)}
            >
              SÍ, ELIMINAR
            </button>
            <button className="btn-ghost" onClick={() => setConfirmarId(null)}>
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
