'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { DEFAULT_ITEMS, DEFAULT_SECTIONS } from '@/lib/default-items';
import { Database, Save, Info, AlertCircle, Edit, DollarSign, Check } from 'lucide-react';

interface PriceListItem {
  itemId: string;
  title: string;
  sectionId: string;
  unit: string;
  materialUnitPrice: number;
  laborUnitPrice: number;
  dailyRate: number;
  mode: 'materials_labor_split' | 'lump_sum' | 'daily_rate';
}

export default function AdminPriceListPage() {
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const router = useRouter();

  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

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

    async function loadPriceCatalog() {
      setLoadingPrices(true);
      try {
        // Load custom database rates if present
        const dbPricesSnapshot = await getDocs(collection(db, 'priceList'));
        const dbPricesMap: Record<string, any> = {};
        dbPricesSnapshot.forEach(docSnap => {
          dbPricesMap[docSnap.id] = docSnap.data();
        });

        // Map template items with database overrides
        const list: PriceListItem[] = DEFAULT_ITEMS.map((item) => {
          const dbOverride = dbPricesMap[item.id] || {};
          return {
            itemId: item.id,
            title: item.title,
            sectionId: item.sectionId,
            unit: item.unit,
            materialUnitPrice: dbOverride.materialUnitPrice !== undefined ? dbOverride.materialUnitPrice : item.defaultPricing.materialUnitPrice,
            laborUnitPrice: dbOverride.laborUnitPrice !== undefined ? dbOverride.laborUnitPrice : item.defaultPricing.laborUnitPrice,
            dailyRate: dbOverride.dailyRate !== undefined ? dbOverride.dailyRate : item.defaultPricing.dailyRate,
            mode: dbOverride.mode || item.defaultPricing.mode
          };
        });

        setPriceList(list);
      } catch (err) {
        console.error('Failed to load pricing catalogue:', err);
      } finally {
        setLoadingPrices(false);
      }
    }

    loadPriceCatalog();
  }, [user]);

  const handlePriceChange = (itemId: string, field: 'materialUnitPrice' | 'laborUnitPrice' | 'dailyRate', value: string) => {
    const numVal = Number(value) || 0;
    setPriceList(prev => prev.map(item => item.itemId === itemId ? { ...item, [field]: numVal } : item));
  };

  const handleSavePriceItem = async (item: PriceListItem) => {
    setSavingId(item.itemId);
    try {
      const docRef = doc(db, 'priceList', item.itemId);
      await setDoc(docRef, {
        materialUnitPrice: item.materialUnitPrice,
        laborUnitPrice: item.laborUnitPrice,
        dailyRate: item.dailyRate,
        mode: item.mode,
        updatedAt: new Date().toISOString()
      });

      setSaveSuccessId(item.itemId);
      setTimeout(() => setSaveSuccessId(null), 2000);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء حفظ التعديل.');
    } finally {
      setSavingId(null);
    }
  };

  if (loadingAuth || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d0e12]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] flex flex-col font-cairo select-none pb-12">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#c5a880]/10 text-[#c5a880] shadow">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">كتالوج قائمة الأسعار الافتراضية</h1>
            <p className="text-xs text-slate-400 mt-0.5">تعديل الأسعار الافتراضية للخامات ومصنعيات البنود عند إنشاء مقايسات جديدة.</p>
          </div>
        </div>

        {/* Informational Tip */}
        <div className="rounded-xl border border-[#222634] bg-slate-900/40 p-4 flex gap-3 text-slate-400 text-xs font-semibold leading-relaxed">
          <Info className="h-5 w-5 text-[#c5a880] shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-bold">منطق كتالوج الأسعار</p>
            <p className="text-slate-400 mt-1 font-medium">
              عند إدخال وتحديث أي سعر لوحدة هنا، سيتلقاها المهندس تلقائياً كمقترح افتراضي عند قيامه بإنشاء أي مشروع حصر جديد. لا تؤثر هذه التعديلات على المشاريع القائمة التي تم العمل عليها وتثبيت تكاليفها بالفعل لضمان استقرار العقود.
            </p>
          </div>
        </div>

        {/* Pricing catalogue tree table */}
        {loadingPrices ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
            <p className="text-xs text-slate-400">جاري تحميل كتالوج الأسعار الافتراضية...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {DEFAULT_SECTIONS.map((sec) => {
              const secPrices = priceList.filter(it => it.sectionId === sec.id);
              if (secPrices.length === 0) return null;

              return (
                <div key={sec.id} className="overflow-x-auto border border-[#222634] rounded-xl bg-[#13151c] shadow-lg">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#1a1c24] border-b border-[#222634] font-bold text-white">
                      <tr>
                        <th className="p-3 text-right text-[#c5a880]" colSpan={6}>
                          {sec.id} - {sec.title}
                        </th>
                      </tr>
                      <tr className="bg-[#1a1c24]/80 text-slate-400 border-b border-[#222634] text-[10px]">
                        <th className="p-3 text-right">بيان بند الحصر</th>
                        <th className="p-3 text-center w-20">الوحدة</th>
                        <th className="p-3 text-center w-36">سعر الخامات المقترح (ج.م)</th>
                        <th className="p-3 text-center w-36">سعر المصنعية المقترح (ج.م)</th>
                        <th className="p-3 text-center w-36">يومية الصنايعي (ج.م)</th>
                        <th className="p-3 text-center w-28">حفظ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222634] text-slate-300">
                      {secPrices.map((item) => (
                        <tr key={item.itemId} className="hover:bg-slate-900/20">
                          <td className="p-3 font-semibold text-white">
                            <span className="text-[10px] text-slate-500 font-bold block">{item.itemId}</span>
                            {item.title}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-400">{item.unit}</td>
                          
                          {/* Materials Rate */}
                          <td className="p-2 text-center">
                            {item.mode === 'materials_labor_split' ? (
                              <input
                                type="number"
                                value={item.materialUnitPrice}
                                onChange={(e) => handlePriceChange(item.itemId, 'materialUnitPrice', e.target.value)}
                                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-[#c5a880]"
                              />
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Labor Rate */}
                          <td className="p-2 text-center">
                            {item.mode === 'materials_labor_split' ? (
                              <input
                                type="number"
                                value={item.laborUnitPrice}
                                onChange={(e) => handlePriceChange(item.itemId, 'laborUnitPrice', e.target.value)}
                                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-[#c5a880]"
                              />
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Daily rate */}
                          <td className="p-2 text-center">
                            {item.mode === 'daily_rate' ? (
                              <input
                                type="number"
                                value={item.dailyRate}
                                onChange={(e) => handlePriceChange(item.itemId, 'dailyRate', e.target.value)}
                                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-[#c5a880]"
                              />
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Save Control */}
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleSavePriceItem(item)}
                              disabled={savingId === item.itemId}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition mx-auto ${
                                saveSuccessId === item.itemId
                                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              {savingId === item.itemId ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              ) : saveSuccessId === item.itemId ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              حفظ السعر
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
