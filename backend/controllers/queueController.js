const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');

const getQueues = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const poli = req.query.poli;
    const status = req.query.status;

    let query = `
      SELECT 
        q.id,
        q.registration_id,
        q.queue_number,
        q.status AS queue_status,
        q.called_at,
        q.created_at,
        r.patient_id,
        r.doctor_id,
        r.poli,
        r.visit_date,
        r.payment_type,
        r.initial_complaint,
        r.status AS registration_status,
        p.medical_record_number,
        p.nik,
        p.name AS patient_name,
        p.gender AS patient_gender,
        p.phone AS patient_phone,
        d.name AS doctor_name
      FROM queues q
      JOIN registrations r ON q.registration_id = r.id
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN doctors d ON r.doctor_id = d.id
      WHERE r.visit_date = $1
    `;

    const params = [date];

    // Dokter hanya boleh melihat antrean yang memang ditugaskan kepadanya.
    // Filter ini dibuat di server agar parameter poli dari browser tidak bisa dipalsukan.
    if (req.user.role === 'Dokter') {
      params.push(req.user.id);
      query += ` AND r.doctor_id = (SELECT id FROM doctors WHERE user_id = $${params.length})`;
    }

    if (poli) {
      params.push(poli);
      query += ` AND r.poli = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND q.status = $${params.length}`;
    }

    // Tampilkan antrean yang baru dibuat di posisi paling atas/kiri pada grid frontend.
    query += ` ORDER BY q.created_at DESC, q.id DESC`;

    const result = await pool.query(query, params);

    return sendSuccess(res, 'Queues retrieved successfully', result.rows);
  } catch (error) {
    console.error('Error fetching queues:', error);
    return sendError(res, 'Failed to fetch queues', { server: error.message }, 500);
  }
};

const createQueue = async (req, res) => {
  try {
    const { registration_id, queue_number } = req.body;

    if (!registration_id || !queue_number) {
      return sendError(res, 'Validation Error', {
        registration_id: !registration_id ? 'Registration ID is required' : undefined,
        queue_number: !queue_number ? 'Queue number is required' : undefined,
      });
    }

    const result = await pool.query(
      `INSERT INTO queues (registration_id, queue_number, status)
       VALUES ($1, $2, 'Menunggu')
       RETURNING *`,
      [registration_id, queue_number]
    );

    return sendSuccess(res, 'Queue created successfully', result.rows[0], 201);
  } catch (error) {
    return sendError(res, 'Failed to create queue', { server: error.message }, 500);
  }
};

const callQueue = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const queueRes = await client.query(
      `UPDATE queues q
       SET status = 'Dipanggil', called_at = CURRENT_TIMESTAMP
       FROM registrations r
       WHERE q.id = $1
         AND r.id = q.registration_id
         ${req.user.role === 'Dokter' ? 'AND r.doctor_id = (SELECT id FROM doctors WHERE user_id = $2)' : ''}
       RETURNING q.*`,
      req.user.role === 'Dokter' ? [id, req.user.id] : [id]
    );

    if (queueRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Queue item not found or not assigned to you', { queue: 'Not found or forbidden' }, 404);
    }

    const updatedQueue = queueRes.rows[0];

    // Update associated registration status
    await client.query(
      `UPDATE registrations
       SET status = 'Check In'
       WHERE id = $1`,
      [updatedQueue.registration_id]
    );

    await client.query('COMMIT');

    // Fetch full details for response
    const fullQueue = await pool.query(
      `SELECT 
        q.id,
        q.queue_number,
        q.status AS queue_status,
        q.called_at,
        p.name AS patient_name,
        p.medical_record_number,
        r.poli,
        d.name AS doctor_name
       FROM queues q
       JOIN registrations r ON q.registration_id = r.id
       JOIN patients p ON r.patient_id = p.id
       LEFT JOIN doctors d ON r.doctor_id = d.id
       WHERE q.id = $1`,
      [id]
    );

    return sendSuccess(res, 'Queue called successfully', fullQueue.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error calling queue:', error);
    return sendError(res, 'Failed to call queue', { server: error.message }, 500);
  } finally {
    client.release();
  }
};

const updateQueueStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      await client.query('ROLLBACK');
      return sendError(res, 'Status is required', { status: 'Status is required' });
    }

    const queueRes = await client.query(
      `UPDATE queues q
       SET status = $1
       FROM registrations r
       WHERE q.id = $2
         AND r.id = q.registration_id
         ${req.user.role === 'Dokter' ? 'AND r.doctor_id = (SELECT id FROM doctors WHERE user_id = $3)' : ''}
       RETURNING q.*`,
      req.user.role === 'Dokter' ? [status, id, req.user.id] : [status, id]
    );

    if (queueRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Queue item not found or not assigned to you', { queue: 'Not found or forbidden' }, 404);
    }

    const updatedQueue = queueRes.rows[0];

    // Synchronize registration status
    let regStatus = 'Menunggu';
    if (status === 'Dipanggil') regStatus = 'Check In';
    if (status === 'Check In') regStatus = 'Check In';
    if (status === 'Dalam Pemeriksaan') regStatus = 'Pemeriksaan';
    if (status === 'Selesai') regStatus = 'Selesai';
    if (status === 'Batal') regStatus = 'Batal';

    await client.query(
      `UPDATE registrations
       SET status = $1
       WHERE id = $2`,
      [regStatus, updatedQueue.registration_id]
    );

    await client.query('COMMIT');

    return sendSuccess(res, 'Queue status updated successfully', updatedQueue);
  } catch (error) {
    await client.query('ROLLBACK');
    return sendError(res, 'Failed to update queue status', { server: error.message }, 500);
  } finally {
    client.release();
  }
};

module.exports = {
  getQueues,
  createQueue,
  callQueue,
  updateQueueStatus,
};
