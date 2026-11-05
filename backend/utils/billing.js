// Helper pembuatan tagihan (invoice) otomatis setelah pemeriksaan dokter selesai.

// Tarif konsultasi dokter per poli (Rp).
const CONSULTATION_FEES = {
  'Poli Umum': 50000,
  'Poli Gigi': 75000,
  'Poli Anak': 75000,
  'Poli THT': 90000,
  'Poli Penyakit Dalam': 100000,
};
const DEFAULT_CONSULTATION_FEE = 50000;

const PAYMENT_METHODS = ['Tunai', 'Debit', 'Kredit', 'QRIS', 'Transfer'];

const generateInvoiceNumber = async (client) => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${today}-`;
  const res = await client.query(
    `SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE $1`,
    [`${prefix}%`]
  );
  const next = parseInt(res.rows[0].count, 10) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

/**
 * Membuat invoice dari rekam medis. Harus dipanggil di dalam transaksi `client`.
 * Pasien BPJS: seluruh tagihan ditanggung BPJS (diskon = subtotal) sehingga otomatis Lunas.
 */
const createInvoiceForMedicalRecord = async (client, medicalRecordId) => {
  const mrRes = await client.query(
    `SELECT mr.id, mr.registration_id, mr.patient_id, r.poli, r.payment_type
     FROM medical_records mr
     JOIN registrations r ON r.id = mr.registration_id
     WHERE mr.id = $1`,
    [medicalRecordId]
  );
  if (mrRes.rowCount === 0) return null;
  const mr = mrRes.rows[0];

  const existing = await client.query('SELECT * FROM invoices WHERE registration_id = $1', [mr.registration_id]);
  if (existing.rowCount > 0) return existing.rows[0];

  const items = [];
  const feeRes = await client.query('SELECT fee FROM consultation_fees WHERE poli = $1', [mr.poli]);
  const fee = feeRes.rowCount > 0 ? Number(feeRes.rows[0].fee) : (CONSULTATION_FEES[mr.poli] ?? DEFAULT_CONSULTATION_FEE);
  items.push({ type: 'Konsultasi', name: `Konsultasi Dokter - ${mr.poli}`, qty: 1, price: fee });

  const procs = await client.query('SELECT procedure_name, cost FROM medical_procedures WHERE medical_record_id = $1', [medicalRecordId]);
  for (const p of procs.rows) {
    items.push({ type: 'Tindakan', name: p.procedure_name, qty: 1, price: Number(p.cost) || 0 });
  }

  const rxs = await client.query('SELECT medicine_name, quantity, unit_price FROM prescriptions WHERE medical_record_id = $1', [medicalRecordId]);
  for (const rx of rxs.rows) {
    items.push({ type: 'Obat', name: rx.medicine_name, qty: rx.quantity || 1, price: Number(rx.unit_price) || 0 });
  }

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const isBpjs = /bpjs/i.test(mr.payment_type || '');
  const discount = isBpjs ? subtotal : 0;
  const total = subtotal - discount;
  const invoiceNumber = await generateInvoiceNumber(client);

  const invRes = await client.query(
    `INSERT INTO invoices
       (invoice_number, registration_id, patient_id, medical_record_id, subtotal, discount, total_amount,
        payment_type, status, payment_method, amount_paid, paid_at, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11,$12)
     RETURNING *`,
    [
      invoiceNumber, mr.registration_id, mr.patient_id, medicalRecordId, subtotal, discount, total,
      mr.payment_type,
      isBpjs ? 'Lunas' : 'Belum Bayar',
      isBpjs ? 'BPJS' : null,
      isBpjs ? new Date() : null,
      isBpjs ? 'Ditanggung BPJS' : null,
    ]
  );
  const invoice = invRes.rows[0];

  for (const i of items) {
    await client.query(
      `INSERT INTO invoice_items (invoice_id, item_type, item_name, quantity, unit_price, subtotal)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [invoice.id, i.type, i.name, i.qty, i.price, i.qty * i.price]
    );
  }

  return invoice;
};

module.exports = {
  CONSULTATION_FEES,
  PAYMENT_METHODS,
  generateInvoiceNumber,
  createInvoiceForMedicalRecord,
};

