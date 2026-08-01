const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedDb() {
  try {
    console.log('Seeding initial data...');

    // 1. Password hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const doctorHash = await bcrypt.hash('dokter123', 10);
    const staffHash = await bcrypt.hash('petugas123', 10);

    // Insert Users
    const userAdminRes = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['admin', adminHash, 'Administrator Utama', 'Administrator']
    );

    const userDoctorRes = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['dokter', doctorHash, 'dr. Andi Wijaya, Sp.PD', 'Dokter']
    );

    const userDoctor2Res = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['dokter_anak', doctorHash, 'dr. Siti Rahma, Sp.A', 'Dokter']
    );

    const userStaffRes = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['petugas', staffHash, 'Budi Santoso (Petugas Pendaftaran)', 'Petugas Pendaftaran']
    );

    const doctor1UserId = userDoctorRes.rows[0].id;
    const doctor2UserId = userDoctor2Res.rows[0].id;

    // 2. Insert Doctors
    const doc1Res = await pool.query(
      `INSERT INTO doctors (user_id, name, specialization, poli, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [doctor1UserId, 'dr. Andi Wijaya, Sp.PD', 'Penyakit Dalam', 'Poli Umum', '081234567890']
    );

    const doc2Res = await pool.query(
      `INSERT INTO doctors (user_id, name, specialization, poli, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [doctor2UserId, 'dr. Siti Rahma, Sp.A', 'Spesialis Anak', 'Poli Anak', '081987654321']
    );

    const doc1Id = doc1Res.rows[0].id;
    const doc2Id = doc2Res.rows[0].id;

    // 3. Insert Patients
    const patient1Res = await pool.query(
      `INSERT INTO patients (medical_record_number, nik, name, gender, birth_date, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['RM-20260729-0001', '3201011508950001', 'Ahmad Rizky', 'Laki-laki', '1995-08-15', '081311223344', 'Jl. Merdeka No. 12, Jakarta Central']
    );

    const patient2Res = await pool.query(
      `INSERT INTO patients (medical_record_number, nik, name, gender, birth_date, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['RM-20260729-0002', '3201014203980002', 'Dewi Lestari', 'Perempuan', '1998-03-22', '085711223344', 'Jl. Sudirman No. 45, Bandung']
    );

    const patient3Res = await pool.query(
      `INSERT INTO patients (medical_record_number, nik, name, gender, birth_date, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['RM-20260729-0003', '3201012010020003', 'Bambang Supriyadi', 'Laki-laki', '2002-10-20', '081299887766', 'Jl. Gatot Subroto No. 88, Surabaya']
    );

    const p1Id = patient1Res.rows[0].id;
    const p2Id = patient2Res.rows[0].id;

    // 4. Registrations & Queues
    const reg1Res = await pool.query(
      `INSERT INTO registrations (patient_id, doctor_id, poli, visit_date, payment_type, initial_complaint, status)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
       RETURNING id`,
      [p1Id, doc1Id, 'Poli Umum', 'BPJS', 'Demam tinggi 3 hari dan pusing', 'Pemeriksaan']
    );

    const reg2Res = await pool.query(
      `INSERT INTO registrations (patient_id, doctor_id, poli, visit_date, payment_type, initial_complaint, status)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
       RETURNING id`,
      [p2Id, doc2Id, 'Poli Anak', 'Umum/Mandiri', 'Batuk dan flu sejak semalam', 'Menunggu']
    );

    const r1Id = reg1Res.rows[0].id;
    const r2Id = reg2Res.rows[0].id;

    await pool.query(
      `INSERT INTO queues (registration_id, queue_number, status)
       VALUES ($1, $2, $3)`,
      [r1Id, 'A001', 'Dalam Pemeriksaan']
    );

    await pool.query(
      `INSERT INTO queues (registration_id, queue_number, status)
       VALUES ($1, $2, $3)`,
      [r2Id, 'A002', 'Menunggu']
    );

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDb();
