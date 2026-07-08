'use client';

import { useProjectStore } from '@/store/projectStore';
import { calculateProjectSummary } from '@/lib/calculations';
import { useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Briefcase, Calendar, CheckCircle2, DollarSign, ArrowRight, HardHat, FileText, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { ProjectService } from '@/lib/project-service';

export default function ClientPortalPage() {
  const params = useParams();
  const id = params.id as string;
  
  const currentProject = useProjectStore((state) => state.currentProject);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);

  useEffect(() => {
    if (!currentProject && id) {
      ProjectService.getProjectData(id).then(data => {
        if (data) setCurrentProject(data);
      });
    }
  }, [id, currentProject, setCurrentProject]);

  const summary = useMemo(() => {
    if (!currentProject) return null;
    return calculateProjectSummary(
      currentProject.items,
      currentProject.sections,
      currentProject.zones,
      currentProject.header.supervisionPercentage || 0,
      currentProject.projectConstants
    );
  }, [currentProject]);

  if (!currentProject || !summary) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-cairo text-slate-500">جاري تحميل بيانات المشروع...</div>;
  }

  // Calculate client specific financials (only what the client should see)
  const clientAccounts = currentProject.accounts?.filter(a => a.personType === 'client') || [];
  const totalAgreed = summary.grandTotal + summary.supervisionValue;
  const totalPaid = clientAccounts.reduce((sum, a) => sum + a.installments.filter(i => i.isPaid).reduce((s, i) => s + i.amount, 0), 0);
  const totalRemaining = totalAgreed - totalPaid;
  
  const clientInvoices = currentProject.invoices?.filter(inv => inv.type === 'client') || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-cairo">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-wide">{currentProject.header.projectName}</h1>
              <p className="text-xs text-slate-400">بوابة العميل (متابعة المشروع)</p>
            </div>
          </div>
          <Link href={`/projects/${id}`} className="text-sm font-bold text-slate-300 hover:text-white transition flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> خروج
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">مرحباً بك، {currentProject.header.ownerName || 'عميلنا العزيز'}</h2>
            <p className="text-slate-500">يمكنك من خلال هذه البوابة متابعة تقدم الأعمال، والمدفوعات، والمستخلصات بكل شفافية.</p>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
              <span className="block text-xs font-bold text-indigo-400 mb-1">نسبة الإنجاز المالي</span>
              <p className="text-2xl font-black text-indigo-600">
                {totalAgreed > 0 ? Math.round((totalPaid / totalAgreed) * 100) : 0}%
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <span className="block text-xs font-bold text-emerald-400 mb-1">نسبة الإنجاز الفني</span>
              <p className="text-2xl font-black text-emerald-600">
                {/* Temporary mock for technical progress */}
                45%
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-500" />
            الملخص المالي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500">إجمالي التعاقد (يشمل الأعمال والإشراف)</span>
              <p className="text-2xl font-black text-slate-800 mt-2">{totalAgreed.toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500">المدفوع حتى الآن</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{totalPaid.toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500">المتبقي حسابه</span>
              <p className="text-2xl font-black text-amber-500 mt-2">{totalRemaining.toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            سجل المستخلصات
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {clientInvoices.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                لا توجد مستخلصات معتمدة حتى الآن.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {clientInvoices.map(inv => (
                  <div key={inv.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div>
                      <h4 className="font-bold text-slate-800">{inv.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">تاريخ الإصدار: {new Date(inv.dateCreated).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800">{inv.totalAmount.toLocaleString()} ج.م</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                        inv.status === 'approved' || inv.status === 'submitted' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inv.status === 'draft' ? 'قيد المراجعة' : inv.status === 'submitted' ? 'مطلوب السداد' : 'تم الاعتماد'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Progress */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-500" />
            تقدم الأعمال (حسب البنود)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentProject.sections.filter(s => s.enabled).map((sec, idx) => {
              // Mock progress for now, ideally we calculate this based on actual vs estimated from BOQ
              const mockProgress = Math.min(100, Math.max(0, 100 - (idx * 20)));
              return (
                <div key={sec.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <h4 className="font-bold text-slate-800">{sec.title}</h4>
                      <span className="text-xs font-bold text-indigo-600">{mockProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${mockProgress}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
