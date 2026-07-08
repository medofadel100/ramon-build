'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Invoice, InvoiceItem } from '@/lib/project-service';
import { generateId } from '@/lib/utils';
import { FileText, Plus, CheckCircle2, Calculator, Receipt, DollarSign, Download, Users, Trash2 } from 'lucide-react';

export default function ProjectInvoicesTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const user = useAuthStore((state) => state.user);

  const [invoices, setInvoices] = useState<Invoice[]>(currentProject?.invoices || []);
  const [isAdding, setIsAdding] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'client' | 'subcontractor'>('client');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // New Invoice State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subcontractorId, setSubcontractorId] = useState('');
  const [taxRate, setTaxRate] = useState(14); // Default VAT in Egypt
  const [retentionRate, setRetentionRate] = useState(5); // Default retention
  const [deductions, setDeductions] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');
  const projectWorkers = currentProject.workers || [];

  const handleCreateInvoice = async () => {
    if (!title) {
      alert('الرجاء إدخال عنوان المستخلص.');
      return;
    }
    if (invoiceType === 'subcontractor' && !subcontractorId) {
      alert('الرجاء اختيار مقاول الباطن.');
      return;
    }

    // Auto-populate items from BOQ if empty and client invoice
    let initialItems: InvoiceItem[] = [];
    if (invoiceType === 'client' && selectedItems.length === 0) {
      initialItems = currentProject.items.map(boq => ({
        boqItemId: boq.id,
        itemName: boq.title,
        previousQuantity: 0, // Should calculate from past invoices
        currentQuantity: 0,
        totalQuantity: boq.quantity || 0,
        unitPrice: boq.pricing.mode === 'lump_sum' ? boq.pricing.lumpSumPrice : 
                   (boq.pricing.materialUnitPrice + boq.pricing.laborUnitPrice + (boq.pricing.equipmentUnitPrice || 0) + (boq.pricing.overheadUnitPrice || 0)),
        totalAmount: 0
      }));
    } else {
      initialItems = selectedItems;
    }

    const subtotal = initialItems.reduce((acc, item) => acc + item.totalAmount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const retentionAmount = (subtotal * retentionRate) / 100;
    const totalAmount = subtotal + taxAmount - retentionAmount - deductions;

    const newInvoice: Invoice = {
      id: generateId(),
      type: invoiceType,
      status: 'draft',
      title,
      dateCreated: new Date().toISOString(),
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      subcontractorId: invoiceType === 'subcontractor' ? subcontractorId : undefined,
      items: initialItems,
      subtotal,
      taxRate,
      taxAmount,
      retentionRate,
      retentionAmount,
      deductions,
      totalAmount,
      notes,
      createdBy: user?.name || user?.email?.split('@')[0] || 'مهندس الموقع'
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    await updateProject({ invoices: updatedInvoices });
    
    setIsAdding(false);
    setTitle('');
  };

  const calculateSubtotal = (invoice: Invoice) => invoice.items.reduce((acc, item) => acc + item.totalAmount, 0);
  const getSubcontractorName = (id?: string) => projectWorkers.find(w => w.id === id)?.name || 'مقاول غير معروف';

  const handleUpdateInvoiceItems = async () => {
    if (!editingInvoice) return;
    
    // Recalculate totals
    const subtotal = editingInvoice.items.reduce((acc, item) => acc + item.totalAmount, 0);
    const taxAmount = (subtotal * (editingInvoice.taxRate ?? 0)) / 100;
    const retentionAmount = (subtotal * (editingInvoice.retentionRate ?? 0)) / 100;
    const totalAmount = subtotal + taxAmount - retentionAmount - (editingInvoice.deductions ?? 0);

    const updatedInvoice = { ...editingInvoice, subtotal, taxAmount, retentionAmount, totalAmount };
    const updatedInvoices = invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
    
    setInvoices(updatedInvoices);
    await updateProject({ invoices: updatedInvoices });
    setEditingInvoice(null);
  };

  const updateEditingInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!editingInvoice) return;
    const newItems = [...editingInvoice.items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'currentQuantity' || field === 'unitPrice') {
      item.totalAmount = item.currentQuantity * item.unitPrice;
    }
    
    newItems[index] = item;
    setEditingInvoice({ ...editingInvoice, items: newItems });
  };

  const handleAddCustomItemToInvoice = () => {
    if (!editingInvoice) return;
    const newItem: InvoiceItem = {
      boqItemId: generateId(),
      itemName: 'بند جديد',
      previousQuantity: 0,
      currentQuantity: 1,
      totalQuantity: 1,
      unitPrice: 0,
      totalAmount: 0
    };
    setEditingInvoice({ ...editingInvoice, items: [...editingInvoice.items, newItem] });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-xl">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Receipt className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">نظام المستخلصات المالية</h2>
            <p className="text-sm text-muted-foreground mt-1">إدارة مستخلصات المالك ومقاولي الباطن والتدفق المالي.</p>
          </div>
        </div>

        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-foreground text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            إنشاء مستخلص جديد
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-card rounded-2xl border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
          <h3 className="text-lg font-bold text-foreground mb-6">إعداد مستخلص جديد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">نوع المستخلص</label>
              <div className="flex p-1 bg-background rounded-xl border border-border">
                <button
                  onClick={() => setInvoiceType('client')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    invoiceType === 'client' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-muted-foreground hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  مستخلص مالك
                </button>
                <button
                  onClick={() => setInvoiceType('subcontractor')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    invoiceType === 'subcontractor' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-muted-foreground hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  مستخلص مقاول
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">عنوان المستخلص</label>
              <input
                type="text"
                placeholder="مثال: مستخلص رقم 1 - أعمال خرسانات"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>

            {invoiceType === 'subcontractor' && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">مقاول الباطن</label>
                <select
                  value={subcontractorId}
                  onChange={e => setSubcontractorId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-indigo-500/50 focus:outline-none transition-all"
                >
                  <option value="">اختر المقاول...</option>
                  {projectWorkers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">نسبة ضريبة القيمة المضافة (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">نسبة تأمين الأعمال / الاستقطاع (%)</label>
              <input
                type="number"
                value={retentionRate}
                onChange={e => setRetentionRate(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">خصومات أخرى (قيمة مالية)</label>
              <input
                type="number"
                value={deductions}
                onChange={e => setDeductions(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-border">
            <button
              onClick={handleCreateInvoice}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-foreground text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
            >
              متابعة وإضافة البنود (مسودة)
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2.5 bg-background text-secondary-foreground text-sm font-bold rounded-xl border border-border hover:bg-[#222634] transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Client Invoices */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            مستخلصات المالك
          </h3>
          
          {invoices.filter(inv => inv.type === 'client').length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl border border-border border-dashed">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">لا توجد مستخلصات للمالك حتى الآن</p>
            </div>
          ) : (
            invoices.filter(inv => inv.type === 'client').map(invoice => (
              <div key={invoice.id} className="bg-card p-5 rounded-2xl border border-border hover:border-[#383e59] transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-foreground">{invoice.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">تاريخ الاستحقاق: {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    invoice.status === 'draft' ? 'bg-accent text-secondary-foreground' : 
                    invoice.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-500' :
                    invoice.status === 'approved' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {invoice.status === 'draft' ? 'مسودة' : invoice.status === 'submitted' ? 'مقدم للمالك' : invoice.status === 'approved' ? 'معتمد' : 'تم التحصيل'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-background rounded-xl border border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground">إجمالي الأعمال (بدون ضريبة)</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{invoice.subtotal.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">الصافي المستحق (بعد الخصومات)</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{invoice.totalAmount.toLocaleString()} ج.م</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingInvoice(invoice)}
                    className="flex-1 flex justify-center items-center gap-2 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-bold rounded-lg transition-all border border-indigo-500/20"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    تعديل الكميات
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-[#222634] hover:bg-[#2d3248] text-secondary-foreground text-xs font-bold rounded-lg transition-all border border-[#383e59]">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Subcontractor Invoices */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-orange-400" />
            مستخلصات مقاولي الباطن
          </h3>
          
          {invoices.filter(inv => inv.type === 'subcontractor').length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl border border-border border-dashed">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">لا توجد مستخلصات مقاولين حتى الآن</p>
            </div>
          ) : (
            invoices.filter(inv => inv.type === 'subcontractor').map(invoice => (
              <div key={invoice.id} className="bg-card p-5 rounded-2xl border border-border hover:border-[#383e59] transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-foreground">{invoice.title}</h4>
                    <p className="text-xs text-orange-400 font-medium mt-1">{getSubcontractorName(invoice.subcontractorId)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    invoice.status === 'draft' ? 'bg-accent text-secondary-foreground' : 
                    invoice.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-500' :
                    invoice.status === 'approved' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {invoice.status === 'draft' ? 'مسودة' : invoice.status === 'submitted' ? 'مرفوع' : invoice.status === 'approved' ? 'معتمد' : 'تم السداد'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-background rounded-xl border border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground">إجمالي الأعمال</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{invoice.subtotal.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">الصافي المستحق (بعد الاستقطاع)</p>
                    <p className="text-sm font-bold text-orange-400 mt-0.5">{invoice.totalAmount.toLocaleString()} ج.م</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingInvoice(invoice)}
                    className="flex-1 flex justify-center items-center gap-2 py-2 bg-[#222634] hover:bg-[#2d3248] text-secondary-foreground text-xs font-bold rounded-lg transition-all border border-[#383e59]"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    تعديل الكميات
                  </button>
                  <button 
                    onClick={() => window.open(`/projects/${currentProject.id}/invoice/${invoice.id}`, '_blank')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[#222634] hover:bg-[#2d3248] text-secondary-foreground text-xs font-bold rounded-lg transition-all border border-[#383e59]"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    طباعة
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Editing Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            
            <div className="p-5 border-b border-border flex justify-between items-center bg-[#1a1c24]">
              <div>
                <h3 className="font-bold text-lg text-foreground">تعديل بنود المستخلص: {editingInvoice.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">الكميات الحالية التي سيتم محاسبة المقاول أو المالك عليها في هذا المستخلص.</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground">الإجمالي المستحق</p>
                <p className="font-black text-xl text-emerald-400">
                  {(
                    editingInvoice.items.reduce((acc, item) => acc + item.totalAmount, 0) * 
                    (1 + (editingInvoice.taxRate ?? 0)/100) -
                    (editingInvoice.items.reduce((acc, item) => acc + item.totalAmount, 0) * (editingInvoice.retentionRate ?? 0)/100) - (editingInvoice.deductions ?? 0)
                  ).toLocaleString()} ج.م
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border pb-2">
                    <th className="pb-3 font-bold w-1/3">البند</th>
                    <th className="pb-3 font-bold text-center">السابق</th>
                    <th className="pb-3 font-bold text-center text-primary">الحالي (المنفذ)</th>
                    <th className="pb-3 font-bold text-center">الإجمالي</th>
                    <th className="pb-3 font-bold text-center">الفئة</th>
                    <th className="pb-3 font-bold text-left">القيمة (ج.م)</th>
                    <th className="pb-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {editingInvoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-[#1a1c24]/50 transition-colors">
                      <td className="py-3">
                        <input 
                          type="text" 
                          value={item.itemName} 
                          onChange={(e) => updateEditingInvoiceItem(idx, 'itemName', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-foreground font-semibold px-1"
                        />
                      </td>
                      <td className="py-3 text-center text-muted-foreground">
                        <input 
                          type="number" 
                          value={item.previousQuantity || ''} 
                          onChange={(e) => updateEditingInvoiceItem(idx, 'previousQuantity', Number(e.target.value))}
                          className="w-16 bg-[#1a1c24] border border-border rounded text-center text-xs py-1"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input 
                          type="number" 
                          value={item.currentQuantity || ''} 
                          onChange={(e) => updateEditingInvoiceItem(idx, 'currentQuantity', Number(e.target.value))}
                          className="w-20 bg-primary/10 border border-primary/30 rounded text-center font-bold text-primary py-1"
                        />
                      </td>
                      <td className="py-3 text-center font-bold text-muted-foreground">
                        {((item.previousQuantity || 0) + (item.currentQuantity || 0)).toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <input 
                          type="number" 
                          value={item.unitPrice || ''} 
                          onChange={(e) => updateEditingInvoiceItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-24 bg-[#1a1c24] border border-border rounded text-center text-xs py-1"
                        />
                      </td>
                      <td className="py-3 text-left font-bold text-emerald-400">
                        {item.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 text-left">
                        <button 
                          onClick={() => {
                            const newItems = [...editingInvoice.items];
                            newItems.splice(idx, 1);
                            setEditingInvoice({ ...editingInvoice, items: newItems });
                          }}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 text-center">
                <button 
                  onClick={handleAddCustomItemToInvoice}
                  className="px-4 py-2 bg-background border border-border border-dashed rounded-lg text-muted-foreground hover:text-foreground hover:border-slate-500 transition text-xs font-bold"
                >
                  <Plus className="w-4 h-4 inline-block ml-1" />
                  إضافة بند جديد للمستخلص
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-border bg-[#1a1c24] flex justify-between items-center">
              <button 
                onClick={() => setEditingInvoice(null)}
                className="px-6 py-2 rounded-xl bg-background border border-border text-secondary-foreground text-sm font-bold hover:bg-slate-800 transition"
              >
                إغلاق (إلغاء التعديلات)
              </button>
              <button 
                onClick={handleUpdateInvoiceItems}
                className="px-8 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                حفظ التعديلات وتحديث المستخلص
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
