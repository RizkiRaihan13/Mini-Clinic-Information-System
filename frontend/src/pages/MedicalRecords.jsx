import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Stethoscope,
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  History,
  Pill,
  Search,
  UserCheck,
} from "lucide-react";
import Select from "react-select";
export default function MedicalRecords() {
  const [activeTab, setActiveTab] = useState("input"); // 'input' or 'history'
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);

  // SOAP Form State
  const [soapForm, setSoapForm] = useState({
    subjective: "",
    bp: "120/80",
    temp: "36.5",
    weight: "65",
    height: "170",
    assessment: "",
    plan: "",
  });

  // Dynamic Array State: Procedures & Prescriptions
  const [procedures, setProcedures] = useState([
    { procedure_name: "", description: "", cost: 0 },
  ]);

  const [prescriptions, setPrescriptions] = useState([
    {
      medicine_name: "",
      dosage: "500 mg",
      frequency: "3x1 sesudah makan",
      quantity: 10,
      instructions: "",
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Patient History Lookup state
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchActiveQueues();
    fetchPatientList();
  }, []);

  const fetchActiveQueues = async () => {
    try {
      const res = await api.get("/queues", {
        params: { date: new Date().toISOString().slice(0, 10) },
      });
      if (res.data.success) {
        // Filter queues for waiting / examination
        setQueues(
          res.data.data.filter(
            (q) => q.queue_status !== "Selesai" && q.queue_status !== "Batal",
          ),
        );
      }
    } catch (err) {
      console.error("Error fetching queues for examination:", err);
    }
  };

  const fetchPatientList = async () => {
    try {
      const res = await api.get("/patients", { params: { limit: 100 } });
      if (res.data.success) {
        setPatients(res.data.data.patients);
      }
    } catch (err) {
      console.error("Error fetching patient list:", err);
    }
  };

  const handleSelectQueue = (queue) => {
    setSelectedQueue(queue);
    setSoapForm({
      subjective: queue.initial_complaint || "",
      bp: "120/80",
      temp: "36.5",
      weight: "65",
      height: "170",
      assessment: "",
      plan: "",
    });
  };

  // Procedures dynamic handlers
  const handleAddProcedure = () => {
    setProcedures([
      ...procedures,
      { procedure_name: "", description: "", cost: 0 },
    ]);
  };

  const handleRemoveProcedure = (index) => {
    setProcedures(procedures.filter((_, i) => i !== index));
  };

  const handleProcedureChange = (index, field, value) => {
    const updated = [...procedures];
    updated[index][field] = value;
    setProcedures(updated);
  };

  // Prescriptions dynamic handlers
  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medicine_name: "",
        dosage: "500 mg",
        frequency: "3x1 sesudah makan",
        quantity: 10,
        instructions: "",
      },
    ]);
  };

  const handleRemovePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  const handleSubmitSOAP = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedQueue) {
      setErrorMsg("Pilih pasien antrean yang akan diperiksa terlebih dahulu.");
      return;
    }

    if (!soapForm.subjective || !soapForm.assessment || !soapForm.plan) {
      setErrorMsg(
        "Harap lengkapi field Subjective (Keluhan), Assessment (Diagnosa), dan Plan (Rencana Terapi).",
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        registration_id: selectedQueue.registration_id,
        patient_id: selectedQueue.patient_id,
        // Backend menentukan dokter dari akun login/pendaftaran; field ini hanya
        // dipertahankan untuk kompatibilitas payload lama.
        doctor_id: selectedQueue.doctor_id,
        ...soapForm,
        procedures: procedures.filter((p) => p.procedure_name.trim() !== ""),
        prescriptions: prescriptions.filter(
          (p) => p.medicine_name.trim() !== "",
        ),
      };

      const res = await api.post("/medical-records", payload);
      if (res.data.success) {
        setSuccessMsg(
          "Pemeriksaan SOAP & Resep obat berhasil disimpan! Status antrean telah diselesaikan.",
        );
        setTimeout(() => setSuccessMsg(""), 5000);

        setSelectedQueue(null);
        setSoapForm({
          subjective: "",
          bp: "120/80",
          temp: "36.5",
          weight: "65",
          height: "170",
          assessment: "",
          plan: "",
        });
        setProcedures([{ procedure_name: "", description: "", cost: 0 }]);
        setPrescriptions([
          {
            medicine_name: "",
            dosage: "500 mg",
            frequency: "3x1 sesudah makan",
            quantity: 10,
            instructions: "",
          },
        ]);

        fetchActiveQueues();
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Gagal menyimpan rekam medis.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // History search handler
  const handleSelectHistoryPatient = async (patient) => {
    setSelectedHistoryPatient(patient);
    try {
      setHistoryLoading(true);
      const res = await api.get(`/medical-records/${patient.id}`);
      if (res.data.success) {
        setPatientRecords(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Stethoscope className="w-7 h-7 text-indigo-400" />
            <span>Modul Pemeriksaan Dokter (SOAP)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pencatatan pemeriksaan medis metode Subjective, Objective,
            Assessment, Plan (SOAP) & Resep Obat.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab("input")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "input"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Input Pemeriksaan Dokter</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Pemeriksaan Pasien</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* --- TAB 1: INPUT PEMERIKSAAN SOAP --- */}
      {activeTab === "input" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Queue Selector Sidebar (Left 4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                    <UserCheck className="w-4.5 h-4.5 text-indigo-300" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-white leading-tight">
                      Antrean Pasien Hari Ini
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Pilih pasien untuk mulai pemeriksaan
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                  {queues.length} pasien
                </span>
              </div>

              {queues.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Tidak ada pasien antrean yang menunggu.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  {queues.map((q) => (
                    <button
                      type="button"
                      key={q.id}
                      onClick={() => handleSelectQueue(q)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        selectedQueue?.id === q.id
                          ? "border-indigo-500/70 bg-indigo-950/45 text-white shadow-lg shadow-indigo-500/10"
                          : "border-slate-800 bg-slate-900/50 hover:border-indigo-500/35 hover:bg-slate-900 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-extrabold text-indigo-300 text-xs tracking-wide">
                          {q.queue_number}
                        </span>
                        <span className="max-w-[58%] truncate text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                          {q.poli}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-white mt-2 truncate">
                        {q.patient_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-1">
                        Keluhan: {q.initial_complaint}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SOAP Examination Form (Right 8 columns) */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            {selectedQueue ? (
              <form onSubmit={handleSubmitSOAP} className="space-y-6">
                {/* Active Patient Card Banner */}
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigo-300 font-semibold uppercase">
                      Pasien Yang Diperiksa:
                    </span>
                    <h3 className="text-lg font-extrabold text-white">
                      {selectedQueue.patient_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      No. RM: {selectedQueue.medical_record_number} | Poli:{" "}
                      {selectedQueue.poli}
                    </p>
                  </div>
                  <span className="font-mono font-black text-2xl text-indigo-400 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
                    {selectedQueue.queue_number}
                  </span>
                </div>

                {/* 1. SUBJECTIVE & OBJECTIVE (Vitals) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                    <span>1. Subjective & Objective (Tanda Vital)</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subjective - Keluhan Utama Pasien
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={soapForm.subjective}
                      onChange={(e) =>
                        setSoapForm({ ...soapForm, subjective: e.target.value })
                      }
                      placeholder="Catat keluhan pasien..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-indigo-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        TD (mmHg)
                      </label>
                      <input
                        type="text"
                        value={soapForm.bp}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, bp: e.target.value })
                        }
                        placeholder="120/80"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Suhu (°C)
                      </label>
                      <input
                        type="text"
                        value={soapForm.temp}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, temp: e.target.value })
                        }
                        placeholder="36.5"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        BB (kg)
                      </label>
                      <input
                        type="text"
                        value={soapForm.weight}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, weight: e.target.value })
                        }
                        placeholder="65"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        TB (cm)
                      </label>
                      <input
                        type="text"
                        value={soapForm.height}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, height: e.target.value })
                        }
                        placeholder="170"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ASSESSMENT & PLAN */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span>
                      2. Assessment (Diagnosa) & Plan (Rencana Terapi)
                    </span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assessment - Diagnosa Dokter
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={soapForm.assessment}
                      onChange={(e) =>
                        setSoapForm({ ...soapForm, assessment: e.target.value })
                      }
                      placeholder="Contoh: Febris ec susp Infeksi Saluran Pernapasan Akut (ISPA)"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-indigo-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Plan - Rencana Terapi & Edukasi
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={soapForm.plan}
                      onChange={(e) =>
                        setSoapForm({ ...soapForm, plan: e.target.value })
                      }
                      placeholder="Contoh: Istirahat cukup, kompres air hangat, minum obat teratur"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-indigo-500 focus:outline-none"
                    ></textarea>
                  </div>
                </div>

                {/* 3. INPUT TINDAKAN MEDIS */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                      Input Tindakan Medis
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddProcedure}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Tindakan</span>
                    </button>
                  </div>

                  {procedures.map((proc, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama Tindakan Medis"
                        value={proc.procedure_name}
                        onChange={(e) =>
                          handleProcedureChange(
                            idx,
                            "procedure_name",
                            e.target.value,
                          )
                        }
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Biaya (Rp)"
                        value={proc.cost}
                        onChange={(e) =>
                          handleProcedureChange(
                            idx,
                            "cost",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500"
                      />
                      {procedures.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProcedure(idx)}
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 4. INPUT RESEP OBAT */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-4 h-4" />
                      <span>Input Resep Obat</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddPrescription}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Obat</span>
                    </button>
                  </div>

                  {prescriptions.map((rx, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800"
                    >
                      <input
                        type="text"
                        placeholder="Nama Obat (Contoh: Paracetamol)"
                        value={rx.medicine_name}
                        onChange={(e) =>
                          handlePrescriptionChange(
                            idx,
                            "medicine_name",
                            e.target.value,
                          )
                        }
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Dosis (Contoh: 500mg)"
                        value={rx.dosage}
                        onChange={(e) =>
                          handlePrescriptionChange(
                            idx,
                            "dosage",
                            e.target.value,
                          )
                        }
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Aturan Pakai (Contoh: 3x1)"
                        value={rx.frequency}
                        onChange={(e) =>
                          handlePrescriptionChange(
                            idx,
                            "frequency",
                            e.target.value,
                          )
                        }
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Jumlah"
                          value={rx.quantity}
                          onChange={(e) =>
                            handlePrescriptionChange(
                              idx,
                              "quantity",
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-indigo-500"
                        />
                        {prescriptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePrescription(idx)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 text-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {submitting
                    ? "Simpan Data SOAP..."
                    : "Simpan Pemeriksaan SOAP & Selesaikan Antrean"}
                </button>
              </form>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <Stethoscope className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm">
                  Silakan pilih pasien dari daftar antrean sebelah kiri untuk
                  memulai pemeriksaan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: RIWAYAT PEMERIKSAAN PASIEN --- */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              <span>Cari Pasien Untuk Melihat Riwayat Rekam Medis</span>
            </h2>
            <Select
              unstyled
              options={patients.map((patient) => ({
                value: patient.id,
                label: `${patient.medical_record_number} - ${patient.name} (${patient.nik})`,
                patient,
              }))}
              value={
                selectedHistoryPatient
                  ? {
                      value: selectedHistoryPatient.id,
                      label: `${selectedHistoryPatient.medical_record_number} - ${selectedHistoryPatient.name} (${selectedHistoryPatient.nik})`,
                      patient: selectedHistoryPatient,
                    }
                  : null
              }
              onChange={(selected) => {
                if (selected) {
                  handleSelectHistoryPatient(selected.patient);
                } else {
                  setSelectedHistoryPatient(null);
                  setPatientRecords([]);
                }
              }}
              placeholder="Cari Pasien Berdasarkan Nama / NIK / RM..."
              noOptionsMessage={() => "Pasien tidak ditemukan"}
              isClearable
              classNames={{
                control: ({ isFocused }) =>
                  `flex items-center w-full px-3 py-1.5 bg-slate-900 border rounded-xl transition-all ${
                    isFocused
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-slate-700"
                  }`,

                placeholder: () => "text-slate-400 text-sm",

                input: () => "text-slate-100 text-sm",

                menu: () =>
                  "mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50",

                option: ({ isFocused, isSelected }) =>
                  `px-4 py-2 text-sm cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : isFocused
                        ? "bg-slate-800 text-white"
                        : "text-slate-200"
                  }`,

                noOptionsMessage: () =>
                  "text-slate-400 text-center p-3 text-sm",
              }}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
            />
          </div>
          {selectedHistoryPatient && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white">
                  {selectedHistoryPatient.name}
                </h3>
                <p className="text-xs text-indigo-300 font-mono">
                  No. RM: {selectedHistoryPatient.medical_record_number} | NIK:{" "}
                  {selectedHistoryPatient.nik}
                </p>
              </div>

              {historyLoading ? (
                <p className="text-xs text-slate-400">
                  Memuat riwayat pemeriksaan...
                </p>
              ) : patientRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada riwayat rekam medis SOAP untuk pasien ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {patientRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-5 rounded-2xl glass-card border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                        <span className="font-semibold text-indigo-300">
                          Poli: {rec.poli} | Dokter: {rec.doctor_name}
                        </span>
                        <span className="text-slate-400">
                          {new Date(rec.created_at).toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <strong className="text-teal-300">
                            Subjective (S):
                          </strong>
                          <p className="text-slate-300 mt-1">
                            {rec.subjective}
                          </p>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <strong className="text-cyan-300">
                            Objective (O):
                          </strong>
                          <p className="text-slate-300 mt-1">
                            TD: {rec.bp} | Suhu: {rec.temp}°C | BB: {rec.weight}
                            kg | TB: {rec.height}cm
                          </p>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <strong className="text-amber-300">
                            Assessment (A):
                          </strong>
                          <p className="text-slate-300 mt-1">
                            {rec.assessment}
                          </p>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <strong className="text-emerald-300">
                            Plan (P):
                          </strong>
                          <p className="text-slate-300 mt-1">{rec.plan}</p>
                        </div>
                      </div>

                      {rec.prescriptions && rec.prescriptions.length > 0 && (
                        <div className="pt-2 border-t border-slate-800 text-xs">
                          <strong className="text-indigo-400">
                            Resep Obat:
                          </strong>
                          <ul className="list-disc pl-4 text-slate-300 mt-1 space-y-1">
                            {rec.prescriptions.map((rx) => (
                              <li key={rx.id}>
                                {rx.medicine_name} ({rx.dosage}) -{" "}
                                {rx.frequency} [{rx.quantity} pcs]
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
          )}
        </div>
      )}
    </div>
  );
}
