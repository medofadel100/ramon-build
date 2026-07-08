'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { RFQ } from '@/lib/project-service';
import { ShoppingCart, Plus, MessageCircle, FileText, CheckCircle2, Store, PackageSearch, Users } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { generateWhatsAppLink } from '@/lib/whatsapp';

export default function ProjectProcurementTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const user = useAuthStore((state) => state.user);

  const [rfqs, setRfqs] = useState<RFQ[]>(currentProject?.rfqs || []);
  const [isAdding, setIsAdding] = useState(false);
  
  // New RFQ State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedItems, setSelectedItems] = useState<{itemName: string, quantity: number, unit: string}[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<{supplierId: string, supplierName: string, phone: string}[]>([]);
  
  // Temp inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('م2');

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');
  const projectSuppliers = currentProject.suppliers || [];
  const projectWorkers = currentProject.workers || []; // For subcontractor bidding

  const handleAddItem = () => {
    if (!newItemName) return;
    setSelectedItems([...selectedItems, { itemName: newItemName, quantity: newItemQty, unit: newItemUnit }]);
    setNewItemName('');
    setNewItemQty(1);
  };

  const handleSaveRFQ = async () => {
    if (!title || selectedItems.length === 0 || selectedSuppliers.length === 0) {
      alert('يرجى التأكد من إدخال عنوان للطلب، واختيار بنود وموردين.');
      return;
    }

    const newRfq: RFQ = {
      id: generateId(),
      title,
      description,
      status: 'sent',
      dateCreated: new Date().toISOString(),
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: user?.name || user?.email?.split('@')[0] || 'مهندس الموقع',
      items: selectedItems,
      suppliers: selectedSuppliers.map(s => ({ supplierId: s.supplierId, supplierName: s.supplierName }))
    };

    const updatedRfqs = [newRfq, ...rfqs];
    setRfqs(updatedRfqs);
    await updateProject({ rfqs: updatedRfqs });
    
    // Reset
    setIsAdding(false);
    setTitle(''); setDescription(''); setDueDate('');
    setSelectedItems([]); setSelectedSuppliers([]);
  };

  const toggleSupplier = (supplierId: string, supplierName: string, phone: string) => {
    if (selectedSuppliers.find(s => s.supplierId === supplierId)) {
      setSelectedSuppliers(selectedSuppliers.filter(s => s.supplierId !== supplierId));
    } else {
      setSelectedSuppliers([...selectedSuppliers, { supplierId, supplierName, phone }]);
    }
  };

  const sendWhatsApp = (rfq: RFQ, supplierId: string) => {
    const supplierPhone = projectSuppliers.find(s => s.id === supplierId)?.phone 
                          || projectWorkers.find(w => w.id === supplierId)?.phone;
                          
    if (!supplierPhone) {
      alert('لا يوجد رقم هاتف مسجل لهذا المورد/المقاول.');
      return;
    }

    let message = `مرحباً،\nنطلب منكم عرض سعر للمواد/الأعمال التالية لمشروع (${currentProject.header.name}):\n\n`;
    rfq.items.forEach(item => {
      message += `- ${item.itemName} (الكمية: ${item.quantity} ${item.unit})\n`;
    });
    
    if (rfq.description) {
      message += `\nملاحظات: ${rfq.description}\n`;
    }
    
    message += `\nبرجاء موافاتنا بعرض السعر في أقرب وقت. شكراً لك.`;

    const link = generateWhatsAppLink(supplierPhone, message);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222634] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#c5a880]" />
            بوابة المشتريات وعطاءات المقاولين (Procurement)
          </h3>
          <p className="text-xs text-slate-400 mt-1">إنشاء طلبات تسعير (RFQ) للخامات أو الأعمال وإرسالها للموردين ومقاولي الباطن.</p>
        </div>
        
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition shadow-lg shadow-[#c5a880]/10"
          >
            <Plus className="w-4 h-4" />
            إنشاء طلب تسعير جديد (RFQ)
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-[#13151c] border border-[#222634] p-5 rounded-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white border-b border-[#222634] pb-2">تفاصيل الطلب</h4>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">عنوان الطلب</label>
                <input 
                  type="text" placeholder="مثال: توريد سيراميك وبورسلين للدور الأول" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">تاريخ الانتهاء المتوقع (للتسعير)</label>
                  <input 
                    type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ملاحظات وشروط للموردين</label>
                <textarea 
                  rows={2} placeholder="مثال: الأسعار يجب أن تشمل النقل والتعتيق..." value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white border-b border-[#222634] pb-2">الخامات أو الأعمال المطلوبة</h4>
              
              <div className="flex gap-2">
                <input type="text" placeholder="اسم الخامة/البند" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880]" />
                <input type="number" placeholder="الكمية" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-20 bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880]" />
                <input type="text" placeholder="الوحدة" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-20 bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880]" />
                <button onClick={handleAddItem} className="px-3 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 font-bold">+</button>
              </div>

              {selectedItems.length > 0 && (
                <div className="bg-[#1a1c24] rounded border border-[#222634] p-3 max-h-32 overflow-y-auto space-y-2">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-300 bg-[#0d0e12] px-3 py-1.5 rounded">
                      <span>{item.itemName}</span>
                      <span className="text-[#c5a880]">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#222634]">
            <h4 className="text-sm font-bold text-white mb-3">اختر الموردين أو مقاولي الباطن للمراسلة</h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {projectSuppliers.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => toggleSupplier(s.id, s.name, s.phone)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                    selectedSuppliers.find(sel => sel.supplierId === s.id) 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                      : 'bg-[#1a1c24] border-[#222634] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> {s.name}
                </button>
              ))}
              {projectWorkers.map(w => (
                <button 
                  key={w.id} 
                  onClick={() => toggleSupplier(w.id, w.name, w.phone)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                    selectedSuppliers.find(sel => sel.supplierId === w.id) 
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                      : 'bg-[#1a1c24] border-[#222634] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> {w.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#222634]">
            <button onClick={() => setIsAdding(false)} className="px-5 py-2 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition">إلغاء</button>
            <button onClick={handleSaveRFQ} className="flex items-center gap-1.5 px-5 py-2 rounded bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition shadow-lg">حفظ الطلب</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rfqs.map(rfq => (
          <div key={rfq.id} className="bg-[#13151c] border border-[#222634] rounded-xl p-5 hover:border-[#c5a880]/30 transition shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">RFQ</span>
                  <h4 className="text-sm font-bold text-white">{rfq.title}</h4>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold mt-2">
                  <span>تم الإنشاء: {new Date(rfq.dateCreated).toLocaleDateString()}</span>
                  <span>المطلوب الرد قبل: {new Date(rfq.dueDate).toLocaleDateString()}</span>
                  <span>بواسطة: {rfq.createdBy}</span>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded text-[10px] font-bold ${
                rfq.status === 'sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                rfq.status === 'awarded' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-slate-800 text-slate-400'
              }`}>
                {rfq.status === 'sent' ? 'تم الإرسال (في انتظار العروض)' : rfq.status === 'awarded' ? 'تم الترسية' : rfq.status}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-[#222634]">
              {/* Items List */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5"><PackageSearch className="w-3.5 h-3.5" /> البنود المطلوبة:</h5>
                <ul className="space-y-1.5">
                  {rfq.items.map((it, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex justify-between bg-[#0d0e12] px-2 py-1.5 rounded border border-slate-800/50">
                      <span>{it.itemName}</span>
                      <span className="text-[#c5a880] font-bold">{it.quantity} {it.unit}</span>
                    </li>
                  ))}
                </ul>
                {rfq.description && (
                  <p className="mt-3 text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded">
                    <span className="text-white font-bold block mb-1">الملاحظات:</span>
                    {rfq.description}
                  </p>
                )}
              </div>

              {/* Suppliers List */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> الموردين المراسلين:</h5>
                <div className="space-y-2">
                  {rfq.suppliers.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1a1c24] border border-[#222634] p-2 rounded">
                      <div className="flex items-center gap-2">
                        {s.awarded ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-slate-700 bg-[#0d0e12]"></div>}
                        <span className={`text-xs font-bold ${s.awarded ? 'text-emerald-400' : 'text-slate-300'}`}>{s.supplierName}</span>
                      </div>
                      
                      <button 
                        onClick={() => sendWhatsApp(rfq, s.supplierId)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition text-[10px] font-bold border border-[#25D366]/20"
                        title="إرسال رسالة طلب تسعير جاهزة عبر واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> مراسلة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        ))}

        {rfqs.length === 0 && !isAdding && (
          <div className="text-center py-16 border border-dashed border-[#222634] rounded-2xl bg-[#13151c]/20">
            <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-bold mb-1">لا توجد طلبات تسعير أو عطاءات حالياً</p>
            <p className="text-xs text-slate-500">قم بإنشاء طلب تسعير جديد لإرساله للموردين عبر الواتساب واختيار أفضل العروض.</p>
          </div>
        )}
      </div>
    </div>
  );
}
