import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  UserPlus,
  ListOrdered,
  Stethoscope,
  Wallet,
} from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    total_patients: 0,
    total_patients_today: 0,
    total_queues_today: 0,
    total_patients_waiting: 0,
    total_patients_completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Pasien',
      value: metrics.total_patients,
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
    },
    {
      title: 'Pasien Hari Ini',
      value: metrics.total_patients_today,
      icon: Calendar,
      color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400',
    },
    {
      title: 'Antrean Hari Ini',
      value: metrics.total_queues_today,
      icon: ListOrdered,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    },
    {
      title: 'Pasien Menunggu',
      value: metrics.total_patients_waiting,
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Selesai Dilayani',
      value: metrics.total_patients_completed,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
  ];

  if (metrics.payment) {
    statCards.push(
      {
        title: 'Pendapatan Hari Ini',
        value: 'Rp ' + Number(metrics.payment.revenue_today).toLocaleString('id-ID'),
        icon: Wallet,
        color: 'from-emerald-500/20 to-lime-500/10 border-emerald-500/30 text-emerald-400',
      },
      {
        title: 'Tagihan Belum Bayar',
        value: metrics.payment.unpaid_count,
        icon: Clock,
        color: 'from-rose-500/20 to-orange-500/10 border-rose-500/30 text-rose-400',
      }
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40">
        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Selamat Datang Kembali
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
            Halo, {user?.full_name}! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Sistem Informasi Mini Clinic terintegrasi. Anda masuk sebagai{' '}
            <strong className="text-teal-300">{user?.role}</strong>. Kelola pasien, antrean, dan rekam medis secara real-time.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-6 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Metrics Cards Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>Ringkasan Statistik Klinik Hari Ini</span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 glass-card rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl glass-card border bg-gradient-to-b ${card.color} transition-all duration-300 hover:scale-[1.02] shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {card.title}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access Menu */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-slate-200 mb-4">Akses Cepat Modul</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hasRole('Administrator', 'Petugas Pendaftaran') && (
            <div
              onClick={() => navigate('/registrations')}
              className="group p-6 rounded-2xl glass-card border border-slate-800 hover:border-teal-500/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/5"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white flex items-center justify-between">
                <span>Pendaftaran Kunjungan</span>
                <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Daftarkan pasien ke poli dan otomatis buat nomor antrean baru.
              </p>
            </div>
          )}

          {hasRole('Administrator', 'Dokter', 'Petugas Pendaftaran') && (
            <div
              onClick={() => navigate('/queues')}
              className="group p-6 rounded-2xl glass-card border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ListOrdered className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white flex items-center justify-between">
                <span>Pengelolaan Antrean</span>
                <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Lihat daftar antrean live, panggil antrean berikutnya, & ubah status.
              </p>
            </div>
          )}

          {hasRole('Administrator', 'Dokter') && (
            <div
              onClick={() => navigate('/medical-records')}
              className="group p-6 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white flex items-center justify-between">
                <span>Pemeriksaan SOAP</span>
                <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Catat SOAP, vital signs, tindakan medis, & resep obat pasien.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
