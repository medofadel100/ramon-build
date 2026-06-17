'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { MarketCategory, MarketSubCategory, MarketMaterial } from '@/types/market';
import { Card } from '@/components/ui/card';
import { Search, Filter, Store, Activity, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function MaterialsMarketplacePage() {
  const { materials, loading, fetchMaterials } = useMarketStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'الكل'>('الكل');
  
  const categories: (MarketCategory | 'الكل')[] = [
    'الكل', 'بناء', 'كهرباء', 'سباكة', 'تكييف', 'دهانات', 'أرضيات', 'نجارة', 'سمارت هوم', 'أخرى'
  ];

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Seed Dummy Data if empty (only for development testing)
  useEffect(() => {
    const seedDummyData = async () => {
      if (!loading && materials.length === 0) {
        const dummy: MarketMaterial = {
          id: 'dummy_cement_1',
          name: 'أسمنت بورتلاندي 50 كجم',
          category: 'بناء',
          subCategory: 'أسمنت',
          unit: 'شكارة',
          lowestPrice: 120,
          sources: [
            { storeName: 'Ahmed Elsallab', price: 125, isAvailable: true, url: '#', lastUpdated: Date.now() },
            { storeName: 'Abdo Market', price: 120, isAvailable: true, url: '#', lastUpdated: Date.now() },
          ]
        };
        const dummy2: MarketMaterial = {
          id: 'dummy_wire_2',
          name: 'لفة سلك نحاس 3 مم السويدي',
          category: 'كهرباء',
          subCategory: 'أسلاك نحاس',
          unit: 'لفة',
          lowestPrice: 1500,
          sources: [
            { storeName: 'Amazon.eg', price: 1500, isAvailable: true, url: '#', lastUpdated: Date.now() },
            { storeName: 'LSweefi', price: 1550, isAvailable: true, url: '#', lastUpdated: Date.now() },
          ]
        };
        await useMarketStore.getState().addOrUpdateMaterial(dummy);
        await useMarketStore.getState().addOrUpdateMaterial(dummy2);
      }
    };
    seedDummyData();
  }, [materials.length, loading]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'الكل' || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [materials, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 font-sans p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">سوق الخامات</h1>
            <p className="text-slate-400 mt-1">تابع أسعار مواد التشطيب والتأسيس من مختلف المتاجر أولاً بأول.</p>
          </div>
          <div className="flex gap-2">
             <div className="bg-slate-900/50 border border-[#222634] rounded-lg p-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium">تحديث مباشر</span>
             </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 space-y-6 shrink-0">
             <div className="bg-[#13151c]/80 border border-[#222634] rounded-xl p-5 backdrop-blur-xl">
               <h3 className="flex items-center gap-2 font-semibold text-white mb-4">
                 <Filter className="w-4 h-4 text-cyan-400" /> التصنيفات
               </h3>
               <div className="space-y-2">
                 {categories.map(cat => (
                   <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={`w-full text-right px-3 py-2 rounded-lg transition-all text-sm ${
                       selectedCategory === cat 
                         ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 font-medium' 
                         : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          <div className="flex-1 space-y-6">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="ابحث عن خامة، أداة، أو علامة تجارية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#13151c]/80 border border-[#222634] rounded-xl py-4 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-lg"
              />
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-20 bg-[#13151c]/50 rounded-xl border border-dashed border-[#222634]">
                <p className="text-slate-400">لا توجد خامات مطابقة للبحث.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMaterials.map(material => (
                  <Link href={`/materials/${material.id}`} key={material.id}>
                    <Card className="bg-[#13151c]/60 border-[#222634] hover:border-cyan-500/30 hover:bg-[#13151c] transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col">
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
                            {material.subCategory}
                          </span>
                          {material.sources.some(s => s.isAvailable) ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              متوفر
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full">
                              غير متوفر
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors mb-4 line-clamp-2">
                          {material.name}
                        </h3>
                        
                        <div className="space-y-3 mt-auto">
                           <div className="flex justify-between items-end border-t border-[#222634] pt-4">
                              <p className="text-sm text-slate-400">أقل سعر:</p>
                              <div className="text-right">
                                <span className="text-2xl font-black text-emerald-400">{material.lowestPrice.toLocaleString()}</span>
                                <span className="text-xs text-slate-500 mr-1">ج.م / {material.unit}</span>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2 pt-2">
                              {material.sources.slice(0, 3).map((source, idx) => (
                                 <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-[#222634]">
                                    <Store className="w-3 h-3" />
                                    <span>{source.storeName}</span>
                                 </div>
                              ))}
                              {material.sources.length > 3 && (
                                <span className="text-xs text-slate-500">+{material.sources.length - 3}</span>
                              )}
                           </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
