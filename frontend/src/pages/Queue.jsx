import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ListOrdered,
  Volume2,
  CheckCircle,
  Clock,
  UserCheck,
  Stethoscope,
  Filter,
  RefreshCw,
  Bell,
} from 'lucide-react';

export default function Queue() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoli, setSelectedPoli] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [callingId, setCallingId] = useState(null);

  const { hasRole } = useAuth();
  const polis = ['Poli Umum', 'Poli Gigi', 'Poli Anak', 'Poli Penyakit Dalam'];

  useEffect(() => {
    fetchQueues();
  }, [selectedPoli, selectedStatus, date]);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/queues', {
        params: {
          date,
          poli: selectedPoli || undefined,
          status: selectedStatus || undefined,
        },
      });
      if (res.data.success) {
        setQueues(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching queues:', err);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API for voice announcement
  const speakQueueCall = (queueNumber, patientName, poli) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous voice
      const textToSpeak = `Nomor antrean ${queueNumber.split('').join(' ')}, atas nama ${patientName}, silakan menuju ke ${poli}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCallQueue = async (queue) => {
    try {
      setCallingId(queue.id);
      const res = await api.put(`/queues/${queue.id}/call`);
      if (res.data.success) {
        speakQueueCall(queue.queue_number, queue.patient_name, queue.poli);
        fetchQueues();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memanggil antrean.');
    } finally {
      setCallingId(null);
    }
  };

  const handleStatusChange = async (queueId, newStatus) => {
    try {
      const res = await api.put(`/queues/${queueId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchQueues();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status antrean.');
    }
  };

  // Find currently called queue
  const currentCalled = queues.find((q) => q.queue_status === 'Dipanggil');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ListOrdered className="w-7 h-7 text-cyan-400" />
            <span>Modul Antrean Pasien</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pantau dan panggil antrean pasien secara real-time dengan panggilan suara otomatis.
          </p>
        </div>

        <button
          onClick={fetchQueues}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Refresh Live</span>
        </button>
      </div>

      {/* Currently Called Display Banner */}
      {currentCalled && (
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-teal-950/60 shadow-2xl relative overflow-hidden animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500 text-slate-950 font-black text-3xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                {currentCalled.queue_number}
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                  SEDANG DIPANGGIL
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">{currentCalled.patient_name}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {currentCalled.poli} | Dokter: {currentCalled.doctor_name || '-'}
                </p>
              </div>
            </div>

            <button
              onClick={() => speakQueueCall(currentCalled.queue_number, currentCalled.patient_name, currentCalled.poli)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Volume2 className="w-5 h-5" />
              <span>Panggil Ulang Suara</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Filter:</span>
        </div>

        <select
          value={selectedPoli}
          onChange={(e) => setSelectedPoli(e.target.value)}
          className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-cyan-500"
        >
          <option value="">-- Semua Poli --</option>
          {polis.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-cyan-500"
        >
          <option value="">-- Semua Status --</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Dipanggil">Dipanggil</option>
          <option value="Dalam Pemeriksaan">Dalam Pemeriksaan</option>
          <option value="Selesai">Selesai</option>
          <option value="Batal">Batal</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-cyan-500"
        />
      </div>

      {/* Queue Items Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Memuat data antrean...</div>
      ) : queues.length === 0 ? (
        <div className="p-12 glass-panel rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
          Tidak ada daftar antrean untuk kriteria yang dipilih.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queues.map((q) => (
            <div
              key={q.id}
              className={`p-6 rounded-3xl glass-card border transition-all duration-300 ${
                q.queue_status === 'Dipanggil'
                  ? 'border-cyan-500 bg-cyan-950/20 shadow-xl shadow-cyan-500/10'
                  : q.queue_status === 'Dalam Pemeriksaan'
                  ? 'border-indigo-500/50 bg-indigo-950/20'
                  : q.queue_status === 'Selesai'
                  ? 'border-emerald-500/30 opacity-75'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-cyan-300 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
                  {q.queue_number}
                </span>

                {/* Status Dropdown */}
                <select
                  value={q.queue_status}
                  onChange={(e) => handleStatusChange(q.id, e.target.value)}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
                >
                  <option value="Menunggu">Menunggu</option>
                  <option value="Dipanggil">Dipanggil</option>
                  <option value="Dalam Pemeriksaan">Pemeriksaan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Batal">Batal</option>
                </select>
              </div>

              <div>
                <h3 className="font-bold text-lg text-white">{q.patient_name}</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{q.medical_record_number}</p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-400">Poli:</strong> {q.poli}
                  </p>
                  <p>
                    <strong className="text-slate-400">Dokter:</strong> {q.doctor_name || '-'}
                  </p>
                  <p>
                    <strong className="text-slate-400">Keluhan:</strong> {q.initial_complaint}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleCallQueue(q)}
                  disabled={callingId === q.id}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{callingId === q.id ? 'Memanggil...' : 'Panggil Antrean'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
