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

    return sendSuccess(res, 'Dashboard metrics retrieved successfully', {
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
