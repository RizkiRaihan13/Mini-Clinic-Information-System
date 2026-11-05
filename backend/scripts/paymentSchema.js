// Skema modul Pembayaran (Billing). Idempotent: aman dijalankan berulang kali.
const paymentSchemaSql = `
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    registration_id INTEGER UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medical_record_id INTEGER REFERENCES medical_records(id) ON DELETE SET NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Belum Bayar' CHECK (status IN ('Belum Bayar', 'Lunas', 'Batal')),
    payment_method VARCHAR(30),
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    change_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_at TIMESTAMP,
    cashier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('Konsultasi', 'Tindakan', 'Obat')),
    item_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Master harga (dikelola Administrator)
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    unit VARCHAR(30) NOT NULL DEFAULT 'tablet',
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS procedure_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_fees (
    poli VARCHAR(50) PRIMARY KEY,
    fee NUMERIC(12,2) NOT NULL DEFAULT 0
);

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL;
ALTER TABLE medical_procedures ADD COLUMN IF NOT EXISTS procedure_id INTEGER REFERENCES procedure_master(id) ON DELETE SET NULL;

-- Data awal contoh (bisa diubah di menu Master Harga)
INSERT INTO consultation_fees (poli, fee) VALUES
  ('Poli Umum', 50000), ('Poli Gigi', 75000), ('Poli Anak', 75000),
  ('Poli THT', 90000), ('Poli Penyakit Dalam', 100000)
ON CONFLICT (poli) DO NOTHING;

INSERT INTO medicines (name, unit, price, stock) VALUES
  ('Paracetamol 500 mg', 'tablet', 1000, 500),
  ('Amoxicillin 500 mg', 'kapsul', 2500, 300),
  ('Ibuprofen 400 mg', 'tablet', 1500, 300),
  ('Cetirizine 10 mg', 'tablet', 1500, 200),
  ('Antasida DOEN', 'tablet', 800, 300),
  ('Omeprazole 20 mg', 'kapsul', 3000, 200),
  ('Ambroxol 30 mg', 'tablet', 1200, 250),
  ('Vitamin C 500 mg', 'tablet', 700, 400),
  ('Sirup Paracetamol Anak', 'botol', 15000, 60),
  ('Asam Mefenamat 500 mg', 'tablet', 1500, 250)
ON CONFLICT (name) DO NOTHING;

INSERT INTO procedure_master (name, price) VALUES
  ('Pemeriksaan Tekanan Darah', 0),
  ('Nebulizer', 75000),
  ('Injeksi', 35000),
  ('Perawatan Luka', 60000),
  ('Jahit Luka (per jahitan)', 25000),
  ('Cabut Gigi', 150000),
  ('Scaling Gigi', 250000),
  ('Cek Gula Darah', 25000),
  ('Cek Kolesterol', 40000),
  ('EKG', 100000)
ON CONFLICT (name) DO NOTHING;
`;

module.exports = { paymentSchemaSql };

