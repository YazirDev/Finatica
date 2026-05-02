const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');

const isDev = process.env.NODE_ENV === 'development';

let mainwindow;
let db;
let dbPath;

// ─── CREAR VENTANA ────────────────────────────────────────────
function createWindow() {
    mainwindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1000,
        minHeight: 650,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#1a0a2e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    if (isDev) {
        mainwindow.loadURL('http://localhost:3000');
    } else {
        mainwindow.loadFile(path.join(__dirname, 'index.html'));
    }
}

// ─── INICIO ───────────────────────────────────────────────────
app.whenReady().then(async () => {
    createWindow();
    await setupDatabase();
    setupIpcHandlers();
});

app.on('window-all-closed', () => {
    saveDb();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ─── BASE DE DATOS ────────────────────────────────────────────
async function setupDatabase() {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();

    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'finatica.db');

    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS cuentas (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre     TEXT    NOT NULL,
            tipo       TEXT    NOT NULL,
            saldo      REAL    NOT NULL DEFAULT 0,
            color      TEXT    NOT NULL DEFAULT '#0e8972',
            icono      TEXT    NOT NULL DEFAULT '💰',
            creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS categorias (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre         TEXT    NOT NULL,
            icono          TEXT    DEFAULT '📌',
            color          TEXT    DEFAULT '#3f67a0',
            tipo           TEXT    DEFAULT 'ambos',
            es_predefinida INTEGER DEFAULT 0
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS movimientos (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo              TEXT  NOT NULL,
            monto             REAL  NOT NULL,
            motivo            TEXT  NOT NULL,
            cuenta_origen_id  INTEGER,
            cuenta_destino_id INTEGER,
            categoria_id      INTEGER REFERENCES categorias(id),
            fecha             TEXT  NOT NULL,
            notas             TEXT
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS recurrentes (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre            TEXT  NOT NULL,
            tipo              TEXT  NOT NULL,
            monto             REAL  NOT NULL,
            cuenta_origen_id  INTEGER,
            cuenta_destino_id INTEGER,
            categoria_id      INTEGER,
            dia_del_mes       INTEGER DEFAULT 1,
            ultima_ejecucion  TEXT,
            activo            INTEGER DEFAULT 1
        );
    `);

    // Migración: agregar columna si no existe en bases de datos viejas
    try { db.run('ALTER TABLE movimientos ADD COLUMN categoria_id INTEGER'); } catch (e) {}

    // Cuentas por defecto solo si la tabla está vacía
    const cuentasCount = db.exec('SELECT COUNT(*) as c FROM cuentas');
    if ((cuentasCount[0]?.values[0][0] || 0) === 0) {
        db.run(`
            INSERT INTO cuentas (nombre, tipo, saldo, color, icono) VALUES
            ('Efectivo',          'efectivo', 0, '#0e8972', '💵'),
            ('Tarjeta de Débito', 'debito',   0, '#3f67a0', '💳'),
            ('Cuenta Bancaria',   'banco',    0, '#a03f67', '🏦');
        `);
    }

    // Categorías predefinidas solo si la tabla está vacía
    const catCount = db.exec('SELECT COUNT(*) as c FROM categorias');
    if ((catCount[0]?.values[0][0] || 0) === 0) {
        const categoriasPredefinidas = [
            ['Alimentación',    '🍽️', '#e67e22', 'egreso'],
            ['Transporte',      '🚌', '#3498db', 'egreso'],
            ['Salud',           '💊', '#e74c3c', 'egreso'],
            ['Entretenimiento', '🎮', '#9b59b6', 'egreso'],
            ['Educación',       '📚', '#1abc9c', 'egreso'],
            ['Ropa',            '👕', '#e91e63', 'egreso'],
            ['Hogar',           '🏠', '#795548', 'egreso'],
            ['Servicios',       '💡', '#607d8b', 'egreso'],
            ['Sueldo',          '💼', '#27ae60', 'ingreso'],
            ['Extra',           '🎁', '#f39c12', 'ingreso'],
            ['Ahorro',          '🏦', '#2980b9', 'ambos'],
            ['Otros',           '📌', '#6b3fa0', 'ambos'],
        ];

        categoriasPredefinidas.forEach(([nombre, icono, color, tipo]) => {
            run(
                'INSERT INTO categorias (nombre, icono, color, tipo, es_predefinida) VALUES (?, ?, ?, ?, 1)',
                [nombre, icono, color, tipo]
            );
        });
    }

    saveDb();
}

// Guarda la base de datos en disco
function saveDb() {
    if (!db || !dbPath) return;
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
}

// Convierte resultado de sql.js a array de objetos
function toObjects(result) {
    if (!result || result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map(row => {
        const obj = {};
        columns.forEach((col, index) => { obj[col] = row[index]; });
        return obj;
    });
}

// Ejecuta un SELECT y devuelve array de objetos
function query(sql, params = []) {
    return toObjects(db.exec(sql, params));
}

// Ejecuta INSERT, UPDATE o DELETE y guarda en disco
function run(sql, params = []) {
    db.run(sql, params);
    saveDb();
}

// ─── IPC HANDLERS ─────────────────────────────────────────────
function setupIpcHandlers() {

    // ── Ventana ──
    ipcMain.handle('window:minimize', () => mainwindow.minimize());

    ipcMain.handle('window:maximize', () => {
        if (mainwindow.isMaximized()) {
            mainwindow.unmaximize();
        } else {
            mainwindow.maximize();
        }
    });

    ipcMain.handle('window:close', () => {
        saveDb();
        mainwindow.close();
    });

    // ── Cuentas ──
    ipcMain.handle('cuentas:getAll', () => {
        return query('SELECT * FROM cuentas ORDER BY tipo, nombre');
    });

    ipcMain.handle('cuentas:crear', (_, { nombre, tipo, saldo, color, icono }) => {
        run(
            'INSERT INTO cuentas (nombre, tipo, saldo, color, icono) VALUES (?, ?, ?, ?, ?)',
            [nombre, tipo, saldo || 0, color || '#6366f1', icono || '💰']
        );
        return query('SELECT * FROM cuentas ORDER BY id DESC LIMIT 1')[0];
    });

    ipcMain.handle('cuentas:eliminar', (_, id) => {
        run('DELETE FROM movimientos WHERE cuenta_origen_id = ? OR cuenta_destino_id = ?', [id, id]);
        run('DELETE FROM cuentas WHERE id = ?', [id]);
        return { ok: true };
    });

    // ── Categorías ──
    ipcMain.handle('categorias:getAll', () => {
        return query('SELECT * FROM categorias ORDER BY es_predefinida DESC, nombre');
    });

    ipcMain.handle('categorias:crear', (_, { nombre, icono, color, tipo }) => {
        run(
            'INSERT INTO categorias (nombre, icono, color, tipo, es_predefinida) VALUES (?, ?, ?, ?, 0)',
            [nombre, icono || '📌', color || '#6b3fa0', tipo || 'ambos']
        );
        return query('SELECT * FROM categorias ORDER BY id DESC LIMIT 1')[0];
    });

    ipcMain.handle('categorias:eliminar', (_, id) => {
        run('UPDATE movimientos SET categoria_id = NULL WHERE categoria_id = ?', [id]);
        run('DELETE FROM categorias WHERE id = ?', [id]);
        return { ok: true };
    });

    // ── Movimientos ──
    ipcMain.handle('movimientos:getAll', (_, opts = {}) => {
        const { limit = 500, cuentaId } = opts;

        let sql = `
            SELECT
                m.*,
                co.nombre  AS cuenta_origen_nombre,
                co.color   AS cuenta_origen_color,
                cd.nombre  AS cuenta_destino_nombre,
                cd.color   AS cuenta_destino_color,
                cat.nombre AS categoria_nombre,
                cat.icono  AS categoria_icono,
                cat.color  AS categoria_color
            FROM movimientos m
            LEFT JOIN cuentas    co  ON m.cuenta_origen_id  = co.id
            LEFT JOIN cuentas    cd  ON m.cuenta_destino_id = cd.id
            LEFT JOIN categorias cat ON m.categoria_id      = cat.id
        `;

        const params = [];
        if (cuentaId) {
            sql += ' WHERE m.cuenta_origen_id = ? OR m.cuenta_destino_id = ?';
            params.push(cuentaId, cuentaId);
        }

        sql += ` ORDER BY m.fecha DESC LIMIT ${limit}`;
        return query(sql, params);
    });

    ipcMain.handle('movimientos:registrar', (_, mov) => {
        const {
            tipo,
            monto,
            motivo,
            cuenta_origen_id,
            cuenta_destino_id,
            categoria_id,
            fecha,
            notas
        } = mov;

        const fechaFinal = fecha || new Date().toISOString().replace('T', ' ').slice(0, 19);

        run(
            `INSERT INTO movimientos
                (tipo, monto, motivo, cuenta_origen_id, cuenta_destino_id, categoria_id, fecha, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tipo, monto, motivo, cuenta_origen_id || null, cuenta_destino_id || null, categoria_id || null, fechaFinal, notas || '']
        );

        if (tipo === 'ingreso' && cuenta_destino_id) {
            run('UPDATE cuentas SET saldo = saldo + ? WHERE id = ?', [monto, cuenta_destino_id]);
        } else if (tipo === 'egreso' && cuenta_origen_id) {
            run('UPDATE cuentas SET saldo = saldo - ? WHERE id = ?', [monto, cuenta_origen_id]);
        } else if (tipo === 'transferencia') {
            if (cuenta_origen_id)  run('UPDATE cuentas SET saldo = saldo - ? WHERE id = ?', [monto, cuenta_origen_id]);
            if (cuenta_destino_id) run('UPDATE cuentas SET saldo = saldo + ? WHERE id = ?', [monto, cuenta_destino_id]);
        }

        return { ok: true };
    });

    ipcMain.handle('movimientos:eliminar', (_, id) => {
        const rows = query('SELECT * FROM movimientos WHERE id = ?', [id]);
        if (!rows.length) return { ok: false };
        const mov = rows[0];

        if (mov.tipo === 'ingreso' && mov.cuenta_destino_id) {
            run('UPDATE cuentas SET saldo = saldo - ? WHERE id = ?', [mov.monto, mov.cuenta_destino_id]);
        } else if (mov.tipo === 'egreso' && mov.cuenta_origen_id) {
            run('UPDATE cuentas SET saldo = saldo + ? WHERE id = ?', [mov.monto, mov.cuenta_origen_id]);
        } else if (mov.tipo === 'transferencia') {
            if (mov.cuenta_origen_id)  run('UPDATE cuentas SET saldo = saldo + ? WHERE id = ?', [mov.monto, mov.cuenta_origen_id]);
            if (mov.cuenta_destino_id) run('UPDATE cuentas SET saldo = saldo - ? WHERE id = ?', [mov.monto, mov.cuenta_destino_id]);
        }

        run('DELETE FROM movimientos WHERE id = ?', [id]);
        return { ok: true };
    });

    // ── Recurrentes ──
    // CORREGIDO: era 'recurrentes:getALL' con ALL en mayúsculas
    ipcMain.handle('recurrentes:getAll', () => {
        return query(`
            SELECT
                r.*,
                co.nombre  AS cuenta_origen_nombre,
                cd.nombre  AS cuenta_destino_nombre,
                cat.nombre AS categoria_nombre,
                cat.icono  AS categoria_icono
            FROM recurrentes r
            LEFT JOIN cuentas    co  ON r.cuenta_origen_id  = co.id
            LEFT JOIN cuentas    cd  ON r.cuenta_destino_id = cd.id
            LEFT JOIN categorias cat ON r.categoria_id      = cat.id
            ORDER BY r.nombre
        `);
    });

    ipcMain.handle('recurrentes:crear', (_, rec) => {
        const {
            nombre,
            tipo,
            monto,
            cuenta_origen_id,
            cuenta_destino_id,
            categoria_id,
            dia_del_mes
        } = rec;

        run(
            `INSERT INTO recurrentes
                (nombre, tipo, monto, cuenta_origen_id, cuenta_destino_id, categoria_id, dia_del_mes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nombre, tipo, monto, cuenta_origen_id || null, cuenta_destino_id || null, categoria_id || null, dia_del_mes || 1]
        );

        return { ok: true };
    });

    ipcMain.handle('recurrentes:eliminar', (_, id) => {
        run('DELETE FROM recurrentes WHERE id = ?', [id]);
        return { ok: true };
    });

    // CORREGIDO: recibe solo id y hace el toggle automático
    ipcMain.handle('recurrentes:toggleActivo', (_, id) => {
        run('UPDATE recurrentes SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END WHERE id = ?', [id]);
        return { ok: true };
    });

    ipcMain.handle('recurrentes:procesar', () => {
        const hoy        = new Date();
        const diaHoy     = hoy.getDate();
        const mesAnio    = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        const fechaFinal = new Date().toISOString().replace('T', ' ').slice(0, 19);

        const recurrentes = query('SELECT * FROM recurrentes WHERE activo = 1');
        let procesados = 0;

        recurrentes.forEach(r => {
            if (r.dia_del_mes !== diaHoy) return;

            const yaEjecutado = r.ultima_ejecucion && r.ultima_ejecucion.startsWith(mesAnio);
            if (yaEjecutado) return;

            run(
                `INSERT INTO movimientos
                    (tipo, monto, motivo, cuenta_origen_id, cuenta_destino_id, categoria_id, fecha, notas)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [r.tipo, r.monto, r.nombre, r.cuenta_origen_id, r.cuenta_destino_id, r.categoria_id, fechaFinal, 'Automático']
            );

            if (r.tipo === 'ingreso' && r.cuenta_destino_id) {
                run('UPDATE cuentas SET saldo = saldo + ? WHERE id = ?', [r.monto, r.cuenta_destino_id]);
            } else if (r.tipo === 'egreso' && r.cuenta_origen_id) {
                run('UPDATE cuentas SET saldo = saldo - ? WHERE id = ?', [r.monto, r.cuenta_origen_id]);
            } else if (r.tipo === 'transferencia') {
                if (r.cuenta_origen_id)  run('UPDATE cuentas SET saldo = saldo - ? WHERE id = ?', [r.monto, r.cuenta_origen_id]);
                if (r.cuenta_destino_id) run('UPDATE cuentas SET saldo = saldo + ? WHERE id = ?', [r.monto, r.cuenta_destino_id]);
            }

            run('UPDATE recurrentes SET ultima_ejecucion = ? WHERE id = ?', [fechaFinal, r.id]);
            procesados++;
        });

        return { procesados };
    });
}