'use client';

import React, { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { InventoryTransaction } from '@/lib/project-service';
import { Package, Plus, ArrowDownRight, ArrowUpRight, AlertTriangle, Search, Filter } from 'lucide-react';
import { generateId } from '@/lib/utils';

export default function ProjectInventoryTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const user = useAuthStore((state) => state.user);

  const [transactions, setTransactions] = useState<InventoryTransaction[]>(currentProject?.inventory || []);
  const [isAdding, setIsAdding] = useState(false);
  const [txType, setTxType] = useState<'in' | 'out'>('in');
  
  // Form state
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('م2');
  const [notes, setNotes] = useState('');
  const [relatedItemId, setRelatedItemId] = useState('');

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  // Calculate stock balance
  const inventoryBalance = useMemo(() => {
    const balance: Record<string, { in: number, out: number, unit: string }> = {};
    
    transactions.forEach(tx => {
      if (!balance[tx.materialName]) {
        balance[tx.materialName] = { in: 0, out: 0, unit: tx.unit };
      }
      if (tx.type === 'in') {
        balance[tx.materialName].in += tx.quantity;
      } else {
        balance[tx.materialName].out += tx.quantity;
      }
    });
    
    return balance;
  }, [transactions]);

  // All active items from BOQ for dropdown
  const activeItems = currentProject.items.filter(it => it.isActive);

  const handleSaveTransaction = async () => {
    if (!materialName || quantity <= 0) {
      alert('يرجى إدخال اسم الخامة وكمية صحيحة.');
      return;
    }

    if (txType === 'out') {
      const currentStock = (inventoryBalance[materialName]?.in || 0) - (inventoryBalance[materialName]?.out || 0);
      if (quantity > currentStock) {
        if (!confirm(`تحذير: الكمية المنصرفة (${quantity}) أكبر من الرصيد المتاح بالمخزن (${currentStock}). هل تريد الاستمرار بالسحب بالسالب؟`)) {
          return;
        }
      }
    }

    const newTx: InventoryTransaction = {
      id: generateId(),
      type: txType,
      date: new Date().toISOString(),
      materialName,
      quantity,
      unit,
      notes,
      recordedBy: user?.name || user?.email?.split('@')[0] || 'أمين المخزن',
      ...(txType === 'out' && relatedItemId ? { relatedItemId } : {})
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    await updateProject({ inventory: updatedTxs });
    
    // Reset Form
    setIsAdding(false);
    setMaterialName(''); setQuantity(0); setNotes(''); setRelatedItemId('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222634] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-400" />
            المخازن والمواد (Inventory)
          </h3>
          <p className="text-xs text-slate-400 mt-1">إدارة وارد ومنصرف الخامات للموقع وتتبع الكميات المتبقية.</p>
        </div>
        
        {canEdit && !isAdding && (
          <div className="flex gap-2">
            <button
              onClick={() => { setTxType('in'); setIsAdding(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow"
            >
              <ArrowDownRight className="w-4 h-4" />
              تسجيل وارد (استلام)
            </button>
            <button
              onClick={() => { setTxType('out'); setIsAdding(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition shadow"
            >
              <ArrowUpRight className="w-4 h-4" />
              تسجيل منصرف (صرف)
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <div className={`border p-5 rounded-xl space-y-4 shadow-xl relative overflow-hidden ${txType === 'in' ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-rose-950/20 border-rose-900/50'}`}>
          <div className={`absolute top-0 right-0 w-full h-1 ${txType === 'in' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <h4 className={`text-sm font-bold flex items-center gap-2 ${txType === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {txType === 'in' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            {txType === 'in' ? 'إذن إضافة للمخزن (وارد)' : 'إذن صرف من المخزن (منصرف)'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">اسم الخامة</label>
              <input 
                type="text" placeholder="مثال: أسمنت بورتلاندي" value={materialName} onChange={e => setMaterialName(e.target.value)}
                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">الكمية</label>
              <input 
                type="number" min="0" step="0.01" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">الوحدة</label>
              <input 
                type="text" placeholder="طن، م2، شيكارة..." value={unit} onChange={e => setUnit(e.target.value)}
                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            {txType === 'out' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">صرف لصالح بند (اختياري)</label>
                <select 
                  value={relatedItemId} onChange={e => setRelatedItemId(e.target.value)}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
                >
                  <option value="">بدون ربط</option>
                  {activeItems.map(item => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-400 mb-1">ملاحظات المستلم/الصارف</label>
              <input 
                type="text" placeholder="..." value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition">إلغاء</button>
            <button onClick={handleSaveTransaction} className={`px-5 py-2 rounded text-white text-xs font-bold transition shadow-lg ${txType === 'in' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
              حفظ وتأكيد الإذن
            </button>
          </div>
        </div>
      )}

      {/* Inventory Balance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Stock Balance */}
        <div className="lg:col-span-1 bg-[#13151c] border border-[#222634] rounded-xl p-5">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-[#222634] pb-2">
            <Package className="w-4 h-4 text-indigo-400" />
            أرصدة المخزن الحالية
          </h4>
          {Object.keys(inventoryBalance).length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">المخزن فارغ حالياً.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(inventoryBalance).map(([mat, data]) => {
                const currentStock = data.in - data.out;
                const isLow = currentStock <= 0;
                return (
                  <div key={mat} className="flex justify-between items-center bg-[#1a1c24] p-3 rounded border border-[#222634]">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">{mat}</span>
                      <span className="text-[10px] text-slate-500 mt-1">إجمالي الوارد: {data.in} | المنصرف: {data.out}</span>
                    </div>
                    <div className={`text-sm font-black px-2 py-1 rounded ${isLow ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      {currentStock} <span className="text-[10px] font-normal">{data.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Transaction Log */}
        <div className="lg:col-span-2 bg-[#13151c] border border-[#222634] rounded-xl p-5">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-[#222634] pb-2">
            <Filter className="w-4 h-4 text-slate-400" />
            سجل حركات المخزن
          </h4>
          
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#1a1c24] border border-[#222634] p-3 rounded-lg hover:border-slate-700 transition gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {tx.type === 'in' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{tx.materialName}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-semibold">
                      <span>بواسطة: {tx.recordedBy}</span>
                      <span>•</span>
                      <span>{new Date(tx.date).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:justify-end">
                  {tx.relatedItemId && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 hidden sm:block truncate max-w-[150px]">
                      بند: {activeItems.find(i => i.id === tx.relatedItemId)?.title || 'بند محذوف'}
                    </span>
                  )}
                  <div className={`text-sm font-black text-left w-24 ${tx.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'in' ? '+' : '-'}{tx.quantity} <span className="text-xs font-normal">{tx.unit}</span>
                  </div>
                </div>
                {tx.notes && (
                  <div className="w-full sm:hidden text-[10px] text-slate-400 mt-1 italic">
                    ملاحظة: {tx.notes}
                  </div>
                )}
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-bold">لا توجد حركات مخزنية مسجلة.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
