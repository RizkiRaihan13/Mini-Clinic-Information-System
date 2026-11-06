const { Pool } = require('pg');
require('dotenv').config();

const usePostgres = Boolean(process.env.DATABASE_URL || process.env.DB_HOST);

/**
 * Mode 1 (default, demo): database in-memory memakai PGlite (PostgreSQL asli berbasis WASM).
 *   Tidak perlu instalasi/biaya database. Data reset saat server/instance restart.
 * Mode 2: PostgreSQL biasa, aktif jika DATABASE_URL atau DB_HOST di-set.
 */
function createPostgresPool() {
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
  const pool = new Pool(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl, max: 3 }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'mini_clinic_db',
          ssl,
          max: 3,
        }
  );
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
  return pool;
}

function createMemoryPool() {
  let dbPromise = null;
  const getDb = () => {
    if (!dbPromise) {
      dbPromise = (async () => {
        const { PGlite } = require('@electric-sql/pglite');
        const { initMemoryDb } = require('./memorySeed');
        const db = new PGlite();
        await db.waitReady;
        await initMemoryDb(db);
        console.log('In-memory PGlite database ready (demo mode).');
        return db;
      })();
    }
    return dbPromise;
  };

  // PGlite hanya punya satu koneksi: transaksi (pool.connect) diserialisasi agar tidak bertabrakan.
  // pool.query langsung dieksekusi tanpa kunci, karena controller memanggilnya saat client masih dipegang.
  let tail = Promise.resolve();
  const acquire = () => {
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    const prev = tail;
    tail = gate;
    return prev.then(() => release);
  };

  const run = async (db, text, params) => {
    const res = await db.query(text, params || []);
    return { rows: res.rows, rowCount: res.rows.length || res.affectedRows || 0, fields: res.fields };
  };

  return {
    async query(text, params) {
      const db = await getDb();
      return run(db, text, params);
    },
    async connect() {
      const db = await getDb();
      const release = await acquire();
      let released = false;
      return {
        query: (text, params) => run(db, text, params),
        release: () => {
          if (!released) {
            released = true;
            release();
          }
        },
      };
    },
    async end() {},
    on() {},
  };
}

module.exports = usePostgres ? createPostgresPool() : createMemoryPool();


