// ============================================================
// Cuentas.js — Gestión de cuentas bancarias y categorías
// Tiene dos pestañas: Cuentas y Categorías
// ============================================================

import React, { useState } from 'react';
import './Cuentas.css';

// Opciones de tipo de cuenta
const TIPOS_CUENTA = [
  { value: 'debito',   label: 'Tarjeta de débito', icono: '💳' },
  { value: 'efectivo', label: 'Efectivo',           icono: '💵' },
  { value: 'sobre',    label: 'Sobre',              icono: '✉️'  },
];

// Colores disponibles para cuentas
const COLORES_CUENTA = [
  '#7c6fff', '#ff6b9d', '#00d4aa',
  '#ffd166', '#ff4d6d', '#60a5fa',
  '#f472b6', '#34d399'
];

// Íconos disponibles para cuentas
const ICONOS_CUENTA = ['💰','💳','💵','✉️','🏦','🎯','🏠','🚗','🎓','💊','🛒'];

// Colores disponibles para categorías
const COLORES_CAT = [
  '#e67e22', '#3498db', '#e74c3c', '#9b59b6',
  '#1abc9c', '#27ae60', '#f39c12', '#6b3fa0',
  '#c0392b', '#2980b9'
];

// Íconos disponibles para categorías
const ICONOS_CAT = [
  '🍽️','🚌','💊','🎮','📚','👕',
  '🏠','💡','💼','🎁','🏦','📌',
  '🚗','✈️','🎵','⚽'
];

/**
 * Formatea número como colones
 */
function formatColones(n) {
  return '₡' + new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n);
}

// ── Componente principal ──────────────────────────────────────
export default function Cuentas({ cuentas, categorias, reload }) {

  // Controla qué pestaña está activa
  const [pestana, setPestana] = useState('cuentas');

  return (
    <div className="cuentas-page">

      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 CUENTAS</h1>
          <p className="page-subtitle">
            Total: {formatColones(cuentas.reduce((s, c) => s + c.saldo, 0))}
          </p>
        </div>
      </div>

      {/* Pestañas */}
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

      {/* Contenido según pestaña */}
      {pestana === 'cuentas'    && <PanelCuentas    cuentas={cuentas}       reload={reload} />}
      {pestana === 'categorias' && <PanelCategorias categorias={categorias} reload={reload} />}

    </div>
  );
}

// ── Panel de Cuentas ─────────────────────────────────────────
function PanelCuentas({ cuentas, reload }) {

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    tipo:   'sobre',
    saldo:  '0',
    color:  COLORES_CUENTA[0],
    icono:  '✉️'
  });
  const [guardando,  setGuardando]  = useState(false);
  const [confirmarId, setConfirmarId] = useState(null);

  /**
   * Actualiza un campo del formulario
   */
  function actualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  /**
   * Cambia el tipo de cuenta y actualiza el ícono automáticamente
   */
  function cambiarTipo(tipo) {
    const t = TIPOS_CUENTA.find(t => t.value === tipo);
    setForm(prev => ({ ...prev, tipo, icono: t?.icono || prev.icono }));
  }

  /**
   * Guarda la cuenta nueva en la base de datos
   */
  async function guardarCuenta() {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    await window.api.crearCuenta({
      ...form,
      saldo: parseFloat(form.saldo) || 0
    });
    setGuardando(false);
    setMostrarForm(false);
    setForm({ nombre: '', tipo: 'sobre', saldo: '0', color: COLORES_CUENTA[0], icono: '✉️' });
    reload();
  }

  /**
   * Elimina una cuenta y sus movimientos
   */
  async function eliminarCuenta(id) {
    await window.api.eliminarCuenta(id);
    setConfirmarId(null);
    reload();
  }

  return (
    <div>

      {/* Botón para mostrar/ocultar formulario */}
      <div className="panel-header">
        <button
          className="btn-agregar"
          onClick={() => setMostrarForm(v => !v)}
        >
          {mostrarForm ? '✕ Cancelar' : '＋ Nueva cuenta'}
        </button>
      </div>

      {/* Formulario de nueva cuenta */}
      {mostrarForm && (
        <div className="form-card">
          <h3 className="form-titulo">NUEVA CUENTA</h3>

          {/* Selector de tipo */}
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

          {/* Nombre y saldo */}
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

          {/* Selector de ícono */}
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

          {/* Selector de color */}
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

      {/* Lista de cuentas */}
      <div className="lista-cuentas">
        {cuentas.map(c => (
          <div
            key={c.id}
            className="cuenta-card"
            style={{ '--color-cuenta': c.color }}
          >
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
              <button
                className="btn-del"
                onClick={() => setConfirmarId(c.id)}
                title="Eliminar"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación de eliminar */}
      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <h2>¿ELIMINAR CUENTA?</h2>
            <p className="modal-texto">
              Se eliminarán todos los movimientos asociados. Esta acción no se puede deshacer.
            </p>
            <button
              className="btn-primary"
              style={{ background: 'var(--rojo)' }}
              onClick={() => eliminarCuenta(confirmarId)}
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

// ── Panel de Categorías ──────────────────────────────────────
function PanelCategorias({ categorias, reload }) {

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    icono:  '📌',
    color:  '#6b3fa0',
    tipo:   'ambos'
  });
  const [guardando,   setGuardando]   = useState(false);
  const [confirmarId, setConfirmarId] = useState(null);

  /**
   * Guarda la categoría nueva
   */
  async function guardarCategoria() {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    await window.api.crearCategoria(form);
    setGuardando(false);
    setMostrarForm(false);
    setForm({ nombre: '', icono: '📌', color: '#6b3fa0', tipo: 'ambos' });
    reload();
  }

  /**
   * Elimina una categoría personalizada
   */
  async function eliminarCategoria(id) {
    await window.api.eliminarCategoria(id);
    setConfirmarId(null);
    reload();
  }

  // Separar predefinidas de personalizadas
  const predefinidas    = categorias.filter(c => c.es_predefinida);
  const personalizadas  = categorias.filter(c => !c.es_predefinida);

  return (
    <div>

      {/* Botón para mostrar formulario */}
      <div className="panel-header">
        <button
          className="btn-agregar"
          onClick={() => setMostrarForm(v => !v)}
        >
          {mostrarForm ? '✕ Cancelar' : '＋ Nueva categoría'}
        </button>
      </div>

      {/* Formulario nueva categoría */}
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
              <select
                value={form.tipo}
                onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
              >
                <option value="egreso">Solo egresos</option>
                <option value="ingreso">Solo ingresos</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
          </div>

          {/* Selector de ícono */}
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

          {/* Selector de color */}
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

      {/* Categorías personalizadas */}
      {personalizadas.length > 0 && (
        <>
          <div className="section-title">Mis categorías</div>
          <div className="lista-cuentas" style={{ marginBottom: 20 }}>
            {personalizadas.map(c => (
              <div
                key={c.id}
                className="cuenta-card"
                style={{ '--color-cuenta': c.color }}
              >
                <div className="cuenta-izq">
                  <div className="cuenta-icono">{c.icono}</div>
                  <div>
                    <div className="cuenta-nombre">{c.nombre}</div>
                    <div className="cuenta-tipo">
                      {c.tipo === 'ambos' ? 'Ingresos y egresos' : c.tipo}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-del"
                  onClick={() => setConfirmarId(c.id)}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Categorías predefinidas */}
      <div className="section-title">Predefinidas</div>
      <div className="lista-cuentas">
        {predefinidas.map(c => (
          <div
            key={c.id}
            className="cuenta-card"
            style={{ '--color-cuenta': c.color, opacity: 0.7 }}
          >
            <div className="cuenta-izq">
              <div className="cuenta-icono">{c.icono}</div>
              <div>
                <div className="cuenta-nombre">{c.nombre}</div>
                <div className="cuenta-tipo">
                  {c.tipo === 'ambos' ? 'Ingresos y egresos' : c.tipo}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación */}
      {confirmarId && (
        <div className="modal-overlay" onClick={() => setConfirmarId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <h2>¿ELIMINAR CATEGORÍA?</h2>
            <p className="modal-texto">
              Los movimientos con esta categoría quedarán sin categoría asignada.
            </p>
            <button
              className="btn-primary"
              style={{ background: 'var(--rojo)' }}
              onClick={() => eliminarCategoria(confirmarId)}
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
