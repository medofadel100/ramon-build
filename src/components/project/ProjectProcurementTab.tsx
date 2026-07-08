'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { RFQ, PurchaseOrder } from '@/lib/project-service';
import { ShoppingCart, Plus, MessageCircle, FileText, CheckCircle2, Store, PackageSearch, Users, Calculator, Trash2 } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { generateWhatsAppLink } from '@/lib/whatsapp';

export default function ProjectProcurementTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const user = useAuthStore((state) => state.user);

  const addPurchaseOrder = useProjectStore((state) => state.addPurchaseOrder);
  const removePurchaseOrder = useProjectStore((state) => state.removePurchaseOrder);

  const [activeSubTab, setActiveSubTab] = useState<'rfq' | 'po'>('rfq');
  const [rfqs, setRfqs] = useState<RFQ[]>(currentProject?.rfqs || []);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingPO, setIsAddingPO] = useState(false);
  
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
  const [newItemPrice, setNewItemPrice] = useState(0);

  // New PO State
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');

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

  const handleAddPOItem = () => {
    if (!newItemName) return;
    setSelectedItems([...selectedItems, { itemName: newItemName, quantity: newItemQty, unit: newItemUnit, price: newItemPrice } as any]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice(0);
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

  const handleSavePO = async () => {
    if (!poSupplierId || selectedItems.length === 0) {
      alert('الرجاء اختيار مورد وإضافة خامات/بنود لأمر الشراء.');
      return;
    }

    const supplier = projectSuppliers.find(s => s.id === poSupplierId);
    if (!supplier) return;

    let subtotal = 0;
    const items = selectedItems.map(it => {
      const price = (it as any).price || 0;
      const total = price * it.quantity;
      subtotal += total;
      return {
        id: generateId(),
        materialName: it.itemName,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: price,
        totalPrice: total,
        status: 'pending' as const,
        deliveredQuantity: 0
      };
    });

    const applyVat = currentProject.header.applyVat ?? true;
    const vatAmount = applyVat ? subtotal * 0.14 : 0;
    const totalAmount = subtotal + vatAmount;

    await addPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      dateCreated: new Date().toISOString(),
      expectedDeliveryDate: poExpectedDate,
      status: 'draft',
      items,
      subtotal,
      vatAmount,
      totalAmount,
      notes: poNotes
    });

    setIsAddingPO(false);
    setSelectedItems([]);
    setPoSupplierId('');
    setPoNotes('');
    setPoExpectedDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            بوابة المشتريات وعطاءات المقاولين (Procurement)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">إنشاء طلبات تسعير (RFQ) للخامات أو الأعمال وإرسالها للموردين ومقاولي الباطن.</p>
        </div>
        
        {canEdit && activeSubTab === 'rfq' && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition shadow-lg shadow-[#c5a880]/10"
          >
            <Plus className="w-4 h-4" />
            إنشاء طلب تسعير جديد (RFQ)
          </button>
        )}
        {canEdit && activeSubTab === 'po' && !isAddingPO && (
          <button
            onClick={() => setIsAddingPO(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition shadow-lg shadow-[#c5a880]/10"
          >
            <Plus className="w-4 h-4" />
            إصدار أمر توريد جديد (PO)
          </button>
        )}
      </div>

      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveSubTab('rfq')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === 'rfq' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-slate-700'
          }`}
        >
          عطاءات الموردين (RFQ)
        </button>
        <button
          onClick={() => setActiveSubTab('po')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === 'po' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-slate-700'
          }`}
        >
          أوامر التوريد (PO)
        </button>
      </div>

      {activeSubTab === 'rfq' && (
        <>
          {isAdding && (
        <div className="bg-card border border-border p-5 rounded-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">تفاصيل الطلب</h4>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">عنوان الطلب</label>
                <input 
                  type="text" placeholder="مثال: توريد سيراميك وبورسلين للدور الأول" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">تاريخ الانتهاء المتوقع (للتسعير)</label>
                  <input 
                    type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">ملاحظات وشروط للموردين</label>
                <textarea 
                  rows={2} placeholder="مثال: الأسعار يجب أن تشمل النقل والتعتيق..." value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">الخامات أو الأعمال المطلوبة</h4>
              
              <div className="flex gap-2">
                <input type="text" placeholder="اسم الخامة/البند" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880]" />
                <input type="number" placeholder="الكمية" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-20 bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880]" />
                <input type="text" placeholder="الوحدة" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-20 bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880]" />
                <button onClick={handleAddItem} className="px-3 bg-accent text-secondary-foreground rounded hover:bg-slate-700 font-bold">+</button>
              </div>

              {selectedItems.length > 0 && (
                <div className="bg-[#1a1c24] rounded border border-border p-3 max-h-32 overflow-y-auto space-y-2">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-secondary-foreground bg-background px-3 py-1.5 rounded">
                      <span>{item.itemName}</span>
                      <span className="text-primary">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">اختر الموردين أو مقاولي الباطن للمراسلة</h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {projectSuppliers.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => toggleSupplier(s.id, s.name, s.phone)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                    selectedSuppliers.find(sel => sel.supplierId === s.id) 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                      : 'bg-[#1a1c24] border-border text-muted-foreground hover:border-slate-600'
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
                      : 'bg-[#1a1c24] border-border text-muted-foreground hover:border-slate-600'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> {w.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => setIsAdding(false)} className="px-5 py-2 rounded bg-accent text-secondary-foreground text-xs font-bold hover:bg-slate-700 transition">إلغاء</button>
            <button onClick={handleSaveRFQ} className="flex items-center gap-1.5 px-5 py-2 rounded bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition shadow-lg">حفظ الطلب</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rfqs.map(rfq => (
          <div key={rfq.id} className="bg-card border border-border rounded-xl p-5 hover:border-[#c5a880]/30 transition shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-accent text-muted-foreground font-bold">RFQ</span>
                  <h4 className="text-sm font-bold text-foreground">{rfq.title}</h4>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold mt-2">
                  <span>تم الإنشاء: {new Date(rfq.dateCreated).toLocaleDateString()}</span>
                  <span>المطلوب الرد قبل: {new Date(rfq.dueDate).toLocaleDateString()}</span>
                  <span>بواسطة: {rfq.createdBy}</span>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded text-[10px] font-bold ${
                rfq.status === 'sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                rfq.status === 'awarded' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-accent text-muted-foreground'
              }`}>
                {rfq.status === 'sent' ? 'تم الإرسال (في انتظار العروض)' : rfq.status === 'awarded' ? 'تم الترسية' : rfq.status}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-border">
              {/* Items List */}
              <div>
                <h5 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5"><PackageSearch className="w-3.5 h-3.5" /> البنود المطلوبة:</h5>
                <ul className="space-y-1.5">
                  {rfq.items.map((it, idx) => (
                    <li key={idx} className="text-xs text-secondary-foreground flex justify-between bg-background px-2 py-1.5 rounded border border-border/50">
                      <span>{it.itemName}</span>
                      <span className="text-primary font-bold">{it.quantity} {it.unit}</span>
                    </li>
                  ))}
                </ul>
                {rfq.description && (
                  <p className="mt-3 text-[11px] text-muted-foreground bg-muted/50 p-2 rounded">
                    <span className="text-foreground font-bold block mb-1">الملاحظات:</span>
                    {rfq.description}
                  </p>
                )}
              </div>

              {/* Suppliers List */}
              <div>
                <h5 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> الموردين المراسلين:</h5>
                <div className="space-y-2">
                  {rfq.suppliers.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1a1c24] border border-border p-2 rounded">
                      <div className="flex items-center gap-2">
                        {s.awarded ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-border bg-background"></div>}
                        <span className={`text-xs font-bold ${s.awarded ? 'text-emerald-400' : 'text-secondary-foreground'}`}>{s.supplierName}</span>
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
      </div>

          {rfqs.length === 0 && !isAdding && (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/20">
              <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold mb-1">لا توجد طلبات تسعير أو عطاءات حالياً</p>
              <p className="text-xs text-muted-foreground">قم بإنشاء طلب تسعير جديد لإرساله للموردين عبر الواتساب واختيار أفضل العروض.</p>
            </div>
          )}
        </>
      )}

      {activeSubTab === 'po' && (
        <>
          {isAddingPO && (
            <div className="bg-card border border-border p-5 rounded-xl space-y-6 animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">تفاصيل المورد وتاريخ التوريد</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">المورد</label>
                    <select 
                      value={poSupplierId} onChange={e => setPoSupplierId(e.target.value)}
                      className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none"
                    >
                      <option value="">-- اختر المورد --</option>
                      {projectSuppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - {s.specialty}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">تاريخ التسليم المتوقع للموقع</label>
                    <input 
                      type="date" value={poExpectedDate} onChange={e => setPoExpectedDate(e.target.value)}
                      className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">ملاحظات إضافية على أمر التوريد</label>
                    <textarea 
                      rows={2} value={poNotes} onChange={e => setPoNotes(e.target.value)}
                      className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">البنود والخامات المطلوبة للشراء</h4>
                  
                  <div className="flex flex-wrap gap-2">
                    <input type="text" placeholder="الخامة" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 min-w-[120px] bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880]" />
                    <input type="number" placeholder="سعر الوحدة" value={newItemPrice || ''} onChange={e => setNewItemPrice(Number(e.target.value))} className="w-24 bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880]" />
                    <input type="number" placeholder="الكمية" value={newItemQty || ''} onChange={e => setNewItemQty(Number(e.target.value))} className="w-20 bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880]" />
                    <input type="text" placeholder="الوحدة" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-16 bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880]" />
                    <button onClick={handleAddPOItem} className="px-3 bg-accent text-secondary-foreground rounded hover:bg-slate-700 font-bold">+</button>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="bg-[#1a1c24] rounded border border-border p-3 max-h-48 overflow-y-auto space-y-2">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/50">
                            <th className="pb-2">الخامة</th>
                            <th className="pb-2">الكمية</th>
                            <th className="pb-2">السعر</th>
                            <th className="pb-2">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItems.map((item, idx) => {
                            const price = (item as any).price || 0;
                            return (
                              <tr key={idx} className="border-b border-border/20 last:border-0">
                                <td className="py-2 text-foreground font-semibold">{item.itemName}</td>
                                <td className="py-2 text-primary font-bold">{item.quantity} {item.unit}</td>
                                <td className="py-2">{price.toLocaleString()}</td>
                                <td className="py-2 text-primary">{(price * item.quantity).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button onClick={() => { setIsAddingPO(false); setSelectedItems([]); }} className="px-5 py-2 rounded bg-accent text-secondary-foreground text-xs font-bold hover:bg-slate-700 transition">إلغاء</button>
                <button onClick={handleSavePO} className="flex items-center gap-1.5 px-5 py-2 rounded bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition shadow-lg">إصدار أمر الشراء</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {(currentProject.purchaseOrders || []).map(po => (
              <div key={po.id} className="bg-card border border-border rounded-xl p-5 hover:border-[#c5a880]/30 transition shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-primary/20"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-3 border-b border-border/50 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{po.poNumber}</span>
                      <h4 className="text-sm font-bold text-foreground">المورد: {po.supplierName}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold mt-2">
                      <span className="flex items-center gap-1"><Store className="w-3.5 h-3.5" /> أمر شراء موجه للمورد</span>
                      <span>تاريخ الإصدار: {new Date(po.dateCreated).toLocaleDateString()}</span>
                      {po.expectedDeliveryDate && <span>التوريد المتوقع: {new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded text-xs font-bold ${
                      po.status === 'draft' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      po.status === 'issued' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      po.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {po.status === 'draft' ? 'مسودة' : po.status === 'issued' ? 'مُصدر (في الانتظار)' : po.status === 'completed' ? 'تم التوريد بالكامل' : 'ملغي'}
                    </div>
                    {canEdit && (
                      <button onClick={() => removePurchaseOrder(po.id)} className="text-rose-400 hover:text-rose-300 transition" title="حذف أمر التوريد">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="py-2 pr-2">البند / الخامة</th>
                        <th className="py-2">الكمية المطلوبة</th>
                        <th className="py-2">سعر الوحدة</th>
                        <th className="py-2">الإجمالي</th>
                        <th className="py-2">الكمية الموردة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/20 text-xs">
                          <td className="py-2 pr-2 text-foreground font-semibold">{item.materialName}</td>
                          <td className="py-2 text-primary font-bold">{item.quantity} {item.unit}</td>
                          <td className="py-2">{item.unitPrice.toLocaleString()}</td>
                          <td className="py-2">{item.totalPrice.toLocaleString()}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded ${item.deliveredQuantity >= item.quantity ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                              {item.deliveredQuantity} / {item.quantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-end border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground max-w-sm">
                    {po.notes && <p><span className="font-bold text-foreground">ملاحظات: </span>{po.notes}</p>}
                  </div>
                  <div className="text-left space-y-1 bg-[#1a1c24] p-3 rounded-lg border border-border w-64">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>الإجمالي قبل الضريبة:</span>
                      <span>{po.subtotal.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>الضريبة (14%):</span>
                      <span>{po.vatAmount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-primary border-t border-border/50 pt-1 mt-1">
                      <span>الإجمالي النهائي:</span>
                      <span>{po.totalAmount.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>

              </div>
            ))}

            {(!currentProject.purchaseOrders || currentProject.purchaseOrders.length === 0) && !isAddingPO && (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/20">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-muted-foreground font-bold mb-1">لا توجد أوامر توريد مسجلة</p>
                <p className="text-xs text-muted-foreground">قم بإصدار أوامر شراء رسمية (PO) لمقاولي الباطن والموردين لربطها بالحسابات.</p>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
