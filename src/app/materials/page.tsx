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
  const [selectedPhase, setSelectedPhase] = useState<'الكل' | 'تأسيس' | 'فنش' | 'إكسسوارات'>('الكل');
  const [selectedBrand, setSelectedBrand] = useState<string>('الكل');
  
  const categories: (MarketCategory | 'الكل')[] = [
    'الكل', 'بناء', 'كهرباء', 'سباكة', 'تكييف', 'دهانات', 'أرضيات', 'نجارة',
    'العزل والمواد الخصوصية', 'الأسقف والجبسون بورد', 'الألوميتال والزجاج',
    'التيار الخفيف والأنظمة', 'المطابخ والرخام', 'الواجهات واللاند سكيب'
  ];

  const phases = ['الكل', 'تأسيس', 'فنش', 'إكسسوارات'] as const;

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Reset selected brand when category changes
  useEffect(() => {
    setSelectedBrand('الكل');
  }, [selectedCategory]);

  const availableBrands = useMemo(() => {
    // Only get brands for the current category to avoid a huge list
    const currentCatMaterials = materials.filter(m => selectedCategory === 'الكل' || m.category === selectedCategory);
    const brands = new Set<string>();
    currentCatMaterials.forEach(m => {
      if (m.brand) brands.add(m.brand);
    });
    return ['الكل', ...Array.from(brands).sort()];
  }, [materials, selectedCategory]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.brand && m.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCategory === 'الكل' || m.category === selectedCategory;
      const matchPhase = selectedPhase === 'الكل' || m.phase === selectedPhase;
      const matchBrand = selectedBrand === 'الكل' || m.brand === selectedBrand;
      
      return matchSearch && matchCat && matchPhase && matchBrand;
    });
  }, [materials, searchTerm, selectedCategory, selectedPhase, selectedBrand]);

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
            {/* Search Bar & Phase Filters */}
            <div className="space-y-4">
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

              {/* Phase Filters */}
              <div className="flex gap-2 flex-wrap">
                {phases.map(phase => (
                  <button
                    key={phase}
                    onClick={() => setSelectedPhase(phase)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedPhase === phase
                        ? 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-[#13151c]/80 text-slate-400 border border-[#222634] hover:bg-slate-800'
                    }`}
                  >
                    {phase}
                  </button>
                ))}
              </div>
              
              {/* Dynamic Brand Filters (Only show if there are brands) */}
              {availableBrands.length > 1 && (
                <div className="flex gap-2 flex-wrap pt-2 border-t border-[#222634]/50">
                  <span className="text-sm text-slate-500 py-1.5 px-2">الماركات:</span>
                  {availableBrands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        selectedBrand === brand
                          ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                          : 'bg-[#13151c] text-slate-400 border border-[#222634] hover:bg-slate-800'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
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
                    <Card className="relative bg-[#13151c]/80 border-[#222634] hover:border-cyan-500/50 hover:bg-[#13151c] transition-all duration-500 overflow-hidden group cursor-pointer h-full flex flex-col hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1">
                      {/* Premium subtle gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      
                      <div className="p-6 flex-1 flex flex-col relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50 backdrop-blur-sm">
                              {material.subCategory}
                            </span>
                            {material.phase && (
                              <span className={`text-xs font-bold px-3 py-1 rounded-full border backdrop-blur-sm shadow-sm ${
                                material.phase === 'تأسيس' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                material.phase === 'فنش' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}>
                                {material.phase}
                              </span>
                            )}
                            {material.brand && (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 backdrop-blur-sm shadow-sm">
                                {material.brand}
                              </span>
                            )}
                          </div>
                          {material.sources.some(s => s.isAvailable) ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              متوفر
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">
                              غير متوفر
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-emerald-400 transition-all duration-300 mb-4 leading-relaxed line-clamp-2">
                          {material.name}
                        </h3>
                        
                        <div className="space-y-4 mt-auto">
                           <div className="flex justify-between items-end border-t border-slate-800/60 pt-4">
                              <p className="text-sm font-medium text-slate-400">أقل سعر بالسوق</p>
                              <div className="text-right flex items-baseline gap-1.5">
                                <span className="text-3xl font-black tracking-tight text-emerald-400 drop-shadow-sm">{material.lowestPrice.toLocaleString()}</span>
                                <span className="text-sm font-medium text-slate-500">ج.م / {material.unit}</span>
                              </div>
                           </div>
                           
                           <div className="flex flex-wrap items-center gap-2 pt-2 relative z-20">
                              {material.sources.slice(0, 3).map((source, idx) => (
                                 <a 
                                   key={idx} 
                                   href={source.url !== '#' ? source.url : `https://www.google.com/search?q=${encodeURIComponent('شراء ' + material.name + ' من ' + source.storeName)}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   onClick={(e) => e.stopPropagation()}
                                   className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-md border border-slate-800 shadow-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-all cursor-pointer"
                                 >
                                    <Store className="w-3.5 h-3.5 text-cyan-500" />
                                    <span>{source.storeName}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                 </a>
                              ))}
                              {material.sources.length > 3 && (
                                <span className="text-xs font-medium text-slate-500 bg-slate-900/50 px-2 py-1 rounded-md">+{material.sources.length - 3} متاجر</span>
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
