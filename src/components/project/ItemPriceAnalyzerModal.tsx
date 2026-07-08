import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Activity, Info } from 'lucide-react';
import { BOQItem, calculateItemTotal, Zone } from '@/lib/calculations';
import { useMarketStore } from '@/store/marketStore';

interface ItemPriceAnalyzerModalProps {
  item: BOQItem;
  zones: Zone[];
  projectConstants?: Record<string, number>;
  onClose: () => void;
}

export function ItemPriceAnalyzerModal({ item, zones, projectConstants, onClose }: ItemPriceAnalyzerModalProps) {
  const { materials } = useMarketStore();

  const currentTotal = calculateItemTotal(item, zones, projectConstants);
  const unitPrice = currentTotal.quantity > 0 ? currentTotal.total / currentTotal.quantity : 0;

  // Extremely basic "Market Average" simulation based on keyword matching
  const marketAnalysis = useMemo(() => {
    if (!materials || materials.length === 0) return null;
    
    // Find market items that share words with the item title
    const keywords = item.title.split(' ').filter(w => w.length > 3);
    const relatedMaterials = materials.filter(m => 
      keywords.some(kw => m.name.includes(kw) || m.category.includes(kw))
    );

    if (relatedMaterials.length === 0) return null;

    const avgPrice = relatedMaterials.reduce((sum, m) => sum + m.lowestPrice, 0) / relatedMaterials.length;
    
    return {
      avgPrice,
      count: relatedMaterials.length,
      isHigher: unitPrice > avgPrice,
      isLower: unitPrice < avgPrice,
      difference: Math.abs(unitPrice - avgPrice)
    };
  }, [item.title, materials, unitPrice]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-cairo">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-[#1a1c24]">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            التحليل الذكي للأسعار
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-white rounded-md hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-black text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground font-medium">كود البند: {item.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1c24] border border-border p-4 rounded-xl text-center">
              <span className="block text-[10px] text-muted-foreground mb-1 font-bold">سعر الوحدة الحالي</span>
              <span className="block text-2xl font-black text-foreground">{Math.round(unitPrice).toLocaleString()} <span className="text-xs text-muted-foreground">ج.م</span></span>
            </div>
            
            <div className="bg-[#1a1c24] border border-border p-4 rounded-xl text-center relative overflow-hidden">
              <span className="block text-[10px] text-muted-foreground mb-1 font-bold">متوسط سوقي تقديري</span>
              {marketAnalysis ? (
                <span className="block text-2xl font-black text-cyan-400">{Math.round(marketAnalysis.avgPrice).toLocaleString()} <span className="text-xs text-muted-foreground">ج.م</span></span>
              ) : (
                <span className="block text-sm font-bold text-muted-foreground mt-2">لا توجد بيانات سوقية</span>
              )}
            </div>
          </div>

          {marketAnalysis && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              marketAnalysis.isHigher ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
              marketAnalysis.isLower ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              'bg-accent border-border text-secondary-foreground'
            }`}>
              {marketAnalysis.isHigher ? <TrendingUp className="w-5 h-5 shrink-0" /> :
               marketAnalysis.isLower ? <TrendingDown className="w-5 h-5 shrink-0" /> :
               <Activity className="w-5 h-5 shrink-0" />}
              
              <div className="text-right flex-1">
                <h4 className="text-sm font-bold mb-1">
                  {marketAnalysis.isHigher ? 'السعر الحالي أعلى من متوسط السوق' :
                   marketAnalysis.isLower ? 'السعر الحالي أفضل من متوسط السوق' :
                   'السعر متطابق مع متوسط السوق'}
                </h4>
                <p className="text-xs opacity-80 leading-relaxed">
                  بناءً على تحليل {marketAnalysis.count} خامة مقاربة في قاعدة بيانات السوق، يوجد فارق بمقدار <strong>{Math.round(marketAnalysis.difference).toLocaleString()} ج.م</strong> في سعر الوحدة.
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5 text-blue-400">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[10px] font-medium leading-relaxed">
              هذا التحليل هو أداة استرشادية تعتمد على مقارنة الكلمات المفتاحية للبند مع أسعار الخامات والمصنعيات المسجلة في السوق المباشر. يرجى مراجعة المواصفات بدقة قبل الاعتماد النهائي.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-[#1a1c24]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-accent hover:bg-slate-700 text-foreground text-xs font-bold rounded-lg transition"
          >
            إغلاق نافذة التحليل
          </button>
        </div>
      </div>
    </div>
  );
}
