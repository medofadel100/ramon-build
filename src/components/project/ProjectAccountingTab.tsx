'use client';

import { useState, useMemo, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { AccountEntry, PaymentInstallment } from '@/lib/project-service';
import { calculateProjectSummary } from '@/lib/calculations';
import { DollarSign, Plus, Trash2, CheckCircle, Clock, CreditCard, AlertTriangle, ChevronDown, ChevronUp, Filter, Users, User, HardHat, Package, Percent, Save, RefreshCw } from 'lucide-react';

export default function ProjectAccountingTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const addAccount = useProjectStore((state) => state.addAccount);
  const updateAccount = useProjectStore((state) => state.updateAccount);
  const removeAccount = useProjectStore((state) => state.removeAccount);
  const updateHeader = useProjectStore((state) => state.updateHeader);
  const user = useAuthStore((state) => state.user);

  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [showInstallmentForm, setShowInstallmentForm] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'client' | 'supplier' | 'worker'>('all');

  // Add account form
  const [formPersonType, setFormPersonType] = useState<'client' | 'supplier' | 'worker'>('supplier');
  const [formPersonId, setFormPersonId] = useState('');
  const [formPersonName, setFormPersonName] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState(0);
  const [formRetentionPercentage, setFormRetentionPercentage] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  // Add installment form
  const [instAmount, setInstAmount] = useState(0);
  const [instDueDate, setInstDueDate] = useState('');
  const [instMethod, setInstMethod] = useState('كاش');
  const [instNote, setInstNote] = useState('');

  if (!currentProject) return null;

  const accounts = currentProject.accounts || [];
  const suppliers = currentProject.suppliers || [];
  const workers = currentProject.workers || [];
  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  const [supervisionPercentage, setSupervisionPercentage] = useState(currentProject.header.supervisionPercentage || 0);
  const [isSavingSupervision, setIsSavingSupervision] = useState(false);

  useEffect(() => {
    if (currentProject?.header.supervisionPercentage !== undefined) {
      setSupervisionPercentage(currentProject.header.supervisionPercentage);
    }
  }, [currentProject?.header.supervisionPercentage]);

  const summary = useMemo(() => {
    return calculateProjectSummary(
      currentProject.items,
      currentProject.sections,
      currentProject.zones,
      currentProject.header.supervisionPercentage || 0,
      currentProject.projectConstants
    );
  }, [currentProject.items, currentProject.sections, currentProject.zones, currentProject.header.supervisionPercentage, currentProject.projectConstants]);

  const handleSaveSupervision = async () => {
    setIsSavingSupervision(true);
    await updateHeader({ supervisionPercentage });
    setIsSavingSupervision(false);
  };

  const clientAccounts = accounts.filter(a => a.personType === 'client');
  const expenseAccounts = accounts.filter(a => a.personType === 'worker' || a.personType === 'supplier');
  const filteredAccounts = accounts.filter(a => filterType === 'all' || a.personType === filterType);

  let totalAgreed = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let overdueCount = 0;
  let clientPaid = 0;
  let expensePaid = 0;

  if (filterType === 'all') {
    clientPaid = clientAccounts.reduce((sum, a) => sum + a.installments.filter(i => i.isPaid).reduce((s, i) => s + i.amount, 0), 0);
    expensePaid = expenseAccounts.reduce((sum, a) => sum + a.installments.filter(i => i.isPaid).reduce((s, i) => s + i.amount, 0), 0);
    
    totalAgreed = clientPaid; 
    totalPaid = expensePaid;
    totalRemaining = clientPaid - expensePaid;
    overdueCount = accounts.reduce((sum, a) => sum + a.installments.filter(i => !i.isPaid && new Date(i.dueDate) < new Date()).length, 0);
  } else {
    totalAgreed = filteredAccounts.reduce((sum, a) => sum + a.totalAgreedAmount, 0);
    totalPaid = filteredAccounts.reduce((sum, a) => sum + a.installments.filter(i => i.isPaid).reduce((s, i) => s + i.amount, 0), 0);
    totalRemaining = totalAgreed - totalPaid;
    overdueCount = filteredAccounts.reduce((sum, a) => sum + a.installments.filter(i => !i.isPaid && new Date(i.dueDate) < new Date()).length, 0);
  }

  const resetForm = () => {
    setFormPersonType('supplier'); setFormPersonId(''); setFormPersonName(''); setFormTotalAmount(0); setFormRetentionPercentage(0); setFormNotes('');
    setShowAddForm(false);
  };

  const handleAddAccount = async () => {
    if (!formPersonName || formTotalAmount <= 0) return;
    await addAccount({
      personType: formPersonType,
      personId: formPersonId,
      personName: formPersonName,
      totalAgreedAmount: formTotalAmount,
      retentionPercentage: formPersonType !== 'client' ? formRetentionPercentage : 0,
      installments: [],
      notes: formNotes
    });
    resetForm();
  };

  const handleAddInstallment = async (account: AccountEntry) => {
    if (instAmount <= 0 || !instDueDate) return;
    const newInstallment: PaymentInstallment = {
      id: `inst_${Date.now()}`,
      amount: instAmount,
      dueDate: instDueDate,
      isPaid: false,
      paymentMethod: instMethod,
      receiptNote: instNote
    };
    await updateAccount({
      ...account,
      installments: [...account.installments, newInstallment]
    });
    setShowInstallmentForm(null);
    setInstAmount(0); setInstDueDate(''); setInstNote('');
  };

  const handleMarkPaid = async (account: AccountEntry, installmentId: string) => {
    const updatedInstallments = account.installments.map(inst =>
      inst.id === installmentId
        ? { ...inst, isPaid: true, paidDate: new Date().toISOString().split('T')[0] }
        : inst
    );
    await updateAccount({ ...account, installments: updatedInstallments });
  };

  const handleDeleteInstallment = async (account: AccountEntry, installmentId: string) => {
    if (!confirm('حذف هذه الدفعة؟')) return;
    const updatedInstallments = account.installments.filter(inst => inst.id !== installmentId);
    await updateAccount({ ...account, installments: updatedInstallments });
  };

  const selectPersonFromList = (type: 'supplier' | 'worker') => {
    setFormPersonType(type);
    const list = type === 'supplier' ? suppliers : workers;
    return list;
  };

  const getPaymentProgress = (account: AccountEntry) => {
    const paid = account.installments.filter(i => i.isPaid).reduce((s, i) => s + i.amount, 0);
    if (account.totalAgreedAmount <= 0) return 0;
    return Math.min(100, (paid / account.totalAgreedAmount) * 100);
  };

  return (
    <div className="space-y-6 font-cairo select-none">
      
      {/* Supervision Settings Card */}
      {canEdit && (
        <div className="rounded-xl border border-[#c5a880]/20 bg-[#c5a880]/5 p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#c5a880] mb-1">إعدادات الإشراف الهندسي</h3>
            <p className="text-xs text-slate-400">حدد نسبة الإشراف لحساب الربح المتوقع من إجمالي التكلفة الأساسية للبنود ({summary.grandTotal.toLocaleString('ar-EG')} ج.م)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-32">
              <input
                type="number"
                min="0"
                max="100"
                value={supervisionPercentage}
                onChange={(e) => setSupervisionPercentage(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-4 py-2.5 pl-8 text-left text-sm text-white focus:border-[#c5a880] focus:outline-none"
              />
              <Percent className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>
            <button
              onClick={handleSaveSupervision}
              disabled={isSavingSupervision || supervisionPercentage === (currentProject.header.supervisionPercentage || 0)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 disabled:opacity-50 transition"
            >
              {isSavingSupervision ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ النسبة
            </button>
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      {filterType === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
            <span className="block text-xs font-semibold text-emerald-600 mb-1">إجمالي المستلم من العميل</span>
            <p className="text-xl font-extrabold text-emerald-400">{clientPaid.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
          <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-5">
            <span className="block text-xs font-semibold text-rose-600 mb-1">إجمالي المنصرف (موردين/عمال)</span>
            <p className="text-xl font-extrabold text-rose-400">{expensePaid.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
          <div className="rounded-xl border border-[#c5a880]/30 bg-[#c5a880]/10 p-5 shadow-lg shadow-[#c5a880]/5">
            <span className="block text-xs font-semibold text-[#c5a880] mb-1">الرصيد الصافي بالخزينة</span>
            <p className="text-xl font-extrabold text-white">{(clientPaid - expensePaid).toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
          <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5">
            <span className="block text-xs font-semibold text-slate-400 mb-1">ربح الإشراف المتوقع</span>
            <p className="text-xl font-extrabold text-white">{summary.supervisionValue.toLocaleString('ar-EG')} <span className="text-xs text-slate-500">ج.م</span></p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5">
            <span className="block text-xs font-semibold text-slate-500 mb-1">
              إجمالي {filterType === 'client' ? 'التعاقد' : 'المستحقات'}
            </span>
            <p className="text-xl font-extrabold text-white">{totalAgreed.toLocaleString('ar-EG')} <span className="text-xs text-slate-400">ج.م</span></p>
          </div>
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
            <span className="block text-xs font-semibold text-emerald-600 mb-1">المدفوع</span>
            <p className="text-xl font-extrabold text-emerald-400">{totalPaid.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-5">
            <span className="block text-xs font-semibold text-amber-600 mb-1">المتبقي</span>
            <p className="text-xl font-extrabold text-amber-400">{totalRemaining.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
          <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-5">
            <span className="block text-xs font-semibold text-rose-600 mb-1">دفعات متأخرة</span>
            <p className="text-xl font-extrabold text-rose-400">{overdueCount} <span className="text-xs">دفعة</span></p>
          </div>
        </div>
      )}

      {/* Add Account Button */}
      {canEdit && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          إنشاء حساب مالي جديد
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#222634] pb-4">
        <div className="flex items-center gap-2 ml-4">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-400">تصفية الحسابات:</span>
        </div>
        <button
          onClick={() => setFilterType('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition ${
            filterType === 'all' ? 'bg-[#c5a880]/10 border-[#c5a880] text-white' : 'border-[#222634] text-slate-400 hover:text-white bg-[#1a1c24]'
          }`}
        >
          <Users className="h-4 w-4" /> الكل
        </button>
        <button
          onClick={() => setFilterType('client')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition ${
            filterType === 'client' ? 'bg-purple-950/40 border-purple-500 text-purple-400' : 'border-[#222634] text-slate-400 hover:text-white bg-[#1a1c24]'
          }`}
        >
          <User className="h-4 w-4" /> دفعات العميل
        </button>
        <button
          onClick={() => setFilterType('supplier')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition ${
            filterType === 'supplier' ? 'bg-sky-950/40 border-sky-500 text-sky-400' : 'border-[#222634] text-slate-400 hover:text-white bg-[#1a1c24]'
          }`}
        >
          <Package className="h-4 w-4" /> الموردين
        </button>
        <button
          onClick={() => setFilterType('worker')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition ${
            filterType === 'worker' ? 'bg-amber-950/40 border-amber-500 text-amber-400' : 'border-[#222634] text-slate-400 hover:text-white bg-[#1a1c24]'
          }`}
        >
          <HardHat className="h-4 w-4" /> الصنايعية
        </button>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="rounded-xl border border-[#c5a880]/30 bg-[#1a1c24] p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">إنشاء حساب مالي جديد</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5">نوع الشخص</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFormPersonType('client');
                    setFormPersonId('client_1');
                    setFormPersonName(currentProject.header.ownerName || 'العميل');
                    setFormTotalAmount(summary.grandTotal + summary.supervisionValue);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                    formPersonType === 'client' ? 'bg-purple-950/40 border-purple-500 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >عميل</button>
                <button
                  onClick={() => { setFormPersonType('supplier'); setFormPersonId(''); setFormPersonName(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                    formPersonType === 'supplier' ? 'bg-sky-950/40 border-sky-500 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >مورد</button>
                <button
                  onClick={() => { setFormPersonType('worker'); setFormPersonId(''); setFormPersonName(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                    formPersonType === 'worker' ? 'bg-amber-950/40 border-amber-500 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >صنايعي</button>
              </div>
            </div>
            
            {formPersonType !== 'client' ? (
              <div>
                <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5">اختر من القائمة أو أدخل اسم</label>
                <select
                  value={formPersonId}
                  onChange={(e) => {
                    setFormPersonId(e.target.value);
                    const list = formPersonType === 'supplier' ? suppliers : workers;
                    const p = list.find(l => l.id === e.target.value);
                    if (p) setFormPersonName(p.name);
                  }}
                  className="w-full rounded-lg border border-[#222634] bg-[#13151c] px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
                >
                  <option value="">أدخل يدوياً...</option>
                  {(formPersonType === 'supplier' ? suppliers : workers).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5">اسم العميل</label>
                <input
                  type="text" value={formPersonName} readOnly
                  className="w-full rounded-lg border border-[#222634] bg-[#13151c]/50 text-slate-500 px-4 py-2.5 text-right text-sm focus:outline-none cursor-not-allowed"
                />
              </div>
            )}
            
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5">اسم الشخص *</label>
              <input
                type="text" value={formPersonName} onChange={(e) => setFormPersonName(e.target.value)}
                className="w-full rounded-lg border border-[#222634] bg-[#13151c] px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5">المبلغ المتفق عليه (ج.م) *</label>
              <input
                type="number" value={formTotalAmount} onChange={(e) => setFormTotalAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-[#222634] bg-[#13151c] px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            {formPersonType !== 'client' && (
              <div>
                <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5">استقطاع تأمين أعمال / ضمان (%)</label>
                <div className="relative">
                  <input
                    type="number" value={formRetentionPercentage} onChange={(e) => setFormRetentionPercentage(Number(e.target.value))}
                    min="0" max="100"
                    className="w-full rounded-lg border border-[#222634] bg-[#13151c] pl-8 pr-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
                  />
                  <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5">ملاحظات</label>
              <input
                type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                className="w-full rounded-lg border border-[#222634] bg-[#13151c] px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition">إلغاء</button>
            <button
              onClick={handleAddAccount}
              disabled={!formPersonName || formTotalAmount <= 0}
              className="px-4 py-1.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition disabled:opacity-50"
            >إنشاء الحساب</button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-4">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#222634] rounded-xl bg-[#13151c]/40">
            <DollarSign className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">لا يوجد حسابات مالية متطابقة</p>
            <p className="text-xs text-slate-500 mt-1">تأكد من اختيار الفلتر الصحيح أو قم بإضافة حساب جديد</p>
          </div>
        ) : (
          filteredAccounts.map(account => {
            const paid = account.installments.filter(i => i.isPaid).reduce((s, i) => s + i.amount, 0);
            const retentionAmount = account.retentionPercentage ? (account.totalAgreedAmount * account.retentionPercentage) / 100 : 0;
            const remaining = account.totalAgreedAmount - paid - retentionAmount;
            const progress = getPaymentProgress(account);
            const isExpanded = expandedAccountId === account.id;
            const hasOverdue = account.installments.some(i => !i.isPaid && new Date(i.dueDate) < new Date());

            return (
              <div key={account.id} className="rounded-xl border border-[#222634] bg-[#13151c] overflow-hidden">
                {/* Account Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-900/30 transition"
                  onClick={() => setExpandedAccountId(isExpanded ? null : account.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        account.personType === 'client'
                          ? 'bg-purple-950/40 text-purple-400 border-purple-800/40'
                          : account.personType === 'supplier'
                            ? 'bg-sky-950/40 text-sky-400 border-sky-800/40'
                            : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                      }`}>
                        {account.personType === 'client' ? 'العميل' : account.personType === 'supplier' ? 'مورد' : 'صنايعي'}
                      </div>
                      <h4 className="text-sm font-bold text-white">{account.personName}</h4>
                      {hasOverdue && (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col text-left">
                        <span className="text-xs text-slate-400">
                          {paid.toLocaleString('ar-EG')} / {account.totalAgreedAmount.toLocaleString('ar-EG')} ج.م
                        </span>
                        {retentionAmount > 0 && (
                          <span className="text-[10px] text-amber-500 font-bold">
                            تأمين أعمال محتجز: {retentionAmount.toLocaleString('ar-EG')} ج.م
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        progress >= 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-[#c5a880]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-slate-500 font-medium">
                    <span>المدفوع: {paid.toLocaleString('ar-EG')} ج.م</span>
                    <span>المتبقي: {remaining.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                </div>

                {/* Expanded: Installments */}
                {isExpanded && (
                  <div className="border-t border-[#222634] p-4 space-y-3">
                    {/* Installments Table */}
                    {account.installments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="text-slate-500 border-b border-[#222634]">
                            <tr>
                              <th className="p-2">المبلغ</th>
                              <th className="p-2">تاريخ الاستحقاق</th>
                              <th className="p-2">طريقة الدفع</th>
                              <th className="p-2">الحالة</th>
                              <th className="p-2">ملاحظات</th>
                              <th className="p-2">إجراء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222634]">
                            {account.installments.map(inst => {
                              const isOverdue = !inst.isPaid && new Date(inst.dueDate) < new Date();
                              return (
                                <tr key={inst.id} className={`${isOverdue ? 'bg-rose-950/10' : ''}`}>
                                  <td className="p-2 font-bold text-white">{inst.amount.toLocaleString('ar-EG')} ج.م</td>
                                  <td className="p-2 text-slate-300">{inst.dueDate}</td>
                                  <td className="p-2 text-slate-400">{inst.paymentMethod || '-'}</td>
                                  <td className="p-2">
                                    {inst.isPaid ? (
                                      <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                                        <CheckCircle className="h-3 w-3" /> مدفوع {inst.paidDate && `(${inst.paidDate})`}
                                      </span>
                                    ) : isOverdue ? (
                                      <span className="flex items-center gap-1 text-rose-400 text-[10px] font-semibold">
                                        <AlertTriangle className="h-3 w-3" /> متأخر
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-amber-400 text-[10px] font-semibold">
                                        <Clock className="h-3 w-3" /> قادم
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2 text-slate-500 text-[10px]">{inst.receiptNote || '-'}</td>
                                  <td className="p-2">
                                    <div className="flex gap-1">
                                      {!inst.isPaid && canEdit && (
                                        <button
                                          onClick={() => handleMarkPaid(account, inst.id)}
                                          className="px-2 py-1 rounded bg-emerald-950/40 text-emerald-400 text-[10px] font-semibold border border-emerald-800/40 hover:brightness-110 transition"
                                        >
                                          تأكيد الدفع
                                        </button>
                                      )}
                                      {canEdit && (
                                        <button
                                          onClick={() => handleDeleteInstallment(account, inst.id)}
                                          className="p-1 rounded hover:bg-slate-800 text-rose-500/60 hover:text-rose-400 transition"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-4">لم يتم إضافة دفعات بعد</p>
                    )}

                    {/* Add Installment Form */}
                    {canEdit && showInstallmentForm === account.id ? (
                      <div className="rounded-lg bg-[#1a1c24] border border-[#222634] p-3 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">المبلغ (ج.م) *</label>
                            <input type="number" value={instAmount} onChange={(e) => setInstAmount(Number(e.target.value))}
                              className="w-full rounded border border-[#222634] bg-[#13151c] px-2 py-1.5 text-xs text-white text-right focus:border-[#c5a880] focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">تاريخ الاستحقاق *</label>
                            <input type="date" value={instDueDate} onChange={(e) => setInstDueDate(e.target.value)}
                              className="w-full rounded border border-[#222634] bg-[#13151c] px-2 py-1.5 text-xs text-white focus:border-[#c5a880] focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">طريقة الدفع</label>
                            <select value={instMethod} onChange={(e) => setInstMethod(e.target.value)}
                              className="w-full rounded border border-[#222634] bg-[#13151c] px-2 py-1.5 text-xs text-white focus:border-[#c5a880] focus:outline-none">
                              <option>كاش</option>
                              <option>تحويل بنكي</option>
                              <option>شيك</option>
                              <option>فودافون كاش</option>
                              <option>انستاباي</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">ملاحظة / إيصال</label>
                            <input type="text" value={instNote} onChange={(e) => setInstNote(e.target.value)}
                              className="w-full rounded border border-[#222634] bg-[#13151c] px-2 py-1.5 text-xs text-white focus:border-[#c5a880] focus:outline-none" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowInstallmentForm(null)} className="px-2 py-1 text-[10px] text-slate-400 hover:text-white transition">إلغاء</button>
                          <button
                            onClick={() => handleAddInstallment(account)}
                            disabled={instAmount <= 0 || !instDueDate}
                            className="px-3 py-1 rounded bg-[#c5a880] text-[#0d0e12] text-[10px] font-bold hover:brightness-110 transition disabled:opacity-50"
                          >إضافة الدفعة</button>
                        </div>
                      </div>
                    ) : canEdit && (
                      <button
                        onClick={() => { setShowInstallmentForm(account.id); setInstAmount(0); setInstDueDate(''); setInstNote(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-[#c5a880] transition"
                      >
                        <CreditCard className="h-3 w-3" />
                        إضافة دفعة جديدة
                      </button>
                    )}

                    {/* Delete Account */}
                    {canEdit && (
                      <div className="flex justify-end pt-2 border-t border-[#222634]">
                        <button
                          onClick={() => { if (confirm('هل أنت متأكد من حذف هذا الحساب المالي وجميع دفعاته؟')) removeAccount(account.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-rose-400/60 hover:text-rose-400 hover:bg-rose-950/20 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          حذف الحساب
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
