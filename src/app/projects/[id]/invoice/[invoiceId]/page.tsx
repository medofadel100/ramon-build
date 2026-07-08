'use client';

import { useProjectStore } from '@/store/projectStore';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Printer, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ProjectService } from '@/lib/project-service';

export default function InvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const invoiceId = params.invoiceId as string;
  
  const currentProject = useProjectStore((state) => state.currentProject);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);

  useEffect(() => {
    if (!currentProject && id) {
      ProjectService.getProjectData(id).then(data => {
        if (data) setCurrentProject(data);
      });
    }
  }, [id, currentProject, setCurrentProject]);

  if (!currentProject) {
    return <div className="p-10 text-center font-cairo">جاري تحميل المستخلص...</div>;
  }

  const invoice = currentProject.invoices?.find(inv => inv.id === invoiceId);
  if (!invoice) {
    return <div className="p-10 text-center font-cairo">المستخلص غير موجود.</div>;
  }

  const subcontractor = invoice.type === 'subcontractor' && invoice.subcontractorId 
    ? currentProject.workers?.find(w => w.id === invoice.subcontractorId)
    : null;

  return (
    <div className="min-h-screen bg-white text-black font-cairo print:bg-white print:m-0 print:p-0">
      {/* Non-printable header */}
      <div className="print:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <Link href={`/projects/${id}`} className="flex items-center gap-2 hover:text-primary transition">
          <ArrowRight className="w-4 h-4" /> العودة للمشروع
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-emerald-600 px-4 py-2 rounded font-bold hover:brightness-110 transition"
        >
          <Printer className="w-4 h-4" /> طباعة المستخلص
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-10 print:max-w-full print:p-4">
        
        {/* Header / Company Info */}
        <div className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-800 mb-2">
              {invoice.type === 'client' ? 'مستخلص مالك (فاتورة)' : 'مستخلص مقاول باطن'}
            </h1>
            <h2 className="text-2xl font-bold text-slate-600">{currentProject.header.projectName}</h2>
            <p className="text-slate-500 mt-2">
              موجه إلى: {invoice.type === 'client' ? (currentProject.header.ownerName || 'المالك') : (subcontractor?.name || 'مقاول غير معروف')}
            </p>
          </div>
          <div className="text-left">
            <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center mb-2">
              <span className="text-slate-400 font-bold text-xs">شعار الشركة</span>
            </div>
            <p className="text-sm font-bold">تاريخ المستخلص: {new Date(invoice.dateCreated).toLocaleDateString('ar-EG')}</p>
            <p className="text-sm">رقم المرجع: {invoice.id.slice(-6).toUpperCase()}</p>
            <p className="text-sm">الحالة: {
              invoice.status === 'draft' ? 'مسودة' :
              invoice.status === 'submitted' ? 'مطلوب السداد' : 'تم الاعتماد'
            }</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">{invoice.title}</h3>
          {invoice.notes && <p className="text-slate-600 text-sm">{invoice.notes}</p>}
        </div>

        {/* Invoice Items Table */}
        <div className="mb-12">
          <table className="w-full text-sm border-x border-b border-slate-300">
            <thead className="bg-slate-800 text-white font-bold">
              <tr>
                <th className="p-3 text-right border-b border-slate-300 w-12">م</th>
                <th className="p-3 text-right border-b border-slate-300">بيان الأعمال (البند)</th>
                <th className="p-3 text-center border-b border-slate-300 w-24">الكمية السابقة</th>
                <th className="p-3 text-center border-b border-slate-300 w-24">الكمية الحالية</th>
                <th className="p-3 text-center border-b border-slate-300 w-24">الإجمالي التراكمي</th>
                <th className="p-3 text-center border-b border-slate-300 w-28">الفئة (ج.م)</th>
                <th className="p-3 text-center border-b border-slate-300 w-32">القيمة الحالية (ج.م)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 text-right font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{item.itemName}</td>
                  <td className="p-3 text-center text-slate-600">{item.previousQuantity || 0}</td>
                  <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/50">{item.currentQuantity || 0}</td>
                  <td className="p-3 text-center font-bold text-slate-700">{(item.previousQuantity || 0) + (item.currentQuantity || 0)}</td>
                  <td className="p-3 text-center font-bold">{item.unitPrice.toLocaleString()}</td>
                  <td className="p-3 text-center font-bold text-slate-900">{item.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-16 break-inside-avoid">
          <div className="w-1/2 border-2 border-slate-800 rounded-lg overflow-hidden">
            <div className="flex justify-between p-3 border-b border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-600">إجمالي الأعمال المنفذة (الحالي)</span>
              <span className="font-bold">{invoice.subtotal.toLocaleString()} ج.م</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between p-3 border-b border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-600">القيمة المضافة ({invoice.taxRate}%)</span>
                <span className="font-bold text-emerald-600">+{invoice.taxAmount.toLocaleString()} ج.م</span>
              </div>
            )}
            {invoice.retentionRate > 0 && (
              <div className="flex justify-between p-3 border-b border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-600">تأمين أعمال ({invoice.retentionRate}%)</span>
                <span className="font-bold text-rose-500">-{invoice.retentionAmount.toLocaleString()} ج.م</span>
              </div>
            )}
            {invoice.deductions > 0 && (
              <div className="flex justify-between p-3 border-b border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-600">خصومات واستقطاعات أخرى</span>
                <span className="font-bold text-rose-500">-{invoice.deductions.toLocaleString()} ج.م</span>
              </div>
            )}
            <div className="flex justify-between p-4 bg-slate-800 text-white text-xl">
              <span className="font-black">الصافي المستحق صرفه</span>
              <span className="font-black">{invoice.totalAmount.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 text-sm text-slate-700 mt-20 break-inside-avoid text-center">
          <div>
            <p className="font-bold mb-8">المهندس المسئول / حصر الكميات</p>
            <p>.......................................</p>
          </div>
          <div>
            <p className="font-bold mb-8">إعتماد {invoice.type === 'client' ? 'الاستشاري' : 'المدير المالي'}</p>
            <p>.......................................</p>
          </div>
          <div>
            <p className="font-bold mb-8">إعتماد {invoice.type === 'client' ? 'المالك' : 'الشركة (المقاول الرئيسي)'}</p>
            <p>.......................................</p>
          </div>
        </div>

      </div>
    </div>
  );
}
