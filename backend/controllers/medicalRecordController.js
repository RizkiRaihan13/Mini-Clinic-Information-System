const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');

const createMedicalRecord = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      registration_id,
      patient_id,
      doctor_id,
      subjective,
      bp,
      temp,
      weight,
      height,
      assessment,
      plan,
      procedures = [],
      prescriptions = [],
    } = req.body;

    const errors = {};
    if (!registration_id) errors.registration_id = 'Registration ID wajib diisi';
    if (!patient_id) errors.patient_id = 'Patient ID wajib diisi';
    if (!doctor_id) errors.doctor_id = 'Doctor ID wajib diisi';
    if (!subjective) errors.subjective = 'Keluhan pasien (Subjective) wajib diisi';
    if (!bp) errors.bp = 'Tekanan darah wajib diisi';
    if (!temp) errors.temp = 'Suhu tubuh wajib diisi';
    if (!weight) errors.weight = 'Berat badan wajib diisi';
    if (!height) errors.height = 'Tinggi badan wajib diisi';
    if (!assessment) errors.assessment = 'Diagnosa (Assessment) wajib diisi';
    if (!plan) errors.plan = 'Rencana terapi (Plan) wajib diisi';

    if (Object.keys(errors).length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Validation Error', errors, 400);
    }

    // Insert Medical Record SOAP
    const mrRes = await client.query(
      `INSERT INTO medical_records 
        (registration_id, patient_id, doctor_id, subjective, bp, temp, weight, height, assessment, plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [registration_id, patient_id, doctor_id, subjective, bp, temp, weight, height, assessment, plan]
    );

    const medicalRecord = mrRes.rows[0];

    // Insert Medical Procedures if provided
    const insertedProcedures = [];
    if (Array.isArray(procedures) && procedures.length > 0) {
      for (const proc of procedures) {
        if (proc.procedure_name) {
          const pRes = await client.query(
            `INSERT INTO medical_procedures (medical_record_id, procedure_name, description, cost)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [medicalRecord.id, proc.procedure_name, proc.description || '', proc.cost || 0]
          );
          insertedProcedures.push(pRes.rows[0]);
        }
      }
    }

    // Insert Prescriptions if provided
    const insertedPrescriptions = [];
    if (Array.isArray(prescriptions) && prescriptions.length > 0) {
      for (const rx of prescriptions) {
        if (rx.medicine_name) {
          const rxRes = await client.query(
            `INSERT INTO prescriptions (medical_record_id, medicine_name, dosage, frequency, quantity, instructions)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [medicalRecord.id, rx.medicine_name, rx.dosage || '', rx.frequency || '', rx.quantity || 1, rx.instructions || '']
          );
          insertedPrescriptions.push(rxRes.rows[0]);
        }
      }
    }

    // Update Registration and Queue status to 'Selesai'
    await client.query(
      `UPDATE registrations SET status = 'Selesai' WHERE id = $1`,
      [registration_id]
    );

    await client.query(
      `UPDATE queues SET status = 'Selesai' WHERE registration_id = $1`,
      [registration_id]
    );

    await client.query('COMMIT');

    return sendSuccess(
      res,
      'Medical record created successfully',
      {
        medical_record: medicalRecord,
        procedures: insertedProcedures,
        prescriptions: insertedPrescriptions,
      },
      201
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating medical record:', error);
    return sendError(res, 'Failed to create medical record', { server: error.message }, 500);
  } finally {
    client.release();
  }
};

const getMedicalRecordsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;

    const recordsRes = await pool.query(
      `SELECT 
        mr.*,
        p.name AS patient_name,
        p.medical_record_number,
        d.name AS doctor_name,
        r.poli,
        r.visit_date
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN doctors d ON mr.doctor_id = d.id
       JOIN registrations r ON mr.registration_id = r.id
       WHERE mr.patient_id = $1
       ORDER BY mr.created_at DESC`,
      [patientId]
    );

    const medicalRecords = recordsRes.rows;

    for (let record of medicalRecords) {
      const procRes = await pool.query(
        'SELECT * FROM medical_procedures WHERE medical_record_id = $1',
        [record.id]
      );
      const rxRes = await pool.query(
        'SELECT * FROM prescriptions WHERE medical_record_id = $1',
        [record.id]
      );

      record.procedures = procRes.rows;
      record.prescriptions = rxRes.rows;
    }

    return sendSuccess(res, 'Patient medical records retrieved successfully', medicalRecords);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return sendError(res, 'Failed to fetch medical records', { server: error.message }, 500);
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecordsByPatientId,
};
