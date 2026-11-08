// Engine database lokal berbasis localStorage (tanpa database server/SQL).
// Menyediakan seluruh endpoint, validasi, RBAC, dan alur bisnis identik dengan backend Express.

const STORAGE_KEY = 'mini_clinic_local_db_v1';
const AUTO_EXAM_AFTER_SECONDS = 60;

export const CONSULTATION_FEES = {
  'Poli Umum': 50000,
  'Poli Gigi': 75000,
  'Poli Anak': 75000,
  'Poli THT': 90000,
  'Poli Penyakit Dalam': 100000,
};
const DEFAULT_CONSULTATION_FEE = 50000;
export const PAYMENT_METHODS = ['Tunai', 'Debit', 'Kredit', 'QRIS', 'Transfer'];

const todayIsoDate = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

function buildInitialSeed() {
  const today = todayIsoDate();
  const created = nowIso();

  const users = [
    { id: 1, username: 'admin', password: 'admin123', full_name: 'Administrator Utama', role: 'Administrator', created_at: created },
    { id: 2, username: 'dokter', password: 'dokter123', full_name: 'dr. Andi Pratama', role: 'Dokter', created_at: created },
    { id: 3, username: 'dokter_anak', password: 'dokter123', full_name: 'dr. Siti Rahma, Sp.A', role: 'Dokter', created_at: created },
    { id: 4, username: 'dokter_gigi', password: 'dokter123', full_name: 'drg. Maya Kusuma', role: 'Dokter', created_at: created },
    { id: 5, username: 'dokter_tht', password: 'dokter123', full_name: 'dr. Rendra Putra, Sp.THT-KL', role: 'Dokter', created_at: created },
    { id: 6, username: 'dokter_dalam', password: 'dokter123', full_name: 'dr. Andi Wijaya, Sp.PD', role: 'Dokter', created_at: created },
    { id: 7, username: 'petugas', password: 'petugas123', full_name: 'Budi Santoso (Petugas Pendaftaran)', role: 'Petugas Pendaftaran', created_at: created },
  ];

  const doctors = [
    { id: 1, user_id: 2, name: 'dr. Andi Pratama', specialization: 'Dokter Umum', poli: 'Poli Umum', phone: '081234567890', created_at: created },
    { id: 2, user_id: 3, name: 'dr. Siti Rahma, Sp.A', specialization: 'Spesialis Anak', poli: 'Poli Anak', phone: '081987654321', created_at: created },
    { id: 3, user_id: 4, name: 'drg. Maya Kusuma', specialization: 'Dokter Gigi', poli: 'Poli Gigi', phone: '081234567891', created_at: created },
    { id: 4, user_id: 5, name: 'dr. Rendra Putra, Sp.THT-KL', specialization: 'THT-KL', poli: 'Poli THT', phone: '081234567892', created_at: created },
    { id: 5, user_id: 6, name: 'dr. Andi Wijaya, Sp.PD', specialization: 'Penyakit Dalam', poli: 'Poli Penyakit Dalam', phone: '081234567893', created_at: created },
  ];

  const patients = [
    {
      id: 1,
      medical_record_number: 'RM-20260729-0001',
      nik: '3201011508950001',
      name: 'Ahmad Rizky',
      gender: 'Laki-laki',
      birth_date: '1995-08-15',
      phone: '081311223344',
      address: 'Jl. Merdeka No. 12, Jakarta Central',
      created_at: created,
    },
    {
      id: 2,
      medical_record_number: 'RM-20260729-0002',
      nik: '3201014203980002',
      name: 'Dewi Lestari',
      gender: 'Perempuan',
      birth_date: '1998-03-22',
      phone: '085711223344',
      address: 'Jl. Sudirman No. 45, Bandung',
      created_at: created,
    },
    {
      id: 3,
      medical_record_number: 'RM-20260729-0003',
      nik: '3201012010020003',
      name: 'Bambang Supriyadi',
      gender: 'Laki-laki',
      birth_date: '2002-10-20',
      phone: '081299887766',
      address: 'Jl. Gatot Subroto No. 88, Surabaya',
      created_at: created,
    },
  ];

  const registrations = [
    {
      id: 1,
      patient_id: 1,
      doctor_id: 1,
      poli: 'Poli Umum',
      visit_date: today,
      payment_type: 'BPJS',
      initial_complaint: 'Demam tinggi 3 hari dan pusing',
      status: 'Pemeriksaan',
      created_at: created,
    },
    {
      id: 2,
      patient_id: 2,
      doctor_id: 2,
      poli: 'Poli Anak',
      visit_date: today,
      payment_type: 'Umum/Mandiri',
      initial_complaint: 'Batuk dan flu sejak semalam',
      status: 'Menunggu',
      created_at: created,
    },
  ];

  const queues = [
    {
      id: 1,
      registration_id: 1,
      queue_number: 'U001',
      status: 'Dalam Pemeriksaan',
      called_at: null,
      created_at: created,
    },
    {
      id: 2,
      registration_id: 2,
      queue_number: 'A001',
      status: 'Menunggu',
      called_at: null,
      created_at: created,
    },
  ];

  const medicines = [
    { id: 1, name: 'Paracetamol 500 mg', unit: 'tablet', price: 1000, stock: 500, is_active: true, created_at: created },
    { id: 2, name: 'Amoxicillin 500 mg', unit: 'kapsul', price: 2500, stock: 300, is_active: true, created_at: created },
    { id: 3, name: 'Ibuprofen 400 mg', unit: 'tablet', price: 1500, stock: 300, is_active: true, created_at: created },
    { id: 4, name: 'Cetirizine 10 mg', unit: 'tablet', price: 1500, stock: 200, is_active: true, created_at: created },
    { id: 5, name: 'Antasida DOEN', unit: 'tablet', price: 800, stock: 300, is_active: true, created_at: created },
    { id: 6, name: 'Omeprazole 20 mg', unit: 'kapsul', price: 3000, stock: 200, is_active: true, created_at: created },
    { id: 7, name: 'Ambroxol 30 mg', unit: 'tablet', price: 1200, stock: 250, is_active: true, created_at: created },
    { id: 8, name: 'Vitamin C 500 mg', unit: 'tablet', price: 700, stock: 400, is_active: true, created_at: created },
    { id: 9, name: 'Sirup Paracetamol Anak', unit: 'botol', price: 15000, stock: 60, is_active: true, created_at: created },
    { id: 10, name: 'Asam Mefenamat 500 mg', unit: 'tablet', price: 1500, stock: 250, is_active: true, created_at: created },
  ];

  const procedure_master = [
    { id: 1, name: 'Pemeriksaan Tekanan Darah', price: 0, is_active: true, created_at: created },
    { id: 2, name: 'Nebulizer', price: 75000, is_active: true, created_at: created },
    { id: 3, name: 'Injeksi', price: 35000, is_active: true, created_at: created },
    { id: 4, name: 'Perawatan Luka', price: 60000, is_active: true, created_at: created },
    { id: 5, name: 'Jahit Luka (per jahitan)', price: 25000, is_active: true, created_at: created },
    { id: 6, name: 'Cabut Gigi', price: 150000, is_active: true, created_at: created },
    { id: 7, name: 'Scaling Gigi', price: 250000, is_active: true, created_at: created },
    { id: 8, name: 'Cek Gula Darah', price: 25000, is_active: true, created_at: created },
    { id: 9, name: 'Cek Kolesterol', price: 40000, is_active: true, created_at: created },
    { id: 10, name: 'EKG', price: 100000, is_active: true, created_at: created },
  ];

  const consultation_fees = [
    { poli: 'Poli Umum', fee: 50000 },
    { poli: 'Poli Gigi', fee: 75000 },
    { poli: 'Poli Anak', fee: 75000 },
    { poli: 'Poli THT', fee: 90000 },
    { poli: 'Poli Penyakit Dalam', fee: 100000 },
  ];

  return {
    users,
    doctors,
    patients,
    registrations,
    queues,
    medical_records: [],
    medical_procedures: [],
    prescriptions: [],
    invoices: [],
    invoice_items: [],
    medicines,
    procedure_master,
    consultation_fees,
    counters: {
      patients: 3,
      registrations: 2,
      queues: 2,
      medical_records: 0,
      medical_procedures: 0,
      prescriptions: 0,
      invoices: 0,
      invoice_items: 0,
      medicines: 10,
      procedure_master: 10,
    },
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Gagal membaca localStorage, menggunakan data awal:', e);
  }
  const seed = buildInitialSeed();
  saveDb(seed);
  return seed;
}

function saveDb(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Gagal menyimpan ke localStorage:', e);
  }
}

export function resetDemoDb() {
  const seed = buildInitialSeed();
  saveDb(seed);
  return seed;
}

function nextId(db, table) {
  db.counters[table] = (db.counters[table] || 0) + 1;
  return db.counters[table];
}

// Token encoding/decoding (stateless JWT-like token di browser)
function encodeToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(
    unescape(
      encodeURIComponent(
        JSON.stringify({
          ...payload,
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
      )
    )
  );
  return `${header}.${body}.local_demo_sig`;
}

function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = decodeURIComponent(escape(atob(parts[1])));
    const payload = JSON.parse(json);
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function ok(message, data = {}, status = 200) {
  return { status, body: { success: true, message, data } };
}

function fail(message, errors = null, status = 400) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return { status, body };
}

function requireAuth(headers) {
  const auth = headers?.Authorization || headers?.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  if (!token) {
    return { error: fail('Access token is missing or invalid', { auth: 'Token required' }, 401) };
  }
  const user = decodeToken(token);
  if (!user) {
    return { error: fail('Invalid or expired token', { auth: 'Token invalid or expired' }, 401) };
  }
  return { user };
}

function requireRole(user, allowedRoles) {
  if (!user || !allowedRoles.includes(user.role)) {
    return fail(
      'Forbidden: You do not have permission to access this resource',
      { role: `Role '${user?.role}' is not authorized` },
      403
    );
  }
  return null;
}

// Auto-advance antrean Dipanggil > 60 detik -> Dalam Pemeriksaan
function autoAdvanceCalledQueues(db) {
  const now = Date.now();
  let changed = false;
  for (const q of db.queues) {
    if (q.status === 'Dipanggil' && q.called_at) {
      const elapsedSec = (now - new Date(q.called_at).getTime()) / 1000;
      if (elapsedSec >= AUTO_EXAM_AFTER_SECONDS) {
        q.status = 'Dalam Pemeriksaan';
        const reg = db.registrations.find((r) => r.id === q.registration_id);
        if (reg && !['Selesai', 'Batal'].includes(reg.status)) {
          reg.status = 'Pemeriksaan';
        }
        changed = true;
      }
    }
  }
  if (changed) saveDb(db);
}

function generateMedicalRecordNumber(db) {
  const dateStr = todayIsoDate().replace(/-/g, '');
  const prefix = `RM-${dateStr}-`;
  const matching = db.patients
    .filter((p) => p.medical_record_number.startsWith(prefix))
    .sort((a, b) => b.id - a.id);

  let nextSeq = 1;
  if (matching.length > 0) {
    const parts = matching[0].medical_record_number.split('-');
    if (parts.length === 3) {
      nextSeq = (parseInt(parts[2], 10) || 0) + 1;
    }
  }
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

function generateQueueNumber(db, poli, visitDate) {
  let prefix = 'U';
  const lower = (poli || '').toLowerCase();
  if (lower.includes('anak')) prefix = 'A';
  if (lower.includes('gigi')) prefix = 'G';
  if (lower.includes('tht')) prefix = 'T';
  if (lower.includes('penyakit dalam')) prefix = 'D';

  const matching = db.queues
    .filter((q) => {
      const reg = db.registrations.find((r) => r.id === q.registration_id);
      return reg && reg.visit_date === visitDate && q.queue_number.startsWith(prefix);
    })
    .sort((a, b) => b.id - a.id);

  let nextSeq = 1;
  if (matching.length > 0) {
    const numPart = matching[0].queue_number.substring(1);
    nextSeq = (parseInt(numPart, 10) || 0) + 1;
  }
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

function generateInvoiceNumber(db) {
  const today = todayIsoDate().replace(/-/g, '');
  const prefix = `INV-${today}-`;
  const count = db.invoices.filter((i) => i.invoice_number.startsWith(prefix)).length;
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

function createInvoiceForMedicalRecord(db, medicalRecordId) {
  const mr = db.medical_records.find((m) => m.id === medicalRecordId);
  if (!mr) return null;
  const reg = db.registrations.find((r) => r.id === mr.registration_id);
  if (!reg) return null;

  const existing = db.invoices.find((i) => i.registration_id === mr.registration_id);
  if (existing) return existing;

  const items = [];
  const feeRow = db.consultation_fees.find((f) => f.poli === reg.poli);
  const fee = feeRow ? Number(feeRow.fee) : (CONSULTATION_FEES[reg.poli] ?? DEFAULT_CONSULTATION_FEE);
  items.push({ type: 'Konsultasi', name: `Konsultasi Dokter - ${reg.poli}`, qty: 1, price: fee });

  const procs = db.medical_procedures.filter((p) => p.medical_record_id === medicalRecordId);
  for (const p of procs) {
    items.push({ type: 'Tindakan', name: p.procedure_name, qty: 1, price: Number(p.cost) || 0 });
  }

  const rxs = db.prescriptions.filter((rx) => rx.medical_record_id === medicalRecordId);
  for (const rx of rxs) {
    items.push({ type: 'Obat', name: rx.medicine_name, qty: rx.quantity || 1, price: Number(rx.unit_price) || 0 });
  }

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const isBpjs = /bpjs/i.test(reg.payment_type || '');
  const discount = isBpjs ? subtotal : 0;
  const total = subtotal - discount;
  const invoiceNumber = generateInvoiceNumber(db);

  const invoice = {
    id: nextId(db, 'invoices'),
    invoice_number: invoiceNumber,
    registration_id: mr.registration_id,
    patient_id: mr.patient_id,
    medical_record_id: medicalRecordId,
    subtotal,
    discount,
    total_amount: total,
    payment_type: reg.payment_type,
    status: isBpjs ? 'Lunas' : 'Belum Bayar',
    payment_method: isBpjs ? 'BPJS' : null,
    amount_paid: 0,
    change_amount: 0,
    paid_at: isBpjs ? nowIso() : null,
    cashier_id: null,
    notes: isBpjs ? 'Ditanggung BPJS' : null,
    created_at: nowIso(),
  };
  db.invoices.push(invoice);

  for (const i of items) {
    db.invoice_items.push({
      id: nextId(db, 'invoice_items'),
      invoice_id: invoice.id,
      item_type: i.type,
      item_name: i.name,
      quantity: i.qty,
      unit_price: i.price,
      subtotal: i.qty * i.price,
    });
  }

  return invoice;
}

function getDoctorForUser(db, user) {
  return db.doctors.find((d) => d.user_id === user.id) || null;
}

export function dispatchLocalApi({ method = 'GET', url = '', params = {}, data = {}, headers = {} }) {
  const cleanMethod = method.toUpperCase();
  // Normalisasi path tanpa /api prefix & pisahkan query string jika ada
  const [rawPath, queryStr] = url.split('?');
  let path = rawPath.replace(/^https?:\/\/[^/]+/, '');
  if (path.startsWith('/api/')) path = path.slice(4);
  else if (path === '/api') path = '/';
  if (!path.startsWith('/')) path = '/' + path;

  const queryParams = { ...params };
  if (queryStr) {
    const sp = new URLSearchParams(queryStr);
    for (const [k, v] of sp.entries()) {
      if (queryParams[k] === undefined) queryParams[k] = v;
    }
  }

  const body = typeof data === 'string' && data ? JSON.parse(data) : (data || {});
  const db = loadDb();

  // --- Public Routes ---
  if (cleanMethod === 'GET' && path === '/health') {
    return ok('OK', { status: 'ok', mode: 'local-storage', timestamp: nowIso() });
  }

  if (cleanMethod === 'POST' && path === '/login') {
    const { username, password } = body;
    if (!username || !password) {
      return fail('Username and password are required', {
        username: !username ? 'Username is required' : undefined,
        password: !password ? 'Password is required' : undefined,
      });
    }
    const user = db.users.find((u) => u.username === username);
    if (!user || user.password !== password) {
      return fail('Invalid username or password', { auth: 'Invalid credentials' }, 401);
    }
    let doctor = null;
    if (user.role === 'Dokter') {
      doctor = db.doctors.find((d) => d.user_id === user.id) || null;
      if (!doctor) {
        return fail('Akun dokter belum terhubung ke data dokter', { doctor: 'Doctor profile not found' }, 403);
      }
    }
    const userPayload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      doctor_id: doctor?.id || null,
      doctor_poli: doctor?.poli || null,
    };
    const token = encodeToken(userPayload);
    return ok('Login successful', { token, user: userPayload });
  }

  if (cleanMethod === 'POST' && path === '/logout') {
    return ok('Logout successful', {});
  }

  // --- Protected Routes ---
  const auth = requireAuth(headers);
  if (auth.error) return auth.error;
  const currentUser = auth.user;

  // --- Dashboard ---
  if (cleanMethod === 'GET' && path === '/dashboard') {
    autoAdvanceCalledQueues(db);
    const today = todayIsoDate();
    const doc = currentUser.role === 'Dokter' ? getDoctorForUser(db, currentUser) : null;

    const total_patients = db.patients.length;
    const total_patients_today = db.patients.filter((p) => String(p.created_at).slice(0, 10) === today).length;

    const todayQueues = db.queues.filter((q) => {
      const reg = db.registrations.find((r) => r.id === q.registration_id);
      if (!reg || reg.visit_date !== today) return false;
      if (currentUser.role === 'Dokter') return doc && reg.doctor_id === doc.id;
      return true;
    });

    const total_queues_today = todayQueues.length;
    const total_patients_waiting = todayQueues.filter((q) => q.status === 'Menunggu').length;
    const total_patients_completed = todayQueues.filter((q) => q.status === 'Selesai').length;

    const doctors = (
      currentUser.role === 'Dokter'
        ? db.doctors.filter((d) => d.user_id === currentUser.id)
        : db.doctors
    )
      .map(({ id, name, specialization, poli }) => ({ id, name, specialization, poli }))
      .sort((a, b) => a.name.localeCompare(b.name));

    let payment = null;
    if (currentUser.role !== 'Dokter') {
      const todayInvoices = db.invoices.filter((inv) => {
        const reg = db.registrations.find((r) => r.id === inv.registration_id);
        return reg && reg.visit_date === today;
      });
      payment = {
        revenue_today: todayInvoices
          .filter((i) => i.status === 'Lunas' && i.payment_method !== 'BPJS')
          .reduce((s, i) => s + Number(i.total_amount), 0),
        unpaid_count: todayInvoices.filter((i) => i.status === 'Belum Bayar').length,
        paid_count: todayInvoices.filter((i) => i.status === 'Lunas').length,
        unpaid_amount: todayInvoices
          .filter((i) => i.status === 'Belum Bayar')
          .reduce((s, i) => s + Number(i.total_amount), 0),
      };
    }

    return ok('Dashboard metrics retrieved successfully', {
      payment,
      total_patients,
      total_patients_today,
      total_queues_today,
      total_patients_waiting,
      total_patients_completed,
      doctors,
    });
  }

  // --- Patients ---
  if (path === '/patients' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran', 'Dokter']);
    if (deny) return deny;

    const page = Math.max(parseInt(queryParams.page || '1', 10) || 1, 1);
    const limit = Math.max(parseInt(queryParams.limit || '10', 10) || 10, 1);
    const search = (queryParams.search || '').trim().toLowerCase();

    let filtered = [...db.patients];
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.nik.toLowerCase().includes(search) ||
          p.medical_record_number.toLowerCase().includes(search)
      );
    }
    filtered.sort((a, b) => b.id - a.id);

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const offset = (page - 1) * limit;
    const patients = filtered.slice(offset, offset + limit);

    return ok('Patients retrieved successfully', {
      patients,
      pagination: { totalItems, totalPages, currentPage: page, limit },
    });
  }

  if (path === '/patients' && cleanMethod === 'POST') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;

    const { nik, name, gender, birth_date, phone, address } = body;
    const errors = {};
    if (!nik || String(nik).length < 16) errors.nik = 'NIK minimal 16 digit';
    if (!name) errors.name = 'Nama pasien wajib diisi';
    if (!gender) errors.gender = 'Jenis kelamin wajib diisi';
    if (!birth_date) errors.birth_date = 'Tanggal lahir wajib diisi';
    if (!phone) errors.phone = 'Nomor telepon wajib diisi';
    if (!address) errors.address = 'Alamat wajib diisi';
    if (Object.keys(errors).length > 0) return fail('Validation Error', errors, 400);

    if (db.patients.some((p) => p.nik === String(nik).trim())) {
      return fail('Validation Error', { nik: 'NIK sudah terdaftar di sistem' }, 400);
    }

    const patient = {
      id: nextId(db, 'patients'),
      medical_record_number: generateMedicalRecordNumber(db),
      nik: String(nik).trim(),
      name: String(name).trim(),
      gender,
      birth_date,
      phone: String(phone).trim(),
      address: String(address).trim(),
      created_at: nowIso(),
    };
    db.patients.push(patient);
    saveDb(db);
    return ok('Patient created successfully', patient, 201);
  }

  const patientIdMatch = path.match(/^\/patients\/(\d+)$/);
  if (patientIdMatch) {
    const id = parseInt(patientIdMatch[1], 10);

    if (cleanMethod === 'GET') {
      const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran', 'Dokter']);
      if (deny) return deny;
      const patient = db.patients.find((p) => p.id === id);
      if (!patient) return fail('Patient not found', { patient: 'Patient not found' }, 404);
      return ok('Patient retrieved successfully', patient);
    }

    if (cleanMethod === 'PUT') {
      const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
      if (deny) return deny;
      const { nik, name, gender, birth_date, phone, address } = body;
      const errors = {};
      if (!nik || String(nik).length < 16) errors.nik = 'NIK minimal 16 digit';
      if (!name) errors.name = 'Nama pasien wajib diisi';
      if (!gender) errors.gender = 'Jenis kelamin wajib diisi';
      if (!birth_date) errors.birth_date = 'Tanggal lahir wajib diisi';
      if (!phone) errors.phone = 'Nomor telepon wajib diisi';
      if (!address) errors.address = 'Alamat wajib diisi';
      if (Object.keys(errors).length > 0) return fail('Validation Error', errors, 400);

      if (db.patients.some((p) => p.nik === String(nik).trim() && p.id !== id)) {
        return fail('Validation Error', { nik: 'NIK sudah terdaftar pada pasien lain' }, 400);
      }

      const idx = db.patients.findIndex((p) => p.id === id);
      if (idx === -1) return fail('Patient not found', { patient: 'Patient not found' }, 404);

      db.patients[idx] = {
        ...db.patients[idx],
        nik: String(nik).trim(),
        name: String(name).trim(),
        gender,
        birth_date,
        phone: String(phone).trim(),
        address: String(address).trim(),
      };
      saveDb(db);
      return ok('Patient updated successfully', db.patients[idx]);
    }

    if (cleanMethod === 'DELETE') {
      const deny = requireRole(currentUser, ['Administrator']);
      if (deny) return deny;
      const idx = db.patients.findIndex((p) => p.id === id);
      if (idx === -1) return fail('Patient not found', { patient: 'Patient not found' }, 404);

      const [deleted] = db.patients.splice(idx, 1);
      // Cascade clean up relasi
      const removedRegIds = new Set(db.registrations.filter((r) => r.patient_id === id).map((r) => r.id));
      db.registrations = db.registrations.filter((r) => r.patient_id !== id);
      db.queues = db.queues.filter((q) => !removedRegIds.has(q.registration_id));
      const removedMrIds = new Set(db.medical_records.filter((m) => m.patient_id === id).map((m) => m.id));
      db.medical_records = db.medical_records.filter((m) => m.patient_id !== id);
      db.medical_procedures = db.medical_procedures.filter((p) => !removedMrIds.has(p.medical_record_id));
      db.prescriptions = db.prescriptions.filter((rx) => !removedMrIds.has(rx.medical_record_id));
      const removedInvIds = new Set(db.invoices.filter((i) => i.patient_id === id).map((i) => i.id));
      db.invoices = db.invoices.filter((i) => i.patient_id !== id);
      db.invoice_items = db.invoice_items.filter((it) => !removedInvIds.has(it.invoice_id));

      saveDb(db);
      return ok('Patient deleted successfully', deleted);
    }
  }

  // --- Registrations ---
  if (path === '/registrations' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran', 'Dokter']);
    if (deny) return deny;

    const date = queryParams.date || todayIsoDate();
    const poli = queryParams.poli;
    const doc = currentUser.role === 'Dokter' ? getDoctorForUser(db, currentUser) : null;

    const rows = db.registrations
      .filter((r) => {
        if (r.visit_date !== date) return false;
        if (currentUser.role === 'Dokter' && (!doc || r.doctor_id !== doc.id)) return false;
        if (poli && r.poli !== poli) return false;
        return true;
      })
      .sort((a, b) => b.id - a.id)
      .map((r) => {
        const patient = db.patients.find((p) => p.id === r.patient_id) || {};
        const doctor = db.doctors.find((d) => d.id === r.doctor_id) || {};
        const queue = db.queues.find((q) => q.registration_id === r.id) || {};
        return {
          id: r.id,
          patient_id: r.patient_id,
          doctor_id: r.doctor_id,
          poli: r.poli,
          visit_date: r.visit_date,
          payment_type: r.payment_type,
          initial_complaint: r.initial_complaint,
          registration_status: r.status,
          created_at: r.created_at,
          medical_record_number: patient.medical_record_number,
          nik: patient.nik,
          patient_name: patient.name,
          patient_gender: patient.gender,
          patient_phone: patient.phone,
          doctor_name: doctor.name || null,
          queue_id: queue.id || null,
          queue_number: queue.queue_number || null,
          queue_status: queue.status || null,
          called_at: queue.called_at || null,
        };
      });

    return ok('Registrations retrieved successfully', rows);
  }

  if (path === '/registrations' && cleanMethod === 'POST') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;

    const { patient_id, doctor_id, poli, visit_date, payment_type, initial_complaint } = body;
    const errors = {};
    if (!patient_id) errors.patient_id = 'Pasien wajib dipilih';
    if (!doctor_id) errors.doctor_id = 'Dokter wajib dipilih';
    if (!poli) errors.poli = 'Poli wajib dipilih';
    if (!payment_type) errors.payment_type = 'Jenis pembayaran wajib dipilih';
    if (!initial_complaint || !String(initial_complaint).trim()) {
      errors.initial_complaint = 'Keluhan awal wajib diisi';
    }
    if (Object.keys(errors).length > 0) return fail('Validation Error', errors, 400);

    const pid = parseInt(patient_id, 10);
    const did = parseInt(doctor_id, 10);
    if (!db.patients.some((p) => p.id === pid)) {
      return fail('Pasien tidak ditemukan', { patient_id: 'Pasien tidak valid' }, 400);
    }
    const doctor = db.doctors.find((d) => d.id === did && d.poli === poli);
    if (!doctor) {
      return fail('Dokter harus sesuai dengan poli tujuan', { doctor_id: 'Dokter tidak terdaftar pada poli yang dipilih' }, 400);
    }

    const regDate = visit_date || todayIsoDate();
    const registration = {
      id: nextId(db, 'registrations'),
      patient_id: pid,
      doctor_id: did,
      poli,
      visit_date: regDate,
      payment_type,
      initial_complaint: String(initial_complaint).trim(),
      status: 'Menunggu',
      created_at: nowIso(),
    };
    db.registrations.push(registration);

    const queueNumber = generateQueueNumber(db, poli, regDate);
    const queue = {
      id: nextId(db, 'queues'),
      registration_id: registration.id,
      queue_number: queueNumber,
      status: 'Menunggu',
      called_at: null,
      created_at: nowIso(),
    };
    db.queues.push(queue);

    saveDb(db);
    return ok('Registration and Queue created successfully', { registration, queue }, 201);
  }

  const regIdMatch = path.match(/^\/registrations\/(\d+)$/);
  if (regIdMatch && cleanMethod === 'PUT') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const id = parseInt(regIdMatch[1], 10);
    const reg = db.registrations.find((r) => r.id === id);
    if (!reg) return fail('Registration not found', { registration: 'Not found' }, 404);

    const { doctor_id, poli, payment_type, initial_complaint, status } = body;
    if (doctor_id !== undefined && doctor_id !== null) reg.doctor_id = parseInt(doctor_id, 10);
    if (poli !== undefined && poli !== null) reg.poli = poli;
    if (payment_type !== undefined && payment_type !== null) reg.payment_type = payment_type;
    if (initial_complaint !== undefined && initial_complaint !== null) reg.initial_complaint = initial_complaint;
    if (status !== undefined && status !== null) reg.status = status;

    saveDb(db);
    return ok('Registration updated successfully', reg);
  }

  // --- Queues ---
  if (path === '/queues' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran', 'Dokter']);
    if (deny) return deny;

    autoAdvanceCalledQueues(db);
    const date = queryParams.date || todayIsoDate();
    const poli = queryParams.poli;
    const status = queryParams.status;
    const doc = currentUser.role === 'Dokter' ? getDoctorForUser(db, currentUser) : null;

    const rows = db.queues
      .map((q) => {
        const reg = db.registrations.find((r) => r.id === q.registration_id);
        if (!reg || reg.visit_date !== date) return null;
        if (currentUser.role === 'Dokter' && (!doc || reg.doctor_id !== doc.id)) return null;
        if (poli && reg.poli !== poli) return null;
        if (status && q.status !== status) return null;

        const patient = db.patients.find((p) => p.id === reg.patient_id) || {};
        const doctor = db.doctors.find((d) => d.id === reg.doctor_id) || {};
        return {
          id: q.id,
          registration_id: q.registration_id,
          queue_number: q.queue_number,
          queue_status: q.status,
          called_at: q.called_at,
          created_at: q.created_at,
          patient_id: reg.patient_id,
          doctor_id: reg.doctor_id,
          poli: reg.poli,
          visit_date: reg.visit_date,
          payment_type: reg.payment_type,
          initial_complaint: reg.initial_complaint,
          registration_status: reg.status,
          medical_record_number: patient.medical_record_number,
          nik: patient.nik,
          patient_name: patient.name,
          patient_gender: patient.gender,
          patient_phone: patient.phone,
          doctor_name: doctor.name || null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const diff = new Date(b.created_at) - new Date(a.created_at);
        return diff !== 0 ? diff : b.id - a.id;
      });

    return ok('Queues retrieved successfully', rows);
  }

  if (path === '/queues' && cleanMethod === 'POST') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const { registration_id, queue_number } = body;
    if (!registration_id || !queue_number) {
      return fail('Validation Error', {
        registration_id: !registration_id ? 'Registration ID is required' : undefined,
        queue_number: !queue_number ? 'Queue number is required' : undefined,
      });
    }
    const queue = {
      id: nextId(db, 'queues'),
      registration_id: parseInt(registration_id, 10),
      queue_number,
      status: 'Menunggu',
      called_at: null,
      created_at: nowIso(),
    };
    db.queues.push(queue);
    saveDb(db);
    return ok('Queue created successfully', queue, 201);
  }

  const queueCallMatch = path.match(/^\/queues\/(\d+)\/call$/);
  if (queueCallMatch && cleanMethod === 'PUT') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const id = parseInt(queueCallMatch[1], 10);
    const q = db.queues.find((item) => item.id === id);
    const reg = q ? db.registrations.find((r) => r.id === q.registration_id) : null;
    const doc = currentUser.role === 'Dokter' ? getDoctorForUser(db, currentUser) : null;

    const authorized =
      q &&
      reg &&
      !['Selesai', 'Batal'].includes(q.status) &&
      (currentUser.role !== 'Dokter' || (doc && reg.doctor_id === doc.id));

    if (!authorized) {
      return fail(
        'Antrean tidak ditemukan, bukan milik Anda, atau sudah Selesai/Batal (terkunci)',
        { queue: 'Not found, forbidden or locked' },
        404
      );
    }

    q.status = 'Dipanggil';
    q.called_at = nowIso();
    reg.status = 'Check In';
    saveDb(db);

    const patient = db.patients.find((p) => p.id === reg.patient_id) || {};
    const doctor = db.doctors.find((d) => d.id === reg.doctor_id) || {};

    return ok('Queue called successfully', {
      id: q.id,
      queue_number: q.queue_number,
      queue_status: q.status,
      called_at: q.called_at,
      patient_name: patient.name,
      medical_record_number: patient.medical_record_number,
      poli: reg.poli,
      doctor_name: doctor.name || null,
    });
  }

  const queueStatusMatch = path.match(/^\/queues\/(\d+)\/status$/);
  if (queueStatusMatch && cleanMethod === 'PUT') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const id = parseInt(queueStatusMatch[1], 10);
    const { status } = body;
    if (!status) return fail('Status is required', { status: 'Status is required' });

    const q = db.queues.find((item) => item.id === id);
    const reg = q ? db.registrations.find((r) => r.id === q.registration_id) : null;
    const doc = currentUser.role === 'Dokter' ? getDoctorForUser(db, currentUser) : null;

    const authorized =
      q &&
      reg &&
      !['Selesai', 'Batal'].includes(q.status) &&
      (currentUser.role !== 'Dokter' || (doc && reg.doctor_id === doc.id));

    if (!authorized) {
      return fail(
        'Antrean tidak ditemukan, bukan milik Anda, atau sudah Selesai/Batal (terkunci)',
        { queue: 'Not found, forbidden or locked' },
        404
      );
    }

    q.status = status;
    let regStatus = 'Menunggu';
    if (status === 'Dipanggil' || status === 'Check In') regStatus = 'Check In';
    if (status === 'Dalam Pemeriksaan') regStatus = 'Pemeriksaan';
    if (status === 'Selesai') regStatus = 'Selesai';
    if (status === 'Batal') regStatus = 'Batal';
    reg.status = regStatus;

    saveDb(db);
    return ok('Queue status updated successfully', q);
  }

  // --- Medical Records (SOAP) ---
  if (path === '/medical-records' && cleanMethod === 'POST') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter']);
    if (deny) return deny;

    const {
      registration_id,
      subjective,
      bp,
      temp,
      weight,
      height,
      assessment,
      plan,
      procedures = [],
      prescriptions = [],
    } = body;

    const errors = {};
    if (!registration_id) errors.registration_id = 'Registration ID wajib diisi';
    if (!subjective) errors.subjective = 'Keluhan pasien (Subjective) wajib diisi';
    if (!bp) errors.bp = 'Tekanan darah wajib diisi';
    if (!temp) errors.temp = 'Suhu tubuh wajib diisi';
    if (!weight) errors.weight = 'Berat badan wajib diisi';
    if (!height) errors.height = 'Tinggi badan wajib diisi';
    if (!assessment) errors.assessment = 'Diagnosa (Assessment) wajib diisi';
    if (!plan) errors.plan = 'Rencana terapi (Plan) wajib diisi';
    if (Object.keys(errors).length > 0) return fail('Validation Error', errors, 400);

    const regId = parseInt(registration_id, 10);
    const reg = db.registrations.find((r) => r.id === regId);
    const doc = currentUser.role === 'Dokter' ? getDoctorForUser(db, currentUser) : null;

    if (!reg || (currentUser.role === 'Dokter' && (!doc || reg.doctor_id !== doc.id))) {
      return fail('Pendaftaran tidak ditemukan atau bukan antrean Anda', { registration: 'Not found or forbidden' }, 403);
    }

    // Validasi master tindakan & stok obat sebelum mutasi (transaksi atomik)
    const resolvedProcedures = [];
    if (Array.isArray(procedures)) {
      for (const proc of procedures) {
        if (!proc.procedure_id) continue;
        const pid = parseInt(proc.procedure_id, 10);
        const master = db.procedure_master.find((m) => m.id === pid && m.is_active);
        if (!master) {
          return fail('Tindakan tidak ditemukan di Master Tindakan', { procedures: 'Pilih tindakan dari daftar' }, 400);
        }
        resolvedProcedures.push({ master, description: proc.description || '' });
      }
    }

    const stockNeeded = {};
    const resolvedPrescriptions = [];
    if (Array.isArray(prescriptions)) {
      for (const rx of prescriptions) {
        if (!rx.medicine_id) continue;
        const mid = parseInt(rx.medicine_id, 10);
        const qty = Math.max(parseInt(rx.quantity, 10) || 1, 1);
        const medicine = db.medicines.find((m) => m.id === mid && m.is_active);
        if (!medicine) {
          return fail('Obat tidak ditemukan di Master Obat', { prescriptions: 'Pilih obat dari daftar' }, 400);
        }
        stockNeeded[mid] = (stockNeeded[mid] || 0) + qty;
        if (medicine.stock < stockNeeded[mid]) {
          return fail(
            `Stok ${medicine.name} tidak cukup (tersisa ${medicine.stock})`,
            { prescriptions: `Stok ${medicine.name} tersisa ${medicine.stock}` },
            400
          );
        }
        resolvedPrescriptions.push({ medicine, qty, rx });
      }
    }

    const medicalRecord = {
      id: nextId(db, 'medical_records'),
      registration_id: reg.id,
      patient_id: reg.patient_id,
      doctor_id: reg.doctor_id,
      subjective,
      bp,
      temp,
      weight,
      height,
      assessment,
      plan,
      created_at: nowIso(),
    };
    db.medical_records.push(medicalRecord);

    const insertedProcedures = [];
    for (const item of resolvedProcedures) {
      const p = {
        id: nextId(db, 'medical_procedures'),
        medical_record_id: medicalRecord.id,
        procedure_id: item.master.id,
        procedure_name: item.master.name,
        description: item.description,
        cost: Number(item.master.price) || 0,
        created_at: nowIso(),
      };
      db.medical_procedures.push(p);
      insertedProcedures.push(p);
    }

    const insertedPrescriptions = [];
    for (const item of resolvedPrescriptions) {
      item.medicine.stock -= item.qty;
      const p = {
        id: nextId(db, 'prescriptions'),
        medical_record_id: medicalRecord.id,
        medicine_id: item.medicine.id,
        medicine_name: item.medicine.name,
        dosage: item.rx.dosage || '',
        frequency: item.rx.frequency || '',
        quantity: item.qty,
        instructions: item.rx.instructions || '',
        unit_price: Number(item.medicine.price) || 0,
        created_at: nowIso(),
      };
      db.prescriptions.push(p);
      insertedPrescriptions.push(p);
    }

    reg.status = 'Selesai';
    const queue = db.queues.find((q) => q.registration_id === reg.id);
    if (queue) queue.status = 'Selesai';

    const invoice = createInvoiceForMedicalRecord(db, medicalRecord.id);
    saveDb(db);

    return ok(
      'Medical record created successfully',
      {
        medical_record: medicalRecord,
        invoice,
        procedures: insertedProcedures,
        prescriptions: insertedPrescriptions,
      },
      201
    );
  }

  if (path === '/medical-records' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter']);
    if (deny) return deny;

    const { date_from, date_to, poli, doctor_id, search } = queryParams;
    const doc = currentUser.role === 'Dokter' ? getDoctorForUser(db, currentUser) : null;
    const searchLower = (search || '').trim().toLowerCase();

    const records = db.medical_records
      .map((mr) => {
        const patient = db.patients.find((p) => p.id === mr.patient_id) || {};
        const doctor = db.doctors.find((d) => d.id === mr.doctor_id) || {};
        const reg = db.registrations.find((r) => r.id === mr.registration_id) || {};

        if (currentUser.role === 'Dokter' && (!doc || mr.doctor_id !== doc.id)) return null;
        if (date_from && (!reg.visit_date || reg.visit_date < date_from)) return null;
        if (date_to && (!reg.visit_date || reg.visit_date > date_to)) return null;
        if (poli && reg.poli !== poli) return null;
        if (doctor_id && String(mr.doctor_id) !== String(doctor_id)) return null;
        if (searchLower) {
          const hit =
            (patient.name || '').toLowerCase().includes(searchLower) ||
            (patient.nik || '').toLowerCase().includes(searchLower) ||
            (patient.medical_record_number || '').toLowerCase().includes(searchLower);
          if (!hit) return null;
        }

        return {
          ...mr,
          patient_name: patient.name,
          nik: patient.nik,
          medical_record_number: patient.medical_record_number,
          doctor_name: doctor.name || '-',
          poli: reg.poli,
          visit_date: reg.visit_date,
          payment_type: reg.payment_type,
          procedures: db.medical_procedures.filter((p) => p.medical_record_id === mr.id),
          prescriptions: db.prescriptions.filter((rx) => rx.medical_record_id === mr.id),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 200);

    return ok('Medical records retrieved successfully', records);
  }

  const mrPatientMatch = path.match(/^\/medical-records\/(\d+)$/);
  if (mrPatientMatch && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const patientId = parseInt(mrPatientMatch[1], 10);
    const doc = currentUser.role === 'Dokter' ? getDoctorForUser(db, currentUser) : null;

    const records = db.medical_records
      .filter((mr) => {
        if (mr.patient_id !== patientId) return false;
        if (currentUser.role === 'Dokter' && (!doc || mr.doctor_id !== doc.id)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((mr) => {
        const patient = db.patients.find((p) => p.id === mr.patient_id) || {};
        const doctor = db.doctors.find((d) => d.id === mr.doctor_id) || {};
        const reg = db.registrations.find((r) => r.id === mr.registration_id) || {};
        return {
          ...mr,
          patient_name: patient.name,
          medical_record_number: patient.medical_record_number,
          doctor_name: doctor.name || '-',
          poli: reg.poli,
          visit_date: reg.visit_date,
          procedures: db.medical_procedures.filter((p) => p.medical_record_id === mr.id),
          prescriptions: db.prescriptions.filter((rx) => rx.medical_record_id === mr.id),
        };
      });

    return ok('Patient medical records retrieved successfully', records);
  }

  // --- Prescriptions ---
  if (path === '/prescriptions' && cleanMethod === 'POST') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter']);
    if (deny) return deny;
    const { medical_record_id, medicine_name, dosage, frequency, quantity, instructions } = body;
    const errors = {};
    if (!medical_record_id) errors.medical_record_id = 'Medical Record ID is required';
    if (!medicine_name) errors.medicine_name = 'Nama obat wajib diisi';
    if (!dosage) errors.dosage = 'Dosis wajib diisi';
    if (!frequency) errors.frequency = 'Frekuensi aturan pakai wajib diisi';
    if (Object.keys(errors).length > 0) return fail('Validation Error', errors, 400);

    const rx = {
      id: nextId(db, 'prescriptions'),
      medical_record_id: parseInt(medical_record_id, 10),
      medicine_id: null,
      medicine_name,
      dosage,
      frequency,
      quantity: quantity || 1,
      instructions: instructions || '',
      unit_price: 0,
      created_at: nowIso(),
    };
    db.prescriptions.push(rx);
    saveDb(db);
    return ok('Prescription created successfully', rx, 201);
  }

  const rxIdMatch = path.match(/^\/prescriptions\/(\d+)$/);
  if (rxIdMatch && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const id = parseInt(rxIdMatch[1], 10);
    const pr = db.prescriptions.find((r) => r.id === id);
    if (!pr) return fail('Prescription not found', { prescription: 'Not found' }, 404);
    const mr = db.medical_records.find((m) => m.id === pr.medical_record_id) || {};
    const patient = db.patients.find((p) => p.id === mr.patient_id) || {};
    const doctor = db.doctors.find((d) => d.id === mr.doctor_id) || {};
    return ok('Prescription retrieved successfully', {
      ...pr,
      patient_id: mr.patient_id,
      doctor_id: mr.doctor_id,
      patient_name: patient.name,
      medical_record_number: patient.medical_record_number,
      doctor_name: doctor.name,
    });
  }

  // --- Payments / Billing ---
  if (path === '/payments/summary' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;

    const date = queryParams.date || todayIsoDate();
    const dayInvoices = db.invoices.filter((i) => {
      const reg = db.registrations.find((r) => r.id === i.registration_id);
      return reg && reg.visit_date === date;
    });

    const revenue = dayInvoices
      .filter((i) => i.status === 'Lunas' && i.payment_method !== 'BPJS')
      .reduce((s, i) => s + Number(i.total_amount), 0);
    const paid_count = dayInvoices.filter((i) => i.status === 'Lunas').length;
    const unpaid = dayInvoices.filter((i) => i.status === 'Belum Bayar');
    const unpaid_count = unpaid.length;
    const unpaid_amount = unpaid.reduce((s, i) => s + Number(i.total_amount), 0);

    const byMethodMap = {};
    for (const inv of dayInvoices.filter((i) => i.status === 'Lunas')) {
      const m = inv.payment_method || 'Lainnya';
      if (!byMethodMap[m]) byMethodMap[m] = { payment_method: m, count: 0, total: 0 };
      byMethodMap[m].count += 1;
      byMethodMap[m].total += Number(inv.total_amount);
    }
    const by_method = Object.values(byMethodMap).sort((a, b) => b.total - a.total);

    return ok('Payment summary retrieved', {
      date,
      revenue,
      paid_count,
      unpaid_count,
      unpaid_amount,
      by_method,
      payment_methods: PAYMENT_METHODS,
      consultation_fees: CONSULTATION_FEES,
    });
  }

  if (path === '/payments' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;

    const { date, status, search } = queryParams;
    const searchLower = (search || '').trim().toLowerCase();

    const rows = db.invoices
      .map((inv) => {
        const patient = db.patients.find((p) => p.id === inv.patient_id) || {};
        const reg = db.registrations.find((r) => r.id === inv.registration_id) || {};
        const doctor = db.doctors.find((d) => d.id === reg.doctor_id) || {};
        const cashier = db.users.find((u) => u.id === inv.cashier_id) || {};

        if (date && reg.visit_date !== date) return null;
        if (status && inv.status !== status) return null;
        if (searchLower) {
          const hit =
            (patient.name || '').toLowerCase().includes(searchLower) ||
            (patient.medical_record_number || '').toLowerCase().includes(searchLower) ||
            (inv.invoice_number || '').toLowerCase().includes(searchLower);
          if (!hit) return null;
        }

        return {
          ...inv,
          patient_name: patient.name,
          medical_record_number: patient.medical_record_number,
          poli: reg.poli,
          visit_date: reg.visit_date,
          doctor_name: doctor.name || '-',
          cashier_name: cashier.full_name || null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const diff = new Date(b.created_at) - new Date(a.created_at);
        return diff !== 0 ? diff : b.id - a.id;
      });

    return ok('Invoices retrieved successfully', rows);
  }

  const paymentIdMatch = path.match(/^\/payments\/(\d+)$/);
  if (paymentIdMatch && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;

    const id = parseInt(paymentIdMatch[1], 10);
    const inv = db.invoices.find((i) => i.id === id);
    if (!inv) return fail('Invoice tidak ditemukan', { invoice: 'Not found' }, 404);

    const patient = db.patients.find((p) => p.id === inv.patient_id) || {};
    const reg = db.registrations.find((r) => r.id === inv.registration_id) || {};
    const doctor = db.doctors.find((d) => d.id === reg.doctor_id) || {};
    const cashier = db.users.find((u) => u.id === inv.cashier_id) || {};
    const items = db.invoice_items
      .filter((it) => it.invoice_id === id)
      .sort((a, b) => a.id - b.id);

    return ok('Invoice retrieved successfully', {
      ...inv,
      patient_name: patient.name,
      medical_record_number: patient.medical_record_number,
      poli: reg.poli,
      visit_date: reg.visit_date,
      doctor_name: doctor.name || '-',
      cashier_name: cashier.full_name || null,
      items,
    });
  }

  const payMatch = path.match(/^\/payments\/(\d+)\/pay$/);
  if (payMatch && cleanMethod === 'PUT') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;

    const id = parseInt(payMatch[1], 10);
    const { payment_method, amount_paid, discount, notes } = body;

    if (!PAYMENT_METHODS.includes(payment_method)) {
      return fail(
        'Metode pembayaran tidak valid',
        { payment_method: `Pilih salah satu: ${PAYMENT_METHODS.join(', ')}` },
        400
      );
    }

    const inv = db.invoices.find((i) => i.id === id);
    if (!inv) return fail('Invoice tidak ditemukan', { invoice: 'Not found' }, 404);
    if (inv.status !== 'Belum Bayar') {
      return fail(`Invoice sudah berstatus ${inv.status}`, { status: inv.status }, 409);
    }

    const subtotal = Number(inv.subtotal);
    let discountValue = Number(inv.discount);
    if (discount !== undefined && discount !== null && discount !== '') {
      if (currentUser.role !== 'Administrator') {
        return fail('Hanya Administrator yang dapat memberi diskon', { discount: 'Forbidden' }, 403);
      }
      discountValue = Number(discount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > subtotal) {
        return fail('Diskon tidak valid', { discount: 'Harus 0 s/d subtotal' }, 400);
      }
    }

    const total = subtotal - discountValue;
    const paid = payment_method === 'Tunai' ? Number(amount_paid) : total;
    if (isNaN(paid) || paid < total) {
      return fail('Jumlah bayar kurang dari total tagihan', { amount_paid: `Minimal ${total}` }, 400);
    }

    inv.status = 'Lunas';
    inv.payment_method = payment_method;
    inv.discount = discountValue;
    inv.total_amount = total;
    inv.amount_paid = paid;
    inv.change_amount = paid - total;
    inv.paid_at = nowIso();
    inv.cashier_id = currentUser.id;
    if (notes) inv.notes = notes;

    saveDb(db);
    return ok('Pembayaran berhasil', inv);
  }

  const cancelPayMatch = path.match(/^\/payments\/(\d+)\/cancel$/);
  if (cancelPayMatch && cleanMethod === 'PUT') {
    const deny = requireRole(currentUser, ['Administrator']);
    if (deny) return deny;

    const id = parseInt(cancelPayMatch[1], 10);
    const inv = db.invoices.find((i) => i.id === id && i.status === 'Belum Bayar');
    if (!inv) {
      return fail('Invoice tidak ditemukan atau sudah diproses', { invoice: 'Not cancellable' }, 404);
    }
    inv.status = 'Batal';
    if (body?.notes) inv.notes = body.notes;
    saveDb(db);
    return ok('Invoice dibatalkan', inv);
  }

  // --- Master Harga ---
  if (path === '/master/medicines' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const onlyActive = currentUser.role === 'Dokter' || !queryParams.all;
    const rows = db.medicines
      .filter((m) => (onlyActive ? m.is_active : true))
      .sort((a, b) => a.name.localeCompare(b.name));
    return ok('Medicines retrieved', rows);
  }

  if (path === '/master/medicines' && cleanMethod === 'POST') {
    const deny = requireRole(currentUser, ['Administrator']);
    if (deny) return deny;
    const { name, unit, price, stock } = body;
    if (!name || !name.trim()) return fail('Nama obat wajib diisi', { name: 'Required' }, 400);
    const numPrice = Number(price);
    if (price === undefined || price === '' || isNaN(numPrice) || numPrice < 0) {
      return fail('Harga tidak valid', { price: 'Harus angka >= 0' }, 400);
    }
    const stockVal = parseInt(stock, 10);
    if (isNaN(stockVal) || stockVal < 0) return fail('Stok tidak valid', { stock: 'Harus angka >= 0' }, 400);

    const trimmed = name.trim();
    if (db.medicines.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      return fail('Nama obat sudah ada', { name: 'Duplicate' }, 409);
    }

    const med = {
      id: nextId(db, 'medicines'),
      name: trimmed,
      unit: unit || 'tablet',
      price: numPrice,
      stock: stockVal,
      is_active: true,
      created_at: nowIso(),
    };
    db.medicines.push(med);
    saveDb(db);
    return ok('Obat tersimpan', med, 201);
  }

  const medIdMatch = path.match(/^\/master\/medicines\/(\d+)$/);
  if (medIdMatch && cleanMethod === 'PUT') {
    const deny = requireRole(currentUser, ['Administrator']);
    if (deny) return deny;
    const id = parseInt(medIdMatch[1], 10);
    const { name, unit, price, stock, is_active } = body;

    if (!name || !name.trim()) return fail('Nama obat wajib diisi', { name: 'Required' }, 400);
    const numPrice = Number(price);
    if (price === undefined || price === '' || isNaN(numPrice) || numPrice < 0) {
      return fail('Harga tidak valid', { price: 'Harus angka >= 0' }, 400);
    }
    const stockVal = parseInt(stock, 10);
    if (isNaN(stockVal) || stockVal < 0) return fail('Stok tidak valid', { stock: 'Harus angka >= 0' }, 400);

    const idx = db.medicines.findIndex((m) => m.id === id);
    if (idx === -1) return fail('Obat tidak ditemukan', { id: 'Not found' }, 404);

    const trimmed = name.trim();
    if (db.medicines.some((m) => m.id !== id && m.name.toLowerCase() === trimmed.toLowerCase())) {
      return fail('Nama obat sudah ada', { name: 'Duplicate' }, 409);
    }

    db.medicines[idx] = {
      ...db.medicines[idx],
      name: trimmed,
      unit: unit || 'tablet',
      price: numPrice,
      stock: stockVal,
      is_active: is_active !== undefined && is_active !== null ? Boolean(is_active) : db.medicines[idx].is_active,
    };
    saveDb(db);
    return ok('Obat tersimpan', db.medicines[idx]);
  }

  if (path === '/master/procedures' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Dokter', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const onlyActive = currentUser.role === 'Dokter' || !queryParams.all;
    const rows = db.procedure_master
      .filter((p) => (onlyActive ? p.is_active : true))
      .sort((a, b) => a.name.localeCompare(b.name));
    return ok('Procedures retrieved', rows);
  }

  if (path === '/master/procedures' && cleanMethod === 'POST') {
    const deny = requireRole(currentUser, ['Administrator']);
    if (deny) return deny;
    const { name, price } = body;
    if (!name || !name.trim()) return fail('Nama tindakan wajib diisi', { name: 'Required' }, 400);
    const numPrice = Number(price);
    if (price === undefined || price === '' || isNaN(numPrice) || numPrice < 0) {
      return fail('Tarif tidak valid', { price: 'Harus angka >= 0' }, 400);
    }

    const trimmed = name.trim();
    if (db.procedure_master.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return fail('Nama tindakan sudah ada', { name: 'Duplicate' }, 409);
    }

    const proc = {
      id: nextId(db, 'procedure_master'),
      name: trimmed,
      price: numPrice,
      is_active: true,
      created_at: nowIso(),
    };
    db.procedure_master.push(proc);
    saveDb(db);
    return ok('Tindakan tersimpan', proc, 201);
  }

  const procIdMatch = path.match(/^\/master\/procedures\/(\d+)$/);
  if (procIdMatch && cleanMethod === 'PUT') {
    const deny = requireRole(currentUser, ['Administrator']);
    if (deny) return deny;
    const id = parseInt(procIdMatch[1], 10);
    const { name, price, is_active } = body;

    if (!name || !name.trim()) return fail('Nama tindakan wajib diisi', { name: 'Required' }, 400);
    const numPrice = Number(price);
    if (price === undefined || price === '' || isNaN(numPrice) || numPrice < 0) {
      return fail('Tarif tidak valid', { price: 'Harus angka >= 0' }, 400);
    }

    const idx = db.procedure_master.findIndex((p) => p.id === id);
    if (idx === -1) return fail('Tindakan tidak ditemukan', { id: 'Not found' }, 404);

    const trimmed = name.trim();
    if (db.procedure_master.some((p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase())) {
      return fail('Nama tindakan sudah ada', { name: 'Duplicate' }, 409);
    }

    db.procedure_master[idx] = {
      ...db.procedure_master[idx],
      name: trimmed,
      price: numPrice,
      is_active: is_active !== undefined && is_active !== null ? Boolean(is_active) : db.procedure_master[idx].is_active,
    };
    saveDb(db);
    return ok('Tindakan tersimpan', db.procedure_master[idx]);
  }

  if (path === '/master/consultation-fees' && cleanMethod === 'GET') {
    const deny = requireRole(currentUser, ['Administrator', 'Petugas Pendaftaran']);
    if (deny) return deny;
    const rows = [...db.consultation_fees].sort((a, b) => a.poli.localeCompare(b.poli));
    return ok('Consultation fees retrieved', rows);
  }

  const feeMatch = path.match(/^\/master\/consultation-fees\/(.+)$/);
  if (feeMatch && cleanMethod === 'PUT') {
    const deny = requireRole(currentUser, ['Administrator']);
    if (deny) return deny;
    const poliName = decodeURIComponent(feeMatch[1]);
    const { fee } = body;
    const numFee = Number(fee);
    if (fee === undefined || fee === '' || isNaN(numFee) || numFee < 0) {
      return fail('Tarif tidak valid', { fee: 'Harus angka >= 0' }, 400);
    }
    const existing = db.consultation_fees.find((f) => f.poli === poliName);
    if (existing) {
      existing.fee = numFee;
      saveDb(db);
      return ok('Tarif konsultasi tersimpan', existing);
    }
    const row = { poli: poliName, fee: numFee };
    db.consultation_fees.push(row);
    saveDb(db);
    return ok('Tarif konsultasi tersimpan', row);
  }

  return fail('Endpoint not found', { url: `${cleanMethod} ${path}` }, 404);
}
