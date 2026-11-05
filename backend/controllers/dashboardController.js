const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');

const getDashboardMetrics = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const totalPatientsRes = await pool.query('SELECT COUNT(*) FROM patients');
    const totalPatientsTodayRes = await pool.query('SELECT COUNT(*) FROM patients WHERE DATE(created_at) = $1', [todayStr]);
    const doctorFilter = req.user.role === 'Dokter'
      ? ' AND r.doctor_id = (SELECT id FROM doctors WHERE user_id = $2)'
      : '';
    const queueParams = req.user.role === 'Dokter' ? [todayStr, req.user.id] : [todayStr];
    const totalQueuesTodayRes = await pool.query(
      `SELECT COUNT(*) FROM queues q JOIN registrations r ON q.registration_id = r.id WHERE r.visit_date = $1${doctorFilter}`,
      queueParams
    );
    const waitingPatientsRes = await pool.query(
      `SELECT COUNT(*) FROM queues q JOIN registrations r ON q.registration_id = r.id WHERE r.visit_date = $1 AND q.status = 'Menunggu'${doctorFilter}`,
      queueParams
    );
    const completedPatientsRes = await pool.query(
      `SELECT COUNT(*) FROM queues q JOIN registrations r ON q.registration_id = r.id WHERE r.visit_date = $1 AND q.status = 'Selesai'${doctorFilter}`,
      queueParams
    );

    // Fetch list of doctors and polis for frontend dropdowns
    const doctorsRes = await pool.query(
      req.user.role === 'Dokter'
        ? 'SELECT id, name, specialization, poli FROM doctors WHERE user_id = $1 ORDER BY name ASC'
        : 'SELECT id, name, specialization, poli FROM doctors ORDER BY name ASC',
      req.user.role === 'Dokter' ? [req.user.id] : []
    );

    // Ringkasan pembayaran (hanya untuk kasir/admin)
    let payment = null;
    if (req.user.role !== 'Dokter') {
      const payRes = await pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN i.status = 'Lunas' AND i.payment_method <> 'BPJS' THEN i.total_amount END), 0) AS revenue,
           COUNT(*) FILTER (WHERE i.status = 'Belum Bayar') AS unpaid_count
         FROM invoices i JOIN registrations r ON r.id = i.registration_id
         WHERE r.visit_date = $1`,
        [todayStr]
      );
      payment = {
        revenue_today: Number(payRes.rows[0].revenue),
        unpaid_count: Number(payRes.rows[0].unpaid_count),
      };
    }

    return sendSuccess(res, 'Dashboard metrics retrieved successfully', {
      payment,
      total_patients: parseInt(totalPatientsRes.rows[0].count, 10),
      total_patients_today: parseInt(totalPatientsTodayRes.rows[0].count, 10),
      total_queues_today: parseInt(totalQueuesTodayRes.rows[0].count, 10),
      total_patients_waiting: parseInt(waitingPatientsRes.rows[0].count, 10),
      total_patients_completed: parseInt(completedPatientsRes.rows[0].count, 10),
      doctors: doctorsRes.rows,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return sendError(res, 'Failed to fetch dashboard metrics', { server: error.message }, 500);
  }
};

module.exports = {
  getDashboardMetrics,
};
