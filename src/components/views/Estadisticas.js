// ============================================================
// Estadisticas.js — Página de análisis y gráficas
// Incluye: resumen, torta por categoría, barras por mes, tabla detalle
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import './Estadisticas.css';

// Nombres cortos de meses en español
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];

/**
 * Formatea número como colones
 */
function formatColones(n) {
  return '₡' + new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n);
}

// ── Componente principal ──────────────────────────────────────
export default function Estadisticas({ movimientos, categorias }) {

  const [periodo,  setPeriodo]  = useState('mes');   // mes | anio | todo
  const [vista,    setVista]    = useState('torta');  // torta | barras | lista

  const ahora = new Date();

  // Filtrar movimientos según el período seleccionado
  const movFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      if (!m.fecha) return false;
      const d = new Date(m.fecha);

      if (periodo === 'mes') {
        return (
          d.getMonth()     === ahora.getMonth() &&
          d.getFullYear()  === ahora.getFullYear()
        );
      }
      if (periodo === 'anio') {
        return d.getFullYear() === ahora.getFullYear();
      }
      return true; // 'todo'
    });
  }, [movimientos, periodo]);

  // Calcular totales del período
  const totalIngresos = movFiltrados
    .filter(m => m.tipo === 'ingreso')
    .reduce((s, m) => s + m.monto, 0);

  const totalEgresos = movFiltrados
    .filter(m => m.tipo === 'egreso')
    .reduce((s, m) => s + m.monto, 0);

  const balance = totalIngresos - totalEgresos;

  // Datos para la gráfica de torta (egresos por categoría)
  const datosTorta = useMemo(() => {
    const egresos = movFiltrados.filter(m => m.tipo === 'egreso' && m.categoria_id);

    // Agrupar por categoría
    const mapa = {};
    egresos.forEach(m => {
      const key = m.categoria_id;
      if (!mapa[key]) {
        mapa[key] = {
          nombre: m.categoria_nombre || 'Sin categoría',
          icono:  m.categoria_icono  || '📌',
          color:  m.categoria_color  || '#6b3fa0',
          total:  0
        };
      }
      mapa[key].total += m.monto;
    });

    return Object.values(mapa).sort((a, b) => b.total - a.total);
  }, [movFiltrados]);

  // Datos para la gráfica de barras (ingresos vs egresos por mes del año actual)
  const datosBarras = useMemo(() => {
    // Inicializar los 12 meses con ceros
    const meses = {};
    movimientos.forEach(m => {
      if (!m.fecha) return;
      const d = new Date(m.fecha);
      if (d.getFullYear() !== ahora.getFullYear()) return;

      const mes = d.getMonth();
      if (!meses[mes]) {
        meses[mes] = { mes: MESES[mes], ingresos: 0, egresos: 0 };
      }
      if (m.tipo === 'ingreso') meses[mes].ingresos += m.monto;
      if (m.tipo === 'egreso')  meses[mes].egresos  += m.monto;
    });

    // Asegurar los 12 meses aunque no tengan datos
    return Array.from({ length: 12 }, (_, i) =>
      meses[i] || { mes: MESES[i], ingresos: 0, egresos: 0 }
    );
  }, [movimientos]);

  return (
    <div className="estadisticas-page">

      {/* ── Encabezado ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 ESTADÍSTICAS</h1>
          <p className="page-subtitle">🇨🇷 Así van tus platas, mae</p>
        </div>

        {/* Selector de período */}
        <div className="tabs-row">
          {[
            ['mes',  'Este mes'],
            ['anio', 'Este año'],
            ['todo', 'Todo']
          ].map(([v, l]) => (
            <button
              key={v}
              className={`tab-btn ${periodo === v ? 'active' : ''}`}
              onClick={() => setPeriodo(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards de resumen ── */}
      <div className="resumen-grid">
        <div className="stat-card stat-ingreso">
          <div className="stat-label">▲ INGRESOS</div>
          <div className="stat-valor">{formatColones(totalIngresos)}</div>
        </div>
        <div className="stat-card stat-egreso">
          <div className="stat-label">▼ EGRESOS</div>
          <div className="stat-valor">{formatColones(totalEgresos)}</div>
        </div>
        <div className={`stat-card ${balance >= 0 ? 'stat-positivo' : 'stat-negativo'}`}>
          <div className="stat-label">◄► BALANCE</div>
          <div className="stat-valor">{formatColones(balance)}</div>
        </div>
      </div>

      {/* ── Tabs de vista ── */}
      <div className="tabs-row">
        <button
          className={`tab-btn ${vista === 'torta' ? 'active' : ''}`}
          onClick={() => setVista('torta')}
        >
          🍕 Por categoría
        </button>
        <button
          className={`tab-btn ${vista === 'barras' ? 'active' : ''}`}
          onClick={() => setVista('barras')}
        >
          📊 Por mes
        </button>
        <button
          className={`tab-btn ${vista === 'lista' ? 'active' : ''}`}
          onClick={() => setVista('lista')}
        >
          📋 Detalle
        </button>
      </div>

      {/* ── Vista: Torta por categoría ── */}
      {vista === 'torta' && (
        <div className="seccion-grafica">
          <div className="section-title">Egresos por categoría</div>

          {datosTorta.length === 0
            ? <p className="empty-msg">► Sin egresos con categoría en este período.</p>
            : (
              <div className="torta-contenedor">

                {/* Gráfica */}
                <ResponsiveContainer width="50%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosTorta}
                      dataKey="total"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={50}
                      strokeWidth={0}
                    >
                      {datosTorta.map((cat, i) => (
                        <Cell key={i} fill={cat.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background:   '#2d1b4e',
                        border:       '2px solid #6b3fa0',
                        borderRadius: 0,
                        fontFamily:   'VT323',
                        fontSize:     16
                      }}
                      formatter={v => [formatColones(v), 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Leyenda */}
                <div className="torta-leyenda">
                  {datosTorta.map((cat, i) => (
                    <div key={i} className="leyenda-item">
                      <span
                        className="leyenda-color"
                        style={{ background: cat.color }}
                      />
                      <span className="leyenda-icono">{cat.icono}</span>
                      <span className="leyenda-nombre">{cat.nombre}</span>
                      <span className="leyenda-valor">{formatColones(cat.total)}</span>
                      <span className="leyenda-pct">
                        {totalEgresos > 0
                          ? Math.round(cat.total / totalEgresos * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            )
          }
        </div>
      )}

      {/* ── Vista: Barras por mes ── */}
      {vista === 'barras' && (
        <div className="seccion-grafica">
          <div className="section-title">
            Ingresos vs Egresos — {ahora.getFullYear()}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={datosBarras} barGap={2}>
              <XAxis
                dataKey="mes"
                tick={{ fill: '#9b7ec8', fontSize: 12, fontFamily: 'VT323' }}
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
                formatter={(v, n) => [
                  formatColones(v),
                  n === 'ingresos' ? 'Ingresos' : 'Egresos'
                ]}
              />
              <Bar dataKey="ingresos" fill="#00b341" radius={0} />
              <Bar dataKey="egresos"  fill="#c8102e" radius={0} />
              <Legend
                formatter={v => v === 'ingresos' ? '▲ Ingresos' : '▼ Egresos'}
                wrapperStyle={{
                  fontFamily: 'Press Start 2P',
                  fontSize:   8,
                  paddingTop: 12
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Vista: Lista detallada ── */}
      {vista === 'lista' && (
        <div className="seccion-grafica">
          <div className="section-title">Detalle por categoría</div>

          {datosTorta.length === 0
            ? <p className="empty-msg">► Sin datos para mostrar.</p>
            : (
              <div className="lista-detalle">
                {datosTorta.map((cat, i) => (
                  <div
                    key={i}
                    className="detalle-fila"
                    style={{ '--color-cat': cat.color }}
                  >
                    <span className="det-icono">{cat.icono}</span>
                    <span className="det-nombre">{cat.nombre}</span>

                    {/* Barra de progreso */}
                    <div className="det-barra-wrap">
                      <div
                        className="det-barra"
                        style={{
                          width:      `${totalEgresos > 0 ? cat.total / totalEgresos * 100 : 0}%`,
                          background: cat.color
                        }}
                      />
                    </div>

                    <span className="det-valor">{formatColones(cat.total)}</span>
                    <span className="det-pct">
                      {totalEgresos > 0
                        ? Math.round(cat.total / totalEgresos * 100)
                        : 0
                      }%
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

    </div>
  );
}
