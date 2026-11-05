import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Tags, Pill, Syringe, Stethoscope, Plus, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const inputCls = 'px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm w-full';

export default function MasterPrices() {
  const [tab, setTab] = useState('medicines');
  const [medicines, setMedicines] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [fees, setFees] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [newMed, setNewMed] = useState({ name: '', unit: 'tablet', price: '', stock: '' });
  const [newProc, setNewProc] = useState({ name: '', price: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [m, p, f] = await Promise.all([
      api.get('/master/medicines', { params: { all: 1 } }),
      api.get('/master/procedures', { params: { all: 1 } }),
      api.get('/master/consultation-fees'),
    ]);
    setMedicines(m.data.data);
    setProcedures(p.data.data);
    setFees(f.data.data);
  };

  const notify = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const run = async (fn, okText) => {
    try {
      await fn();
      notify('ok', okText);
      await load();
      return true;
    } catch (err) {
      notify('err', err.response?.data?.message || 'Gagal menyimpan.');
      return false;
    }
  };

  const edit = (list, setList, id, field, value) =>
    setList(list.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const tabs = [
    { key: 'medicines', label: 'Master Obat', icon: Pill },
    { key: 'procedures', label: 'Master Tindakan', icon: Syringe },
    { key: 'fees', label: 'Tarif Konsultasi', icon: Stethoscope },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Tags className="w-7 h-7 text-amber-400" />
            <span>Master Harga</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Harga obat, tindakan, dan konsultasi diatur di sini. Dokter hanya memilih item, harga otomatis masuk ke tagihan.
          </p>
        </div>
        <div className="flex items-center p-1 bg-slate-900 rounded-2xl border border-slate-800">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${tab === t.key ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl text-sm flex items-center gap-3 border ${msg.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          {msg.type === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      {tab === 'medicines' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr><th className="text-left py-2">Nama Obat</th><th className="text-left">Satuan</th><th className="text-left">Harga (Rp)</th><th className="text-left">Stok</th><th className="text-left">Aktif</th><th></th></tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m.id} className="border-b border-slate-800/60">
                  <td className="py-2 pr-2"><input className={inputCls} value={m.name} onChange={(e) => edit(medicines, setMedicines, m.id, 'name', e.target.value)} /></td>
                  <td className="pr-2"><input className={inputCls} value={m.unit} onChange={(e) => edit(medicines, setMedicines, m.id, 'unit', e.target.value)} /></td>
                  <td className="pr-2"><input type="number" min="0" className={inputCls} value={m.price} onChange={(e) => edit(medicines, setMedicines, m.id, 'price', e.target.value)} /></td>
                  <td className="pr-2"><input type="number" min="0" className={inputCls} value={m.stock} onChange={(e) => edit(medicines, setMedicines, m.id, 'stock', e.target.value)} /></td>
                  <td className="pr-2"><input type="checkbox" checked={m.is_active} onChange={(e) => edit(medicines, setMedicines, m.id, 'is_active', e.target.checked)} /></td>
                  <td><button onClick={() => run(() => api.put(`/master/medicines/${m.id}`, m), 'Obat diperbarui.')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300"><Save className="w-4 h-4" /></button></td>
                </tr>
              ))}
              <tr>
                <td className="py-3 pr-2"><input className={inputCls} placeholder="Obat baru" value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} /></td>
                <td className="pr-2"><input className={inputCls} value={newMed.unit} onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })} /></td>
                <td className="pr-2"><input type="number" min="0" className={inputCls} placeholder="Harga" value={newMed.price} onChange={(e) => setNewMed({ ...newMed, price: e.target.value })} /></td>
                <td className="pr-2"><input type="number" min="0" className={inputCls} placeholder="Stok" value={newMed.stock} onChange={(e) => setNewMed({ ...newMed, stock: e.target.value })} /></td>
                <td></td>
                <td>
                  <button onClick={async () => { if (await run(() => api.post('/master/medicines', newMed), 'Obat ditambahkan.')) setNewMed({ name: '', unit: 'tablet', price: '', stock: '' }); }} className="p-2 rounded-lg bg-amber-500 text-slate-950"><Plus className="w-4 h-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-500">Stok berkurang otomatis saat dokter menyimpan resep. Nonaktifkan obat agar tidak muncul di pilihan dokter.</p>
        </div>
      )}

      {tab === 'procedures' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr><th className="text-left py-2">Nama Tindakan</th><th className="text-left">Tarif (Rp)</th><th className="text-left">Aktif</th><th></th></tr>
            </thead>
            <tbody>
              {procedures.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60">
                  <td className="py-2 pr-2"><input className={inputCls} value={p.name} onChange={(e) => edit(procedures, setProcedures, p.id, 'name', e.target.value)} /></td>
                  <td className="pr-2"><input type="number" min="0" className={inputCls} value={p.price} onChange={(e) => edit(procedures, setProcedures, p.id, 'price', e.target.value)} /></td>
                  <td className="pr-2"><input type="checkbox" checked={p.is_active} onChange={(e) => edit(procedures, setProcedures, p.id, 'is_active', e.target.checked)} /></td>
                  <td><button onClick={() => run(() => api.put(`/master/procedures/${p.id}`, p), 'Tindakan diperbarui.')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300"><Save className="w-4 h-4" /></button></td>
                </tr>
              ))}
              <tr>
                <td className="py-3 pr-2"><input className={inputCls} placeholder="Tindakan baru" value={newProc.name} onChange={(e) => setNewProc({ ...newProc, name: e.target.value })} /></td>
                <td className="pr-2"><input type="number" min="0" className={inputCls} placeholder="Tarif" value={newProc.price} onChange={(e) => setNewProc({ ...newProc, price: e.target.value })} /></td>
                <td></td>
                <td>
                  <button onClick={async () => { if (await run(() => api.post('/master/procedures', newProc), 'Tindakan ditambahkan.')) setNewProc({ name: '', price: '' }); }} className="p-2 rounded-lg bg-amber-500 text-slate-950"><Plus className="w-4 h-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'fees' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-3 max-w-xl">
          {fees.map((f) => (
            <div key={f.poli} className="flex items-center gap-3">
              <span className="w-48 text-sm text-slate-200">{f.poli}</span>
              <input type="number" min="0" className={inputCls} value={f.fee} onChange={(e) => setFees(fees.map((x) => (x.poli === f.poli ? { ...x, fee: e.target.value } : x)))} />
              <span className="w-28 text-xs text-slate-500">{rupiah(f.fee)}</span>
              <button onClick={() => run(() => api.put(`/master/consultation-fees/${encodeURIComponent(f.poli)}`, { fee: f.fee }), `Tarif ${f.poli} diperbarui.`)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300"><Save className="w-4 h-4" /></button>
            </div>
          ))}
          <p className="text-xs text-slate-500">Perubahan tarif hanya berlaku untuk tagihan berikutnya.</p>
        </div>
      )}
    </div>
  );
}

