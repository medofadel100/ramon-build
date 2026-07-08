'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Supplier, Worker } from '@/lib/project-service';
import { Package, Hammer, Plus, Trash2, Edit3, Save, X, Phone, MessageCircle, MapPin } from 'lucide-react';

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

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحيرة', 'المنوفية',
  'الغربية', 'الشرقية', 'القليوبية', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'بني سويف',
  'الفيوم', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'البحر الأحمر', 'الوادي الجديد', 'مطروح'
];

export default function ProjectSuppliersTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const addSupplier = useProjectStore((state) => state.addSupplier);
  const updateSupplier = useProjectStore((state) => state.updateSupplier);
  const removeSupplier = useProjectStore((state) => state.removeSupplier);
  const addWorker = useProjectStore((state) => state.addWorker);
  const updateWorkerData = useProjectStore((state) => state.updateWorkerData);
  const removeWorker = useProjectStore((state) => state.removeWorker);
  const user = useAuthStore((state) => state.user);

  const [activeSection, setActiveSection] = useState<'suppliers' | 'workers'>('suppliers');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formGovernorate, setFormGovernorate] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDailyRate, setFormDailyRate] = useState(0);

  if (!currentProject) return null;

  const suppliers = currentProject.suppliers || [];
  const workers = currentProject.workers || [];
  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  const resetForm = () => {
    setFormName(''); setFormPhone(''); setFormSpecialty(''); setFormGovernorate(''); setFormAddress(''); setFormNotes(''); setFormDailyRate(0);
    setShowAddForm(false); setEditingId(null);
  };

  const handleAddSupplier = async () => {
    if (!formName) return;
    await addSupplier({ name: formName, phone: formPhone, specialty: formSpecialty, governorate: formGovernorate, address: formAddress, notes: formNotes });
    resetForm();
  };

  const handleAddWorker = async () => {
    if (!formName) return;
    await addWorker({ name: formName, phone: formPhone, trade: formSpecialty, assignedItems: [], dailyRate: formDailyRate, governorate: formGovernorate, address: formAddress, notes: formNotes });
    resetForm();
  };

  const handleUpdateSupplier = async (supplier: Supplier) => {
    await updateSupplier({ ...supplier, name: formName, phone: formPhone, specialty: formSpecialty, governorate: formGovernorate, address: formAddress, notes: formNotes });
    resetForm();
  };

  const handleUpdateWorker = async (worker: Worker) => {
    await updateWorkerData({ ...worker, name: formName, phone: formPhone, trade: formSpecialty, dailyRate: formDailyRate, governorate: formGovernorate, address: formAddress, notes: formNotes });
    resetForm();
  };

  const startEdit = (person: Supplier | Worker) => {
    setEditingId(person.id);
    setFormName(person.name);
    setFormPhone(person.phone);
    setFormSpecialty(activeSection === 'suppliers' ? (person as Supplier).specialty : (person as Worker).trade);
    setFormGovernorate(person.governorate || '');
    setFormAddress(person.address || '');
    setFormNotes(person.notes);
    if (activeSection === 'workers') setFormDailyRate((person as Worker).dailyRate);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6 font-cairo select-none">
      
      {/* Section Toggle */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => { setActiveSection('suppliers'); resetForm(); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition ${
            activeSection === 'suppliers'
              ? 'bg-primary/10 border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          <Package className="h-4 w-4" />
          الموردين ({suppliers.length})
        </button>
        <button
          onClick={() => { setActiveSection('workers'); resetForm(); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition ${
            activeSection === 'workers'
              ? 'bg-primary/10 border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          <Hammer className="h-4 w-4" />
          الصناعية / العمال ({workers.length})
        </button>
      </div>

      {/* Add Button */}
      {canEdit && !showAddForm && (
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); setFormName(''); setFormPhone(''); setFormSpecialty(''); setFormNotes(''); setFormDailyRate(0); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          {activeSection === 'suppliers' ? 'إضافة مورد جديد' : 'إضافة صنايعي جديد'}
        </button>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="rounded-xl border border-primary/30 bg-[#1a1c24] p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground">
            {editingId ? 'تعديل البيانات' : (activeSection === 'suppliers' ? 'إضافة مورد جديد' : 'إضافة صنايعي جديد')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">الاسم *</label>
              <input
                type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">رقم التليفون</label>
              <input
                type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">
                {activeSection === 'suppliers' ? 'التخصص' : 'الحرفة'}
              </label>
              <select
                value={formSpecialty} onChange={(e) => setFormSpecialty(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
              >
                <option value="">اختر...</option>
                {(activeSection === 'suppliers' ? SUPPLIER_SPECIALTIES : WORKER_TRADES).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {activeSection === 'workers' && (
              <div>
                <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">اليومية (ج.م)</label>
                <input
                  type="number" value={formDailyRate} onChange={(e) => setFormDailyRate(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">المحافظة</label>
              <select
                value={formGovernorate} onChange={(e) => setFormGovernorate(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
              >
                <option value="">اختر المحافظة...</option>
                {GOVERNORATES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">العنوان التفصيلي</label>
              <input
                type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                placeholder="مثال: شارع التحرير - الدور الثالث"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">ملاحظات</label>
              <textarea
                value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-white transition">
              <X className="h-3.5 w-3.5" /> إلغاء
            </button>
            <button
              onClick={() => {
                if (editingId) {
                  if (activeSection === 'suppliers') {
                    const s = suppliers.find(s => s.id === editingId);
                    if (s) handleUpdateSupplier(s);
                  } else {
                    const w = workers.find(w => w.id === editingId);
                    if (w) handleUpdateWorker(w);
                  }
                } else {
                  activeSection === 'suppliers' ? handleAddSupplier() : handleAddWorker();
                }
              }}
              disabled={!formName}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> {editingId ? 'حفظ التعديلات' : 'إضافة'}
            </button>
          </div>
        </div>
      )}

      {/* Suppliers List */}
      {activeSection === 'suppliers' && (
        <div className="space-y-3">
          {suppliers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card/40">
              <Package className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا يوجد موردين مُسجلين لهذا المشروع</p>
            </div>
          ) : (
            suppliers.map(supplier => (
              <div key={supplier.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-[#c5a880]/30 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-foreground">{supplier.name}</h4>
                    {supplier.specialty && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-950/40 text-sky-400 border border-sky-800/40">
                        {supplier.specialty}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {supplier.phone && (
                      <>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {supplier.phone}
                        </span>
                        <a
                          href={`https://wa.me/2${supplier.phone}`} target="_blank" rel="noopener noreferrer"
                          className="text-emerald-500 hover:text-emerald-400 transition"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </>
                    )}
                    {supplier.governorate && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {supplier.governorate}
                      </span>
                    )}
                    {supplier.address && <span className="text-[10px] text-muted-foreground">• {supplier.address}</span>}
                    {supplier.notes && <span className="text-[10px] text-muted-foreground">• {supplier.notes}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1.5">
                    <button onClick={() => startEdit(supplier)} className="p-1.5 rounded hover:bg-slate-800 text-muted-foreground hover:text-white transition">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm('حذف هذا المورد؟')) removeSupplier(supplier.id); }} className="p-1.5 rounded hover:bg-slate-800 text-rose-500/60 hover:text-rose-400 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Workers List */}
      {activeSection === 'workers' && (
        <div className="space-y-3">
          {workers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card/40">
              <Hammer className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا يوجد صناعية مسجلين لهذا المشروع</p>
            </div>
          ) : (
            workers.map(worker => (
              <div key={worker.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-[#c5a880]/30 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-foreground">{worker.name}</h4>
                    {worker.trade && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
                        {worker.trade}
                      </span>
                    )}
                    {worker.dailyRate > 0 && (
                      <span className="text-[10px] text-muted-foreground">اليومية: {worker.dailyRate} ج.م</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {worker.phone && (
                      <>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {worker.phone}
                        </span>
                        <a
                          href={`https://wa.me/2${worker.phone}`} target="_blank" rel="noopener noreferrer"
                          className="text-emerald-500 hover:text-emerald-400 transition"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </>
                    )}
                    {worker.governorate && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {worker.governorate}
                      </span>
                    )}
                    {worker.address && <span className="text-[10px] text-muted-foreground">• {worker.address}</span>}
                    {worker.notes && <span className="text-[10px] text-muted-foreground">• {worker.notes}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1.5">
                    <button onClick={() => startEdit(worker)} className="p-1.5 rounded hover:bg-slate-800 text-muted-foreground hover:text-white transition">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm('حذف هذا الصنايعي؟')) removeWorker(worker.id); }} className="p-1.5 rounded hover:bg-slate-800 text-rose-500/60 hover:text-rose-400 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
