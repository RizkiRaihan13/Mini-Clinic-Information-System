const bcrypt = require('bcryptjs');
const { schemaSql } = require('./schema');
const { paymentSchemaSql } = require('../scripts/paymentSchema');

// Membuat skema + data awal pada database in-memory (mode demo tanpa PostgreSQL).
async function initMemoryDb(db) {
  await db.exec(schemaSql);
  await db.exec(paymentSchemaSql);

  const adminHash = await bcrypt.hash('admin123', 8);
  const doctorHash = await bcrypt.hash('dokter123', 8);
  const staffHash = await bcrypt.hash('petugas123', 8);

  const users = [
    ['admin', adminHash, 'Administrator Utama', 'Administrator'],
    ['dokter', doctorHash, 'dr. Andi Pratama', 'Dokter'],
    ['dokter_anak', doctorHash, 'dr. Siti Rahma, Sp.A', 'Dokter'],
    ['dokter_gigi', doctorHash, 'drg. Maya Kusuma', 'Dokter'],
    ['dokter_tht', doctorHash, 'dr. Rendra Putra, Sp.THT-KL', 'Dokter'],
    ['dokter_dalam', doctorHash, 'dr. Andi Wijaya, Sp.PD', 'Dokter'],
    ['petugas', staffHash, 'Budi Santoso (Petugas Pendaftaran)', 'Petugas Pendaftaran'],
  ];
  const userIds = {};
  for (const u of users) {
    const r = await db.query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id',
      u
    );
    userIds[u[0]] = r.rows[0].id;
  }

  const doctors = [
    ['dokter', 'dr. Andi Pratama', 'Dokter Umum', 'Poli Umum', '081234567890'],
    ['dokter_anak', 'dr. Siti Rahma, Sp.A', 'Spesialis Anak', 'Poli Anak', '081987654321'],
    ['dokter_gigi', 'drg. Maya Kusuma', 'Dokter Gigi', 'Poli Gigi', '081234567891'],
    ['dokter_tht', 'dr. Rendra Putra, Sp.THT-KL', 'THT-KL', 'Poli THT', '081234567892'],
    ['dokter_dalam', 'dr. Andi Wijaya, Sp.PD', 'Penyakit Dalam', 'Poli Penyakit Dalam', '081234567893'],
  ];
  const doctorIds = {};
  for (const d of doctors) {
    const r = await db.query(
      'INSERT INTO doctors (user_id, name, specialization, poli, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [userIds[d[0]], d[1], d[2], d[3], d[4]]
    );
    doctorIds[d[0]] = r.rows[0].id;
  }

  const patients = [
    ['RM-20260729-0001', '3201011508950001', 'Ahmad Rizky', 'Laki-laki', '1995-08-15', '081311223344', 'Jl. Merdeka No. 12, Jakarta Central'],
    ['RM-20260729-0002', '3201014203980002', 'Dewi Lestari', 'Perempuan', '1998-03-22', '085711223344', 'Jl. Sudirman No. 45, Bandung'],
    ['RM-20260729-0003', '3201012010020003', 'Bambang Supriyadi', 'Laki-laki', '2002-10-20', '081299887766', 'Jl. Gatot Subroto No. 88, Surabaya'],
  ];
  const patientIds = [];
  for (const p of patients) {
    const r = await db.query(
      `INSERT INTO patients (medical_record_number, nik, name, gender, birth_date, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      p
    );
    patientIds.push(r.rows[0].id);
  }

  const regs = [
    [patientIds[0], doctorIds.dokter, 'Poli Umum', 'BPJS', 'Demam tinggi 3 hari dan pusing', 'Pemeriksaan', 'A001', 'Dalam Pemeriksaan'],
    [patientIds[1], doctorIds.dokter_anak, 'Poli Anak', 'Umum/Mandiri', 'Batuk dan flu sejak semalam', 'Menunggu', 'A002', 'Menunggu'],
  ];
  for (const r of regs) {
    const reg = await db.query(
      `INSERT INTO registrations (patient_id, doctor_id, poli, visit_date, payment_type, initial_complaint, status)
       VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6) RETURNING id`,
      [r[0], r[1], r[2], r[3], r[4], r[5]]
    );
    await db.query(
      'INSERT INTO queues (registration_id, queue_number, status) VALUES ($1,$2,$3)',
      [reg.rows[0].id, r[6], r[7]]
    );
  }
}

module.exports = { initMemoryDb };

