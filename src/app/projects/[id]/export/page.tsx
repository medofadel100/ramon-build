'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import Navbar from '@/components/Navbar';
import { calculateItemTotal, calculateProjectSummary, calculateItemMaterials } from '@/lib/calculations';
import { Printer, ChevronLeft, FileText, CheckSquare, Layers, Calendar, User, Phone, MapPin, ClipboardList, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ExportPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectExportPage({ params }: ExportPageProps) {
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;

  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const router = useRouter();

  const loadProject = useProjectStore((state) => state.loadProject);
  const currentProject = useProjectStore((state) => state.currentProject);
  const loadingProject = useProjectStore((state) => state.loading);

  // Active Report template selection selection
  const [reportType, setReportType] = useState<'client' | 'materials' | 'internal' | 'quotation'>('quotation');

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  // Aggregate project summary
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

  // Aggregate list of purchase materials from specifications
  const purchaseMaterials = useMemo(() => {
    if (!currentProject) return [];
    
    const matList: any[] = [];
    currentProject.items.forEach(item => {
      if (!item.isActive) return;
      
      const itemMats = calculateItemMaterials(item, currentProject.zones, currentProject.projectConstants);
      itemMats.forEach(mat => {
        matList.push({
          itemId: item.id,
          title: item.title,
          key: mat.key,
          material: mat.name,
          qtyRequired: mat.qtyRequired,
          qtyRounded: mat.qtyRounded,
          unit: mat.unit,
          unitPrice: mat.unitPrice,
          totalCost: mat.totalCost,
          packagingDetails: mat.packagingDetails,
          sectionId: item.sectionId
        });
      });
    });
    return matList;
  }, [currentProject]);

  if (loadingAuth || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (loadingProject || !currentProject || !summary) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-cairo text-sm text-muted-foreground">جاري معالجة بيانات التصدير والطباعة...</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const activeItems = currentProject.items.filter(it => it.isActive);

  return (
    <div className="min-h-screen bg-background flex flex-col font-cairo select-none pb-12">
      
      {/* Navbar with hidden rules on print */}
      <div className="no-print">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Controls Sidebar - Hidden on print */}
        <div className="w-full lg:w-80 space-y-6 no-print">
          <Link
            href={`/projects/${currentProject.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition"
          >
            <ArrowRight className="h-4 w-4 transform rotate-180" />
            العودة للوحة تحكم المشروع
          </Link>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">اختر نوع التقرير الفني</h3>
            <p className="text-[10px] text-muted-foreground leading-normal">
              اختر أحد القوالب التصديرية الثلاثة لتوليد مستند طباعة معتمد للعميل أو الإدارة الفنية.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => setReportType('client')}
                className={`w-full p-3.5 rounded-lg text-right border transition flex items-center gap-3 ${
                  reportType === 'client'
                    ? 'bg-primary/15 border-primary text-foreground font-bold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-slate-700'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <div className="text-right">
                  <span className="block text-xs">١. تقرير مقايسة العميل</span>
                  <span className="block text-[8px] text-muted-foreground font-medium mt-0.5">جدول الأبعاد وحصر البنود والمواصفات</span>
                </div>
              </button>
              
              <button
                onClick={() => setReportType('materials')}
                className={`w-full p-3.5 rounded-lg text-right border transition flex items-center gap-3 ${
                  reportType === 'materials'
                    ? 'bg-primary/15 border-primary text-foreground font-bold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-slate-700'
                }`}
              >
                <ClipboardList className="h-4 w-4 shrink-0" />
                <div className="text-right">
                  <span className="block text-xs">٢. كشف مواد الشراء</span>
                  <span className="block text-[8px] text-muted-foreground font-medium mt-0.5">مستلزمات الدهان، البورسلين، والصرف بالفواصل والنسب</span>
                </div>
              </button>

              <button
                onClick={() => setReportType('internal')}
                className={`w-full p-3.5 rounded-lg text-right border transition flex items-center gap-3 ${
                  reportType === 'internal'
                    ? 'bg-primary/15 border-primary text-foreground font-bold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-slate-700'
                }`}
              >
                <Printer className="h-4 w-4 shrink-0" />
                <div className="text-right">
                  <span className="block text-xs">٣. مقايسة الحصر واليوميات الداخلي</span>
                  <span className="block text-[8px] text-muted-foreground font-medium mt-0.5">تفاصيل التكلفة والتجزئة، أيام التنفيذ والجدول</span>
                </div>
              </button>

              <button
                onClick={() => setReportType('quotation')}
                className={`w-full p-3.5 rounded-lg text-right border transition flex items-center gap-3 ${
                  reportType === 'quotation'
                    ? 'bg-primary/15 border-primary text-foreground font-bold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-slate-700'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <div className="text-right">
                  <span className="block text-xs">٤. عرض سعر مالي للعميل</span>
                  <span className="block text-[8px] text-muted-foreground font-medium mt-0.5">تفاصيل كميات وأسعار للبنود المنفذة</span>
                </div>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#c5a880] to-[#e5c595] py-2.5 font-cairo text-xs font-bold text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              <Printer className="h-4 w-4" />
              طباعة وحفظ PDF بالمتصفح
            </button>
          </div>
        </div>

        {/* Preview Frame Area - A4 styled layout preview */}
        <div className="flex-1 overflow-x-auto p-1 bg-muted/20 border border-dashed border-border rounded-2xl flex justify-center">
          
          <div 
            id="print-sheet-node"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[15mm] shadow-2xl relative select-text flex flex-col justify-between"
            style={{ contentVisibility: 'auto' }}
          >
            <div>
              {/* PRINT HEADER */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
                <div className="flex items-center gap-4">
                  <img src="/logo.jpeg" alt="Ramon Build Logo" className="w-16 h-16 object-contain rounded-md" />
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight">مكتب رامون الفني للتشطيبات والمقاولات</h1>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">المكتب الهندسي الاستشاري للحصر والكميات والمواصفات</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs font-black tracking-wider block bg-muted text-foreground px-2 py-0.5 rounded text-center">
                    {currentProject.header.projectCode}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground block mt-1">تاريخ الإصدار: {currentProject.header.issueDate}</span>
                </div>
              </div>

              {/* Project Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-slate-350 bg-slate-50 rounded-xl mb-6 text-[10px] font-bold">
                <div>
                  <span className="text-muted-foreground block">المشروع المستهدف</span>
                  <span className="text-slate-900 text-xs font-black">{currentProject.header.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">العميل المستفيد</span>
                  <span className="text-slate-900 text-xs font-black">{currentProject.header.ownerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">المحافظة والعنوان</span>
                  <span className="text-slate-900 text-xs font-black">{currentProject.header.governorate} - {currentProject.header.addressDetails || 'الموقع المسجل'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">الكود التصميمي</span>
                  <span className="text-slate-900 text-xs font-black">{currentProject.header.designCode}</span>
                </div>
              </div>

              {/* REPORT 4: Quotation */}
              {reportType === 'quotation' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 border-b border-slate-400 pb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-muted-foreground" /> عرض سعر معتمد</span>
                      <span className="text-[10px] text-muted-foreground font-bold">صالح لمدة ١٥ يوماً من تاريخ الإصدار</span>
                    </h2>
                  </div>

                  <table className="w-full text-right text-[10px] font-bold border-collapse border border-slate-300">
                    <thead className="bg-card text-foreground border-b border-slate-300">
                      <tr>
                        <th className="p-2 border border-slate-300 w-12 text-center">رقم</th>
                        <th className="p-2 border border-slate-300 text-right">البيان</th>
                        <th className="p-2 border border-slate-300 text-center w-16">الوحدة</th>
                        <th className="p-2 border border-slate-300 text-center w-20">الكمية</th>
                        <th className="p-2 border border-slate-300 text-center w-20">الفئة (ج.م)</th>
                        <th className="p-2 border border-slate-300 text-center w-24">الإجمالي (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentProject.sections.filter(sec => sec.enabled).map((sec, secIdx) => {
                        const secItems = activeItems.filter(it => it.sectionId === sec.id);
                        if (secItems.length === 0) return null;

                        return (
                          <React.Fragment key={sec.id}>
                            <tr className="bg-slate-100 font-black border-y-2 border-slate-300">
                              <td colSpan={6} className="p-2 text-slate-800">
                                بند ({secIdx + 1}): {sec.title}
                              </td>
                            </tr>
                            {secItems.map((item, itemIdx) => {
                              const res = calculateItemTotal(item, currentProject.zones, currentProject.projectConstants);
                              const unitPrice = res.quantity > 0 ? (res.total / res.quantity) : 0;
                              return (
                                <tr key={item.id}>
                                  <td className="p-2 border border-slate-300 text-center text-muted-foreground">{itemIdx + 1}</td>
                                  <td className="p-2 border border-slate-300 text-slate-800">
                                    <span className="block font-black">{item.title}</span>
                                    {item.notes && <span className="block text-[8px] text-muted-foreground font-medium mt-0.5">{item.notes}</span>}
                                  </td>
                                  <td className="p-2 border border-slate-300 text-center">{item.unit}</td>
                                  <td className="p-2 border border-slate-300 text-center">{res.quantity.toFixed(1)}</td>
                                  <td className="p-2 border border-slate-300 text-center">
                                    {unitPrice > 0 ? Math.round(unitPrice).toLocaleString() : '-'}
                                  </td>
                                  <td className="p-2 border border-slate-300 text-center font-extrabold text-slate-900 bg-slate-50">
                                    {res.total > 0 ? res.total.toLocaleString() : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      
                      <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-900 text-xs">
                        <td className="p-3 border border-slate-350 text-right" colSpan={5}>إجمالي عرض السعر التقديري</td>
                        <td className="p-3 border border-slate-350 text-center bg-primary/10 text-slate-900">
                          {summary.grandTotal.toLocaleString()} ج.م
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* REPORT 1: Client BOQ Report */}
              {reportType === 'client' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 border-b border-slate-400 pb-1 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      مقايسة حصر البنود والمواصفات التفصيلية للعميل
                    </h2>
                  </div>

                  <table className="w-full text-right text-[10px] font-bold border-collapse border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300">
                      <tr>
                        <th className="p-2 border border-slate-300 w-12 text-center">كود</th>
                        <th className="p-2 border border-slate-300 text-right">بيان الأعمال الفنية والمواصفات</th>
                        <th className="p-2 border border-slate-300 text-center w-20">الكمية</th>
                        <th className="p-2 border border-slate-300 text-center w-16">الوحدة</th>
                        {currentProject.clientShareSettings.showPrices && (
                          <th className="p-2 border border-slate-300 text-center w-24">إجمالي السعر</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentProject.sections.filter(sec => sec.enabled).map((sec) => {
                        const secItems = activeItems.filter(it => it.sectionId === sec.id);
                        if (secItems.length === 0) return null;

                        return (
                          <React.Fragment key={sec.id}>
                            <tr className="bg-slate-50 font-black">
                              <td className="p-2 border border-slate-300 text-center text-muted-foreground">{sec.id}</td>
                              <td className="p-2 border border-slate-300 text-slate-900" colSpan={currentProject.clientShareSettings.showPrices ? 4 : 3}>
                                {sec.title}
                              </td>
                            </tr>
                            {secItems.map((item) => {
                              const res = calculateItemTotal(item, currentProject.zones, currentProject.projectConstants);
                              return (
                                <tr key={item.id}>
                                  <td className="p-2 border border-slate-300 text-center text-muted-foreground">{item.id}</td>
                                  <td className="p-2 border border-slate-300 text-slate-800">
                                    <span>{item.title}</span>
                                    {item.notes && (
                                      <span className="block text-[8px] text-muted-foreground mt-0.5">ملاحظة: {item.notes}</span>
                                    )}
                                  </td>
                                  <td className="p-2 border border-slate-300 text-center">{res.quantity.toFixed(1)}</td>
                                  <td className="p-2 border border-slate-300 text-center">{item.unit}</td>
                                  {currentProject.clientShareSettings.showPrices && (
                                    <td className="p-2 border border-slate-300 text-center font-extrabold text-slate-900">
                                      {res.total.toLocaleString()} ج.م
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      
                      {currentProject.clientShareSettings.showPrices && (
                        <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-900 text-xs">
                          <td className="p-3 border border-slate-350 text-right" colSpan={4}>الإجمالي التقديري النهائي للمقايسة</td>
                          <td className="p-3 border border-slate-350 text-center font-black bg-slate-50 text-slate-900">
                            {summary.grandTotal.toLocaleString()} ج.م
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* REPORT 2: Materials Checklist Report */}
              {reportType === 'materials' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 border-b border-slate-400 pb-1 flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                      بيان مواد ومستلزمات الشراء المطلوبة للموقع
                    </h2>
                  </div>

                  <table className="w-full text-right text-[10px] font-bold border-collapse border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300">
                      <tr>
                        <th className="p-2 border border-slate-300 text-right">البند المستهدف</th>
                        <th className="p-2 border border-slate-300 text-right">الخامة والتوصيف الفني المطلوب</th>
                        <th className="p-2 border border-slate-300 text-center w-20">الاحتياج الفعلي</th>
                        <th className="p-2 border border-slate-300 text-center w-20">الكمية المقربة</th>
                        <th className="p-2 border border-slate-300 text-center w-14">الوحدة</th>
                        <th className="p-2 border border-slate-300 text-center w-16">سعر الوحدة</th>
                        <th className="p-2 border border-slate-300 text-center w-20">الإجمالي</th>
                        <th className="p-2 border border-slate-300 text-center w-16">حالة التوريد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {purchaseMaterials.length === 0 ? (
                        <tr>
                          <td className="p-4 text-center text-muted-foreground" colSpan={8}>لا توجد مواد شراء معرفة في مواصفات بنود المقايسة.</td>
                        </tr>
                      ) : (
                        <>
                          {purchaseMaterials.map((mat, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="p-2 border border-slate-300 text-muted-foreground font-semibold">{mat.title}</td>
                              <td className="p-2 border border-slate-300 text-slate-900 font-black">
                                {mat.material}
                                {mat.packagingDetails && (
                                  <span className="block text-[8.5px] text-muted-foreground font-normal mt-0.5">{mat.packagingDetails}</span>
                                )}
                              </td>
                              <td className="p-2 border border-slate-300 text-center text-slate-600">{mat.qtyRequired.toFixed(1)}</td>
                              <td className="p-2 border border-slate-300 text-center text-slate-900 font-black">{mat.qtyRounded}</td>
                              <td className="p-2 border border-slate-300 text-center text-slate-600">{mat.unit}</td>
                              <td className="p-2 border border-slate-300 text-center text-slate-800">{mat.unitPrice.toLocaleString()} ج.م</td>
                              <td className="p-2 border border-slate-300 text-center text-slate-900 font-extrabold">{mat.totalCost.toLocaleString()} ج.م</td>
                              <td className="p-2 border border-slate-300 text-center">
                                <span className="inline-block border border-slate-400 w-3 h-3 rounded mr-1"></span>
                                <span className="text-[8px] text-muted-foreground mr-1 leading-none">لم يورد</span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-900 text-xs">
                            <td className="p-3 border border-slate-300 text-right" colSpan={6}>إجمالي تكلفة مواد ومستلزمات الشراء المطلوبة للموقع</td>
                            <td className="p-3 border border-slate-300 text-center font-black bg-slate-50 text-slate-900" colSpan={2}>
                              {purchaseMaterials.reduce((sum, mat) => sum + mat.totalCost, 0).toLocaleString()} ج.م
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* REPORT 3: Internal Full BOQ Report */}
              {reportType === 'internal' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 border-b border-slate-400 pb-1 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      تقرير مقايسة الحصر الداخلي وبنود اليوميات
                    </h2>
                  </div>

                  <table className="w-full text-right text-[9px] font-bold border-collapse border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300">
                      <tr>
                        <th className="p-2 border border-slate-300 text-right">بيان الأعمال ومواصفاتها</th>
                        <th className="p-2 border border-slate-300 text-center w-14">الكمية</th>
                        <th className="p-2 border border-slate-300 text-center w-14">وحدة</th>
                        <th className="p-2 border border-slate-300 text-center w-14">سعر خامات</th>
                        <th className="p-2 border border-slate-300 text-center w-14">سعر عمالة</th>
                        <th className="p-2 border border-slate-300 text-center w-14">أيام</th>
                        <th className="p-2 border border-slate-300 text-center w-20">إجمالي البند</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentProject.sections.filter(sec => sec.enabled).map((sec) => {
                        const secItems = activeItems.filter(it => it.sectionId === sec.id);
                        if (secItems.length === 0) return null;

                        return (
                          <React.Fragment key={sec.id}>
                            <tr className="bg-slate-50 font-black text-[10px]">
                              <td className="p-2 border border-slate-300 text-slate-900" colSpan={7}>
                                {sec.id} - {sec.title}
                              </td>
                            </tr>
                            {secItems.map((item) => {
                              const res = calculateItemTotal(item, currentProject.zones, currentProject.projectConstants);
                              return (
                                <tr key={item.id}>
                                  <td className="p-2 border border-slate-300 text-slate-800">
                                    {item.title}
                                    {item.pricing.mode === 'daily_rate' && (
                                      <span className="inline-block px-1 rounded bg-slate-150 text-[7px] text-muted-foreground font-normal mr-1">يوميات</span>
                                    )}
                                  </td>
                                  <td className="p-2 border border-slate-300 text-center">{res.quantity.toFixed(1)}</td>
                                  <td className="p-2 border border-slate-300 text-center">{item.unit}</td>
                                  <td className="p-2 border border-slate-300 text-center">
                                    {item.pricing.mode === 'materials_labor_split' ? `${item.pricing.materialUnitPrice}` : '-'}
                                  </td>
                                  <td className="p-2 border border-slate-300 text-center">
                                    {item.pricing.mode === 'materials_labor_split' ? `${item.pricing.laborUnitPrice}` : item.pricing.mode === 'daily_rate' ? `${item.pricing.dailyRate}/يوم` : '-'}
                                  </td>
                                  <td className="p-2 border border-slate-300 text-center">{res.estimatedDays}</td>
                                  <td className="p-2 border border-slate-300 text-center font-extrabold text-slate-950">
                                    {res.total.toLocaleString()} ج.م
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Financial summary blocks */}
                      <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-900 text-[10px]">
                        <td className="p-2 border border-slate-300" colSpan={6}>إجمالي تكلفة الخامات والمواد المطلوبة:</td>
                        <td className="p-2 border border-slate-300 text-center text-slate-900">{summary.grandMaterialCost.toLocaleString()} ج.م</td>
                      </tr>
                      <tr className="bg-slate-100 font-extrabold border-t border-slate-300 text-[10px]">
                        <td className="p-2 border border-slate-300" colSpan={6}>إجمالي تكلفة المصنعيات والعمالة واليوميات:</td>
                        <td className="p-2 border border-slate-300 text-center text-slate-900">{summary.grandLaborCost.toLocaleString()} ج.م</td>
                      </tr>
                      <tr className="bg-slate-200 font-black border-t-2 border-slate-900 text-xs">
                        <td className="p-3 border border-slate-300" colSpan={6}>الإجمالي الكلي لميزانية المشروع الداخلي:</td>
                        <td className="p-3 border border-slate-300 text-center bg-white text-slate-950 font-black">
                          {summary.grandTotal.toLocaleString()} ج.م
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PRINT FOOTER STAMP */}
            <div className="border-t border-slate-400 pt-8 mt-12 flex justify-between items-center text-[9px] font-bold text-muted-foreground">
              <div className="space-y-1">
                <p>توقيع المهندس المسؤول: .............................</p>
                <p>توقيع مدير المكتب الفني: .............................</p>
              </div>
              <div className="text-left space-y-1">
                <p>شركة رامون للتشطيبات والمقاولات العامة</p>
                <p>شعار المقايسة المعتمد 2026</p>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
