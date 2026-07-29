const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');

// Helper to generate unique RM
const generateMedicalRecordNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RM-${dateStr}-`;

  const result = await pool.query(
    `SELECT medical_record_number FROM patients WHERE medical_record_number LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSeq = 1;
  if (result.rowCount > 0) {
    const lastRM = result.rows[0].medical_record_number;
    const parts = lastRM.split('-');
    if (parts.length === 3) {
      nextSeq = parseInt(parts[2], 10) + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
};

const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    let params = [];

    if (search.trim() !== '') {
      whereClause = `WHERE name ILIKE $1 OR nik ILIKE $1 OR medical_record_number ILIKE $1`;
      params.push(`%${search.trim()}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM patients ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    let dataQuery = `SELECT * FROM patients ${whereClause} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const dataParams = [...params, limit, offset];

    const dataResult = await pool.query(dataQuery, dataParams);

    return sendSuccess(res, 'Patients retrieved successfully', {
      patients: dataResult.rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return sendError(res, 'Failed to fetch patients', { server: error.message }, 500);
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return sendError(res, 'Patient not found', { patient: 'Patient not found' }, 404);
    }

    return sendSuccess(res, 'Patient retrieved successfully', result.rows[0]);
  } catch (error) {
    return sendError(res, 'Failed to fetch patient', { server: error.message }, 500);
  }
};

const createPatient = async (req, res) => {
  try {
    const { nik, name, gender, birth_date, phone, address } = req.body;

    const errors = {};
    if (!nik || nik.length < 16) errors.nik = 'NIK minimal 16 digit';
    if (!name) errors.name = 'Nama pasien wajib diisi';
    if (!gender) errors.gender = 'Jenis kelamin wajib diisi';
    if (!birth_date) errors.birth_date = 'Tanggal lahir wajib diisi';
    if (!phone) errors.phone = 'Nomor telepon wajib diisi';
    if (!address) errors.address = 'Alamat wajib diisi';

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation Error', errors, 400);
    }

    // Check duplicate NIK
    const duplicateCheck = await pool.query('SELECT id FROM patients WHERE nik = $1', [nik]);
    if (duplicateCheck.rowCount > 0) {
      return sendError(res, 'Validation Error', { nik: 'NIK sudah terdaftar di sistem' }, 400);
    }

    const medical_record_number = await generateMedicalRecordNumber();

    const insertResult = await pool.query(
      `INSERT INTO patients (medical_record_number, nik, name, gender, birth_date, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [medical_record_number, nik, name, gender, birth_date, phone, address]
    );

    return sendSuccess(res, 'Patient created successfully', insertResult.rows[0], 201);
  } catch (error) {
    console.error('Error creating patient:', error);
    return sendError(res, 'Failed to create patient', { server: error.message }, 500);
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { nik, name, gender, birth_date, phone, address } = req.body;

    const errors = {};
    if (!nik || nik.length < 16) errors.nik = 'NIK minimal 16 digit';
    if (!name) errors.name = 'Nama pasien wajib diisi';
    if (!gender) errors.gender = 'Jenis kelamin wajib diisi';
    if (!birth_date) errors.birth_date = 'Tanggal lahir wajib diisi';
    if (!phone) errors.phone = 'Nomor telepon wajib diisi';
    if (!address) errors.address = 'Alamat wajib diisi';

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation Error', errors, 400);
    }

    // Check duplicate NIK for other patients
    const duplicateCheck = await pool.query('SELECT id FROM patients WHERE nik = $1 AND id != $2', [nik, id]);
    if (duplicateCheck.rowCount > 0) {
      return sendError(res, 'Validation Error', { nik: 'NIK sudah terdaftar pada pasien lain' }, 400);
    }

    const updateResult = await pool.query(
      `UPDATE patients
       SET nik = $1, name = $2, gender = $3, birth_date = $4, phone = $5, address = $6
       WHERE id = $7
       RETURNING *`,
      [nik, name, gender, birth_date, phone, address, id]
    );

    if (updateResult.rowCount === 0) {
      return sendError(res, 'Patient not found', { patient: 'Patient not found' }, 404);
    }

    return sendSuccess(res, 'Patient updated successfully', updateResult.rows[0]);
  } catch (error) {
    return sendError(res, 'Failed to update patient', { server: error.message }, 500);
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return sendError(res, 'Patient not found', { patient: 'Patient not found' }, 404);
    }

    return sendSuccess(res, 'Patient deleted successfully', result.rows[0]);
  } catch (error) {
    return sendError(res, 'Failed to delete patient', { server: error.message }, 500);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
