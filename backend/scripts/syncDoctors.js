const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const doctors = [
  ['dokter', 'dr. Andi Pratama', 'Dokter Umum', 'Poli Umum', '081234567890'],
  ['dokter_anak', 'dr. Siti Rahma, Sp.A', 'Spesialis Anak', 'Poli Anak', '081987654321'],
  ['dokter_gigi', 'drg. Maya Kusuma', 'Dokter Gigi', 'Poli Gigi', '081234567891'],
  ['dokter_tht', 'dr. Rendra Putra, Sp.THT-KL', 'THT-KL', 'Poli THT', '081234567892'],
  ['dokter_dalam', 'dr. Andi Wijaya, Sp.PD', 'Penyakit Dalam', 'Poli Penyakit Dalam', '081234567893'],
];

async function syncDoctors() {
  const passwordHash = await bcrypt.hash('dokter123', 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Versi seed lama dapat membuat lebih dari satu profil doctors untuk satu akun.
    // Pertahankan profil paling awal agar seluruh antrean/rekam medis lama tetap terhubung.
    const duplicateProfiles = await client.query(
      `SELECT user_id, MIN(id) AS primary_id, ARRAY_AGG(id ORDER BY id) AS doctor_ids
       FROM doctors
       WHERE user_id IS NOT NULL
       GROUP BY user_id
       HAVING COUNT(*) > 1`
    );

    for (const duplicate of duplicateProfiles.rows) {
      const duplicateIds = duplicate.doctor_ids.filter((id) => id !== duplicate.primary_id);
      await client.query(
        'UPDATE registrations SET doctor_id = $1 WHERE doctor_id = ANY($2::int[])',
        [duplicate.primary_id, duplicateIds]
      );
      await client.query(
        'UPDATE medical_records SET doctor_id = $1 WHERE doctor_id = ANY($2::int[])',
        [duplicate.primary_id, duplicateIds]
      );
      await client.query('DELETE FROM doctors WHERE id = ANY($1::int[])', [duplicateIds]);
    }

    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS doctors_user_id_unique ON doctors (user_id)');

    for (const [username, name, specialization, poli, phone] of doctors) {
      const userRes = await client.query(
        `INSERT INTO users (username, password_hash, full_name, role)
         VALUES ($1, $2, $3, 'Dokter')
         ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [username, passwordHash, name]
      );
      await client.query(
        `INSERT INTO doctors (user_id, name, specialization, poli, phone)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE
         SET name = EXCLUDED.name, specialization = EXCLUDED.specialization, poli = EXCLUDED.poli, phone = EXCLUDED.phone`,
        [userRes.rows[0].id, name, specialization, poli, phone]
      );

      const currentDoctorRes = await client.query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [userRes.rows[0].id]
      );
      const currentDoctorId = currentDoctorRes.rows[0].id;

      // Pindahkan antrean lama pada poli ini yang sebelumnya keliru terhubung
      // ke akun non-dokter atau tanpa akun, ke akun dokter poli yang benar.
      const legacyProfiles = await client.query(
        `SELECT d.id
         FROM doctors d
         LEFT JOIN users u ON u.id = d.user_id
         WHERE d.poli = $1
           AND d.id <> $2
           AND (d.user_id IS NULL OR u.role <> 'Dokter')`,
        [poli, currentDoctorId]
      );

      for (const legacyProfile of legacyProfiles.rows) {
        await client.query('UPDATE registrations SET doctor_id = $1 WHERE doctor_id = $2', [currentDoctorId, legacyProfile.id]);
        await client.query('UPDATE medical_records SET doctor_id = $1 WHERE doctor_id = $2', [currentDoctorId, legacyProfile.id]);
        await client.query('DELETE FROM doctors WHERE id = $1', [legacyProfile.id]);
      }
    }

    await client.query('COMMIT');
    console.log('Doctor accounts and poli mappings synchronized.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to synchronize doctor accounts:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

syncDoctors();
