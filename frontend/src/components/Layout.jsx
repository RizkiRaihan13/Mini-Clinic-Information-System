import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ListOrdered,
  Stethoscope,
  LogOut,
  Activity,
  User,
  ShieldAlert,
  Wallet,
  Tags,
} from 'lucide-react';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Administrator', 'Dokter', 'Petugas Pendaftaran'],
    },
    {
      title: 'Master Pasien',
      path: '/patients',
      icon: Users,
      roles: ['Administrator', 'Petugas Pendaftaran', 'Dokter'],
    },
    {
      title: 'Pendaftaran',
      path: '/registrations',
      icon: UserPlus,
      roles: ['Administrator', 'Petugas Pendaftaran'],
    },
    {
      title: 'Antrean Pasien',
      path: '/queues',
      icon: ListOrdered,
      roles: ['Administrator', 'Dokter', 'Petugas Pendaftaran'],
    },
    {
      title: 'Pemeriksaan SOAP',
      path: '/medical-records',
      icon: Stethoscope,
      roles: ['Administrator', 'Dokter'],
    },
    {
      title: 'Pembayaran',
      path: '/payments',
      icon: Wallet,
      roles: ['Administrator', 'Petugas Pendaftaran'],
    },
    {
      title: 'Master Harga',
      path: '/master-prices',
      icon: Tags,
      roles: ['Administrator'],
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar */}
      <aside className="w-64 glass-panel flex flex-col border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-extrabold text-xl">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Mini Clinic</h1>
            <p className="text-xs text-teal-400 font-medium">Info System v1.0</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-4 mx-3 my-3 rounded-xl glass-card border border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold border border-teal-500/30 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate text-slate-200">{user?.full_name}</p>
            <span className="inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems
            .filter((item) => hasRole(...item.roles))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900/50">
        <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between glass-panel">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium text-teal-400">Mini Clinic System</span>
            <span>/</span>
            <span className="text-slate-200 font-semibold">{user?.role} Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 text-xs text-slate-300 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PostgreSQL Ready</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Keluar dari aplikasi?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Anda harus login kembali untuk mengakses sistem.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
