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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#13151c] p-6 rounded-2xl border border-[#222634] shadow-xl">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Receipt className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">نظام المستخلصات المالية</h2>
            <p className="text-sm text-slate-400 mt-1">إدارة مستخلصات المالك ومقاولي الباطن والتدفق المالي.</p>
          </div>
        </div>

        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            إنشاء مستخلص جديد
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-[#13151c] rounded-2xl border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
          <h3 className="text-lg font-bold text-white mb-6">إعداد مستخلص جديد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">نوع المستخلص</label>
              <div className="flex p-1 bg-[#0d0e12] rounded-xl border border-[#222634]">
                <button
                  onClick={() => setInvoiceType('client')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    invoiceType === 'client' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  مستخلص مالك
                </button>
                <button
                  onClick={() => setInvoiceType('subcontractor')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    invoiceType === 'subcontractor' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  مستخلص مقاول
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">عنوان المستخلص</label>
              <input
                type="text"
                placeholder="مثال: مستخلص رقم 1 - أعمال خرسانات"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#0d0e12] border border-[#222634] rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[#0d0e12] border border-[#222634] rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>

            {invoiceType === 'subcontractor' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">مقاول الباطن</label>
                <select
                  value={subcontractorId}
                  onChange={e => setSubcontractorId(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#222634] rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none transition-all"
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
              <label className="block text-xs font-bold text-slate-400 mb-2">نسبة ضريبة القيمة المضافة (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full bg-[#0d0e12] border border-[#222634] rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">نسبة تأمين الأعمال / الاستقطاع (%)</label>
              <input
                type="number"
                value={retentionRate}
                onChange={e => setRetentionRate(Number(e.target.value))}
                className="w-full bg-[#0d0e12] border border-[#222634] rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">خصومات أخرى (قيمة مالية)</label>
              <input
                type="number"
                value={deductions}
                onChange={e => setDeductions(Number(e.target.value))}
                className="w-full bg-[#0d0e12] border border-[#222634] rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-[#222634]">
            <button
              onClick={handleCreateInvoice}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
            >
              متابعة وإضافة البنود (مسودة)
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2.5 bg-[#0d0e12] text-slate-300 text-sm font-bold rounded-xl border border-[#222634] hover:bg-[#222634] transition-all"
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
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            مستخلصات المالك
          </h3>
          
          {invoices.filter(inv => inv.type === 'client').length === 0 ? (
            <div className="text-center py-10 bg-[#13151c] rounded-2xl border border-[#222634] border-dashed">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">لا توجد مستخلصات للمالك حتى الآن</p>
            </div>
          ) : (
            invoices.filter(inv => inv.type === 'client').map(invoice => (
              <div key={invoice.id} className="bg-[#13151c] p-5 rounded-2xl border border-[#222634] hover:border-[#383e59] transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-200">{invoice.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">تاريخ الاستحقاق: {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    invoice.status === 'draft' ? 'bg-slate-800 text-slate-300' : 
                    invoice.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-500' :
                    invoice.status === 'approved' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {invoice.status === 'draft' ? 'مسودة' : invoice.status === 'submitted' ? 'مقدم للمالك' : invoice.status === 'approved' ? 'معتمد' : 'تم التحصيل'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#0d0e12] rounded-xl border border-[#222634]">
                  <div>
                    <p className="text-[10px] text-slate-500">إجمالي الأعمال (بدون ضريبة)</p>
                    <p className="text-sm font-bold text-white mt-0.5">{invoice.subtotal.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">الصافي المستحق (بعد الخصومات)</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{invoice.totalAmount.toLocaleString()} ج.م</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex justify-center items-center gap-2 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-bold rounded-lg transition-all border border-indigo-500/20">
                    <Calculator className="w-3.5 h-3.5" />
                    تعديل الكميات
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-[#222634] hover:bg-[#2d3248] text-slate-300 text-xs font-bold rounded-lg transition-all border border-[#383e59]">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Subcontractor Invoices */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-orange-400" />
            مستخلصات مقاولي الباطن
          </h3>
          
          {invoices.filter(inv => inv.type === 'subcontractor').length === 0 ? (
            <div className="text-center py-10 bg-[#13151c] rounded-2xl border border-[#222634] border-dashed">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">لا توجد مستخلصات مقاولين حتى الآن</p>
            </div>
          ) : (
            invoices.filter(inv => inv.type === 'subcontractor').map(invoice => (
              <div key={invoice.id} className="bg-[#13151c] p-5 rounded-2xl border border-[#222634] hover:border-[#383e59] transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-200">{invoice.title}</h4>
                    <p className="text-xs text-orange-400 font-medium mt-1">{getSubcontractorName(invoice.subcontractorId)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    invoice.status === 'draft' ? 'bg-slate-800 text-slate-300' : 
                    invoice.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-500' :
                    invoice.status === 'approved' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {invoice.status === 'draft' ? 'مسودة' : invoice.status === 'submitted' ? 'مرفوع' : invoice.status === 'approved' ? 'معتمد' : 'تم السداد'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#0d0e12] rounded-xl border border-[#222634]">
                  <div>
                    <p className="text-[10px] text-slate-500">إجمالي الأعمال</p>
                    <p className="text-sm font-bold text-white mt-0.5">{invoice.subtotal.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">الصافي المستحق (بعد الاستقطاع)</p>
                    <p className="text-sm font-bold text-orange-400 mt-0.5">{invoice.totalAmount.toLocaleString()} ج.م</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex justify-center items-center gap-2 py-2 bg-[#222634] hover:bg-[#2d3248] text-slate-300 text-xs font-bold rounded-lg transition-all border border-[#383e59]">
                    <Calculator className="w-3.5 h-3.5" />
                    تعديل الكميات
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-[#222634] hover:bg-[#2d3248] text-slate-300 text-xs font-bold rounded-lg transition-all border border-[#383e59]">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
