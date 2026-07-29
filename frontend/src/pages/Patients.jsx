import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
  Phone,
  MapPin,
  Calendar,
  Shield,
} from 'lucide-react';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    gender: 'Laki-laki',
    birth_date: '',
    phone: '',
    address: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { hasRole } = useAuth();

  useEffect(() => {
    fetchPatients(1, search);
  }, []);

  const fetchPatients = async (page = 1, searchQuery = '') => {
    try {
      setLoading(true);
      const res = await api.get('/patients', {
        params: { page, limit: 10, search: searchQuery },
      });
      if (res.data.success) {
        setPatients(res.data.data.patients);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearch(query);
    fetchPatients(1, query);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPatients(newPage, search);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nik: '',
      name: '',
      gender: 'Laki-laki',
      birth_date: '',
      phone: '',
      address: '',
    });
    setFormErrors({});
    setServerError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      nik: patient.nik,
      name: patient.name,
      gender: patient.gender,
      birth_date: patient.birth_date ? patient.birth_date.substring(0, 10) : '',
      phone: patient.phone,
      address: patient.address,
    });
    setFormErrors({});
    setServerError('');
    setIsEditModalOpen(true);
  };

  const openDetailModal = async (patient) => {
    setSelectedPatient(patient);
    setIsDetailModalOpen(true);
    // Fetch patient history
    try {
      setHistoryLoading(true);
      const res = await api.get(`/medical-records/${patient.id}`);
      if (res.data.success) {
        setPatientHistory(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching patient history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openDeleteModal = (patient) => {
    setSelectedPatient(patient);
    setIsDeleteModalOpen(true);
  };

  // Validations
  const validateForm = () => {
    const errors = {};
    if (!formData.nik || formData.nik.trim().length !== 16 || isNaN(formData.nik)) {
      errors.nik = 'NIK harus tepat 16 digit angka';
    }
    if (!formData.name.trim()) errors.name = 'Nama pasien wajib diisi';
    if (!formData.birth_date) errors.birth_date = 'Tanggal lahir wajib diisi';
    if (!formData.phone.trim()) errors.phone = 'Nomor telepon wajib diisi';
    if (!formData.address.trim()) errors.address = 'Alamat wajib diisi';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;

    try {
      const res = await api.post('/patients', formData);
      if (res.data.success) {
        setSuccessMessage('Pasien baru berhasil ditambahkan! Nomor RM dibuat otomatis.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setIsAddModalOpen(false);
        fetchPatients(pagination.currentPage, search);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
      setServerError(error.response?.data?.message || 'Gagal menambahkan pasien.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;

    try {
      const res = await api.put(`/patients/${selectedPatient.id}`, formData);
      if (res.data.success) {
        setSuccessMessage('Data pasien berhasil diperbarui!');
        setTimeout(() => setSuccessMessage(''), 4000);
        setIsEditModalOpen(false);
        fetchPatients(pagination.currentPage, search);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
      setServerError(error.response?.data?.message || 'Gagal memperbarui data pasien.');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await api.delete(`/patients/${selectedPatient.id}`);
      if (res.data.success) {
        setSuccessMessage('Data pasien berhasil dihapus!');
        setTimeout(() => setSuccessMessage(''), 4000);
        setIsDeleteModalOpen(false);
        fetchPatients(pagination.currentPage, search);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus data pasien.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-teal-400" />
            <span>Master Data Pasien</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Kelola seluruh pendaftaran dan data rekam medis master pasien klinik.
          </p>
        </div>

        {hasRole('Administrator', 'Petugas Pendaftaran') && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 text-sm transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            <span>Tambah Pasien Baru</span>
          </button>
        )}
      </div>

      {/* Alert Success */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Cari berdasarkan Nama Pasien, NIK, atau Nomor Rekam Medis (RM)..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat data pasien...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Tidak ada data pasien yang ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-4 px-6">No. Rekam Medis</th>
                  <th className="py-4 px-6">NIK</th>
                  <th className="py-4 px-6">Nama Pasien</th>
                  <th className="py-4 px-6">L/P</th>
                  <th className="py-4 px-6">Tgl Lahir</th>
                  <th className="py-4 px-6">Telepon</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-teal-300">
                      {patient.medical_record_number}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">{patient.nik}</td>
                    <td className="py-4 px-6 font-bold text-white">{patient.name}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          patient.gender === 'Laki-laki'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                        }`}
                      >
                        {patient.gender}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-300">{patient.phone}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetailModal(patient)}
                          title="Lihat Detail & Riwayat"
                          className="p-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasRole('Administrator', 'Petugas Pendaftaran') && (
                          <button
                            onClick={() => openEditModal(patient)}
                            title="Ubah Data"
                            className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {hasRole('Administrator') && (
                          <button
                            onClick={() => openDeleteModal(patient)}
                            title="Hapus Data"
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Menampilkan {patients.length} dari <strong>{pagination.totalItems}</strong> pasien (Halaman{' '}
            {pagination.currentPage} dari {pagination.totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-teal-400">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- ADD PATIENT MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                <span>Tambah Pasien Baru</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {serverError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Rekam Medis (RM)
                </label>
                <input
                  type="text"
                  disabled
                  value="[Otomatis Digenerate oleh Sistem]"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-teal-400 text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">NIK Pasien (16 Digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="Contoh: 3201011508950001"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
                {formErrors.nik && <p className="text-xs text-rose-400 mt-1">{formErrors.nik}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Pasien</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
                {formErrors.name && <p className="text-xs text-rose-400 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                  {formErrors.birth_date && (
                    <p className="text-xs text-rose-400 mt-1">{formErrors.birth_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
                {formErrors.phone && <p className="text-xs text-rose-400 mt-1">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jalan, No. Rumah, RT/RW, Kota"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                ></textarea>
                {formErrors.address && <p className="text-xs text-rose-400 mt-1">{formErrors.address}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-cyan-400 transition-all"
                >
                  Simpan Pasien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PATIENT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <span>Ubah Data Pasien</span>
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {serverError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Rekam Medis (Tidak Dapat Diubah)
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedPatient?.medical_record_number}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-teal-400 text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">NIK Pasien (16 Digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
                {formErrors.nik && <p className="text-xs text-rose-400 mt-1">{formErrors.nik}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Pasien</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
                {formErrors.name && <p className="text-xs text-rose-400 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                  {formErrors.birth_date && (
                    <p className="text-xs text-rose-400 mt-1">{formErrors.birth_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
                {formErrors.phone && <p className="text-xs text-rose-400 mt-1">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                ></textarea>
                {formErrors.address && <p className="text-xs text-rose-400 mt-1">{formErrors.address}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition-all"
                >
                  Perbarui Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAIL & HISTORY PATIENT MODAL --- */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-teal-400" />
                  <span>Detail & Riwayat Pemeriksaan Pasien</span>
                </h2>
                <p className="text-xs text-teal-300 font-mono mt-0.5">
                  {selectedPatient?.medical_record_number}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
              {/* Patient Info Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl glass-card border border-slate-700/60">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Nama Lengkap</span>
                  <p className="font-bold text-white text-sm">{selectedPatient?.name}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">NIK</span>
                  <p className="font-mono text-sm text-slate-300">{selectedPatient?.nik}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Jenis Kelamin</span>
                  <p className="text-sm font-medium text-slate-200">{selectedPatient?.gender}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Telepon</span>
                  <p className="text-sm text-slate-300">{selectedPatient?.phone}</p>
                </div>
                <div className="col-span-2 sm:col-span-4 border-t border-slate-800 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Alamat</span>
                  <p className="text-xs text-slate-300">{selectedPatient?.address}</p>
                </div>
              </div>

              {/* Medical History Section */}
              <div>
                <h3 className="font-bold text-md text-slate-200 mb-3 flex items-center gap-2">
                  <span>Riwayat Pemeriksaan Dokter (SOAP)</span>
                </h3>

                {historyLoading ? (
                  <p className="text-xs text-slate-400">Memuat riwayat medis...</p>
                ) : patientHistory.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                    Belum ada riwayat pemeriksaan dokter untuk pasien ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientHistory.map((rec) => (
                      <div key={rec.id} className="p-4 rounded-2xl glass-card border border-slate-700/60 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                          <span className="font-semibold text-teal-400">
                            Poli: {rec.poli} | Dokter: {rec.doctor_name}
                          </span>
                          <span className="text-slate-400">
                            {new Date(rec.created_at).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                            <strong className="text-teal-300">Subjective (S):</strong>
                            <p className="text-slate-300 mt-1">{rec.subjective}</p>
                          </div>

                          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                            <strong className="text-cyan-300">Objective (O) Vitals:</strong>
                            <p className="text-slate-300 mt-1">
                              TD: {rec.bp} | Suhu: {rec.temp}°C | BB: {rec.weight}kg | TB: {rec.height}cm
                            </p>
                          </div>

                          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                            <strong className="text-amber-300">Assessment (A) Diagnosa:</strong>
                            <p className="text-slate-300 mt-1">{rec.assessment}</p>
                          </div>

                          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                            <strong className="text-emerald-300">Plan (P) Terapi:</strong>
                            <p className="text-slate-300 mt-1">{rec.plan}</p>
                          </div>
                        </div>

                        {/* Prescriptions & Procedures */}
                        {rec.prescriptions && rec.prescriptions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800 text-xs">
                            <strong className="text-teal-400">Resep Obat:</strong>
                            <ul className="list-disc pl-4 text-slate-300 mt-1 space-y-1">
                              {rec.prescriptions.map((rx) => (
                                <li key={rx.id}>
                                  {rx.medicine_name} ({rx.dosage}) - {rx.frequency} [{rx.quantity} pcs]
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Hapus Data Pasien?</h2>
            <p className="text-xs text-slate-400 mb-6">
              Apakah Anda yakin ingin menghapus data pasien <strong>{selectedPatient?.name}</strong> (
              {selectedPatient?.medical_record_number})? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition-all"
              >
                Ya, Hapus Pasien
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
