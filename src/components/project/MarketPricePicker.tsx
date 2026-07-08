import React, { useState, useEffect } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { Search, X, Store, ArrowDownLeft } from 'lucide-react';
import { MarketMaterial } from '@/types/market';

interface MarketPricePickerProps {
  onSelect: (price: number, name: string) => void;
  onClose: () => void;
}

export function MarketPricePicker({ onSelect, onClose }: MarketPricePickerProps) {
  const { materials, startMaterialSync, stopMaterialSync, loading } = useMarketStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    startMaterialSync();
    return () => {
      stopMaterialSync();
    };
  }, [startMaterialSync, stopMaterialSync]);

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-cairo">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-[#1a1c24]">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Store className="w-4 h-4 text-cyan-400" />
            البحث في السوق المباشر
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-white rounded-md hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              placeholder="ابحث عن خامة، ماركة، أو قسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0e14] border border-border rounded-lg pl-3 pr-10 py-2.5 text-sm text-foreground focus:border-cyan-500/50 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">لا توجد نتائج مطابقة لبحثك.</p>
          ) : (
            filteredMaterials.map(material => (
              <button
                key={material.id}
                onClick={() => {
                  onSelect(material.lowestPrice, material.name);
                  onClose();
                }}
                className="w-full text-right bg-[#0b0e14] border border-border hover:border-cyan-500/50 hover:bg-[#1a1c24] p-3 rounded-xl transition flex justify-between items-center group"
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-cyan-400 transition">{material.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded">{material.category}</span>
                    {material.brand && <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">{material.brand}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <span className="text-sm font-black text-emerald-400 block">{material.lowestPrice.toLocaleString()} ج.م</span>
                    <span className="text-[9px] text-muted-foreground">لكل {material.unit}</span>
                  </div>
                  <ArrowDownLeft className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition" />
                </div>
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
