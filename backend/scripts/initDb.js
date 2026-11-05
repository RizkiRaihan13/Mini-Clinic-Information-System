const { Client } = require('pg');
require('dotenv').config();
const { paymentSchemaSql } = require('./paymentSchema');

const dbName = process.env.DB_NAME || 'mini_clinic_db';

const schemaSql = `
-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS procedure_master CASCADE;
DROP TABLE IF EXISTS consultation_fees CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS medical_procedures CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS queues CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Administrator', 'Dokter', 'Petugas Pendaftaran')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    poli VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patients Table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    nik VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Laki-laki', 'Perempuan')),
    birth_date DATE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Registrations Table
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    poli VARCHAR(50) NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(50) NOT NULL,
    initial_complaint TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Check In', 'Pemeriksaan', 'Selesai', 'Batal')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Queues Table
CREATE TABLE queues (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    queue_number VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Dipanggil', 'Check In', 'Dalam Pemeriksaan', 'Selesai', 'Batal')),
    called_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Medical Records Table (SOAP)
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    subjective TEXT NOT NULL,
    bp VARCHAR(20) NOT NULL,
    temp NUMERIC(4,1) NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    height NUMERIC(5,2) NOT NULL,
    assessment TEXT NOT NULL,
    plan TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Medical Procedures Table
CREATE TABLE medical_procedures (
    id SERIAL PRIMARY KEY,
    medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    procedure_name VARCHAR(100) NOT NULL,
    description TEXT,
    cost NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Prescriptions Table
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    medicine_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & quick lookup
CREATE INDEX idx_patients_nik ON patients(nik);
CREATE INDEX idx_patients_rm ON patients(medical_record_number);
CREATE INDEX idx_registrations_visit_date ON registrations(visit_date);
CREATE INDEX idx_queues_status ON queues(status);
`;

async function initDb() {
  const rootClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    console.log('Connected to default database "postgres".');

    const res = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }

    await rootClient.end();

    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    await dbClient.connect();
    console.log(`Connected to database "${dbName}". Executing schema...`);
    await dbClient.query(schemaSql);
    await dbClient.query(paymentSchemaSql);
    console.log('Schema created successfully.');
    await dbClient.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDb();
