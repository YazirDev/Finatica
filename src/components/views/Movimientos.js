// ============================================================
// Movimientos.js — Historial y recurrentes con Firestore
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  eliminarMovimiento,
  getRecurrentes,
  getCuentas,
  crearRecurrente,
  eliminarRecurrente,
  toggleRecurrente
} from '../../config/db';
import './Movimientos.css';

const ICONOS   = { ingreso: '▲', egreso: '▼', transferencia: '◄►' };
const COLORES  = { ingreso: 'var(--green)', egreso: 'var(--rojo)', transferencia: 'var(--azul)' };
const ETIQUETAS = { ingreso: 'Ingreso', egreso: 'Egreso', transferencia: 'Transf.' };

function formatColones(n) {
  return '₡' + new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n);
}

export default function Movimientos({ movimientos, categorias, reload }) {
  const [pestana, setPestana] = useState('historial');

  return (
    <div className="movimientos-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 MOVIMIENTOS</h1>
          <p className="page-subtitle">Historial y recurrentes automáticos</p>
        </div>
      </div>

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

      {pestana === 'historial'   && <PanelHistorial   movimientos={movimientos} reload={reload} />}
      {pestana === 'recurrentes' && <PanelRecurrentes categorias={categorias}  reload={reload} />}
    </div>
  );
}

// ── Panel Historial ──────────────────────────────────────────
function PanelHistorial({ movimientos, reload }) {
  const [filtroTipo,  setFiltroTipo]  = useState('todos');
  const [busqueda,    setBusqueda]    = useState('');
  const [confirmarId, setConfirmarId] = useState(null);

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

  async function borrarMovimiento(id) {
    await eliminarMovimiento(id);
    setConfirmarId(null);
    reload();
  }

  return (
    <div>
      <div className="filtros-bar">
        <div className="tabs-tipo">
          {['todos','ingreso','egreso','transferencia'].map(t => (
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
        <input
          className="input-busqueda"
          placeholder="🔍 Buscar..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <span className="contador-registros">{movFiltrados.length} registros</span>
      </div>

      {movFiltrados.length === 0
        ? <p className="empty-msg">► Sin movimientos, mae.</p>
        : (
          <div className="tabla-movimientos">
            <div className="tabla-header">
              <span>Tipo</span>
              <span>Motivo</span>
              <span>Categoría</span>
              <span>Cuenta(s)</span>
              <span>Fecha</span>
              <span className="col-derecha">Monto</span>
              <span></span>
            </div>
            {movFiltrados.map(m => (
              <div key={m.id} className="tabla-fila">
                <span>
                  <span className="badge-tipo" style={{ color: COLORES[m.tipo] }}>
                    {ICONOS[m.tipo]} {ETIQUETAS[m.tipo]}
                  </span>
                </span>
                <span className="col-motivo">{m.motivo}</span>
                <span>
                  {m.categoria_icono && (
                    <span className="badge-categoria" style={{ borderColor: m.categoria_color }}>
                      {m.categoria_icono} {m.categoria_nombre}
                    </span>
                  )}
                </span>
                <span className="col-cuentas">
                  {m.cuenta_origen_nombre && (
                    <span className="badge-cuenta" style={{ borderColor: m.cuenta_origen_color }}>
                      {m.cuenta_origen_nombre}
                    </span>
                  )}
                  {m.tipo === 'transferencia' && m.cuenta_destino_nombre && (
                    <span className="flecha-transferencia">→</span>
                  )}
                  {(m.tipo === 'transferencia' || m.tipo === 'ingreso') && m.cuenta_destino_nombre && (
                    <span className="badge-cuenta" style={{ borderColor: m.cuenta_destino_color }}>
                      {m.cuenta_destino_nombre}
                    </span>
                  )}
                </span>
                <span className="col-fecha">{m.fecha?.slice(0, 16)}</span>
                <span className="col-monto col-derecha" style={{ color: COLORES[m.tipo] }}>
                  {m.tipo === 'egreso' ? '-' : '+'}{formatColones(m.monto)}
                </span>
                <span>
                  <button className="btn-del-tabla" onClick={() => setConfirmarId(m.id)}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )
      }

      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <h2>¿ELIMINAR MOVIMIENTO?</h2>
            <p className="modal-texto">El saldo de las cuentas se revertirá automáticamente.</p>
            <button
              className="btn-primary"
              style={{ background: 'var(--rojo)' }}
              onClick={() => borrarMovimiento(confirmarId)}
            >
              SÍ, ELIMINAR
            </button>
            <button className="btn-ghost" onClick={() => setConfirmarId(null)}>CANCELAR</button>
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
  const [form, setForm] = useState({
    nombre: '', tipo: 'egreso', monto: '',
    cuenta_origen_id: '', cuenta_destino_id: '',
    categoria_id: '', dia_del_mes: '1',
  });

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    const [r, c] = await Promise.all([getRecurrentes(), getCuentas()]);
    setRecurrentes(r);
    setCuentas(c);
  }

  function actualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function guardarRecurrente() {
    if (!form.nombre.trim() || !form.monto) return;
    setGuardando(true);
    await crearRecurrente({
      ...form,
      monto:            parseFloat(form.monto),
      cuenta_origen_id:  form.cuenta_origen_id  || null,
      cuenta_destino_id: form.cuenta_destino_id || null,
      categoria_id:      form.categoria_id      || null,
      dia_del_mes:       parseInt(form.dia_del_mes) || 1,
    });
    setGuardando(false);
    setMostrarForm(false);
    setForm({ nombre: '', tipo: 'egreso', monto: '', cuenta_origen_id: '', cuenta_destino_id: '', categoria_id: '', dia_del_mes: '1' });
    cargarDatos();
  }

  async function toggleActivo(id) {
    await toggleRecurrente(id);
    cargarDatos();
  }

  async function borrarRecurrente(id) {
    await eliminarRecurrente(id);
    setConfirmarId(null);
    cargarDatos();
  }

  return (
    <div>
      <div className="rec-header">
        <p className="rec-descripcion">Se registran automáticamente cada mes en el día que configurés.</p>
        <button className="btn-agregar" onClick={() => setMostrarForm(v => !v)}>
          {mostrarForm ? '✕ Cancelar' : '＋ Nuevo recurrente'}
        </button>
      </div>

      {mostrarForm && (
        <div className="form-card">
          <h3 className="form-titulo">NUEVO RECURRENTE</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input value={form.nombre} onChange={e => actualizarCampo('nombre', e.target.value)} placeholder="Ej: Alquiler..." />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => actualizarCampo('tipo', e.target.value)}>
                <option value="egreso">▼ Egreso</option>
                <option value="ingreso">▲ Ingreso</option>
                <option value="transferencia">◄► Transferencia</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Monto (₡)</label>
              <input type="number" value={form.monto} onChange={e => actualizarCampo('monto', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Día del mes (1-28)</label>
              <input type="number" min="1" max="28" value={form.dia_del_mes} onChange={e => actualizarCampo('dia_del_mes', e.target.value)} />
            </div>
          </div>
          {(form.tipo === 'egreso' || form.tipo === 'transferencia') && (
            <div className="form-group">
              <label>Cuenta origen</label>
              <select value={form.cuenta_origen_id} onChange={e => actualizarCampo('cuenta_origen_id', e.target.value)}>
                <option value="">— Seleccioná —</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
              </select>
            </div>
          )}
          {(form.tipo === 'ingreso' || form.tipo === 'transferencia') && (
            <div className="form-group">
              <label>Cuenta destino</label>
              <select value={form.cuenta_destino_id} onChange={e => actualizarCampo('cuenta_destino_id', e.target.value)}>
                <option value="">— Seleccioná —</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Categoría (opcional)</label>
            <select value={form.categoria_id} onChange={e => actualizarCampo('categoria_id', e.target.value)}>
              <option value="">— Sin categoría —</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={guardarRecurrente} disabled={guardando}>
            {guardando ? 'GUARDANDO...' : '► GUARDAR RECURRENTE'}
          </button>
        </div>
      )}

      {recurrentes.length === 0
        ? <p className="empty-msg">► Sin recurrentes. ¡Agregá el primero!</p>
        : (
          <div className="lista-recurrentes">
            {recurrentes.map(r => (
              <div key={r.id} className="rec-card" style={{ '--color-rec': COLORES[r.tipo] }}>
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
                <div className="rec-der">
                  <span className="rec-monto">{formatColones(r.monto)}</span>
                  <button
                    className={`rec-toggle ${r.activo ? 'activo' : 'inactivo'}`}
                    onClick={() => toggleActivo(r.id)}
                  >
                    {r.activo ? '✓ ON' : '✗ OFF'}
                  </button>
                  <button className="btn-del" onClick={() => setConfirmarId(r.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <h2>¿ELIMINAR RECURRENTE?</h2>
            <p className="modal-texto">Los movimientos ya registrados no se eliminarán.</p>
            <button
              className="btn-primary"
              style={{ background: 'var(--rojo)' }}
              onClick={() => borrarRecurrente(confirmarId)}
            >
              SÍ, ELIMINAR
            </button>
            <button className="btn-ghost" onClick={() => setConfirmarId(null)}>CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
}