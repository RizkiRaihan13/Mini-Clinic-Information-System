const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');
const { PAYMENT_METHODS, CONSULTATION_FEES } = require('../utils/billing');

const BASE_SELECT = `
  SELECT
    i.*,
    p.name AS patient_name,
    p.medical_record_number,
    r.poli,
    r.visit_date,
    d.name AS doctor_name,
    u.full_name AS cashier_name
  FROM invoices i
  JOIN patients p ON p.id = i.patient_id
  JOIN registrations r ON r.id = i.registration_id
  LEFT JOIN doctors d ON d.id = r.doctor_id
  LEFT JOIN users u ON u.id = i.cashier_id
`;

const getInvoices = async (req, res) => {
  try {
    const { date, status, search } = req.query;
    const params = [];
    const where = [];

    if (date) {
      params.push(date);
      where.push(`r.visit_date = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`i.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(p.name ILIKE $${params.length} OR p.medical_record_number ILIKE $${params.length} OR i.invoice_number ILIKE $${params.length})`);
    }

    const query = `${BASE_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY i.created_at DESC, i.id DESC`;
    const result = await pool.query(query, params);
    return sendSuccess(res, 'Invoices retrieved successfully', result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return sendError(res, 'Failed to fetch invoices', { server: error.message }, 500);
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const result = await pool.query(`${BASE_SELECT} WHERE i.id = $1`, [req.params.id]);
    if (result.rowCount === 0) {
      return sendError(res, 'Invoice tidak ditemukan', { invoice: 'Not found' }, 404);
    }
    const items = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id', [req.params.id]);
    return sendSuccess(res, 'Invoice retrieved successfully', { ...result.rows[0], items: items.rows });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return sendError(res, 'Failed to fetch invoice', { server: error.message }, 500);
  }
};

const payInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { payment_method, amount_paid, discount, notes } = req.body;

    if (!PAYMENT_METHODS.includes(payment_method)) {
      await client.query('ROLLBACK');
      return sendError(res, 'Metode pembayaran tidak valid', { payment_method: `Pilih salah satu: ${PAYMENT_METHODS.join(', ')}` }, 400);
    }

    const invRes = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (invRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Invoice tidak ditemukan', { invoice: 'Not found' }, 404);
    }
    const invoice = invRes.rows[0];

    if (invoice.status !== 'Belum Bayar') {
      await client.query('ROLLBACK');
      return sendError(res, `Invoice sudah berstatus ${invoice.status}`, { status: invoice.status }, 409);
    }

    const subtotal = Number(invoice.subtotal);
    // Diskon manual hanya boleh diatur Administrator
    let discountValue = Number(invoice.discount);
    if (discount !== undefined && discount !== null && discount !== '') {
      if (req.user.role !== 'Administrator') {
        await client.query('ROLLBACK');
        return sendError(res, 'Hanya Administrator yang dapat memberi diskon', { discount: 'Forbidden' }, 403);
      }
      discountValue = Number(discount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > subtotal) {
        await client.query('ROLLBACK');
        return sendError(res, 'Diskon tidak valid', { discount: 'Harus 0 s/d subtotal' }, 400);
      }
    }

    const total = subtotal - discountValue;
    // Non-tunai dianggap dibayar pas
    const paid = payment_method === 'Tunai' ? Number(amount_paid) : total;
    if (isNaN(paid) || paid < total) {
      await client.query('ROLLBACK');
      return sendError(res, 'Jumlah bayar kurang dari total tagihan', { amount_paid: `Minimal ${total}` }, 400);
    }
    const change = paid - total;

    const updated = await client.query(
      `UPDATE invoices
       SET status = 'Lunas', payment_method = $1, discount = $2, total_amount = $3,
           amount_paid = $4, change_amount = $5, paid_at = CURRENT_TIMESTAMP,
           cashier_id = $6, notes = COALESCE($7, notes)
       WHERE id = $8
       RETURNING *`,
      [payment_method, discountValue, total, paid, change, req.user.id, notes || null, req.params.id]
    );

    await client.query('COMMIT');
    return sendSuccess(res, 'Pembayaran berhasil', updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error paying invoice:', error);
    return sendError(res, 'Failed to process payment', { server: error.message }, 500);
  } finally {
    client.release();
  }
};

const cancelInvoice = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE invoices SET status = 'Batal', notes = COALESCE($1, notes)
       WHERE id = $2 AND status = 'Belum Bayar'
       RETURNING *`,
      [req.body?.notes || null, req.params.id]
    );
    if (result.rowCount === 0) {
      return sendError(res, 'Invoice tidak ditemukan atau sudah diproses', { invoice: 'Not cancellable' }, 404);
    }
    return sendSuccess(res, 'Invoice dibatalkan', result.rows[0]);
  } catch (error) {
    return sendError(res, 'Failed to cancel invoice', { server: error.message }, 500);
  }
};

const getPaymentSummary = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN i.status = 'Lunas' AND i.payment_method <> 'BPJS' THEN i.total_amount END), 0) AS revenue,
         COUNT(*) FILTER (WHERE i.status = 'Lunas') AS paid_count,
         COUNT(*) FILTER (WHERE i.status = 'Belum Bayar') AS unpaid_count,
         COALESCE(SUM(CASE WHEN i.status = 'Belum Bayar' THEN i.total_amount END), 0) AS unpaid_amount
       FROM invoices i
       JOIN registrations r ON r.id = i.registration_id
       WHERE r.visit_date = $1`,
      [date]
    );
    const byMethod = await pool.query(
      `SELECT i.payment_method, COUNT(*) AS count, SUM(i.total_amount) AS total
       FROM invoices i JOIN registrations r ON r.id = i.registration_id
       WHERE r.visit_date = $1 AND i.status = 'Lunas'
       GROUP BY i.payment_method ORDER BY total DESC`,
      [date]
    );
    const row = result.rows[0];
    return sendSuccess(res, 'Payment summary retrieved', {
      date,
      revenue: Number(row.revenue),
      paid_count: Number(row.paid_count),
      unpaid_count: Number(row.unpaid_count),
      unpaid_amount: Number(row.unpaid_amount),
      by_method: byMethod.rows.map((m) => ({ payment_method: m.payment_method, count: Number(m.count), total: Number(m.total) })),
      payment_methods: PAYMENT_METHODS,
      consultation_fees: CONSULTATION_FEES,
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    return sendError(res, 'Failed to fetch payment summary', { server: error.message }, 500);
  }
};

module.exports = { getInvoices, getInvoiceById, payInvoice, cancelInvoice, getPaymentSummary };

