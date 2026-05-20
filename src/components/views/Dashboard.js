// ============================================================
// Dashboard.js — Página principal con resumen de finanzas
// Muestra: totales, cuentas, gráfica de flujo y movimientos recientes
// ============================================================


import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

// Versión de la app desde el archivo .env
const VERSION = process.env.REACT_APP_VERSION || '2.0.0';

/**
 * Formatea un número como colones costarricenses.
 * Ejemplo: 1500 → ₡1.500
 */
function formatColones(numero) {
  return '₡' + new Intl.NumberFormat('es-CR', {
    maximumFractionDigits: 0
  }).format(numero);
}

// ── Componente principal ──────────────────────────────────────
export default function Dashboard({ cuentas, movimientos, onNuevo, usuario }) {

  // Total de todos los saldos de cuentas
  const totalActivos = cuentas.reduce((suma, c) => suma + c.saldo, 0);

  // Calcular ingresos y egresos del mes actual
  const { ingresosMes, egresosMes } = useMemo(() => {
    const ahora      = new Date();
    const mesActual  = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
    const delMes     = movimientos.filter(m => m.fecha?.startsWith(mesActual));

    return {
      ingresosMes: delMes
        .filter(m => m.tipo === 'ingreso')
        .reduce((s, m) => s + m.monto, 0),
      egresosMes: delMes
        .filter(m => m.tipo === 'egreso')
        .reduce((s, m) => s + m.monto, 0),
    };
  }, [movimientos]);

  // Datos para la gráfica de flujo de los últimos 14 días
  const datosGrafica = useMemo(() => {
    // Crear array de los últimos 14 días
    const dias = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dias.push({
        fecha:  d.toISOString().slice(0, 10),
        label:  d.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        monto:  0
      });
    }

    // Acumular movimientos por día
    movimientos.forEach(m => {
      const dia = m.fecha?.slice(0, 10);
      const idx = dias.findIndex(d => d.fecha === dia);
      if (idx >= 0) {
        if (m.tipo === 'ingreso') dias[idx].monto += m.monto;
        if (m.tipo === 'egreso')  dias[idx].monto -= m.monto;
      }
    });

    // Calcular acumulado progresivo
    let acumulado = 0;
    return dias.map(d => {
      acumulado += d.monto;
      return { ...d, acumulado };
    });
  }, [movimientos]);

  // Solo los 5 movimientos más recientes
  const movRecientes = movimientos.slice(0, 5);

  return (
    <div className="dashboard">

      {/* ── Encabezado ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🏠 PÁGINA PRINCIPAL</h1>
          <p className="page-subtitle">
            🇨🇷 Hola {usuario?.displayName || usuario?.email} · <span className="version-badge">v{VERSION}</span>
          </p>
        </div>
        <button className="btn-nuevo-mov" onClick={onNuevo}>
          ＋ NUEVO MOV.
        </button>
      </div>

      {/* ── Cards de resumen ── */}
      <div className="cards-grid">
        <div className="card card--total">
          <div className="card-label">💰 Total activos</div>
          <div className="card-valor">{formatColones(totalActivos)}</div>
          <div className="card-sub">📂 {cuentas.length} cuentas</div>
        </div>
        <div className="card card--ingreso">
          <div className="card-label">📈 Ingresos del mes</div>
          <div className="card-valor">{formatColones(ingresosMes)}</div>
        </div>
        <div className="card card--egreso">
          <div className="card-label">📉 Egresos del mes</div>
          <div className="card-valor">{formatColones(egresosMes)}</div>
        </div>
      </div>

      {/* ── Lista de cuentas ── */}
      <div className="section-title">Tus cuentas</div>
      <div className="cuentas-pills">
        {cuentas.map(cuenta => (
          <div
            key={cuenta.id}
            className="cuenta-pill"
            style={{ '--color-cuenta': cuenta.color }}
          >
            <span className="pill-icono">{cuenta.icono}</span>
            <div className="pill-info">
              <div className="pill-nombre">{cuenta.nombre}</div>
              <div className="pill-tipo">{cuenta.tipo}</div>
            </div>
            <div className="pill-saldo">{formatColones(cuenta.saldo)}</div>
          </div>
        ))}
      </div>

      {/* ── Gráfica de flujo ── */}
      <div className="grafica-card">
        <div className="section-title" style={{ marginBottom: 16 }}>
          Flujo últimos 14 días
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={datosGrafica}>
            <defs>
              <linearGradient id="gradiente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#c8102e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#c8102e" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: '#9b7ec8', fontSize: 10, fontFamily: 'VT323' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background:   '#2d1b4e',
                border:       '2px solid #6b3fa0',
                borderRadius: 0,
                fontFamily:   'VT323',
                fontSize:     15
              }}
              formatter={v => [formatColones(v), 'Acumulado']}
            />
            <Area
              type="stepAfter"
              dataKey="acumulado"
              stroke="#c8102e"
              strokeWidth={2}
              fill="url(#gradiente)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Movimientos recientes ── */}
      <div className="section-title" style={{ marginTop: 24 }}>
        Movimientos recientes
      </div>
      {movRecientes.length === 0
        ? <p className="empty-msg">► Sin movimientos. ¡Registrá el primero, mae!</p>
        : (
          <div className="mov-recientes">
            {movRecientes.map(m => (
              <FilaMovimiento key={m.id} movimiento={m} />
            ))}
          </div>
        )
      }

    </div>
  );
}

// ── Subcomponente: fila de movimiento reciente ────────────────
function FilaMovimiento({ movimiento: m }) {
  const ICONOS  = { ingreso: '▲', egreso: '▼', transferencia: '◄►' };
  const COLORES = {
    ingreso:       'var(--green)',
    egreso:        'var(--rojo)',
    transferencia: 'var(--azul)'
  };

  return (
    <div className="fila-mov">
      <div className="fila-icono" style={{ color: COLORES[m.tipo] }}>
        {ICONOS[m.tipo]}
      </div>
      <div className="fila-info">
        <div className="fila-motivo">{m.motivo}</div>
        <div className="fila-meta">
          {m.fecha?.slice(0, 16).replace('T', ' ')}
          {m.cuenta_origen_nombre  && ` · ${m.cuenta_origen_nombre}`}
          {m.cuenta_destino_nombre && ` → ${m.cuenta_destino_nombre}`}
        </div>
      </div>
      <div className="fila-monto" style={{ color: COLORES[m.tipo] }}>
        {m.tipo === 'egreso' ? '-' : '+'}
        {'₡' + new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(m.monto)}
      </div>
    </div>
  );
}
