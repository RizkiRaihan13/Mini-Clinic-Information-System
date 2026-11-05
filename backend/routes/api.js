const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const patientController = require('../controllers/patientController');
const registrationController = require('../controllers/registrationController');
const queueController = require('../controllers/queueController');
const medicalRecordController = require('../controllers/medicalRecordController');
const prescriptionController = require('../controllers/prescriptionController');
const dashboardController = require('../controllers/dashboardController');
const paymentController = require('../controllers/paymentController');
const masterController = require('../controllers/masterController');

// --- Authentication Endpoints ---
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected Routes (Require Token)
router.use(authenticateToken);

// --- Dashboard ---
router.get('/dashboard', dashboardController.getDashboardMetrics);

// --- Patient Endpoints ---
// Accessible by Administrator and Petugas Pendaftaran
router.get('/patients', authorizeRoles('Administrator', 'Petugas Pendaftaran', 'Dokter'), patientController.getPatients);
router.get('/patients/:id', authorizeRoles('Administrator', 'Petugas Pendaftaran', 'Dokter'), patientController.getPatientById);
router.post('/patients', authorizeRoles('Administrator', 'Petugas Pendaftaran'), patientController.createPatient);
router.put('/patients/:id', authorizeRoles('Administrator', 'Petugas Pendaftaran'), patientController.updatePatient);
router.delete('/patients/:id', authorizeRoles('Administrator'), patientController.deletePatient);

// --- Registration Endpoints ---
// Accessible by Administrator and Petugas Pendaftaran
router.get('/registrations', authorizeRoles('Administrator', 'Petugas Pendaftaran', 'Dokter'), registrationController.getRegistrations);
router.post('/registrations', authorizeRoles('Administrator', 'Petugas Pendaftaran'), registrationController.createRegistration);
router.put('/registrations/:id', authorizeRoles('Administrator', 'Petugas Pendaftaran'), registrationController.updateRegistration);

// --- Queue Endpoints ---
// Accessible by Administrator, Petugas Pendaftaran, and Dokter
router.get('/queues', authorizeRoles('Administrator', 'Petugas Pendaftaran', 'Dokter'), queueController.getQueues);
router.post('/queues', authorizeRoles('Administrator', 'Petugas Pendaftaran'), queueController.createQueue);
router.put('/queues/:id/call', authorizeRoles('Administrator', 'Dokter', 'Petugas Pendaftaran'), queueController.callQueue);
router.put('/queues/:id/status', authorizeRoles('Administrator', 'Dokter', 'Petugas Pendaftaran'), queueController.updateQueueStatus);

// --- Medical Record Endpoints (SOAP) ---
// Accessible by Dokter and Administrator
router.post('/medical-records', authorizeRoles('Administrator', 'Dokter'), medicalRecordController.createMedicalRecord);
router.get('/medical-records', authorizeRoles('Administrator', 'Dokter'), medicalRecordController.getAllMedicalRecords);
router.get('/medical-records/:patientId', authorizeRoles('Administrator', 'Dokter', 'Petugas Pendaftaran'), medicalRecordController.getMedicalRecordsByPatientId);

// --- Prescription Endpoints ---
// Accessible by Dokter and Administrator
router.post('/prescriptions', authorizeRoles('Administrator', 'Dokter'), prescriptionController.createPrescription);
router.get('/prescriptions/:id', authorizeRoles('Administrator', 'Dokter', 'Petugas Pendaftaran'), prescriptionController.getPrescriptionById);

// --- Payment / Billing Endpoints ---
// Accessible by Administrator and Petugas Pendaftaran (kasir)
const paymentRoles = authorizeRoles('Administrator', 'Petugas Pendaftaran');
router.get('/payments/summary', paymentRoles, paymentController.getPaymentSummary);
router.get('/payments', paymentRoles, paymentController.getInvoices);
router.get('/payments/:id', paymentRoles, paymentController.getInvoiceById);
router.put('/payments/:id/pay', paymentRoles, paymentController.payInvoice);
router.put('/payments/:id/cancel', authorizeRoles('Administrator'), paymentController.cancelInvoice);

// --- Master Harga (Obat, Tindakan, Tarif Konsultasi) ---
const adminOnly = authorizeRoles('Administrator');
router.get('/master/medicines', authorizeRoles('Administrator', 'Dokter', 'Petugas Pendaftaran'), masterController.getMedicines);
router.post('/master/medicines', adminOnly, masterController.saveMedicine);
router.put('/master/medicines/:id', adminOnly, masterController.saveMedicine);
router.get('/master/procedures', authorizeRoles('Administrator', 'Dokter', 'Petugas Pendaftaran'), masterController.getProcedures);
router.post('/master/procedures', adminOnly, masterController.saveProcedure);
router.put('/master/procedures/:id', adminOnly, masterController.saveProcedure);
router.get('/master/consultation-fees', authorizeRoles('Administrator', 'Petugas Pendaftaran'), masterController.getConsultationFees);
router.put('/master/consultation-fees/:poli', adminOnly, masterController.saveConsultationFee);

module.exports = router;
