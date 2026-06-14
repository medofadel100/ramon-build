'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { dbGetMasterConstants, dbUpdateMasterConstants } from '@/lib/project-service';
import { ConstantDefinition } from '@/lib/constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { Save, AlertTriangle, Plus, X, Globe, RefreshCw, Package } from 'lucide-react';

export default function AdminConstantsPage() {
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [constants, setConstants] = useState<ConstantDefinition[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newConst, setNewConst] = useState<Partial<ConstantDefinition> & { value: number }>({
    key: '',
    label: '',
    group: 'materials',
    subgroup: 'general',
    defaultValue: 0,
    unit: 'ج.م',
    value: 0
  });

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        alert('صلاحية مقيدة. هذه الصفحة مخصصة لمدراء النظام فقط.');
        router.push('/dashboard');
      }
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    async function fetchData() {
      setLoading(true);
      try {
        const [data, suppSnap] = await Promise.all([
          dbGetMasterConstants(),
          getDocs(collection(db, 'globalSuppliers'))
        ]);
        setConstants(data);
        setSuppliers(suppSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleConstantChange = (key: string, field: 'defaultValue' | 'supplierId', value: any) => {
    setConstants(prev => prev.map(c => {
      if (c.key !== key) return c;
      if (field === 'defaultValue') {
        const numValue = parseFloat(value);
        return { ...c, defaultValue: isNaN(numValue) ? 0 : numValue };
      }
      if (field === 'supplierId') {
        const supp = suppliers.find(s => s.id === value);
        return { ...c, supplierId: value, supplierName: supp?.name || '' };
      }
      return c;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dbUpdateMasterConstants(constants);
      alert('تم حفظ الكتالوج بنجاح. المشاريع الجديدة ستستخدم هذه القيم مباشرة.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomConstant = () => {
    if (!newConst.label || !newConst.key) return;
    
    const key = `custom_${newConst.key.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    const def: ConstantDefinition = {
      key,
      label: newConst.label,
      group: newConst.group as any,
      subgroup: newConst.subgroup as any,
      defaultValue: newConst.value,
      unit: newConst.unit || ''
    };

    setConstants(prev => [...prev, def]);
    setShowAddModal(false);
    setNewConst({
      key: '',
      label: '',
      group: 'materials',
      subgroup: 'general',
      defaultValue: 0,
      unit: 'ج.م',
      value: 0
    });
  };

  const handleDelete = (key: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الخامة نهائياً من الكتالوج المركزي؟')) {
      setConstants(prev => prev.filter(c => c.key !== key));
    }
  };

  if (loadingAuth || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d0e12]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
      </div>
    );
  }

  const materials = constants.filter(c => c.group === 'materials');

  const renderGroup = (title: string, list: ConstantDefinition[], subgroup: string) => {
    const items = list.filter(c => c.subgroup === subgroup);
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-sm font-bold text-[#c5a880] mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#c5a880]"></div>
          {title}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map(c => (
            <div key={c.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#222634] bg-[#1a1c24] hover:border-[#c5a880]/30 transition group">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {c.label}
                  {c.key.startsWith('custom_') && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-900/30 text-sky-400 border border-sky-800/40">مضاف يدوياً</span>
                  )}
                </h4>
                {c.group === 'materials' && (
                  <div className="mt-3 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <select
                      value={c.supplierId || ''}
                      onChange={(e) => handleConstantChange(c.key, 'supplierId', e.target.value)}
                      className="bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#c5a880] w-48"
                    >
                      <option value="">-- لم يتم ربط مورد --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-32">
                  <input
                    type="number"
                    value={c.defaultValue}
                    onChange={(e) => handleConstantChange(c.key, 'defaultValue', e.target.value)}
                    className="w-full bg-[#13151c] border border-[#222634] rounded-lg px-3 py-2 text-left text-sm font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                    {c.unit}
                  </span>
                </div>
                {c.key.startsWith('custom_') && (
                  <button
                    onClick={() => handleDelete(c.key)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-500 hover:bg-rose-950/20 transition"
                    title="حذف الخامة"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] flex flex-col font-cairo select-none pb-12">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#13151c] p-5 rounded-xl border border-[#222634]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c5a880]/10 text-[#c5a880] shadow">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">الكتالوج المركزي للخامات والأسعار</h1>
              <p className="text-xs text-slate-400 mt-0.5">القاعدة المركزية التي تُسحب منها أسعار وخامات كافة المشاريع الجديدة في النظام.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-bold hover:bg-slate-700 transition"
            >
              <Plus className="h-4 w-4" />
              إضافة خامة جديدة
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-sm font-bold shadow hover:brightness-110 transition disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التعديلات
            </button>
          </div>
        </div>

        {/* Informational Tip */}
        <div className="rounded-xl border border-[#222634] bg-slate-900/40 p-4 flex gap-3 text-slate-400 text-xs font-semibold leading-relaxed">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-bold">تأثير الكتالوج</p>
            <p className="text-slate-400 mt-1 font-medium">
              تعديلك للأسعار هنا سيعتبر "الافتراضي الجديد" لأي مشروع يتم إنشاؤه من الآن فصاعداً. المشاريع القديمة لن تتأثر أسعارها بهذه التعديلات لضمان استقرار عقودها، إلا إذا دخلت لصفحة المشروع وقمت بتحديث أسعاره من هناك.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
            <p className="text-xs text-slate-400">جاري تحميل الكتالوج العالمي...</p>
          </div>
        ) : (
          <div className="bg-[#13151c] rounded-2xl p-6 border border-[#222634]">
            {renderGroup('خامات عامة (أسمنت، رمل، حديد)', materials, 'general')}
            {renderGroup('أعمال المباني', materials, 'masonry')}
            {renderGroup('أعمال المحارة والدهانات والجبس', materials, 'plastering')}
            {renderGroup('أعمال السيراميك', materials, 'flooring')}
            {renderGroup('تأسيس السباكة والعزل', materials, 'plumbing')}
            {renderGroup('تأسيس الكهرباء والشبكات', materials, 'electrical')}
            {renderGroup('تأسيس التكييف', materials, 'hvac')}
          </div>
        )}

      </main>

      {/* Add Custom Constant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#13151c] border border-[#222634] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#222634] bg-[#1a1c24]">
              <h3 className="text-lg font-bold text-white">إضافة خامة للكتالوج المركزي</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">اسم الخامة أو التوصيف</label>
                <input
                  type="text"
                  placeholder="مثال: لفة سلك دش 100م"
                  value={newConst.label}
                  onChange={(e) => setNewConst({...newConst, label: e.target.value, key: e.target.value})}
                  className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">القسم الهندسي</label>
                  <select
                    value={newConst.subgroup}
                    onChange={(e) => setNewConst({...newConst, subgroup: e.target.value as any})}
                    className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  >
                    <option value="general">خامات عامة</option>
                    <option value="masonry">أعمال المباني</option>
                    <option value="plastering">المحارة والدهانات</option>
                    <option value="flooring">أعمال السيراميك</option>
                    <option value="plumbing">السباكة والعزل</option>
                    <option value="electrical">الكهرباء والتيار الخفيف</option>
                    <option value="hvac">التكييف المركزي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">وحدة القياس</label>
                  <input
                    type="text"
                    placeholder="مثال: ج.م، متر، لتر"
                    value={newConst.unit}
                    onChange={(e) => setNewConst({...newConst, unit: e.target.value})}
                    className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">القيمة / السعر الافتراضي</label>
                <input
                  type="number"
                  value={newConst.value || ''}
                  onChange={(e) => setNewConst({...newConst, value: parseFloat(e.target.value)})}
                  className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleAddCustomConstant}
                  disabled={!newConst.label || !newConst.value}
                  className="w-full py-3 rounded-xl bg-[#c5a880] text-[#0d0e12] font-bold shadow hover:brightness-110 transition disabled:opacity-50"
                >
                  إضافة الخامة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
