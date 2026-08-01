import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  UserPlus,
  Search,
  Calendar,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Building2,
  FileText,
} from "lucide-react";
import Select from "react-select";

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  // Form State
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    poli: "Poli Umum",
    visit_date: new Date().toISOString().slice(0, 10),
    payment_type: "BPJS",
    initial_complaint: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { hasRole } = useAuth();

  const polis = [
    "Poli Umum",
    "Poli Gigi",
    "Poli Anak",
    "Poli Penyakit Dalam",
    "Poli THT",
  ];
  const paymentTypes = ["BPJS", "Umum/Mandiri", "Asuransi Private"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRegistrations(filterDate);
  }, [filterDate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [patientsRes, dashRes] = await Promise.all([
        api.get("/patients", { params: { limit: 100 } }),
        api.get("/dashboard"),
      ]);

      if (patientsRes.data.success) {
        setPatients(patientsRes.data.data.patients);
      }

      if (dashRes.data.success) {
        setDoctors(dashRes.data.data.doctors || []);
        if (dashRes.data.data.doctors && dashRes.data.data.doctors.length > 0) {
          setFormData((prev) => ({
            ...prev,
            doctor_id: dashRes.data.data.doctors[0].id,
          }));
        }
      }
    } catch (err) {
      console.error("Error loading registration options:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (date) => {
    try {
      const res = await api.get("/registrations", { params: { date } });
      if (res.data.success) {
        setRegistrations(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching registrations:", err);
    }
  };

  const handlePoliChange = (e) => {
    const selectedPoli = e.target.value;
    setFormData({ ...formData, poli: selectedPoli });

    // Filter doctor based on poli if available
    const matchedDoctor = doctors.find((d) => d.poli === selectedPoli);
    if (matchedDoctor) {
      setFormData((prev) => ({
        ...prev,
        poli: selectedPoli,
        doctor_id: matchedDoctor.id,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setFormErrors({});

    const errors = {};
    if (!formData.patient_id) errors.patient_id = "Pilih pasien wajib diisi";
    if (!formData.doctor_id) errors.doctor_id = "Pilih dokter wajib diisi";
    if (!formData.initial_complaint.trim())
      errors.initial_complaint = "Keluhan awal wajib diisi";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/registrations", formData);
      if (res.data.success) {
        const queueNo = res.data.data.queue.queue_number;
        setSuccessMessage(
          `Pendaftaran Berhasil! Nomor Antrean Pasien: ${queueNo}`,
        );
        setTimeout(() => setSuccessMessage(""), 5000);

        setFormData({
          patient_id: "",
          doctor_id: doctors[0]?.id || "",
          poli: "Poli Umum",
          visit_date: new Date().toISOString().slice(0, 10),
          payment_type: "BPJS",
          initial_complaint: "",
        });

        fetchRegistrations(filterDate);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Gagal membuat pendaftaran kunjungan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <UserPlus className="w-7 h-7 text-teal-400" />
          <span>Modul Pendaftaran Pasien</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Daftarkan kedatangan pasien untuk konsultasi & pemeriksaan dokter.
          Nomor antrean akan dibuat otomatis.
        </p>
      </div>

      {/* Alert Success */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-semibold flex items-center gap-3 shadow-lg shadow-teal-500/10 animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-teal-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Registration Form (Left) & Today Registrations Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Form Card */}
        {hasRole("Administrator", "Petugas Pendaftaran") && (
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-teal-400" />
              <span>Form Pendaftaran Baru</span>
            </h2>

            {serverError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Pasien (Cari Berdasarkan NIK/Nama/RM)
                </label>
                <Select
                  unstyled
                  options={patients.map((patient) => ({
                    value: patient.id,
                    label: `${patient.medical_record_number} - ${patient.name} (${patient.nik})`,
                  }))}
                  value={patients
                    .map((patient) => ({
                      value: patient.id,
                      label: `${patient.medical_record_number} - ${patient.name} (${patient.nik})`,
                    }))
                    .find((patient) => patient.value === formData.patient_id)}
                  onChange={(e) => {
                    setFormData({ ...formData, patient_id: e.value });
                  }}
                  noOptionsMessage={() => "Pasien Tidak ditemukan..."}
                  placeholder="Cari Pasien..."
                  isClearable={false}
                  classNames={{
                    control: ({ isFocused }) =>
                      `flex items-center w-full px-3 py-1.5 bg-gray-900 border rounded-lg transition-all duration-200 ${
                        isFocused
                          ? "border-cyan-500 ring-2 ring-cyan-100"
                          : "border-gray-700"
                      }`,
                    placeholder: () => "text-gray-200 text-sm",
                    input: () => "text-gray-50 text-sm",
                    menu: () =>
                      "mt-2 bg-gray-800 border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50",
                    option: ({ isFocused, isSelected }) =>
                      `px-4 py-2 text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-cyan-600 text-white"
                          : isFocused
                            ? "bg-gray-700"
                            : "text-gray-100"
                      }`,
                    multiValue: () =>
                      "bg-cyan-50 text-cyan-700 rounded-md px-2 py-0.5 m-0.5 flex items-center gap-1 text-sm border border-cyan-200",
                    multiValueLabel: () => "font-medium",
                    multiValueRemove: () =>
                      "hover:bg-cyan-200 hover:text-cyan-900 rounded p-0.5 transition-colors",
                    noOptionsMessage: () =>
                      "text-gray-400 p-4 text-center text-sm",
                  }}
                />
                {formErrors.patient_id && (
                  <p className="text-xs text-rose-400 mt-1">
                    {formErrors.patient_id}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Poli Tujuan
                  </label>
                  <select
                    value={formData.poli}
                    onChange={handlePoliChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    {polis.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dokter Pemeriksa
                  </label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) =>
                      setFormData({ ...formData, doctor_id: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.poli})
                      </option>
                    ))}
                  </select>
                  {formErrors.doctor_id && (
                    <p className="text-xs text-rose-400 mt-1">
                      {formErrors.doctor_id}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Kunjungan
                  </label>
                  <input
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) =>
                      setFormData({ ...formData, visit_date: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jenis Pembayaran
                  </label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_type: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    {paymentTypes.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keluhan Awal Pasien
                </label>
                <textarea
                  rows={3}
                  value={formData.initial_complaint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initial_complaint: e.target.value,
                    })
                  }
                  placeholder="Contoh: Pusing, demam 2 hari, mual"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                ></textarea>
                {formErrors.initial_complaint && (
                  <p className="text-xs text-rose-400 mt-1">
                    {formErrors.initial_complaint}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 text-sm transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {submitting
                  ? "Memproses Pendaftaran..."
                  : "Daftarkan & Generate Antrean"}
              </button>
            </form>
          </div>
        )}

        {/* Registered Patients List (Right Side) */}
        <div
          className={`${
            hasRole("Administrator", "Petugas Pendaftaran")
              ? "lg:col-span-7"
              : "lg:col-span-12"
          } space-y-4`}
        >
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              <span>Daftar Kunjungan Pasien ({filterDate})</span>
            </h2>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-teal-500"
            />
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {registrations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Belum ada pendaftaran pasien pada tanggal ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-5">No. Antrean</th>
                      <th className="py-3.5 px-5">Pasien</th>
                      <th className="py-3.5 px-5">Poli & Dokter</th>
                      <th className="py-3.5 px-5">Bayar</th>
                      <th className="py-3.5 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {registrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-mono font-extrabold text-teal-300 text-base">
                          {reg.queue_number || "-"}
                        </td>
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-white">
                            {reg.patient_name}
                          </p>
                          <p className="text-xs font-mono text-slate-400">
                            {reg.medical_record_number}
                          </p>
                        </td>
                        <td className="py-3.5 px-5">
                          <p className="text-xs font-semibold text-slate-200">
                            {reg.poli}
                          </p>
                          <p className="text-xs text-slate-400">
                            {reg.doctor_name || "-"}
                          </p>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-300 font-medium">
                          {reg.payment_type}
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                              reg.registration_status === "Selesai"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : reg.registration_status === "Pemeriksaan" ||
                                    reg.registration_status === "Check In"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {reg.registration_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
