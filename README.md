# Mini Clinic Information System 🏥

Aplikasi Web Terintegrasi Administrasi dan Pelayanan Pasien Klinik Pratama (Take-Home Test Technical Assignment Programmer).

---

## 📌 Deskripsi Singkat
Mini Clinic Information System adalah aplikasi berbasis web yang mencakup seluruh alur pelayanan klinik, meliputi:
1. **Autentikasi & Otorisasi RBAC (JWT)** untuk 3 Role: `Administrator`, `Dokter`, dan `Petugas Pendaftaran`.
2. **Master Data Pasien**: Pengelolaan pasien dengan Auto-generate Nomor Rekam Medis (`RM-YYYYMMDD-XXXX`), keunikan NIK (16 digit), Pencarian, dan Pagination.
3. **Modul Pendaftaran Pasien**: Pendaftaran kunjungan pasien ke Poli & Dokter, pilihan Jenis Pembayaran, serta auto-generate nomor antrean (`A001`, `A002`, dst).
4. **Modul Antrean Pasien**: Live monitor antrean, update status, dan panggilan antrean dengan sintesis suara otomatis (Web Speech API).
5. **Modul Pemeriksaan Dokter (SOAP)**: Catatan medis metode Subjective, Objective (Vital Signs), Assessment, Plan, Input Tindakan Medis, Resep Obat, dan Riwayat Rekam Medis Pasien.
6. **Dashboard Analytics**: Visualisasi statistik total pasien, pasien hari ini, antrean hari ini, pasien menunggu, dan selesai dilayani.

---

## 🛠️ Teknologi Yang Digunakan

| Komponen | Teknologi |
| :--- | :--- |
| **Frontend** | React.js (Vite), React Router v6, Tailwind CSS, Lucide Icons, Axios |
| **Backend** | Node.js (Express.js), JWT, BcryptJS, Express Validator |
| **Database** | PostgreSQL |
| **Authentication** | JSON Web Token (JWT) |
| **Version Control** | Git |

---

## 🔑 Akun Login Pengujian (Default Seed Credentials)

| Role | Username | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Akses penuh ke seluruh fitur & sistem |
| **Dokter Poli Umum** | `dokter` | `dokter123` | Hanya antrean dan pemeriksaan Poli Umum |
| **Dokter Anak** | `dokter_anak` | `dokter123` | Hanya antrean dan pemeriksaan Poli Anak |
| **Dokter Gigi** | `dokter_gigi` | `dokter123` | Hanya antrean dan pemeriksaan Poli Gigi |
| **Dokter THT** | `dokter_tht` | `dokter123` | Hanya antrean dan pemeriksaan Poli THT |
| **Dokter Penyakit Dalam** | `dokter_dalam` | `dokter123` | Hanya antrean dan pemeriksaan Poli Penyakit Dalam |
| **Petugas Pendaftaran** | `petugas` | `petugas123` | Master Data Pasien, Pendaftaran Pasien, Antrean, Dashboard |

---

## 📁 Struktur Project

```
mini_clinic_information/
├── backend/
│   ├── config/
│   │   └── db.js                 # Koneksi PostgreSQL pool
│   ├── controllers/
│   │   ├── authController.js     # Login & Logout
│   │   ├── patientController.js  # CRUD, Search, Pagination Pasien
│   │   ├── registrationController.js # Pendaftaran Kunjungan
│   │   ├── queueController.js    # Manajemen Antrean Pasien
│   │   ├── medicalRecordController.js # Pemeriksaan Dokter SOAP
│   │   ├── prescriptionController.js  # Resep Obat
│   │   └── dashboardController.js     # Statistik Dashboard
│   ├── middleware/
│   │   ├── authMiddleware.js     # Verify JWT & RBAC Role check
│   │   └── responseHandler.js    # Standard JSON Response Wrapper
│   ├── routes/
│   │   └── api.js                # Definisi Seluruh Endpoints REST API
│   ├── scripts/
│   │   ├── initDb.js             # Script Inisialisasi Database & Tabel
│   │   └── seedDb.js             # Script Seeding Data Awal
│   ├── .env                      # File konfigurasi backend
│   ├── .env.example              # Template env backend
│   ├── index.js                  # Entry Point Server Express (Port 5001)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx        # Sidebar navigation & Topbar
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # State JWT auth & RBAC permissions
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Halaman Login
│   │   │   ├── Dashboard.jsx     # Halaman Dashboard Metric Cards
│   │   │   ├── Patients.jsx      # Halaman Master Data Pasien
│   │   │   ├── Registrations.jsx # Halaman Pendaftaran Kunjungan
│   │   │   ├── Queue.jsx        # Halaman Live Queue & Voice Caller
│   │   │   └── MedicalRecords.jsx# Halaman Pemeriksaan Dokter SOAP
│   │   ├── services/
│   │   │   └── api.js            # Axios client with Auth Interceptor
│   │   ├── App.jsx               # Routing & Protected Routes
│   │   ├── index.css             # Glassmorphism & Custom Tailwind CSS
│   │   └── main.jsx
│   ├── .env                      # File konfigurasi frontend
│   ├── .env.example              # Template env frontend
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database.sql                  # File Standalone Dump SQL Database PostgreSQL
├── ERD.md                        # Entity Relationship Diagram & Spesifikasi Tabel
├── postman_collection.json       # Collection Postman REST API lengkap
├── .env.example                  # Template env root
└── README.md                     # Dokumentasi panduan proyek
```

---

## ⚙️ Konfigurasi File `.env`

### File `backend/.env`
```env
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Rizki130902
DB_NAME=mini_clinic_db
JWT_SECRET=super_secret_jwt_key_mini_clinic_2026
```

### File `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

---

## 🚀 Cara Instalasi & Migrasi Database

### 1. Prasyarat System
- Node.js (v18+)
- PostgreSQL Database Server (Port 5432)

### 2. Migrasi & Seed Database Automatic (Opsi 1 - Recommended)
Buka terminal pada direktori `backend` dan jalankan script migrasi otomatis:
```bash
cd backend
npm install
npm run db:init
npm run db:seed
```

Untuk database yang sudah ada (tanpa menghapus data pasien), jalankan sekali:
```bash
npm run db:sync-doctors
```

---

## 💻 Cara Menjalankan Aplikasi

### 1. Menjalankan Backend API
```bash
cd backend
npm start
```
*Backend API akan berjalan di `http://localhost:5001` (Health Check: `http://localhost:5001/health`)*

### 2. Menjalankan Frontend React (Vite)
Buka terminal baru:
```bash
cd frontend
npm run dev
```
*Frontend akan berjalan di `http://localhost:3000`.*

---

## 💳 Modul Pembayaran (Kasir)

Alur: Pendaftaran → Antrean → Pemeriksaan SOAP → **Invoice otomatis** → **Pembayaran** → Kuitansi.

- Saat dokter menyimpan SOAP, sistem membuat invoice berisi: Konsultasi (tarif per poli) + Tindakan (biaya) + Obat (qty x harga satuan yang diisi dokter).
- Pasien **BPJS**: tagihan ditanggung BPJS, invoice otomatis berstatus Lunas (Rp 0).
- Menu **Pembayaran** (Administrator & Petugas Pendaftaran): daftar tagihan, filter tanggal/status/pencarian, bayar (Tunai/Debit/Kredit/QRIS/Transfer) dengan hitung kembalian, cetak kuitansi. Diskon & pembatalan hanya Administrator.
- Dashboard menampilkan pendapatan hari ini & tagihan belum bayar.
- Endpoint: `GET /api/payments`, `GET /api/payments/summary`, `GET /api/payments/:id`, `PUT /api/payments/:id/pay`, `PUT /api/payments/:id/cancel`.
- Tarif konsultasi diatur di `backend/utils/billing.js`.
- DB lama: jalankan sekali `npm run db:migrate-payments` (non-destruktif, backfill invoice lama).

