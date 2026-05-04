// ============================================================
// Cuentas.js — Gestión de cuentas y categorías con Firestore
// ============================================================

import React, { useState } from 'react';
import {
  crearCuenta,
  eliminarCuenta,
  crearCategoria,
  eliminarCategoria
} from '../db';
import './Cuentas.css';

const TIPOS_CUENTA = [
  { value: 'debito',   label: 'Tarjeta de débito', icono: '💳' },
  { value: 'efectivo', label: 'Efectivo',           icono: '💵' },
  { value: 'sobre',    label: 'Sobre',              icono: '✉️'  },
];

const COLORES_CUENTA = [
  '#7c6fff', '#ff6b9d', '#00d4aa',
  '#ffd166', '#ff4d6d', '#60a5fa',
  '#f472b6', '#34d399'
];

const ICONOS_CUENTA = ['💰','💳','💵','✉️','🏦','🎯','🏠','🚗','🎓','💊','🛒'];

const COLORES_CAT = [
  '#e67e22', '#3498db', '#e74c3c', '#9b59b6',
  '#1abc9c', '#27ae60', '#f39c12', '#6b3fa0',
  '#c0392b', '#2980b9'
];

const ICONOS_CAT = [
  '🍽️','🚌','💊','🎮','📚','👕',
  '🏠','💡','💼','🎁','🏦','📌',
  '🚗','✈️','🎵','⚽'
];

function formatColones(n) {
  return '₡' + new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n);
}

// ── Componente principal ──────────────────────────────────────
export default function Cuentas({ cuentas, categorias, reload }) {
  const [pestana, setPestana] = useState('cuentas');

  return (
    <div className="cuentas-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 CUENTAS</h1>
          <p className="page-subtitle">
            Total: {formatColones(cuentas.reduce((s, c) => s + c.saldo, 0))}
          </p>
        </div>
      </div>

      <div className="tabs-row">
        <button
          className={`tab-btn ${pestana === 'cuentas' ? 'active' : ''}`}
          onClick={() => setPestana('cuentas')}
        >
          💰 Cuentas
        </button>
        <button
          className={`tab-btn ${pestana === 'categorias' ? 'active' : ''}`}
          onClick={() => setPestana('categorias')}
        >
          🏷️ Categorías
        </button>
      </div>

      {pestana === 'cuentas'    && <PanelCuentas    cuentas={cuentas}       reload={reload} />}
      {pestana === 'categorias' && <PanelCategorias categorias={categorias} reload={reload} />}
    </div>
  );
}

// ── Panel de Cuentas ─────────────────────────────────────────
function PanelCuentas({ cuentas, reload }) {
  const [mostrarForm,  setMostrarForm]  = useState(false);
  const [form,         setForm]         = useState({
    nombre: '', tipo: 'sobre', saldo: '0',
    color: COLORES_CUENTA[0], icono: '✉️'
  });
  const [guardando,    setGuardando]    = useState(false);
  const [confirmarId,  setConfirmarId]  = useState(null);

  function actualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  function cambiarTipo(tipo) {
    const t = TIPOS_CUENTA.find(t => t.value === tipo);
    setForm(prev => ({ ...prev, tipo, icono: t?.icono || prev.icono }));
  }

  async function guardarCuenta() {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    await crearCuenta({ ...form, saldo: parseFloat(form.saldo) || 0 });
    setGuardando(false);
    setMostrarForm(false);
    setForm({ nombre: '', tipo: 'sobre', saldo: '0', color: COLORES_CUENTA[0], icono: '✉️' });
    reload();
  }

  async function borrarCuenta(id) {
    await eliminarCuenta(id);
    setConfirmarId(null);
    reload();
  }

  return (
    <div>
      <div className="panel-header">
        <button className="btn-agregar" onClick={() => setMostrarForm(v => !v)}>
          {mostrarForm ? '✕ Cancelar' : '＋ Nueva cuenta'}
        </button>
      </div>

      {mostrarForm && (
        <div className="form-card">
          <h3 className="form-titulo">NUEVA CUENTA</h3>

          <div className="tipo-selector">
            {TIPOS_CUENTA.map(t => (
              <button
                key={t.value}
                className={`tipo-btn ${form.tipo === t.value ? 'activo' : ''}`}
                onClick={() => cambiarTipo(t.value)}
              >
                <span>{t.icono}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="form-row" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                value={form.nombre}
                onChange={e => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej: Sobre comida"
              />
            </div>
            <div className="form-group">
              <label>Saldo inicial</label>
              <input
                type="number"
                value={form.saldo}
                onChange={e => actualizarCampo('saldo', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Ícono</label>
            <div className="picker-iconos">
              {ICONOS_CUENTA.map(ic => (
                <button
                  key={ic}
                  className={`picker-icono-btn ${form.icono === ic ? 'activo' : ''}`}
                  onClick={() => actualizarCampo('icono', ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Color</label>
            <div className="picker-colores">
              {COLORES_CUENTA.map(c => (
                <button
                  key={c}
                  className={`picker-color-btn ${form.color === c ? 'activo' : ''}`}
                  style={{ background: c }}
                  onClick={() => actualizarCampo('color', c)}
                />
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 20 }}
            onClick={guardarCuenta}
            disabled={guardando}
          >
            {guardando ? 'GUARDANDO...' : '► CREAR CUENTA'}
          </button>
        </div>
      )}

      <div className="lista-cuentas">
        {cuentas.map(c => (
          <div key={c.id} className="cuenta-card" style={{ '--color-cuenta': c.color }}>
            <div className="cuenta-izq">
              <div className="cuenta-icono">{c.icono}</div>
              <div>
                <div className="cuenta-nombre">{c.nombre}</div>
                <div className="cuenta-tipo">
                  {TIPOS_CUENTA.find(t => t.value === c.tipo)?.label || c.tipo}
                </div>
              </div>
            </div>
            <div className="cuenta-der">
              <div className="cuenta-saldo">{formatColones(c.saldo)}</div>
              <button className="btn-del" onClick={() => setConfirmarId(c.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <h2>¿ELIMINAR CUENTA?</h2>
            <p className="modal-texto">Se eliminarán todos los movimientos asociados.</p>
            <button
              className="btn-primary"
              style={{ background: 'var(--rojo)' }}
              onClick={() => borrarCuenta(confirmarId)}
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

// ── Panel de Categorías ──────────────────────────────────────
function PanelCategorias({ categorias, reload }) {
  const [mostrarForm,  setMostrarForm]  = useState(false);
  const [form,         setForm]         = useState({
    nombre: '', icono: '📌', color: '#6b3fa0', tipo: 'ambos'
  });
  const [guardando,    setGuardando]    = useState(false);
  const [confirmarId,  setConfirmarId]  = useState(null);

  async function guardarCategoria() {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    await crearCategoria(form);
    setGuardando(false);
    setMostrarForm(false);
    setForm({ nombre: '', icono: '📌', color: '#6b3fa0', tipo: 'ambos' });
    reload();
  }

  async function borrarCategoria(id) {
    await eliminarCategoria(id);
    setConfirmarId(null);
    reload();
  }

  const predefinidas   = categorias.filter(c => c.es_predefinida);
  const personalizadas = categorias.filter(c => !c.es_predefinida);

  return (
    <div>
      <div className="panel-header">
        <button className="btn-agregar" onClick={() => setMostrarForm(v => !v)}>
          {mostrarForm ? '✕ Cancelar' : '＋ Nueva categoría'}
        </button>
      </div>

      {mostrarForm && (
        <div className="form-card">
          <h3 className="form-titulo">NUEVA CATEGORÍA</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Mascotas"
              />
            </div>
            <div className="form-group">
              <label>Aplica para</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                <option value="egreso">Solo egresos</option>
                <option value="ingreso">Solo ingresos</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Ícono</label>
            <div className="picker-iconos">
              {ICONOS_CAT.map(ic => (
                <button
                  key={ic}
                  className={`picker-icono-btn ${form.icono === ic ? 'activo' : ''}`}
                  onClick={() => setForm(p => ({ ...p, icono: ic }))}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Color</label>
            <div className="picker-colores">
              {COLORES_CAT.map(c => (
                <button
                  key={c}
                  className={`picker-color-btn ${form.color === c ? 'activo' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                />
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 16 }}
            onClick={guardarCategoria}
            disabled={guardando}
          >
            {guardando ? 'GUARDANDO...' : '► CREAR CATEGORÍA'}
          </button>
        </div>
      )}

      {personalizadas.length > 0 && (
        <>
          <div className="section-title">Mis categorías</div>
          <div className="lista-cuentas" style={{ marginBottom: 20 }}>
            {personalizadas.map(c => (
              <div key={c.id} className="cuenta-card" style={{ '--color-cuenta': c.color }}>
                <div className="cuenta-izq">
                  <div className="cuenta-icono">{c.icono}</div>
                  <div>
                    <div className="cuenta-nombre">{c.nombre}</div>
                    <div className="cuenta-tipo">{c.tipo === 'ambos' ? 'Ingresos y egresos' : c.tipo}</div>
                  </div>
                </div>
                <button className="btn-del" onClick={() => setConfirmarId(c.id)}>🗑</button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title">Predefinidas</div>
      <div className="lista-cuentas">
        {predefinidas.map(c => (
          <div key={c.id} className="cuenta-card" style={{ '--color-cuenta': c.color, opacity: 0.7 }}>
            <div className="cuenta-izq">
              <div className="cuenta-icono">{c.icono}</div>
              <div>
                <div className="cuenta-nombre">{c.nombre}</div>
                <div className="cuenta-tipo">{c.tipo === 'ambos' ? 'Ingresos y egresos' : c.tipo}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <h2>¿ELIMINAR CATEGORÍA?</h2>
            <p className="modal-texto">Los movimientos quedarán sin categoría.</p>
            <button
              className="btn-primary"
              style={{ background: 'var(--rojo)' }}
              onClick={() => borrarCategoria(confirmarId)}
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