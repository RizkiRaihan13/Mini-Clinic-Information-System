-- ============================================================
-- Mini Clinic Information System - Full Database SQL Dump
-- Database Engine: PostgreSQL 14+
-- ============================================================

-- Drop existing tables
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

-- Indexes for optimal performance
CREATE INDEX idx_patients_nik ON patients(nik);
CREATE INDEX idx_patients_rm ON patients(medical_record_number);
CREATE INDEX idx_registrations_visit_date ON registrations(visit_date);
CREATE INDEX idx_queues_status ON queues(status);

-- ============================================================
-- INITIAL SEED DATA (Passwords: admin123, dokter123, petugas123)
-- ============================================================

-- Seed Users
INSERT INTO users (username, password_hash, full_name, role) VALUES
('admin', '$2a$10$wK1P025dD7iB8G749E5eUOB.vE8u8d9XNfR4p.e7K8E0z7j3M2q9u', 'Administrator Utama', 'Administrator'),
('dokter', '$2a$10$tZ2P025dD7iB8G749E5eUOB.vE8u8d9XNfR4p.e7K8E0z7j3M2q9u', 'dr. Andi Wijaya, Sp.PD', 'Dokter'),
('dokter_anak', '$2a$10$tZ2P025dD7iB8G749E5eUOB.vE8u8d9XNfR4p.e7K8E0z7j3M2q9u', 'dr. Siti Rahma, Sp.A', 'Dokter'),
('dokter_gigi', '$2a$10$tZ2P025dD7iB8G749E5eUOB.vE8u8d9XNfR4p.e7K8E0z7j3M2q9u', 'drg. Maya Kusuma', 'Dokter'),
('dokter_tht', '$2a$10$tZ2P025dD7iB8G749E5eUOB.vE8u8d9XNfR4p.e7K8E0z7j3M2q9u', 'dr. Rendra Putra, Sp.THT-KL', 'Dokter'),
('dokter_dalam', '$2a$10$tZ2P025dD7iB8G749E5eUOB.vE8u8d9XNfR4p.e7K8E0z7j3M2q9u', 'dr. Andi Wijaya, Sp.PD', 'Dokter'),
('petugas', '$2a$10$uX3P025dD7iB8G749E5eUOB.vE8u8d9XNfR4p.e7K8E0z7j3M2q9u', 'Budi Santoso', 'Petugas Pendaftaran');

-- Seed Doctors
INSERT INTO doctors (user_id, name, specialization, poli, phone) VALUES
(2, 'dr. Andi Pratama', 'Dokter Umum', 'Poli Umum', '081234567890'),
(3, 'dr. Siti Rahma, Sp.A', 'Spesialis Anak', 'Poli Anak', '081987654321'),
(4, 'drg. Maya Kusuma', 'Dokter Gigi', 'Poli Gigi', '081234567891'),
(5, 'dr. Rendra Putra, Sp.THT-KL', 'THT-KL', 'Poli THT', '081234567892'),
(6, 'dr. Andi Wijaya, Sp.PD', 'Penyakit Dalam', 'Poli Penyakit Dalam', '081234567893');

-- Seed Sample Patients
INSERT INTO patients (medical_record_number, nik, name, gender, birth_date, phone, address) VALUES
('RM-20260729-0001', '3201011508950001', 'Ahmad Rizky', 'Laki-laki', '1995-08-15', '081311223344', 'Jl. Merdeka No. 12, Jakarta Central'),
('RM-20260729-0002', '3201014203980002', 'Dewi Lestari', 'Perempuan', '1998-03-22', '085711223344', 'Jl. Sudirman No. 45, Bandung'),
('RM-20260729-0003', '3201012010020003', 'Bambang Supriyadi', 'Laki-laki', '2002-10-20', '081299887766', 'Jl. Gatot Subroto No. 88, Surabaya');

-- Seed Registrations & Queues
INSERT INTO registrations (patient_id, doctor_id, poli, visit_date, payment_type, initial_complaint, status) VALUES
(1, 1, 'Poli Umum', CURRENT_DATE, 'BPJS', 'Demam tinggi 3 hari dan pusing', 'Check In'),
(2, 2, 'Poli Anak', CURRENT_DATE, 'Umum/Mandiri', 'Batuk dan flu sejak semalam', 'Menunggu');

INSERT INTO queues (registration_id, queue_number, status) VALUES
(1, 'A001', 'Check In'),
(2, 'A002', 'Menunggu');
