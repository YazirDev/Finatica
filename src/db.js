// ============================================================
// db.js — Operaciones de base de datos con Firestore
// Reemplaza completamente a sql.js / SQLite
// Cada usuario tiene su propia colección en:
//   usuarios/{uid}/cuentas
//   usuarios/{uid}/categorias
//   usuarios/{uid}/movimientos
//   usuarios/{uid}/recurrentes
// ============================================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

import { db, auth } from './firebase';

// ─── HELPER: obtener UID del usuario actual ───────────────────
function getUid() {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado');
  return user.uid;
}

// ─── HELPER: referencia a colección del usuario ──────────────
function userCol(colName) {
  return collection(db, 'usuarios', getUid(), colName);
}

// ─── HELPER: referencia a documento del usuario ──────────────
function userDoc(colName, id) {
  return doc(db, 'usuarios', getUid(), colName, id);
}

// ─── HELPER: convertir snapshot a objeto plano ───────────────
function snapToObj(snap) {
  return { id: snap.id, ...snap.data() };
}

// ============================================================
// INICIALIZACIÓN — categorías predefinidas
// Se llama una sola vez cuando el usuario inicia sesión por primera vez
// ============================================================

const CATEGORIAS_PREDEFINIDAS = [
  { nombre: 'Alimentación',    icono: '🍽️', color: '#e67e22', tipo: 'egreso'  },
  { nombre: 'Transporte',      icono: '🚌', color: '#3498db', tipo: 'egreso'  },
  { nombre: 'Salud',           icono: '💊', color: '#e74c3c', tipo: 'egreso'  },
  { nombre: 'Entretenimiento', icono: '🎮', color: '#9b59b6', tipo: 'egreso'  },
  { nombre: 'Educación',       icono: '📚', color: '#1abc9c', tipo: 'egreso'  },
  { nombre: 'Ropa',            icono: '👕', color: '#e91e63', tipo: 'egreso'  },
  { nombre: 'Hogar',           icono: '🏠', color: '#795548', tipo: 'egreso'  },
  { nombre: 'Servicios',       icono: '💡', color: '#607d8b', tipo: 'egreso'  },
  { nombre: 'Sueldo',          icono: '💼', color: '#27ae60', tipo: 'ingreso' },
  { nombre: 'Extra',           icono: '🎁', color: '#f39c12', tipo: 'ingreso' },
  { nombre: 'Ahorro',          icono: '🏦', color: '#2980b9', tipo: 'ambos'   },
  { nombre: 'Otros',           icono: '📌', color: '#6b3fa0', tipo: 'ambos'   },
];

/**
 * Inicializa los datos del usuario si es la primera vez que inicia sesión.
 * Crea el documento del usuario y las categorías predefinidas.
 */
export async function inicializarUsuario() {
  const uid = getUid();
  const userRef = doc(db, 'usuarios', uid);
  const userSnap = await getDoc(userRef);

  // Si ya existe el usuario, no hacer nada
  if (userSnap.exists()) return;

  // Crear documento del usuario
  await updateDoc(userRef, {
    creadoEn: serverTimestamp()
  }).catch(async () => {
    // Si no existe, crearlo
    const { setDoc } = await import('firebase/firestore');
    await setDoc(userRef, { creadoEn: serverTimestamp() });
  });

  // Insertar categorías predefinidas en batch
  const batch = writeBatch(db);
  CATEGORIAS_PREDEFINIDAS.forEach(cat => {
    const ref = doc(userCol('categorias'));
    batch.set(ref, { ...cat, es_predefinida: true });
  });
  await batch.commit();
}

// ============================================================
// CUENTAS
// ============================================================

/**
 * Devuelve todas las cuentas del usuario ordenadas por nombre
 */
export async function getCuentas() {
  const q = query(userCol('cuentas'), orderBy('nombre'));
  const snap = await getDocs(q);
  return snap.docs.map(snapToObj);
}

/**
 * Crea una cuenta nueva
 */
export async function crearCuenta({ nombre, tipo, saldo, color, icono }) {
  const ref = await addDoc(userCol('cuentas'), {
    nombre,
    tipo,
    saldo:     parseFloat(saldo) || 0,
    color:     color || '#0e8972',
    icono:     icono || '💰',
    creadoEn:  serverTimestamp()
  });
  return { id: ref.id, nombre, tipo, saldo, color, icono };
}

/**
 * Elimina una cuenta y todos sus movimientos asociados
 */
export async function eliminarCuenta(id) {
  // Eliminar movimientos relacionados
  const movSnap = await getDocs(query(
    userCol('movimientos'),
    where('cuenta_origen_id',  '==', id)
  ));
  const movSnap2 = await getDocs(query(
    userCol('movimientos'),
    where('cuenta_destino_id', '==', id)
  ));

  const batch = writeBatch(db);
  movSnap.docs.forEach(d => batch.delete(d.ref));
  movSnap2.docs.forEach(d => batch.delete(d.ref));
  batch.delete(userDoc('cuentas', id));
  await batch.commit();

  return { ok: true };
}

/**
 * Actualiza el saldo de una cuenta
 */
export async function actualizarSaldo(id, delta) {
  const ref  = userDoc('cuentas', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const saldoActual = snap.data().saldo || 0;
  await updateDoc(ref, { saldo: saldoActual + delta });
}

// ============================================================
// CATEGORÍAS
// ============================================================

/**
 * Devuelve todas las categorías (predefinidas primero)
 */
export async function getCategorias() {
  const snap = await getDocs(query(userCol('categorias'), orderBy('nombre')));
  const cats = snap.docs.map(snapToObj);
  // Ordenar: predefinidas primero
  return cats.sort((a, b) => (b.es_predefinida ? 1 : 0) - (a.es_predefinida ? 1 : 0));
}

/**
 * Crea una categoría personalizada
 */
export async function crearCategoria({ nombre, icono, color, tipo }) {
  const ref = await addDoc(userCol('categorias'), {
    nombre,
    icono:          icono || '📌',
    color:          color || '#6b3fa0',
    tipo:           tipo  || 'ambos',
    es_predefinida: false
  });
  return { id: ref.id, nombre, icono, color, tipo, es_predefinida: false };
}

/**
 * Elimina una categoría personalizada
 */
export async function eliminarCategoria(id) {
  // Desvincular movimientos
  const snap = await getDocs(query(
    userCol('movimientos'),
    where('categoria_id', '==', id)
  ));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { categoria_id: null }));
  batch.delete(userDoc('categorias', id));
  await batch.commit();
  return { ok: true };
}

// ============================================================
// MOVIMIENTOS
// ============================================================

/**
 * Devuelve los últimos 500 movimientos del usuario
 */
export async function getMovimientos() {
  const q    = query(userCol('movimientos'), orderBy('fecha', 'desc'), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map(snapToObj);
}

/**
 * Registra un movimiento y actualiza los saldos de las cuentas
 */
export async function registrarMovimiento({
  tipo,
  monto,
  motivo,
  cuenta_origen_id,
  cuenta_destino_id,
  categoria_id,
  fecha,
  notas
}) {
  const fechaFinal = fecha || new Date().toISOString().replace('T', ' ').slice(0, 19);
  const montoNum   = parseFloat(monto);

  // Guardar movimiento
  await addDoc(userCol('movimientos'), {
    tipo,
    monto:            montoNum,
    motivo,
    cuenta_origen_id:  cuenta_origen_id  || null,
    cuenta_destino_id: cuenta_destino_id || null,
    categoria_id:      categoria_id      || null,
    fecha:             fechaFinal,
    notas:             notas || ''
  });

  // Actualizar saldos
  if (tipo === 'ingreso' && cuenta_destino_id) {
    await actualizarSaldo(cuenta_destino_id, montoNum);

  } else if (tipo === 'egreso' && cuenta_origen_id) {
    await actualizarSaldo(cuenta_origen_id, -montoNum);

  } else if (tipo === 'transferencia') {
    if (cuenta_origen_id)  await actualizarSaldo(cuenta_origen_id,  -montoNum);
    if (cuenta_destino_id) await actualizarSaldo(cuenta_destino_id,  montoNum);
  }

  return { ok: true };
}

/**
 * Elimina un movimiento y revierte los saldos
 */
export async function eliminarMovimiento(id) {
  const snap = await getDoc(userDoc('movimientos', id));
  if (!snap.exists()) return { ok: false };

  const mov      = snap.data();
  const montoNum = parseFloat(mov.monto);

  // Revertir saldo
  if (mov.tipo === 'ingreso' && mov.cuenta_destino_id) {
    await actualizarSaldo(mov.cuenta_destino_id, -montoNum);

  } else if (mov.tipo === 'egreso' && mov.cuenta_origen_id) {
    await actualizarSaldo(mov.cuenta_origen_id, montoNum);

  } else if (mov.tipo === 'transferencia') {
    if (mov.cuenta_origen_id)  await actualizarSaldo(mov.cuenta_origen_id,  montoNum);
    if (mov.cuenta_destino_id) await actualizarSaldo(mov.cuenta_destino_id, -montoNum);
  }

  await deleteDoc(userDoc('movimientos', id));
  return { ok: true };
}

// ============================================================
// RECURRENTES
// ============================================================

/**
 * Devuelve todos los recurrentes del usuario
 */
export async function getRecurrentes() {
  const snap = await getDocs(query(userCol('recurrentes'), orderBy('nombre')));
  return snap.docs.map(snapToObj);
}

/**
 * Crea un nuevo recurrente
 */
export async function crearRecurrente({
  nombre,
  tipo,
  monto,
  cuenta_origen_id,
  cuenta_destino_id,
  categoria_id,
  dia_del_mes
}) {
  await addDoc(userCol('recurrentes'), {
    nombre,
    tipo,
    monto:            parseFloat(monto),
    cuenta_origen_id:  cuenta_origen_id  || null,
    cuenta_destino_id: cuenta_destino_id || null,
    categoria_id:      categoria_id      || null,
    dia_del_mes:       parseInt(dia_del_mes) || 1,
    ultima_ejecucion:  null,
    activo:            true
  });
  return { ok: true };
}

/**
 * Elimina un recurrente
 */
export async function eliminarRecurrente(id) {
  await deleteDoc(userDoc('recurrentes', id));
  return { ok: true };
}

/**
 * Activa o desactiva un recurrente
 */
export async function toggleRecurrente(id) {
  const snap = await getDoc(userDoc('recurrentes', id));
  if (!snap.exists()) return { ok: false };
  await updateDoc(userDoc('recurrentes', id), {
    activo: !snap.data().activo
  });
  return { ok: true };
}

/**
 * Procesa los recurrentes que corresponden a hoy.
 * Se llama automáticamente al abrir la app.
 */
export async function procesarRecurrentes() {
  const hoy        = new Date();
  const diaHoy     = hoy.getDate();
  const mesAnio    = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const fechaFinal = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const snap = await getDocs(query(
    userCol('recurrentes'),
    where('activo', '==', true)
  ));

  let procesados = 0;

  for (const d of snap.docs) {
    const r = { id: d.id, ...d.data() };

    // Verificar que sea el día correcto
    if (r.dia_del_mes !== diaHoy) continue;

    // Verificar que no se haya ejecutado este mes
    if (r.ultima_ejecucion && r.ultima_ejecucion.startsWith(mesAnio)) continue;

    // Registrar movimiento automático
    await registrarMovimiento({
      tipo:             r.tipo,
      monto:            r.monto,
      motivo:           r.nombre,
      cuenta_origen_id:  r.cuenta_origen_id,
      cuenta_destino_id: r.cuenta_destino_id,
      categoria_id:      r.categoria_id,
      fecha:             fechaFinal,
      notas:             'Automático'
    });

    // Marcar como ejecutado
    await updateDoc(userDoc('recurrentes', r.id), {
      ultima_ejecucion: fechaFinal
    });

    procesados++;
  }

  return { procesados };
}
