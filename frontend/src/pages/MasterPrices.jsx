import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Tags, Pill, Syringe, Stethoscope, Plus, Pencil, X, Search, CheckCircle2, AlertCircle } from 'lucide-react';

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const inputCls = 'w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-amber-500 outline-none';
const LOW_STOCK = 20;

const StatusBadge = ({ active }) => (
  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/40 text-slate-400 border-slate-600'}`}>
    {active ? 'Aktif' : 'Nonaktif'}
  </span>
);

export default function MasterPrices() {
  const [tab, setTab] = useState('medicines');
  const [medicines, setMedicines] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [fees, setFees] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [modal, setModal] = useState(null); // { kind, data }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setSearch('');
  }, [tab]);

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

  const openAdd = (kind) =>
    setModal({
      kind,
      data: kind === 'medicine' ? { name: '', unit: 'tablet', price: '', stock: '', is_active: true } : { name: '', price: '', is_active: true },
    });

  const handleSave = async (e) => {
    e.preventDefault();
    const { kind, data } = modal;
    try {
      setSaving(true);
      if (kind === 'fee') {
        await api.put(`/master/consultation-fees/${encodeURIComponent(data.poli)}`, { fee: data.fee });
      } else {
        const base = kind === 'medicine' ? '/master/medicines' : '/master/procedures';
        if (data.id) await api.put(`${base}/${data.id}`, data);
        else await api.post(base, data);
      }
      notify('ok', 'Data berhasil disimpan.');
      setModal(null);
      await load();
    } catch (err) {
      notify('err', err.response?.data?.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (kind, row) => {
    try {
      const base = kind === 'medicine' ? '/master/medicines' : '/master/procedures';
      await api.put(`${base}/${row.id}`, { ...row, is_active: !row.is_active });
      await load();
    } catch (err) {
      notify('err', err.response?.data?.message || 'Gagal mengubah status.');
    }
  };

  const q = search.toLowerCase();
  const filteredMeds = useMemo(() => medicines.filter((m) => m.name.toLowerCase().includes(q)), [medicines, q]);
  const filteredProcs = useMemo(() => procedures.filter((p) => p.name.toLowerCase().includes(q)), [procedures, q]);

  const tabs = [
    { key: 'medicines', label: 'Master Obat', icon: Pill, count: medicines.length },
    { key: 'procedures', label: 'Master Tindakan', icon: Syringe, count: procedures.length },
    { key: 'fees', label: 'Tarif Konsultasi', icon: Stethoscope, count: fees.length },
  ];

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400';
  const td = 'px-4 py-3 text-sm';
  const editBtn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Tags className="w-7 h-7 text-amber-400" />
            <span>Master Harga</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Kelola harga obat, tindakan, dan konsultasi. Dokter hanya memilih item; harga otomatis masuk tagihan.
          </p>
        </div>
        <div className="flex items-center p-1 bg-slate-900 rounded-2xl border border-slate-800 self-start">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t.key ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Icon className="w-4 h-4" /> {t.label}
                <span className={`px-1.5 rounded-full text-[10px] ${tab === t.key ? 'bg-slate-950/20' : 'bg-slate-800'}`}>{t.count}</span>
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

      {/* Toolbar */}
      {tab !== 'fees' && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'medicines' ? 'Cari nama obat...' : 'Cari nama tindakan...'}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm"
            />
          </div>
          <button
            onClick={() => openAdd(tab === 'medicines' ? 'medicine' : 'procedure')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> {tab === 'medicines' ? 'Tambah Obat' : 'Tambah Tindakan'}
          </button>
        </div>
      )}

      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'medicines' && (
            <table className="w-full">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr><th className={th}>No</th><th className={th}>Nama Obat</th><th className={th}>Satuan</th><th className={`${th} text-right`}>Harga</th><th className={`${th} text-right`}>Stok</th><th className={th}>Status</th><th className={`${th} text-right`}>Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMeds.length === 0 && <tr><td colSpan="7" className="py-10 text-center text-slate-500 text-sm">Data tidak ditemukan.</td></tr>}
                {filteredMeds.map((m, i) => (
                  <tr key={m.id} className={`hover:bg-slate-800/30 ${m.is_active ? '' : 'opacity-60'}`}>
                    <td className={`${td} text-slate-500`}>{i + 1}</td>
                    <td className={`${td} text-slate-100 font-medium`}>{m.name}</td>
                    <td className={`${td} text-slate-300`}>{m.unit}</td>
                    <td className={`${td} text-right text-slate-100 font-semibold`}>{rupiah(m.price)}</td>
                    <td className={`${td} text-right`}>
                      <span className={m.stock <= 0 ? 'text-rose-400 font-bold' : m.stock <= LOW_STOCK ? 'text-amber-300 font-bold' : 'text-slate-200'}>{m.stock}</span>
                      {m.stock <= 0 ? <span className="ml-2 text-[10px] text-rose-400">HABIS</span> : m.stock <= LOW_STOCK ? <span className="ml-2 text-[10px] text-amber-300">MENIPIS</span> : null}
                    </td>
                    <td className={td}><StatusBadge active={m.is_active} /></td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <button onClick={() => setModal({ kind: 'medicine', data: { ...m } })} className={editBtn}><Pencil className="w-3.5 h-3.5" /> Edit</button>
                      <button onClick={() => toggleActive('medicine', m)} className={`${editBtn} ml-2`}>{m.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'procedures' && (
            <table className="w-full">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr><th className={th}>No</th><th className={th}>Nama Tindakan</th><th className={`${th} text-right`}>Tarif</th><th className={th}>Status</th><th className={`${th} text-right`}>Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProcs.length === 0 && <tr><td colSpan="5" className="py-10 text-center text-slate-500 text-sm">Data tidak ditemukan.</td></tr>}
                {filteredProcs.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-slate-800/30 ${p.is_active ? '' : 'opacity-60'}`}>
                    <td className={`${td} text-slate-500`}>{i + 1}</td>
                    <td className={`${td} text-slate-100 font-medium`}>{p.name}</td>
                    <td className={`${td} text-right text-slate-100 font-semibold`}>{rupiah(p.price)}</td>
                    <td className={td}><StatusBadge active={p.is_active} /></td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <button onClick={() => setModal({ kind: 'procedure', data: { ...p } })} className={editBtn}><Pencil className="w-3.5 h-3.5" /> Edit</button>
                      <button onClick={() => toggleActive('procedure', p)} className={`${editBtn} ml-2`}>{p.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'fees' && (
            <table className="w-full">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr><th className={th}>No</th><th className={th}>Poli</th><th className={`${th} text-right`}>Tarif Konsultasi</th><th className={`${th} text-right`}>Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fees.map((f, i) => (
                  <tr key={f.poli} className="hover:bg-slate-800/30">
                    <td className={`${td} text-slate-500`}>{i + 1}</td>
                    <td className={`${td} text-slate-100 font-medium`}>{f.poli}</td>
                    <td className={`${td} text-right text-slate-100 font-semibold`}>{rupiah(f.fee)}</td>
                    <td className={`${td} text-right`}>
                      <button onClick={() => setModal({ kind: 'fee', data: { ...f } })} className={editBtn}><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {tab === 'medicines' && `Stok berkurang otomatis saat dokter menyimpan resep. Stok ≤ ${LOW_STOCK} ditandai menipis. Obat nonaktif tidak muncul di pilihan dokter.`}
        {tab === 'procedures' && 'Perubahan tarif hanya berlaku untuk tagihan berikutnya; tagihan lama tidak berubah.'}
        {tab === 'fees' && 'Perubahan tarif hanya berlaku untuk tagihan berikutnya.'}
      </p>

      {/* Modal Tambah/Edit */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {modal.kind === 'fee' ? `Ubah Tarif ${modal.data.poli}` : `${modal.data.id ? 'Edit' : 'Tambah'} ${modal.kind === 'medicine' ? 'Obat' : 'Tindakan'}`}
              </h2>
              <button type="button" onClick={() => setModal(null)} className="p-1.5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {modal.kind !== 'fee' && (
              <div>
                <label className="text-xs text-slate-400">Nama</label>
                <input required className={inputCls} value={modal.data.name} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} />
              </div>
            )}
            {modal.kind === 'medicine' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Satuan</label>
                  <input required className={inputCls} value={modal.data.unit} onChange={(e) => setModal({ ...modal, data: { ...modal.data, unit: e.target.value } })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Stok</label>
                  <input required type="number" min="0" className={inputCls} value={modal.data.stock} onChange={(e) => setModal({ ...modal, data: { ...modal.data, stock: e.target.value } })} />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400">{modal.kind === 'fee' ? 'Tarif Konsultasi (Rp)' : modal.kind === 'medicine' ? 'Harga Satuan (Rp)' : 'Tarif (Rp)'}</label>
              <input
                required
                type="number"
                min="0"
                className={inputCls}
                value={modal.kind === 'fee' ? modal.data.fee : modal.data.price}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, [modal.kind === 'fee' ? 'fee' : 'price']: e.target.value } })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700">Batal</button>
              <button disabled={saving} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
