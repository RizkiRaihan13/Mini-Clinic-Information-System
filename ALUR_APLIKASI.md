# Alur Cara Kerja Aplikasi Mini Clinic Information System

Dokumen ini menjelaskan alur kerja aplikasi **Mini Clinic Information System** secara menyeluruh — dari arsitektur, alur data, hingga alur penggunaan tiap modul — berdasarkan penelusuran seluruh file project.

---

## 1. Arsitektur Aplikasi

```
┌──────────────────────┐        HTTP/JSON        ┌──────────────────────┐        SQL        ┌──────────────┐
│      FRONTEND        │  ────────────────────►  │       BACKEND        │  ───────────────►  │  PostgreSQL  │
│   React + Vite       │  ◄────────────────────  │  Node.js + Express   │  ◄───────────────  │ mini_clinic_db│
│   (Port 3000)        │     JWT + Response      │   (Port 5001)        │                    │              │
└──────────────────────┘                        └──────────────────────┘                    └──────────────┘
```

- **Frontend** (folder `frontend/`): React 18 + Vite, React Router v6, Tailwind CSS, Axios, Lucide Icons, React Select.
- **Backend** (folder `backend/`): Node.js + Express 4, JWT, BcryptJS, `pg` (PostgreSQL Pool).
- **Database**: PostgreSQL 8 tabel (lihat `ERD.md`).
- **Proxy Dev**: Vite mem-proxy request `/api` ke `http://localhost:5001` (`frontend/vite.config.js`), sehingga di development frontend cukup memanggil `/api/...`.

---

## 2. Struktur File Penting

### Backend
| File | Fungsi |
| :--- | :--- |
| `backend/index.js` | Entry point server Express, pasang middleware global (helmet, cors, json), mount router `/api`, health check `/health`, handler 404 & error global. |
| `backend/config/db.js` | Koneksi PostgreSQL connection pool (membaca `backend/.env`). |
| `backend/routes/api.js` | Definisi seluruh endpoint REST API + proteksi JWT & RBAC per endpoint. |
| `backend/middleware/authMiddleware.js` | `authenticateToken` (verifikasi JWT) & `authorizeRoles(...)` (cek role). |
| `backend/middleware/responseHandler.js` | `sendSuccess` / `sendError` → format respons standar JSON. |
| `backend/controllers/*.js` | Logika bisnis: auth, patient, registration, queue, medicalRecord, prescription, dashboard. |
| `backend/scripts/initDb.js` | Buat database & tabel (drop & recreate). |
| `backend/scripts/seedDb.js` | Isi data awal (user, dokter, pasien, registrasi, antrean). |
| `backend/scripts/syncDoctors.js` | Perbaikan mapping akun dokter → profil poli untuk DB lama. |

### Frontend
| File | Fungsi |
| :--- | :--- |
| `frontend/src/main.jsx` | Bootstrap React: `BrowserRouter` + `AuthProvider` + `App`. |
| `frontend/src/App.jsx` | Definisi routing & `ProtectedRoute` (guard per-role). |
| `frontend/src/services/api.js` | Axios instance + interceptor: lampirkan token `Bearer` & auto-logout saat 401. |
| `frontend/src/context/AuthContext.jsx` | State global login/logout, simpan token & user di `localStorage`, fungsi `hasRole()`. |
| `frontend/src/components/Layout.jsx` | Sidebar + topbar + navigasi yang difilter sesuai role. |
| `frontend/src/pages/*.jsx` | Halaman: Login, Dashboard, Patients, Registrations, Queue, MedicalRecords. |

---

## 3. Format Respons API (Standar)

Semua endpoint mengembalikan JSON dengan pola yang sama (`responseHandler.js`):

```json
// Sukses
{ "success": true,  "message": "...", "data": { ... } }

// Gagal
{ "success": false, "message": "...", "errors": { ... } }
```

Autentikasi: kirim header `Authorization: Bearer <JWT>` untuk semua endpoint kecuali `POST /api/login` dan `/health`.

---

## 4. Alur Autentikasi & Otorisasi (RBAC)

**Login** (`POST /api/login` → `authController.login`)
1. User mengisi username & password pada halaman Login.
2. Backend mencari user di tabel `users`, verifikasi password dengan `bcrypt.compare`.
3. Jika role `Dokter`, backend memastikan akun terhubung ke profil `doctors` (jika tidak → error 403).
4. Backend membuat **JWT** (masa berlaku 24 jam) berisi `{ id, username, full_name, role, doctor_id, doctor_poli }`.
5. Frontend menyimpan token di `localStorage` (`clinic_token`) dan data user di `clinic_user` (`AuthContext.login`).

**Proteksi setiap request**
- Axios interceptor menambahkan header `Authorization: Bearer <token>` secara otomatis (`api.js`).
- Backend memverifikasi token lewat middleware `authenticateToken` → `req.user`.
- RBAC dicek per-endpoint dengan `authorizeRoles(...)`. Contoh: `POST /patients` hanya untuk `Administrator` & `Petugas Pendaftaran`; `POST /medical-records` hanya `Administrator` & `Dokter`.
- Jika response `401` (token invalid/kedaluwarsa), interceptor menghapus sesi dan mengarahkan ke `/login`.
- **Perhatian khusus untuk Dokter**: di beberapa controller, filter tambahan server-side memastikan dokter hanya melihat/mengubah data miliknya sendiri (mis. queue & registrasi hanya untuk poli dokternya). Filter ini dibuat di server agar parameter dari browser tidak bisa dipalsukan.

**Logout**: frontend memanggil `POST /api/logout` lalu menghapus `localStorage`.

---

## 5. Database & Inisialisasi

Skema (8 tabel, lihat `backend/scripts/initDb.js` & `ERD.md`):

```
users 1─1 doctors
patients 1─N registrations N─1 doctors
registrations 1─1 queues
registrations 1─1 medical_records (SOAP)
medical_records 1─N medical_procedures
medical_records 1─N prescriptions
```

Relasi & status:
- `registrations.status`: `Menunggu` | `Check In` | `Pemeriksaan` | `Selesai` | `Batal`
- `queues.status`: `Menunggu` | `Dipanggil` | `Check In` | `Dalam Pemeriksaan` | `Selesai` | `Batal`
- Antrean & registrasi **disinkronkan** saat status berubah (lihat Modul Antrean).

Cara setup:
```bash
cd backend
npm install
npm run db:init     # buat database & tabel
npm run db:seed     # isi data awal (admin, dokter, petugas, pasien contoh)
# (opsional untuk DB lama) npm run db:sync-doctors
```

Akun default (dari `seedDb.js`): `admin/admin123`, `dokter/dokter123`, `dokter_anak`, `dokter_gigi`, `dokter_tht`, `dokter_dalam` (semua `dokter123`), `petugas/petugas123`.

---

## 6. Alur Bisnis Utama (End-to-End Pelayanan Pasien)

Alur inti aplikasi mengikuti siklus pelayanan klinik:

```
1. MASTER PASien (kelola data & nomor RM)
        ▼
2. PENDAFTARAN (daftar kunjungan + generate nomor antrean)
        ▼
3. ANTREAN (live monitor, panggil suara, ubah status)
        ▼
4. PEMERIKSAAN SOAP (catat diagnosis, vital, tindakan, resep → otomatis selesai)
        ▼
5. DASHBOARD (statistik real-time)
```

---

## 7. Alur Tiap Modul

### 7.1 Login (`frontend/src/pages/Login.jsx`)
- Form username/password → `AuthContext.login` → `POST /api/login`.
- Sukses → navigate ke `/dashboard`. Gagal → tampil pesan error.
- Tersedia tombol quick login demo (Admin / Dokter / Petugas).

### 7.2 Dashboard (`Dashboard.jsx`)
- `GET /api/dashboard` → `dashboardController.getDashboardMetrics`.
- Menampilkan 5 kartu metrik: Total Pasien, Pasien Hari Ini, Antrean Hari Ini, Pasien Menunggu, Selesai Dilayani.
- Untuk role Dokter, metrik antrean difilter hanya untuk dokternya sendiri.
- `data.doctors` (daftar dokter & poli) ikut dikembalikan dan dipakai dropdown di halaman Registrasi & Medical Records.

### 7.3 Master Data Pasien (`Patients.jsx` ↔ `patientController.js`)
- **Daftar**: `GET /api/patients?page=&limit=&search=` → pencarian (nama/NIK/No. RM) + pagination. Dapat diakses Admin, Petugas, dan Dokter.
- **Tambah** (`POST /api/patients`, hanya Admin/Petugas):
  - Validasi NIK **tepat 16 digit** & tidak duplikat.
  - Nomor Rekam Medis **auto-generate**: `RM-YYYYMMDD-XXXX` (contoh `RM-20260818-0001`), urutan per hari (`generateMedicalRecordNumber`).
- **Ubah** (`PUT /api/patients/:id`): NIK tidak boleh dipakai pasien lain.
- **Hapus** (`DELETE /api/patients/:id`): hanya Administrator.
- **Detail & Riwayat**: `GET /api/medical-records/:patientId` → tampilkan riwayat SOAP pasien (dokter hanya melihat rekam medis miliknya).

### 7.4 Pendaftaran Kunjungan (`Registrations.jsx` ↔ `registrationController.js`)
- Halaman ini hanya untuk **Administrator & Petugas Pendaftaran**.
- Form: pilih pasien (react-select), poli tujuan, dokter pemeriksa, tanggal kunjungan, jenis pembayaran (BPJS / Umum-Mandiri / Asuransi), keluhan awal.
- `POST /api/registrations` → `createRegistration` (menggunakan transaksi DB):
  1. Validasi field wajib.
  2. Validasi dokter **harus sesuai dengan poli tujuan**.
  3. Insert `registrations` dengan status `Menunggu`.
  4. **Auto-generate nomor antrean** per poli (`generateQueueNumber`): `U001` (Umum), `A001` (Anak), `G001` (Gigi), `T001` (THT), `D001` (Penyakit Dalam), urutan per hari.
  5. Insert `queues` dengan status `Menunggu`, terhubung ke `registration_id`.
  6. Commit → respons berisi `registration` + `queue` (nomor antrean ditampilkan sebagai notifikasi sukses).
- **List kunjungan**: `GET /api/registrations?date=&poli=` — join pasien, dokter, dan antrean. Dokter hanya melihat kunjungan poli miliknya.

### 7.5 Antrean Pasien (`Queue.jsx` ↔ `queueController.js`)
- `GET /api/queues?date=&poli=&status=` → daftar antrean (join registrasi & pasien). Dokter hanya melihat antrean miliknya (filter server-side, `selectedPoli` di-disable untuk dokter).
- **Panggil antrean** `PUT /api/queues/:id/call` → `callQueue`:
  1. Ubah status queue menjadi `Dipanggil` + catat `called_at`.
  2. Sinkronkan `registrations.status` menjadi `Check In`.
  3. Frontend memanggil **Web Speech API** untuk mengumumkan nomor antrean & nama pasien (bahasa `id-ID`).
- **Ubah status** `PUT /api/queues/:id/status` → `updateQueueStatus`:
  - Ubah status queue, lalu otomatis sinkronkan status registrasi:
    - `Dipanggil` / `Check In` → registrasi `Check In`
    - `Dalam Pemeriksaan` → registrasi `Pemeriksaan`
    - `Selesai` → registrasi `Selesai`
    - `Batal` → registrasi `Batal`
- UI menampilkan banner "SEDANG DIPANGGIL" untuk antrean berstatus `Dipanggil` + tombol panggil ulang suara. Filter poli, status, dan tanggal tersedia.

### 7.6 Pemeriksaan Dokter / Rekam Medis SOAP (`MedicalRecords.jsx` ↔ `medicalRecordController.js`)
- Khusus **Dokter & Administrator**. Dua tab:

  **Tab 1 — Input Pemeriksaan:**
  1. List antrean hari ini diambil dari `GET /api/queues` (kecuali status `Selesai`/`Batal`).
  2. Pilih pasien antrean → form SOAP terisi otomatis keluhan awal pasien (`initial_complaint` → `subjective`).
  3. Isi field: **Subjective** (keluhan), **Objective** (TD, suhu, BB, TB), **Assessment** (diagnosa), **Plan** (rencana terapi), plus **Tindakan Medis** (dinamis) & **Resep Obat** (dinamis).
  4. `POST /api/medical-records` → `createMedicalRecord` (transaksi):
     - Validasi field wajib SOAP.
     - **Tidak percaya** `patient_id`/`doctor_id` dari browser — ambil ulang dari `registrations` yang dipilih; dokter dipaksa sesuai akun login (server-side).
     - Insert `medical_records`.
     - Insert `medical_procedures` & `prescriptions` (jika diisi).
     - Ubah `registrations.status` & `queues.status` menjadi `Selesai`.
     - Commit.
  5. Sukses → form di-reset & daftar antrean di-refresh (pasien hilang dari antrean aktif).

  **Tab 2 — Riwayat Pasien:**
  - Pilih pasien → `GET /api/medical-records/:patientId` → menampilkan seluruh riwayat SOAP + tindakan + resep (dokter hanya melihat miliknya).

### 7.7 Resep Obat (endpoint terpisah, `prescriptionController.js`)
- `POST /api/prescriptions` — tambah resep manual ke `medical_record_id` (tidak dipakai langsung oleh form SOAP, karena form SOAP mengirim resep dalam satu payload; endpoint ini untuk integrasi/tambahan).
- `GET /api/prescriptions/:id` — lihat detail resep (join pasien & dokter).

---

## 8. Alur Data / State Frontend

1. `main.jsx` membungkus aplikasi dengan `BrowserRouter` → `AuthProvider`.
2. `AuthContext` mengelola `user` & `token` (dari `localStorage`) dan menyediakan `login`, `logout`, `hasRole(...)`.
3. `App.jsx` mendefinisikan route; `ProtectedRoute` memblokir akses bila belum login, dan memfilter halaman sesuai role (redirect ke `/dashboard` bila tidak berhak).
4. `Layout.jsx` menampilkan menu sidebar yang difilter dengan `hasRole`, tombol logout, dan `<Outlet/>` untuk halaman aktif.
5. Setiap halaman menggunakan Axios (`api.js`) untuk memanggil endpoint backend; token otomatis dilampirkan, dan response `401` otomatis logout.

---

## 9. Cara Menjalankan Aplikasi

```bash
# 1) Backend (terminal 1)
cd backend
npm install
npm run db:init
npm run db:seed
npm start            # http://localhost:5001  (health: /health)

# 2) Frontend (terminal 2)
cd frontend
npm install
npm run dev          # http://localhost:3000
```

---

## 10. Catatan & Detail Penting

- **Keamanan**: password di-hash bcrypt; JWT expired 24 jam; RBAC per-endpoint; validasi server-side; transaksi DB untuk operasi multi-tabel (pendaftaran, panggil antrean, SOAP, sinkronisasi dokter).
- **Anti pemalsuan data**: dokter tidak bisa melihat/mengubah antrean poli lain, dan data pasien/dokter pada rekam medis selalu diambil dari registrasi, bukan dari input browser.
- **Nomor otomatis**: No. RM `RM-YYYYMMDD-XXXX` dan No. Antrean per-poli (`U/A/G/T/D` + 3 digit) digenerate urut per hari.
- **Sinkronisasi status**: mengubah status antrean otomatis mengubah status registrasi, dan menyelesaikan SOAP otomatis menuntaskan antrean.
- **Panggilan suara**: menggunakan Web Speech API (SpeechSynthesis) di browser, bahasa `id-ID`.
```