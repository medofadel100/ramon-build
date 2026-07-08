'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { MarketMaterial } from '@/types/market';
import MaterialForm from '@/components/admin/MaterialForm';
import { Search, Plus, Edit2, Trash2, Shield, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function AdminMaterialsPage() {
  const { materials, loading, startMaterialSync, stopMaterialSync, deleteMaterial } = useMarketStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MarketMaterial | undefined>(undefined);

  useEffect(() => {
    startMaterialSync();
    return () => {
      stopMaterialSync();
    };
  }, [startMaterialSync, stopMaterialSync]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.brand && m.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [materials, searchTerm]);

  const handleEdit = (material: MarketMaterial) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الخامة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      try {
        await deleteMaterial(id);
      } catch (err) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-foreground font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-rose-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                  إدارة سوق الخامات
                </h1>
              </div>
              <p className="text-muted-foreground mt-2">
                لوحة تحكم الإدارة لإضافة، وتعديل، وحذف الخامات والمنتجات المسعرة.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/materials" className="bg-muted/50 border border-border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-slate-800 transition-colors">
                 عودة للسوق
              </Link>
              <button
                onClick={() => {
                  setEditingMaterial(undefined);
                  setIsFormOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-lg px-4 py-2 flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <Plus className="w-5 h-5" />
                إضافة خامة جديدة
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl">
            {/* Toolbar */}
            <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1a1c24]">
              <div className="relative w-full md:w-96">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الماركة، أو التصنيف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg py-2.5 pr-10 pl-4 text-foreground placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all"
                />
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                إجمالي الخامات: <span className="text-foreground font-bold">{filteredMaterials.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#222634]/50 text-secondary-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold">اسم الخامة / الماركة</th>
                    <th className="px-6 py-4 font-bold">التصنيف</th>
                    <th className="px-6 py-4 font-bold">المرحلة</th>
                    <th className="px-6 py-4 font-bold text-center">المتاجر</th>
                    <th className="px-6 py-4 font-bold">أقل سعر</th>
                    <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222634]">
                  {loading && materials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                          جاري تحميل الخامات...
                        </div>
                      </td>
                    </tr>
                  ) : filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2 opacity-50" />
                        لا توجد خامات مطابقة للبحث.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map(material => (
                      <tr key={material.id} className="hover:bg-[#1a1c24]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{material.name}</div>
                          {material.brand && <div className="text-xs text-muted-foreground mt-1">{material.brand}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-secondary-foreground">{material.category}</div>
                          <div className="text-xs text-muted-foreground mt-1">{material.subCategory}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            material.phase === 'تأسيس' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                            material.phase === 'فنش' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}>
                            {material.phase || 'غير محدد'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent text-secondary-foreground font-bold text-xs border border-border">
                            {material.sources?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-emerald-400">{material.lowestPrice.toLocaleString()} ج.م</div>
                          <div className="text-[10px] text-muted-foreground mt-1">لكل {material.unit}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(material)}
                              className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors"
                              title="تعديل الخامة"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(material.id)}
                              className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                              title="حذف الخامة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <MaterialForm
          initialData={editingMaterial}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
