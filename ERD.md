# Entity Relationship Diagram (ERD) - Mini Clinic Information System

Berikut adalah diagram relasi entitas (ERD) untuk aplikasi **Mini Clinic Information System**.

```mermaid
erDiagram
    users ||--o| doctors : "relasi 1-to-1 account"
    patients ||--o{ registrations : "memiliki riwayat pendaftaran"
    doctors ||--o{ registrations : "melayani pendaftaran"
    registrations ||--|| queues : "memiliki 1 antrean"
    registrations ||--o| medical_records : "menghasilkan 1 rekam medis"
    patients ||--o{ medical_records : "memiliki rekam medis"
    doctors ||--o{ medical_records : "memeriksa pasien"
    medical_records ||--o{ medical_procedures : "memiliki tindakan medis"
    medical_records ||--o{ prescriptions : "memiliki resep obat"

    users {
        int id PK
        string username UK
        string password_hash
        string full_name
        enum role "Administrator | Dokter | Petugas Pendaftaran"
        timestamp created_at
    }

    doctors {
        int id PK
        int user_id FK
        string name
        string specialization
        string poli
        string phone
        timestamp created_at
    }

    patients {
        int id PK
        string medical_record_number UK
        string nik UK
        string name
        enum gender "Laki-laki | Perempuan"
        date birth_date
        string phone
        text address
        timestamp created_at
    }

    registrations {
        int id PK
        int patient_id FK
        int doctor_id FK
        string poli
        date visit_date
        string payment_type
        text initial_complaint
        enum status "Menunggu | Check In | Pemeriksaan | Selesai | Batal"
        timestamp created_at
    }

    queues {
        int id PK
        int registration_id FK
        string queue_number
        enum status "Menunggu | Dipanggil | Check In | Dalam Pemeriksaan | Selesai | Batal"
        timestamp called_at
        timestamp created_at
    }

    medical_records {
        int id PK
        int registration_id FK
        int patient_id FK
        int doctor_id FK
        text subjective
        string bp
        numeric temp
        numeric weight
        numeric height
        text assessment
        text plan
        timestamp created_at
    }

    medical_procedures {
        int id PK
        int medical_record_id FK
        string procedure_name
        text description
        numeric cost
        timestamp created_at
    }

    prescriptions {
        int id PK
        int medical_record_id FK
        string medicine_name
        string dosage
        string frequency
        int quantity
        text instructions
        timestamp created_at
    }
```

---

## Deskripsi Entitas Utama:

1. **`users`**: Menyimpan kredensial akun pengguna sistem (Administrator, Dokter, Petugas Pendaftaran) dengan enkripsi password `bcrypt`.
2. **`doctors`**: Menyimpan profil detail dokter terhubung ke akun `users` serta spesialisasi dan poli tempat praktek.
3. **`patients`**: Menyimpan Master Data Pasien dengan keunikan `nik` (16 digit) dan `medical_record_number` (Auto-generate `RM-YYYYMMDD-XXXX`).
4. **`registrations`**: Mencatat pendaftaran kunjungan berobat pasien ke poli & dokter tertentu.
5. **`queues`**: Mengelola status antrean pasien secara berurutan (`A001`, `A002`, dst.) yang terhubung otomatis dari modul pendaftaran.
6. **`medical_records`**: Mencatat pemeriksaan dokter menggunakan metode **SOAP** (Subjective, Objective, Assessment, Plan).
7. **`medical_procedures`**: Mencatat tindakan medis yang dilakukan saat pemeriksaan.
8. **`prescriptions`**: Mencatat resep obat yang diberikan oleh dokter (nama obat, dosis, aturan pakai, jumlah).
