const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');

// Helper to generate queue number for today
const generateQueueNumber = async (poli) => {
  let prefix = 'U';
  if (poli && poli.toLowerCase().includes('anak')) prefix = 'A';
  if (poli && poli.toLowerCase().includes('gigi')) prefix = 'G';
  if (poli && poli.toLowerCase().includes('tht')) prefix = 'T';
  if (poli && poli.toLowerCase().includes('penyakit dalam')) prefix = 'D';

  const todayStr = new Date().toISOString().slice(0, 10);

  const result = await pool.query(
    `SELECT q.queue_number 
     FROM queues q
     JOIN registrations r ON q.registration_id = r.id
     WHERE r.visit_date = $1 AND q.queue_number LIKE $2
     ORDER BY q.id DESC LIMIT 1`,
    [todayStr, `${prefix}%`]
  );

  let nextSeq = 1;
  if (result.rowCount > 0) {
    const lastNum = result.rows[0].queue_number;
    const numPart = lastNum.substring(1);
    nextSeq = parseInt(numPart, 10) + 1;
  }

  const padded = String(nextSeq).padStart(3, '0');
  return `${prefix}${padded}`;
};

const getRegistrations = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const poli = req.query.poli;

    let query = `
      SELECT 
        r.id,
        r.patient_id,
        r.doctor_id,
        r.poli,
        r.visit_date,
        r.payment_type,
        r.initial_complaint,
        r.status AS registration_status,
        r.created_at,
        p.medical_record_number,
        p.nik,
        p.name AS patient_name,
        p.gender AS patient_gender,
        p.phone AS patient_phone,
        d.name AS doctor_name,
        q.id AS queue_id,
        q.queue_number,
        q.status AS queue_status,
        q.called_at
      FROM registrations r
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN doctors d ON r.doctor_id = d.id
      LEFT JOIN queues q ON q.registration_id = r.id
      WHERE r.visit_date = $1
    `;

    const params = [date];

    // Sama seperti antrean, dokter tidak boleh melihat kunjungan dokter lain.
    if (req.user.role === 'Dokter') {
      params.push(req.user.id);
      query += ` AND r.doctor_id = (SELECT id FROM doctors WHERE user_id = $${params.length})`;
    }

    if (poli) {
      query += ` AND r.poli = $${params.length + 1}`;
      params.push(poli);
    }

    query += ` ORDER BY r.id DESC`;

    const result = await pool.query(query, params);

    return sendSuccess(res, 'Registrations retrieved successfully', result.rows);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return sendError(res, 'Failed to fetch registrations', { server: error.message }, 500);
  }
};

const createRegistration = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { patient_id, doctor_id, poli, visit_date, payment_type, initial_complaint } = req.body;

    const errors = {};
    if (!patient_id) errors.patient_id = 'Pasien wajib dipilih';
    if (!doctor_id) errors.doctor_id = 'Dokter wajib dipilih';
    if (!poli) errors.poli = 'Poli wajib dipilih';
    if (!payment_type) errors.payment_type = 'Jenis pembayaran wajib dipilih';
    if (!initial_complaint) errors.initial_complaint = 'Keluhan awal wajib diisi';

    if (Object.keys(errors).length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Validation Error', errors, 400);
    }

    const regDate = visit_date || new Date().toISOString().slice(0, 10);

    const doctorRes = await client.query(
      'SELECT id FROM doctors WHERE id = $1 AND poli = $2',
      [doctor_id, poli]
    );
    if (doctorRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Dokter harus sesuai dengan poli tujuan', { doctor_id: 'Dokter tidak terdaftar pada poli yang dipilih' }, 400);
    }

    const regResult = await client.query(
      `INSERT INTO registrations (patient_id, doctor_id, poli, visit_date, payment_type, initial_complaint, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Menunggu')
       RETURNING *`,
      [patient_id, doctor_id, poli, regDate, payment_type, initial_complaint]
    );

    const registration = regResult.rows[0];

    // Auto-generate Queue Number
    const queueNumber = await generateQueueNumber(poli);

    const queueResult = await client.query(
      `INSERT INTO queues (registration_id, queue_number, status)
       VALUES ($1, $2, 'Menunggu')
       RETURNING *`,
      [registration.id, queueNumber]
    );

    await client.query('COMMIT');

    return sendSuccess(
      res,
      'Registration and Queue created successfully',
      {
        registration,
        queue: queueResult.rows[0],
      },
      201
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating registration:', error);
    return sendError(res, 'Failed to create registration', { server: error.message }, 500);
  } finally {
    client.release();
  }
};

const updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor_id, poli, payment_type, initial_complaint, status } = req.body;

    const result = await pool.query(
      `UPDATE registrations
       SET doctor_id = COALESCE($1, doctor_id),
           poli = COALESCE($2, poli),
           payment_type = COALESCE($3, payment_type),
           initial_complaint = COALESCE($4, initial_complaint),
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING *`,
      [doctor_id, poli, payment_type, initial_complaint, status, id]
    );

    if (result.rowCount === 0) {
      return sendError(res, 'Registration not found', { registration: 'Not found' }, 404);
    }

    return sendSuccess(res, 'Registration updated successfully', result.rows[0]);
  } catch (error) {
    return sendError(res, 'Failed to update registration', { server: error.message }, 500);
  }
};

module.exports = {
  getRegistrations,
  createRegistration,
  updateRegistration,
};
