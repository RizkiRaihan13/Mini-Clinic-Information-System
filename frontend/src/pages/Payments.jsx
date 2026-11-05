import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Wallet, RefreshCw, Search, X, Printer, CheckCircle2, Clock, Banknote } from 'lucide-react';

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const METHODS = ['Tunai', 'Debit', 'Kredit', 'QRIS', 'Transfer'];

const statusStyle = {
  'Belum Bayar': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Lunas: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Batal: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export default function Payments() {
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [method, setMethod] = useState('Tunai');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [date, status]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [list, sum] = await Promise.all([
        api.get('/payments', { params: { date, status: status || undefined, search: search || undefined } }),
        api.get('/payments/summary', { params: { date } }),
      ]);
      setInvoices(list.data.data);
      setSummary(sum.data.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/payments/${id}`);
      const inv = res.data.data;
      setDetail(inv);
      setMethod('Tunai');
      setAmountPaid('');
      setDiscount('');
      setError('');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memuat invoice.');
    }
  };

  const effectiveTotal = detail
    ? Number(detail.subtotal) - (discount !== '' ? Number(discount) || 0 : Number(detail.discount))
    : 0;
  const change = method === 'Tunai' ? Math.max((Number(amountPaid) || 0) - effectiveTotal, 0) : 0;

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      const payload = { payment_method: method, amount_paid: method === 'Tunai' ? Number(amountPaid) : effectiveTotal };
      if (discount !== '') payload.discount = Number(discount);
      await api.put(`/payments/${detail.id}/pay`, payload);
      await openDetail(detail.id);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Pembayaran gagal.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Batalkan invoice ini?')) return;
    try {
      await api.put(`/payments/${detail.id}/cancel`, {});
      await openDetail(detail.id);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membatalkan.');
    }
  };

  const cards = summary
    ? [
        { title: 'Pendapatan Hari Ini', value: rupiah(summary.revenue), icon: Banknote, color: 'text-emerald-400 border-emerald-500/30' },
        { title: 'Belum Bayar', value: `${summary.unpaid_count} tagihan`, icon: Clock, color: 'text-amber-400 border-amber-500/30' },
        { title: 'Total Piutang', value: rupiah(summary.unpaid_amount), icon: Wallet, color: 'text-rose-400 border-rose-500/30' },
        { title: 'Sudah Lunas', value: `${summary.paid_count} tagihan`, icon: CheckCircle2, color: 'text-teal-400 border-teal-500/30' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>Pembayaran / Kasir</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tagihan dibuat otomatis setelah dokter menyelesaikan pemeriksaan (konsultasi + tindakan + obat).
          </p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700">
          <RefreshCw className="w-4 h-4 text-emerald-400" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className={`p-5 rounded-2xl glass-card border ${c.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400">{c.title}</span>
                <Icon className="w-5 h-5" />
              </div>
              <p className="mt-3 text-xl font-extrabold text-white">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm">
            <option value="">Semua Status</option>
            <option>Belum Bayar</option>
            <option>Lunas</option>
            <option>Batal</option>
          </select>
          <form onSubmit={(e) => { e.preventDefault(); fetchAll(); }} className="flex-1 flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama pasien / No. RM / No. Invoice" className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm" />
            <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2"><Search className="w-4 h-4" />Cari</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 pr-4">Invoice</th>
                <th className="pr-4">Pasien</th>
                <th className="pr-4">Poli</th>
                <th className="pr-4">Jenis Bayar</th>
                <th className="pr-4 text-right">Total</th>
                <th className="pr-4">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">Memuat...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">Belum ada tagihan pada tanggal ini.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-300">{inv.invoice_number}</td>
                    <td className="pr-4"><div className="text-slate-100 font-medium">{inv.patient_name}</div><div className="text-xs text-slate-500">{inv.medical_record_number}</div></td>
                    <td className="pr-4 text-slate-300">{inv.poli}</td>
                    <td className="pr-4 text-slate-300">{inv.payment_type}</td>
                    <td className="pr-4 text-right text-slate-100 font-semibold">{rupiah(inv.total_amount)}</td>
                    <td className="pr-4"><span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyle[inv.status]}`}>{inv.status}</span></td>
                    <td className="text-right">
                      <button onClick={() => openDetail(inv.id)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700">
                        {inv.status === 'Belum Bayar' ? 'Bayar' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 print-area-wrapper">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5" id="invoice-print">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Invoice {detail.invoice_number}</h2>
                <p className="text-xs text-slate-400">{detail.patient_name} ({detail.medical_record_number}) • {detail.poli} • {detail.doctor_name}</p>
                <p className="text-xs text-slate-500">Kunjungan: {String(detail.visit_date).slice(0, 10)} • Jenis bayar: {detail.payment_type}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 text-slate-400 hover:text-white no-print"><X className="w-5 h-5" /></button>
            </div>

            <table className="w-full text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr><th className="text-left py-2">Item</th><th className="text-right">Qty</th><th className="text-right">Harga</th><th className="text-right">Subtotal</th></tr>
              </thead>
              <tbody>
                {detail.items.map((it) => (
                  <tr key={it.id} className="border-b border-slate-800/50 text-slate-200">
                    <td className="py-2"><span className="text-[10px] text-slate-500 mr-1">[{it.item_type}]</span>{it.item_name}</td>
                    <td className="text-right">{it.quantity}</td>
                    <td className="text-right">{rupiah(it.unit_price)}</td>
                    <td className="text-right">{rupiah(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-sm text-slate-300">
              <div className="flex justify-between"><span>Subtotal</span><span>{rupiah(detail.subtotal)}</span></div>
              <div className="flex justify-between"><span>Diskon / Ditanggung</span><span>- {rupiah(detail.status === 'Belum Bayar' && discount !== '' ? discount : detail.discount)}</span></div>
              <div className="flex justify-between text-base font-extrabold text-white pt-1 border-t border-slate-800"><span>Total Bayar</span><span>{rupiah(detail.status === 'Belum Bayar' ? effectiveTotal : detail.total_amount)}</span></div>
            </div>

            {detail.status === 'Lunas' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> LUNAS via {detail.payment_method}</div>
                <div>Dibayar: {rupiah(detail.amount_paid)} • Kembalian: {rupiah(detail.change_amount)}</div>
                <div className="text-xs text-emerald-300/70">{detail.paid_at && new Date(detail.paid_at).toLocaleString('id-ID')} {detail.cashier_name && `• Kasir: ${detail.cashier_name}`}</div>
                {detail.notes && <div className="text-xs">{detail.notes}</div>}
              </div>
            )}
            {detail.status === 'Batal' && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">Invoice dibatalkan.</div>}

            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{error}</div>}

            {detail.status === 'Belum Bayar' && (
              <form onSubmit={handlePay} className="space-y-3 no-print">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Metode Pembayaran</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm">
                      {METHODS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  {hasRole('Administrator') && (
                    <div>
                      <label className="text-xs text-slate-400">Diskon (Rp, opsional)</label>
                      <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm" />
                    </div>
                  )}
                </div>
                {method === 'Tunai' && (
                  <div>
                    <label className="text-xs text-slate-400">Uang Diterima (Rp)</label>
                    <input type="number" min="0" required value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm" />
                    <p className="text-xs text-slate-400 mt-1">Kembalian: <strong className="text-emerald-300">{rupiah(change)}</strong></p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button disabled={saving} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-50">
                    {saving ? 'Memproses...' : 'Proses Pembayaran'}
                  </button>
                  {hasRole('Administrator') && (
                    <button type="button" onClick={handleCancel} className="px-4 rounded-xl border border-rose-500/40 text-rose-300 text-sm hover:bg-rose-500/10">Batalkan</button>
                  )}
                </div>
              </form>
            )}

            {detail.status === 'Lunas' && (
              <button onClick={() => window.print()} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700 no-print">
                <Printer className="w-4 h-4" /> Cetak Kuitansi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

