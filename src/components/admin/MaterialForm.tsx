'use client';

import { useState, useEffect } from 'react';
import { MarketMaterial, MarketCategory, MarketSubCategory, MarketPhase, MarketSource } from '@/types/market';
import { useMarketStore } from '@/store/marketStore';
import { Save, Plus, Trash2, X, PlusCircle, Store } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface MaterialFormProps {
  initialData?: MarketMaterial;
  onClose: () => void;
}

const CATEGORIES: MarketCategory[] = [
  'بناء', 'كهرباء', 'سباكة', 'تكييف', 'دهانات', 'أرضيات', 'نجارة',
  'العزل والمواد الخصوصية', 'الأسقف والجبسون بورد', 'الألوميتال والزجاج',
  'التيار الخفيف والأنظمة', 'المطابخ والرخام', 'الواجهات واللاند سكيب',
  'أدوات ومعدات التنفيذ', 'ديكورات وتكسيات', 'أخرى'
];

// Simplified mapping for the form (not exhaustive, but covers main ones)
const SUBCATEGORIES: Record<string, MarketSubCategory[]> = {
  'بناء': ['أسمنت', 'رمل ناعم', 'رمل خشن', 'طوب أحمر', 'حديد تسليح', 'زلط وسن', 'خشب مقاولات', 'طوب أسمنتي', 'شبك فيبر'],
  'كهرباء': ['لوحات توزيع', 'قواطع', 'أسلاك نحاس', 'خراطيم', 'علب تأسيس', 'مفاتيح وفيش', 'كشافات وإضاءة'],
  'سباكة': ['مواسير سباكة', 'صرف', 'عزل حراري', 'خلاطات وأحواض', 'إكسسوارات حمام', 'سخانات مياه', 'مواتير مياه', 'أطقم حمامات'],
  'أرضيات': ['سيراميك', 'بورسلين', 'رخام طبيعي', 'SPC', 'باركيه', 'HDF/MDF', 'إكسسوارات أرضيات'],
  'دهانات': ['معجون', 'سيلر', 'بلاستيك', 'أكريليك', 'لاكيه', 'دهانات ديكورية', 'تنر ومذيبات'],
  'نجارة': ['أبواب وحلوق', 'أبواب مصفحة', 'إكسسوارات أبواب'],
  'تكييف': ['تكييفات', 'مواسير تأسيس', 'شفاطات', 'دكت', 'جريلات تهوية'],
  'العزل والمواد الخصوصية': ['عزل مائي', 'عزل حراري وصوتي', 'إيبوكسي'],
  'الأسقف والجبسون بورد': ['جبسون بورد', 'إكسسوارات أسقف', 'أسقف معلقة'],
  'الألوميتال والزجاج': ['ألوميتال', 'uPVC', 'زجاج ومرايا', 'كبائن شاور'],
  'التيار الخفيف والأنظمة': ['سمارت هوم', 'ساوند سيستم', 'كاميرات مراقبة', 'شبكات وإنترنت', 'إنذار حريق', 'إنتركم'],
  'المطابخ والرخام': ['رخام وجرانيت', 'أحواض مطابخ', 'خامات مطابخ', 'أجهزة بلت-إن'],
  'ديكورات وتكسيات': ['بديل خشب WPC', 'بديل رخام', 'ورق حائط', 'حجر ديكوري', 'كرانيش وزوايا'],
};

const PHASES: MarketPhase[] = ['تأسيس', 'فنش', 'إكسسوارات'];

export default function MaterialForm({ initialData, onClose }: MaterialFormProps) {
  const { addOrUpdateMaterial } = useMarketStore();
  
  const [formData, setFormData] = useState<Partial<MarketMaterial>>({
    id: '',
    name: '',
    category: 'بناء',
    subCategory: 'أسمنت',
    phase: 'تأسيس',
    unit: 'وحدة',
    brand: '',
    lowestPrice: 0,
    sources: [],
    ...initialData
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialData) {
      setFormData(prev => ({ ...prev, id: uuidv4() }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'lowestPrice' ? Number(value) : value }));
  };

  const handleAddSource = () => {
    setFormData(prev => ({
      ...prev,
      sources: [
        ...(prev.sources || []),
        { storeName: '', price: 0, url: '', isAvailable: true, lastUpdated: Date.now() }
      ]
    }));
  };

  const handleUpdateSource = (index: number, field: keyof MarketSource, value: any) => {
    setFormData(prev => {
      const newSources = [...(prev.sources || [])];
      newSources[index] = { ...newSources[index], [field]: value };
      
      // Update lowest price automatically
      const lowest = Math.min(...newSources.map(s => s.price).filter(p => p > 0));
      return { ...prev, sources: newSources, lowestPrice: lowest > 0 ? lowest : prev.lowestPrice };
    });
  };

  const handleRemoveSource = (index: number) => {
    setFormData(prev => {
      const newSources = [...(prev.sources || [])];
      newSources.splice(index, 1);
      
      const lowest = newSources.length > 0 ? Math.min(...newSources.map(s => s.price).filter(p => p > 0)) : 0;
      return { ...prev, sources: newSources, lowestPrice: lowest > 0 ? lowest : 0 };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.unit) {
      alert('يرجى تعبئة الحقول الأساسية: الاسم، التصنيف، الوحدة');
      return;
    }

    setLoading(true);
    try {
      await addOrUpdateMaterial(formData as MarketMaterial);
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const availableSubCategories = SUBCATEGORIES[formData.category as string] || ['أخرى'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#13151c] border border-[#222634] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-[#222634]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {initialData ? 'تعديل بيانات الخامة' : 'إضافة خامة جديدة'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="material-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">اسم الخامة <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="مثال: أسمنت بورتلاندي السويس"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">الماركة / العلامة التجارية</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="مثال: السويس للأسمنت"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">التصنيف الأساسي <span className="text-rose-500">*</span></label>
                <select
                  required
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">التصنيف الفرعي <span className="text-rose-500">*</span></label>
                <select
                  required
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {availableSubCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">المرحلة</label>
                <select
                  name="phase"
                  value={formData.phase}
                  onChange={handleChange}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">الوحدة القياسية <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="مثال: شيكارة، م2، لفة"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">أقل سعر (ج.م)</label>
                <input
                  type="number"
                  name="lowestPrice"
                  value={formData.lowestPrice}
                  readOnly
                  className="w-full bg-[#13151c] border border-[#222634] rounded-lg px-4 py-2.5 text-emerald-400 font-bold focus:outline-none cursor-not-allowed"
                  placeholder="يحسب تلقائياً من المتاجر"
                />
              </div>
            </div>

            {/* Sources */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-400" />
                  المتاجر ومصادر الأسعار
                </h3>
                <button
                  type="button"
                  onClick={handleAddSource}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 transition-all text-sm font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  إضافة متجر
                </button>
              </div>

              <div className="space-y-4">
                {formData.sources?.map((source, index) => (
                  <div key={index} className="p-4 bg-[#1a1c24] border border-[#222634] rounded-xl flex flex-wrap lg:flex-nowrap gap-4 items-end relative group">
                    <div className="w-full lg:w-1/4 space-y-2">
                      <label className="text-xs font-medium text-slate-400">اسم المتجر</label>
                      <input
                        type="text"
                        value={source.storeName}
                        onChange={(e) => handleUpdateSource(index, 'storeName', e.target.value)}
                        className="w-full bg-[#13151c] border border-[#222634] rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="w-full lg:w-1/4 space-y-2">
                      <label className="text-xs font-medium text-slate-400">السعر (ج.م)</label>
                      <input
                        type="number"
                        value={source.price}
                        onChange={(e) => handleUpdateSource(index, 'price', Number(e.target.value))}
                        className="w-full bg-[#13151c] border border-[#222634] rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="w-full lg:w-2/4 space-y-2">
                      <label className="text-xs font-medium text-slate-400">الرابط الإلكتروني (URL)</label>
                      <input
                        type="url"
                        value={source.url}
                        onChange={(e) => handleUpdateSource(index, 'url', e.target.value)}
                        className="w-full bg-[#13151c] border border-[#222634] rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none text-left"
                        dir="ltr"
                      />
                    </div>
                    <div className="w-full lg:w-auto flex items-center gap-2 pb-2">
                      <label className="text-sm text-slate-300 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={source.isAvailable}
                          onChange={(e) => handleUpdateSource(index, 'isAvailable', e.target.checked)}
                          className="w-4 h-4 rounded bg-[#13151c] border-[#222634] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#1a1c24]"
                        />
                        متوفر؟
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(index)}
                      className="absolute top-2 left-2 p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                      title="حذف المتجر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {formData.sources?.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-[#222634] rounded-xl text-slate-500">
                    لم يتم إضافة أي متاجر بعد.
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-[#222634] flex justify-end gap-3 bg-[#13151c] rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            إلغاء
          </button>
          <button
            form="material-form"
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : (
              <>
                <Save className="w-5 h-5" />
                حفظ الخامة
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
