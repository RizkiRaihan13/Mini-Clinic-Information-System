const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');

const num = (v) => Number(v);
const validPrice = (v) => v !== undefined && v !== '' && !isNaN(num(v)) && num(v) >= 0;

// ---------- Obat ----------
const getMedicines = async (req, res) => {
  try {
    // Dokter hanya butuh obat aktif; admin/petugas melihat semua bila ?all=1
    const onlyActive = req.user.role === 'Dokter' || !req.query.all;
    const r = await pool.query(`SELECT * FROM medicines ${onlyActive ? 'WHERE is_active = TRUE' : ''} ORDER BY name`);
    return sendSuccess(res, 'Medicines retrieved', r.rows);
  } catch (e) {
    return sendError(res, 'Failed to fetch medicines', { server: e.message }, 500);
  }
};

const saveMedicine = async (req, res) => {
  try {
    const { name, unit, price, stock, is_active } = req.body;
    if (!name || !name.trim()) return sendError(res, 'Nama obat wajib diisi', { name: 'Required' }, 400);
    if (!validPrice(price)) return sendError(res, 'Harga tidak valid', { price: 'Harus angka >= 0' }, 400);
    const stockVal = parseInt(stock, 10);
    if (isNaN(stockVal) || stockVal < 0) return sendError(res, 'Stok tidak valid', { stock: 'Harus angka >= 0' }, 400);

    let result;
    if (req.params.id) {
      result = await pool.query(
        `UPDATE medicines SET name=$1, unit=$2, price=$3, stock=$4, is_active=COALESCE($5, is_active)
         WHERE id=$6 RETURNING *`,
        [name.trim(), unit || 'tablet', num(price), stockVal, is_active, req.params.id]
      );
      if (result.rowCount === 0) return sendError(res, 'Obat tidak ditemukan', { id: 'Not found' }, 404);
    } else {
      result = await pool.query(
        `INSERT INTO medicines (name, unit, price, stock) VALUES ($1,$2,$3,$4) RETURNING *`,
        [name.trim(), unit || 'tablet', num(price), stockVal]
      );
    }
    return sendSuccess(res, 'Obat tersimpan', result.rows[0], req.params.id ? 200 : 201);
  } catch (e) {
    if (e.code === '23505') return sendError(res, 'Nama obat sudah ada', { name: 'Duplicate' }, 409);
    return sendError(res, 'Failed to save medicine', { server: e.message }, 500);
  }
};

// ---------- Tindakan ----------
const getProcedures = async (req, res) => {
  try {
    const onlyActive = req.user.role === 'Dokter' || !req.query.all;
    const r = await pool.query(`SELECT * FROM procedure_master ${onlyActive ? 'WHERE is_active = TRUE' : ''} ORDER BY name`);
    return sendSuccess(res, 'Procedures retrieved', r.rows);
  } catch (e) {
    return sendError(res, 'Failed to fetch procedures', { server: e.message }, 500);
  }
};

const saveProcedure = async (req, res) => {
  try {
    const { name, price, is_active } = req.body;
    if (!name || !name.trim()) return sendError(res, 'Nama tindakan wajib diisi', { name: 'Required' }, 400);
    if (!validPrice(price)) return sendError(res, 'Tarif tidak valid', { price: 'Harus angka >= 0' }, 400);

    let result;
    if (req.params.id) {
      result = await pool.query(
        `UPDATE procedure_master SET name=$1, price=$2, is_active=COALESCE($3, is_active) WHERE id=$4 RETURNING *`,
        [name.trim(), num(price), is_active, req.params.id]
      );
      if (result.rowCount === 0) return sendError(res, 'Tindakan tidak ditemukan', { id: 'Not found' }, 404);
    } else {
      result = await pool.query(`INSERT INTO procedure_master (name, price) VALUES ($1,$2) RETURNING *`, [name.trim(), num(price)]);
    }
    return sendSuccess(res, 'Tindakan tersimpan', result.rows[0], req.params.id ? 200 : 201);
  } catch (e) {
    if (e.code === '23505') return sendError(res, 'Nama tindakan sudah ada', { name: 'Duplicate' }, 409);
    return sendError(res, 'Failed to save procedure', { server: e.message }, 500);
  }
};

// ---------- Tarif konsultasi ----------
const getConsultationFees = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM consultation_fees ORDER BY poli');
    return sendSuccess(res, 'Consultation fees retrieved', r.rows);
  } catch (e) {
    return sendError(res, 'Failed to fetch fees', { server: e.message }, 500);
  }
};

const saveConsultationFee = async (req, res) => {
  try {
    const { fee } = req.body;
    if (!validPrice(fee)) return sendError(res, 'Tarif tidak valid', { fee: 'Harus angka >= 0' }, 400);
    const r = await pool.query(
      `INSERT INTO consultation_fees (poli, fee) VALUES ($1,$2)
       ON CONFLICT (poli) DO UPDATE SET fee = EXCLUDED.fee RETURNING *`,
      [req.params.poli, num(fee)]
    );
    return sendSuccess(res, 'Tarif konsultasi tersimpan', r.rows[0]);
  } catch (e) {
    return sendError(res, 'Failed to save fee', { server: e.message }, 500);
  }
};

module.exports = {
  getMedicines, saveMedicine, getProcedures, saveProcedure, getConsultationFees, saveConsultationFee,
};

