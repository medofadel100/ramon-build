'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { Package, Hammer, Plus, Trash2, Edit3, Save, X, Phone, MessageCircle, MapPin, Search, Filter, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحيرة', 'المنوفية',
  'الغربية', 'الشرقية', 'القليوبية', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'بني سويف',
  'الفيوم', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'البحر الأحمر', 'الوادي الجديد', 'مطروح'
];

const SUPPLIER_SPECIALTIES = [
  'مورد سيراميك وبلاط', 'مورد أدوات صحية', 'مورد كهرباء', 'مورد دهانات',
  'مورد رخام وجرانيت', 'مورد أخشاب ونجارة', 'مورد تكييف', 'مورد ألومنيوم',
  'مورد مواد بناء عامة', 'مورد جبس بورد', 'أخرى'
];

const WORKER_TRADES = [
  'سباك', 'كهربائي', 'نقاش (دهانات)', 'مبلّط (سيراميك)', 'نجار',
  'حداد', 'عامل محارة', 'فني تكييف', 'فني ألومنيوم', 'فني جبس بورد',
  'عامل عام', 'أخرى'
];

interface PriceItem {
  product: string;
  unit: string;
  price: number;
}

interface GlobalSupplier {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  governorate: string;
  address: string;
  notes: string;
  products: PriceItem[];
}

interface GlobalWorker {
  id: string;
  name: string;
  phone: string;
  trade: string;
  governorate: string;
  address: string;
  dailyRate: number;
  meterRate: number;
  notes: string;
}

export default function DirectoryPage() {
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<'suppliers' | 'workers'>('suppliers');
  const [suppliers, setSuppliers] = useState<GlobalSupplier[]>([]);
  const [workers, setWorkers] = useState<GlobalWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [govFilter, setGovFilter] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formGovernorate, setFormGovernorate] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDailyRate, setFormDailyRate] = useState(0);
  const [formMeterRate, setFormMeterRate] = useState(0);
  const [formProducts, setFormProducts] = useState<PriceItem[]>([]);

  useEffect(() => {
    if (!loadingAuth && !user) router.push('/login');
  }, [user, loadingAuth, router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const suppSnap = await getDocs(collection(db, 'globalSuppliers'));
      setSuppliers(suppSnap.docs.map(d => ({ id: d.id, ...d.data() } as GlobalSupplier)));

      const workSnap = await getDocs(collection(db, 'globalWorkers'));
      setWorkers(workSnap.docs.map(d => ({ id: d.id, ...d.data() } as GlobalWorker)));
    } catch (err) {
      console.error('Error loading directory:', err);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormName(''); setFormPhone(''); setFormSpecialty(''); setFormGovernorate('');
    setFormAddress(''); setFormNotes(''); setFormDailyRate(0); setFormMeterRate(0);
    setFormProducts([]);
    setShowForm(false); setEditingId(null);
  };

  const handleSaveSupplier = async () => {
    if (!formName) return;
    const id = editingId || `sup_${Date.now()}`;
    const data: GlobalSupplier = {
      id, name: formName, phone: formPhone, specialty: formSpecialty,
      governorate: formGovernorate, address: formAddress, notes: formNotes,
      products: formProducts
    };
    await setDoc(doc(db, 'globalSuppliers', id), data);
    await loadData();
    resetForm();
  };

  const handleSaveWorker = async () => {
    if (!formName) return;
    const id = editingId || `wrk_${Date.now()}`;
    const data: GlobalWorker = {
      id, name: formName, phone: formPhone, trade: formSpecialty,
      governorate: formGovernorate, address: formAddress, notes: formNotes,
      dailyRate: formDailyRate, meterRate: formMeterRate
    };
    await setDoc(doc(db, 'globalWorkers', id), data);
    await loadData();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    const col = activeSection === 'suppliers' ? 'globalSuppliers' : 'globalWorkers';
    await deleteDoc(doc(db, col, id));
    await loadData();
  };

  const startEditSupplier = (s: GlobalSupplier) => {
    setEditingId(s.id); setFormName(s.name); setFormPhone(s.phone);
    setFormSpecialty(s.specialty); setFormGovernorate(s.governorate);
    setFormAddress(s.address); setFormNotes(s.notes);
    setFormProducts(s.products || []);
    setShowForm(true);
  };

  const startEditWorker = (w: GlobalWorker) => {
    setEditingId(w.id); setFormName(w.name); setFormPhone(w.phone);
    setFormSpecialty(w.trade); setFormGovernorate(w.governorate);
    setFormAddress(w.address); setFormNotes(w.notes);
    setFormDailyRate(w.dailyRate); setFormMeterRate(w.meterRate);
    setShowForm(true);
  };

  const addProduct = () => setFormProducts([...formProducts, { product: '', unit: 'متر', price: 0 }]);
  const updateProduct = (idx: number, field: string, value: any) => {
    setFormProducts(formProducts.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const removeProduct = (idx: number) => setFormProducts(formProducts.filter((_, i) => i !== idx));

  // Filtering
  const filteredSuppliers = suppliers.filter(s => {
    if (searchText && !s.name.includes(searchText) && !s.specialty.includes(searchText)) return false;
    if (govFilter && s.governorate !== govFilter) return false;
    if (specFilter && s.specialty !== specFilter) return false;
    return true;
  });

  const filteredWorkers = workers.filter(w => {
    if (searchText && !w.name.includes(searchText) && !w.trade.includes(searchText)) return false;
    if (govFilter && w.governorate !== govFilter) return false;
    if (specFilter && w.trade !== specFilter) return false;
    return true;
  });

  if (loadingAuth || !user) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-cairo select-none">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-foreground">دليل الموردين والصناعية</h1>
            <p className="text-sm text-muted-foreground mt-1">قاعدة بيانات عامة لجميع الموردين والصناعية وأسعارهم. يمكن استخدامها كمرجع لأي مشروع.</p>
          </div>
        </div>

        {/* Section Toggle */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setActiveSection('suppliers'); resetForm(); setSearchText(''); setGovFilter(''); setSpecFilter(''); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition ${
              activeSection === 'suppliers'
                ? 'bg-primary/10 border-primary text-foreground shadow-sm shadow-[#c5a880]/5'
                : 'border-border text-muted-foreground hover:text-white hover:bg-slate-900'
            }`}
          >
            <Package className="h-5 w-5" />
            الموردين ({suppliers.length})
          </button>
          <button
            onClick={() => { setActiveSection('workers'); resetForm(); setSearchText(''); setGovFilter(''); setSpecFilter(''); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition ${
              activeSection === 'workers'
                ? 'bg-primary/10 border-primary text-foreground shadow-sm shadow-[#c5a880]/5'
                : 'border-border text-muted-foreground hover:text-white hover:bg-slate-900'
            }`}
          >
            <Hammer className="h-5 w-5" />
            الصناعية ({workers.length})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder="بحث بالاسم أو التخصص..."
              className="w-full rounded-xl border border-border bg-card pr-10 pl-4 py-2.5 text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none"
            />
          </div>
          <select value={govFilter} onChange={e => setGovFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-[#c5a880] focus:outline-none">
            <option value="">كل المحافظات</option>
            {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={specFilter} onChange={e => setSpecFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-[#c5a880] focus:outline-none">
            <option value="">كل التخصصات</option>
            {(activeSection === 'suppliers' ? SUPPLIER_SPECIALTIES : WORKER_TRADES).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Add Button */}
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#e5c595] text-primary-foreground text-sm font-bold hover:brightness-110 transition shadow-lg mb-6"
          >
            <Plus className="h-5 w-5" />
            {activeSection === 'suppliers' ? 'إضافة مورد جديد للدليل' : 'إضافة صنايعي جديد للدليل'}
          </button>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="rounded-xl border border-primary/30 bg-[#1a1c24] p-6 space-y-5 mb-6 shadow-xl">
            <h4 className="text-sm font-bold text-foreground">{editingId ? 'تعديل البيانات' : 'إضافة جديد'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">الاسم *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="الاسم الكامل"
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none" />
              </div>
              <div>
                <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">رقم التليفون</label>
                <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="01xxxxxxxxx"
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none" />
              </div>
              <div>
                <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">{activeSection === 'suppliers' ? 'التخصص' : 'الحرفة'}</label>
                <select value={formSpecialty} onChange={e => setFormSpecialty(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none">
                  <option value="">اختر...</option>
                  {(activeSection === 'suppliers' ? SUPPLIER_SPECIALTIES : WORKER_TRADES).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">المحافظة</label>
                <select value={formGovernorate} onChange={e => setFormGovernorate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none">
                  <option value="">اختر المحافظة...</option>
                  {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">العنوان التفصيلي</label>
                <input type="text" value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="شارع - منطقة"
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none" />
              </div>
              {activeSection === 'workers' && (
                <>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">اليومية (ج.م)</label>
                    <input type="number" value={formDailyRate} onChange={e => setFormDailyRate(Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">سعر المتر (ج.م)</label>
                    <input type="number" value={formMeterRate} onChange={e => setFormMeterRate(Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none" />
                  </div>
                </>
              )}
              <div className="md:col-span-3">
                <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">ملاحظات</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none resize-none" />
              </div>
            </div>

            {/* Products / Prices for Suppliers */}
            {activeSection === 'suppliers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-primary" /> المنتجات والأسعار</h5>
                  <button onClick={addProduct} className="flex items-center gap-1 px-3 py-1 rounded bg-muted border border-border text-xs text-muted-foreground hover:text-white transition">
                    <Plus className="h-3 w-3" /> إضافة منتج
                  </button>
                </div>
                {formProducts.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-muted/30 rounded-lg p-3 border border-border/50">
                    <input type="text" value={p.product} onChange={e => updateProduct(idx, 'product', e.target.value)} placeholder="اسم المنتج (مثال: سيراميك 60x60)"
                      className="rounded border border-border bg-card px-3 py-2 text-xs text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none" />
                    <input type="text" value={p.unit} onChange={e => updateProduct(idx, 'unit', e.target.value)} placeholder="الوحدة (متر/قطعة/كرتونة)"
                      className="rounded border border-border bg-card px-3 py-2 text-xs text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none" />
                    <div className="flex items-center gap-1">
                      <input type="number" value={p.price} onChange={e => updateProduct(idx, 'price', Number(e.target.value))} placeholder="السعر"
                        className="flex-1 rounded border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none" />
                      <span className="text-[10px] text-muted-foreground">ج.م</span>
                    </div>
                    <button onClick={() => removeProduct(idx)} className="text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1 justify-center">
                      <Trash2 className="h-3 w-3" /> حذف
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={resetForm} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-white transition">
                <X className="h-3.5 w-3.5" /> إلغاء
              </button>
              <button
                onClick={activeSection === 'suppliers' ? handleSaveSupplier : handleSaveWorker}
                disabled={!formName}
                className="flex items-center gap-1 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> {editingId ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-3"></div>
            <p className="text-muted-foreground text-sm">جاري تحميل البيانات...</p>
          </div>
        )}

        {/* Suppliers List */}
        {!loading && activeSection === 'suppliers' && (
          <div className="space-y-3">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/40">
                <Package className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">لا يوجد موردين مسجلين في الدليل العام</p>
              </div>
            ) : filteredSuppliers.map(s => (
              <div key={s.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-[#c5a880]/20 transition">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground">{s.name}</h4>
                      {s.specialty && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-950/40 text-sky-400 border border-sky-800/40">{s.specialty}</span>}
                      {s.governorate && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.governorate}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {s.phone && (
                        <>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</span>
                          <a href={`https://wa.me/2${s.phone}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 transition"><MessageCircle className="h-3.5 w-3.5" /></a>
                        </>
                      )}
                      {s.address && <span className="text-[10px] text-muted-foreground">• {s.address}</span>}
                      {s.products?.length > 0 && (
                        <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline">
                          <DollarSign className="h-3 w-3" /> {s.products.length} منتج
                          {expandedId === s.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => startEditSupplier(s)} className="p-1.5 rounded hover:bg-slate-800 text-muted-foreground hover:text-white transition"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-slate-800 text-rose-500/60 hover:text-rose-400 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {/* Products sub-table */}
                {expandedId === s.id && s.products?.length > 0 && (
                  <div className="border-t border-border bg-background/50 p-4">
                    <table className="w-full text-xs">
                      <thead><tr className="text-muted-foreground border-b border-border">
                        <th className="p-2 text-right">المنتج</th><th className="p-2 text-center">الوحدة</th><th className="p-2 text-center">السعر (ج.م)</th>
                      </tr></thead>
                      <tbody className="divide-y divide-[#1a1c24]">
                        {s.products.map((p, i) => (
                          <tr key={i} className="text-foreground"><td className="p-2">{p.product}</td><td className="p-2 text-center text-muted-foreground">{p.unit}</td><td className="p-2 text-center text-primary font-bold">{p.price.toLocaleString()}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Workers List */}
        {!loading && activeSection === 'workers' && (
          <div className="space-y-3">
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/40">
                <Hammer className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">لا يوجد صناعية مسجلين في الدليل العام</p>
              </div>
            ) : filteredWorkers.map(w => (
              <div key={w.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-[#c5a880]/20 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-sm font-bold text-foreground">{w.name}</h4>
                    {w.trade && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">{w.trade}</span>}
                    {w.governorate && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {w.governorate}</span>}
                    {w.dailyRate > 0 && <span className="text-[10px] text-emerald-400 font-bold">اليومية: {w.dailyRate} ج.م</span>}
                    {w.meterRate > 0 && <span className="text-[10px] text-blue-400 font-bold">سعر المتر: {w.meterRate} ج.م</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {w.phone && (
                      <>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {w.phone}</span>
                        <a href={`https://wa.me/2${w.phone}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 transition"><MessageCircle className="h-3.5 w-3.5" /></a>
                      </>
                    )}
                    {w.address && <span className="text-[10px] text-muted-foreground">• {w.address}</span>}
                    {w.notes && <span className="text-[10px] text-muted-foreground">• {w.notes}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => startEditWorker(w)} className="p-1.5 rounded hover:bg-slate-800 text-muted-foreground hover:text-white transition"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded hover:bg-slate-800 text-rose-500/60 hover:text-rose-400 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
