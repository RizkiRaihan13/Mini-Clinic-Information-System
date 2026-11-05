// Migrasi non-destruktif modul Pembayaran untuk database yang sudah ada.
// Jalankan: npm run db:migrate-payments
require('dotenv').config();
const pool = require('../config/db');
const { paymentSchemaSql } = require('./paymentSchema');
const { createInvoiceForMedicalRecord } = require('../utils/billing');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(paymentSchemaSql);

    // Backfill invoice untuk rekam medis lama yang belum punya tagihan
    const missing = await client.query(
      `SELECT mr.id FROM medical_records mr
       LEFT JOIN invoices i ON i.registration_id = mr.registration_id
       WHERE i.id IS NULL ORDER BY mr.id`
    );
    for (const row of missing.rows) {
      await createInvoiceForMedicalRecord(client, row.id);
    }
    await client.query('COMMIT');
    console.log(`Migrasi pembayaran selesai. Invoice dibuat untuk ${missing.rowCount} rekam medis lama.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migrasi pembayaran gagal:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

