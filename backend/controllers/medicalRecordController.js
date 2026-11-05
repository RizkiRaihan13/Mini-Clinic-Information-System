const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');
const { createInvoiceForMedicalRecord } = require('../utils/billing');

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

    // Jangan percaya patient_id/doctor_id dari browser. Pastikan data SOAP selalu
    // memakai dokter dan pasien dari pendaftaran yang dipilih.
    const registrationRes = await client.query(
      `SELECT patient_id, doctor_id
       FROM registrations
       WHERE id = $1
         ${req.user.role === 'Dokter' ? 'AND doctor_id = (SELECT id FROM doctors WHERE user_id = $2)' : ''}`,
      req.user.role === 'Dokter' ? [registration_id, req.user.id] : [registration_id]
    );

    if (registrationRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Pendaftaran tidak ditemukan atau bukan antrean Anda', { registration: 'Not found or forbidden' }, 403);
    }

    const registration = registrationRes.rows[0];

    // Insert Medical Record SOAP
    const mrRes = await client.query(
      `INSERT INTO medical_records 
        (registration_id, patient_id, doctor_id, subjective, bp, temp, weight, height, assessment, plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [registration_id, registration.patient_id, registration.doctor_id, subjective, bp, temp, weight, height, assessment, plan]
    );

    const medicalRecord = mrRes.rows[0];

    // Tindakan: harga selalu diambil dari Master Tindakan (bukan dari browser)
    const insertedProcedures = [];
    if (Array.isArray(procedures)) {
      for (const proc of procedures) {
        if (!proc.procedure_id) continue;
        const master = await client.query('SELECT * FROM procedure_master WHERE id = $1 AND is_active = TRUE', [proc.procedure_id]);
        if (master.rowCount === 0) {
          await client.query('ROLLBACK');
          return sendError(res, 'Tindakan tidak ditemukan di Master Tindakan', { procedures: 'Pilih tindakan dari daftar' }, 400);
        }
        const pRes = await client.query(
          `INSERT INTO medical_procedures (medical_record_id, procedure_id, procedure_name, description, cost)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [medicalRecord.id, master.rows[0].id, master.rows[0].name, proc.description || '', master.rows[0].price]
        );
        insertedProcedures.push(pRes.rows[0]);
      }
    }

    // Resep: pilih dari Master Obat; harga disalin dari master & stok dikurangi
    const insertedPrescriptions = [];
    if (Array.isArray(prescriptions)) {
      for (const rx of prescriptions) {
        if (!rx.medicine_id) continue;
        const qty = Math.max(parseInt(rx.quantity, 10) || 1, 1);
        const med = await client.query('SELECT * FROM medicines WHERE id = $1 AND is_active = TRUE FOR UPDATE', [rx.medicine_id]);
        if (med.rowCount === 0) {
          await client.query('ROLLBACK');
          return sendError(res, 'Obat tidak ditemukan di Master Obat', { prescriptions: 'Pilih obat dari daftar' }, 400);
        }
        const medicine = med.rows[0];
        if (medicine.stock < qty) {
          await client.query('ROLLBACK');
          return sendError(res, `Stok ${medicine.name} tidak cukup (tersisa ${medicine.stock})`, { prescriptions: `Stok ${medicine.name} tersisa ${medicine.stock}` }, 400);
        }
        await client.query('UPDATE medicines SET stock = stock - $1 WHERE id = $2', [qty, medicine.id]);
        const rxRes = await client.query(
          `INSERT INTO prescriptions (medical_record_id, medicine_id, medicine_name, dosage, frequency, quantity, instructions, unit_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [medicalRecord.id, medicine.id, medicine.name, rx.dosage || '', rx.frequency || '', qty, rx.instructions || '', medicine.price]
        );
        insertedPrescriptions.push(rxRes.rows[0]);
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

    // Buat tagihan otomatis untuk kasir
    const invoice = await createInvoiceForMedicalRecord(client, medicalRecord.id);

    await client.query('COMMIT');

    return sendSuccess(
      res,
      'Medical record created successfully',
      {
        medical_record: medicalRecord,
        invoice,
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
       ${req.user.role === 'Dokter' ? 'AND mr.doctor_id = (SELECT id FROM doctors WHERE user_id = $2)' : ''}
       ORDER BY mr.created_at DESC`,
      req.user.role === 'Dokter' ? [patientId, req.user.id] : [patientId]
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

// Seluruh riwayat pemeriksaan dengan filter tanggal, poli, dokter, dan pencarian nama/NIK/No. RM.
const getAllMedicalRecords = async (req, res) => {
  try {
    const { date_from, date_to, poli, doctor_id, search } = req.query;
    const params = [];
    const where = [];

    if (req.user.role === 'Dokter') {
      params.push(req.user.id);
      where.push(`mr.doctor_id = (SELECT id FROM doctors WHERE user_id = $${params.length})`);
    }
    if (date_from) {
      params.push(date_from);
      where.push(`r.visit_date >= $${params.length}`);
    }
    if (date_to) {
      params.push(date_to);
      where.push(`r.visit_date <= $${params.length}`);
    }
    if (poli) {
      params.push(poli);
      where.push(`r.poli = $${params.length}`);
    }
    if (doctor_id) {
      params.push(doctor_id);
      where.push(`mr.doctor_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(p.name ILIKE $${params.length} OR p.nik ILIKE $${params.length} OR p.medical_record_number ILIKE $${params.length})`);
    }

    const recordsRes = await pool.query(
      `SELECT mr.*, p.name AS patient_name, p.nik, p.medical_record_number,
              d.name AS doctor_name, r.poli, r.visit_date, r.payment_type
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN doctors d ON mr.doctor_id = d.id
       JOIN registrations r ON mr.registration_id = r.id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY mr.created_at DESC
       LIMIT 200`,
      params
    );

    const records = recordsRes.rows;
    if (records.length > 0) {
      const ids = records.map((r) => r.id);
      const procRes = await pool.query('SELECT * FROM medical_procedures WHERE medical_record_id = ANY($1::int[])', [ids]);
      const rxRes = await pool.query('SELECT * FROM prescriptions WHERE medical_record_id = ANY($1::int[])', [ids]);
      for (const rec of records) {
        rec.procedures = procRes.rows.filter((x) => x.medical_record_id === rec.id);
        rec.prescriptions = rxRes.rows.filter((x) => x.medical_record_id === rec.id);
      }
    }

    return sendSuccess(res, 'Medical records retrieved successfully', records);
  } catch (error) {
    console.error('Error fetching all medical records:', error);
    return sendError(res, 'Failed to fetch medical records', { server: error.message }, 500);
  }
};

module.exports = {
  createMedicalRecord,
  getAllMedicalRecords,
  getMedicalRecordsByPatientId,
};
