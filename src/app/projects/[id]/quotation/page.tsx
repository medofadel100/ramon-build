'use client';

import { useProjectStore } from '@/store/projectStore';
import { calculateProjectSummary } from '@/lib/calculations';
import { useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Printer, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ProjectService } from '@/lib/project-service';

export default function QuotationPage() {
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
    return <div className="p-10 text-center font-cairo">جاري تحميل عرض السعر...</div>;
  }

  const sectionsWithItems = currentProject.sections.filter(sec => sec.enabled).map(sec => {
    const activeItems = currentProject.items.filter(it => it.sectionId === sec.id && it.isActive);
    return { ...sec, activeItems };
  }).filter(sec => sec.activeItems.length > 0);

  const grandTotalWithSupervision = summary.grandTotal + summary.supervisionValue;

  return (
    <div className="min-h-screen bg-white text-black font-cairo print:bg-white print:m-0 print:p-0">
      {/* Non-printable header controls */}
      <div className="print:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <Link href={`/projects/${id}`} className="flex items-center gap-2 hover:text-primary transition">
          <ArrowRight className="w-4 h-4" /> العودة للمشروع
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primary px-4 py-2 rounded font-bold hover:brightness-110 transition"
        >
          <Printer className="w-4 h-4" /> طباعة عرض السعر
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-10 print:max-w-full print:p-4">
        
        {/* Header / Company Info */}
        <div className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-800 mb-2">عرض سعر هندسي</h1>
            <h2 className="text-2xl font-bold text-slate-600">{currentProject.header.projectName}</h2>
            <p className="text-slate-500 mt-2">عناية السيد / {currentProject.header.ownerName || 'المالك'}</p>
          </div>
          <div className="text-left">
            <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center mb-2">
              <span className="text-slate-400 font-bold text-xs">شعار الشركة</span>
            </div>
            <p className="text-sm font-bold">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
            <p className="text-sm">رقم المرجع: {currentProject.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* Intro */}
        <div className="mb-8 text-slate-700 leading-relaxed text-justify">
          <p>
            يسعدنا تقديم عرض السعر الخاص بمشروعكم الموقر بناءً على المواصفات والكميات التي تم حصرها والاتفاق عليها مبدئياً. 
            الأسعار أدناه تشمل التوريد والتركيب ما لم يُذكر خلاف ذلك.
          </p>
        </div>

        {/* Detailed BOQ */}
        <div className="space-y-8 mb-12">
          {sectionsWithItems.map((sec, idx) => {
            const secSummary = summary.bySection[sec.id];
            
            return (
              <div key={sec.id} className="break-inside-avoid">
                <h3 className="text-xl font-bold text-white bg-slate-800 px-4 py-2 rounded-t-lg flex justify-between">
                  <span>{idx + 1}. {sec.title}</span>
                  <span>{secSummary?.totalCost.toLocaleString()} ج.م</span>
                </h3>
                <table className="w-full text-sm border-x border-b border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3 text-right border-b border-slate-300 w-12">م</th>
                      <th className="p-3 text-right border-b border-slate-300">بيان الأعمال (البند)</th>
                      <th className="p-3 text-center border-b border-slate-300 w-20">الوحدة</th>
                      <th className="p-3 text-center border-b border-slate-300 w-24">الكمية</th>
                      <th className="p-3 text-center border-b border-slate-300 w-28">الفئة (ج.م)</th>
                      <th className="p-3 text-center border-b border-slate-300 w-32">الإجمالي (ج.م)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sec.activeItems.map((item, itemIdx) => {
                      const itemTotal = secSummary?.itemDetails.find(d => d.id === item.id);
                      if (!itemTotal) return null;
                      
                      const unitPrice = itemTotal.estimatedDays > 0 ? (itemTotal.total / item.quantity) : 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3 text-right font-bold text-slate-500">{itemIdx + 1}</td>
                          <td className="p-3 text-right">
                            <p className="font-bold text-slate-800 mb-1">{item.title}</p>
                            {/* Specifications listed nicely */}
                            <div className="text-xs text-slate-600 pr-2 border-r-2 border-slate-300 space-y-0.5">
                              {Object.entries(item.specs || {}).map(([key, val]) => (
                                <p key={key}>- {key}: {val}</p>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-center text-slate-700">{item.unit}</td>
                          <td className="p-3 text-center font-bold">{item.quantity.toLocaleString()}</td>
                          <td className="p-3 text-center font-bold">
                            {item.pricing.mode === 'lump_sum' ? '-' : unitPrice.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-900">
                            {itemTotal.total.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-16 break-inside-avoid">
          <div className="w-1/2 border-2 border-slate-800 rounded-lg overflow-hidden">
            <div className="flex justify-between p-3 border-b border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-600">إجمالي الأعمال (الأساسيات)</span>
              <span className="font-bold">{summary.grandTotal.toLocaleString()} ج.م</span>
            </div>
            {summary.supervisionValue > 0 && (
              <div className="flex justify-between p-3 border-b border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-600">نسبة الإشراف والإدارة ({currentProject.header.supervisionPercentage}%)</span>
                <span className="font-bold">{summary.supervisionValue.toLocaleString()} ج.م</span>
              </div>
            )}
            <div className="flex justify-between p-4 bg-slate-800 text-white text-xl">
              <span className="font-black">الإجمالي الكلي المستحق</span>
              <span className="font-black">{grandTotalWithSupervision.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

        {/* Terms & Signatures */}
        <div className="grid grid-cols-2 gap-8 text-sm text-slate-700 break-inside-avoid">
          <div>
            <h4 className="font-bold text-slate-900 mb-2 border-b-2 border-slate-800 pb-1 inline-block">الشروط والأحكام</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>الأسعار سارية لمدة 15 يوماً من تاريخ العرض.</li>
              <li>أي أعمال إضافية غير مذكورة في هذا العرض يتم تسعيرها منفصلة.</li>
              <li>طريقة الدفع: يتم الاتفاق عليها في العقد المبرم.</li>
            </ul>
          </div>
          <div className="flex justify-around items-end pt-10">
            <div className="text-center">
              <p className="font-bold mb-8">توقيع المالك (بالموافقة)</p>
              <p>.......................................</p>
            </div>
            <div className="text-center">
              <p className="font-bold mb-8">توقيع المقاول / الشركة</p>
              <p>.......................................</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
