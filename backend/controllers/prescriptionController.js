const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');

const createPrescription = async (req, res) => {
  try {
    const { medical_record_id, medicine_name, dosage, frequency, quantity, instructions } = req.body;

    const errors = {};
    if (!medical_record_id) errors.medical_record_id = 'Medical Record ID is required';
    if (!medicine_name) errors.medicine_name = 'Nama obat wajib diisi';
    if (!dosage) errors.dosage = 'Dosis wajib diisi';
    if (!frequency) errors.frequency = 'Frekuensi aturan pakai wajib diisi';

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation Error', errors, 400);
    }

    const result = await pool.query(
      `INSERT INTO prescriptions (medical_record_id, medicine_name, dosage, frequency, quantity, instructions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [medical_record_id, medicine_name, dosage, frequency, quantity || 1, instructions || '']
    );

    return sendSuccess(res, 'Prescription created successfully', result.rows[0], 201);
  } catch (error) {
    return sendError(res, 'Failed to create prescription', { server: error.message }, 500);
  }
};

const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        pr.*,
        mr.patient_id,
        mr.doctor_id,
        p.name AS patient_name,
        p.medical_record_number,
        d.name AS doctor_name
       FROM prescriptions pr
       JOIN medical_records mr ON pr.medical_record_id = mr.id
       JOIN patients p ON mr.patient_id = p.id
       JOIN doctors d ON mr.doctor_id = d.id
       WHERE pr.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return sendError(res, 'Prescription not found', { prescription: 'Not found' }, 404);
    }

    return sendSuccess(res, 'Prescription retrieved successfully', result.rows[0]);
  } catch (error) {
    return sendError(res, 'Failed to fetch prescription', { server: error.message }, 500);
  }
};

module.exports = {
  createPrescription,
  getPrescriptionById,
};
