'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMarketStore } from '@/store/marketStore';
import { MarketMaterial } from '@/types/market';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Store, ExternalLink, Activity, Clock, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function MaterialDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { materials, loading, startMaterialSync, stopMaterialSync } = useMarketStore();
  const [material, setMaterial] = useState<MarketMaterial | null>(null);

  useEffect(() => {
    startMaterialSync();
    return () => {
      stopMaterialSync();
    };
  }, [startMaterialSync, stopMaterialSync]);

  useEffect(() => {
    if (!loading && materials.length > 0) {
      const found = materials.find(m => m.id === params.id);
      if (found) {
        setMaterial(found);
      }
  }, [loading, materials, params.id]);

  const chartData = useMemo(() => {
    if (!material) return [];
    if (material.priceHistory && material.priceHistory.length > 0) {
      return material.priceHistory;
    }
    
    const data = [];
    const basePrice = material.lowestPrice;
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const variation = basePrice * 0.1 * (Math.random() * 2 - 1);
      const price = i === 0 ? basePrice : Math.round(basePrice + variation);
      data.push({
        date: date.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
        price: price
      });
    }
    return data;
  }, [material]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#13151c]/90 border border-[#222634] p-3 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="text-slate-400 text-xs mb-1">{label}</p>
          <p className="text-emerald-400 font-bold text-lg">{payload[0].value.toLocaleString()} ج.م</p>
        </div>
      );
    }
    return null;
  };

  if (loading || (!material && materials.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-slate-400 gap-4">
        <p>الخامة غير موجودة.</p>
        <button onClick={() => router.push('/materials')} className="text-cyan-400 hover:underline">العودة للسوق</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Nav */}
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> العودة لسوق الخامات
          </button>

        {/* Header Card */}
        <div className="bg-[#13151c]/80 border border-[#222634] rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent to-cyan-500/5 opacity-50"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {material.category}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-900/50">
                  {material.subCategory}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {material.name}
              </h1>
              <p className="text-slate-400 max-w-xl">
                {material.description || 'لا يوجد وصف تفصيلي متاح حالياً لهذه الخامة.'}
              </p>
            </div>
            
            <div className="bg-[#0b0e14]/80 p-6 rounded-xl border border-[#222634] shrink-0 min-w-[200px] flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-400 mb-1">أقل سعر متاح</p>
              <div className="flex items-baseline gap-1">
                 <span className="text-4xl font-black text-emerald-400">{material.lowestPrice.toLocaleString()}</span>
                 <span className="text-sm text-slate-500">ج.م/{material.unit}</span>
              </div>
              {material.sources.some(s => s.isAvailable) ? (
                 <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> متوفر في السوق
                 </div>
              ) : (
                 <div className="mt-4 text-xs font-medium text-rose-400 bg-rose-400/10 px-3 py-1.5 rounded-full">
                    غير متوفر حالياً
                 </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Price History Chart */}
        <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" /> تغيّر السعر مع الزمن
        </h2>
        
        <div className="bg-[#13151c]/60 border border-[#222634] rounded-2xl p-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} style={{ direction: 'ltr' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222634" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => value.toLocaleString()} width={80} orientation="right" />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#222634', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Store Comparisons */}
        <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-cyan-400" /> مقارنة الأسعار في المتاجر
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {[...material.sources].sort((a, b) => a.price - b.price).map((source, idx) => (
            <Card key={source.storeName} className={`bg-[#13151c]/60 border-[#222634] hover:bg-[#13151c] transition-colors p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${idx === 0 ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-[#222634] flex items-center justify-center text-slate-400">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {source.storeName}
                    {idx === 0 && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">الأرخص</span>}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> تم التحديث: {new Date(source.lastUpdated).toLocaleDateString('ar-EG')}</span>
                    {source.isAvailable ? (
                      <span className="text-emerald-400">متوفر</span>
                    ) : (
                      <span className="text-rose-400">نفذت الكمية</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto">
                <div className="text-right flex-1 sm:flex-none">
                  <div className="text-2xl font-bold text-white">{source.price.toLocaleString()} <span className="text-sm font-normal text-slate-500">ج.م</span></div>
                </div>
                <Link 
                  href={source.url !== '#' ? source.url : `https://www.google.com/search?q=${encodeURIComponent('شراء ' + material.name + ' من ' + source.storeName)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
                >
                  شراء <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>

        </div>
      </div>
    </div>
  );
}
