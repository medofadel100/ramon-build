'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Zone, BOQItem, calculateProjectSummary, calculateItemTotal } from '@/lib/calculations';
import { FileText, MapPin, Calendar, User, Layers, ClipboardCheck, Info, FileSpreadsheet, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface ClientViewPageProps {
  params: Promise<{ token: string }>;
}

export default function ClientViewPage({ params }: ClientViewPageProps) {
  const resolvedParams = React.use(params);
  const shareToken = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Project state
  const [project, setProject] = useState<any>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [items, setItems] = useState<BOQItem[]>([]);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!shareToken) return;

    async function loadSharedProject() {
      setLoading(true);
      setError(null);
      try {
        // Find project matching the token
        const pQuery = query(collection(db, 'projects'), where('clientShareToken', '==', shareToken));
        const snap = await getDocs(pQuery);

        if (snap.empty) {
          setError('رابط المشاركة هذا غير صالح أو تم إبطال صلاحيته.');
          setLoading(false);
          return;
        }

        const projectDoc = snap.docs[0];
        const pData = projectDoc.data();
        const projectId = projectDoc.id;

        // Fetch subcollections
        const areasSnap = await getDocs(collection(db, 'projects', projectId, 'areas'));
        const zonesList = areasSnap.docs.map(doc => doc.data() as Zone);

        const sectionsSnap = await getDocs(collection(db, 'projects', projectId, 'sections'));
        const sectionsList = sectionsSnap.docs.map(doc => doc.data() as any);

        const itemsList: BOQItem[] = [];
        const itemPromises = sectionsList.map(async (sec) => {
          const itemsSnap = await getDocs(collection(db, 'projects', projectId, 'sections', sec.id, 'items'));
          itemsSnap.docs.forEach(doc => {
            itemsList.push(doc.data() as BOQItem);
          });
        });

        await Promise.all(itemPromises);

        // Sort lists
        zonesList.sort((a, b) => a.name.localeCompare(b.name));
        sectionsList.sort((a, b) => a.id.localeCompare(b.id));
        itemsList.sort((a, b) => a.id.localeCompare(b.id));

        setProject({ id: projectId, ...pData });
        setZones(zonesList);
        setSections(sectionsList);
        setItems(itemsList);

        // Expand first 2 sections by default
        if (sectionsList.length > 0) {
          setExpandedSections({ 
            [sectionsList[0].id]: true,
            [sectionsList[1]?.id || '']: true 
          });
        }

      } catch (err: any) {
        console.error(err);
        setError('خطأ أثناء تحميل مستند الحصر.');
      } finally {
        setLoading(false);
      }
    }

    loadSharedProject();
  }, [shareToken]);

  // Aggregate project summary
  const summary = useMemo(() => {
    if (!project) return null;
    return calculateProjectSummary(items, sections, zones);
  }, [project, items, sections, zones]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d0e12] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
          <p className="font-cairo text-sm text-slate-400">جاري فتح ملف حصر العميل المعتمد...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex flex-col items-center justify-center text-center p-6 select-none font-cairo">
        <div className="max-w-md border border-slate-800 bg-[#13151c] p-8 rounded-2xl shadow-xl space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950 text-rose-500">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">رابط المشاركة مقيد</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error || 'الملف المطلوب غير متاح.'}</p>
        </div>
      </div>
    );
  }

  const settings = project.clientShareSettings || { showPrices: true, showDetailedPricing: true };
  const showPrices = settings.showPrices;
  const showDetailedPricing = settings.showDetailedPricing;

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'draft': return 'مسودة معتمدة';
      case 'review': return 'تحت المراجعة';
      case 'approved': return 'معتمد فنيًا';
      case 'sent_to_client': return 'مرسل للعميل';
      case 'closed': return 'مغلق/منتهي';
      default: return s;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-slate-100 font-cairo select-none flex flex-col pb-16">
      
      {/* Client Dashboard Header */}
      <header className="border-b border-[#222634] bg-[#13151c] py-6 px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#c5a880] bg-[#c5a880]/10 px-2 py-0.5 rounded tracking-wide">
                {project.header.projectCode}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">حالة الملف: {getStatusLabel(project.header.status)}</span>
            </div>
            <h1 className="text-xl font-extrabold text-white">{project.header.name}</h1>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">المكتب الفني الاستشاري لشركة</span>
            <span className="font-extrabold text-sm text-[#c5a880] tracking-wide">رامون للتشطيبات والمقاولات</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* 1. Project Metadata Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 rounded-2xl border border-[#222634] bg-[#13151c] p-6 shadow-lg">
          <div className="flex gap-3 items-start">
            <User className="h-5 w-5 text-[#c5a880] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="block text-[10px] text-slate-500 font-bold">العميل المستفيد</span>
              <p className="text-xs font-bold text-white">{project.header.ownerName}</p>
              <p className="text-[10px] text-slate-400">{project.header.ownerPhone}</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <MapPin className="h-5 w-5 text-[#c5a880] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="block text-[10px] text-slate-500 font-bold">العنوان وتفاصيل الموقع</span>
              <p className="text-xs font-bold text-white">{project.header.governorate}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{project.header.addressDetails}</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Calendar className="h-5 w-5 text-[#c5a880] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="block text-[10px] text-slate-500 font-bold">تاريخ إصدار الحصر</span>
              <p className="text-xs font-bold text-white">{project.header.issueDate}</p>
              <p className="text-[10px] text-slate-400">مرجع الكود: {project.header.designCode}</p>
            </div>
          </div>
        </div>

        {/* 2. Client Overview Areas Table */}
        <div className="rounded-2xl border border-[#222634] bg-[#13151c] p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-[#222634] pb-2">
            <Layers className="h-4 w-4 text-[#c5a880]" />
            جدول أبعاد ومساحات الحيّز (الأرضية والجدران)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#1a1c24] text-slate-400 font-bold border-b border-[#222634]">
                <tr>
                  <th className="p-3 text-right">المساحة / الغرفة</th>
                  <th className="p-3 text-center">مساحة الأرضية (م²)</th>
                  <th className="p-3 text-center">المحيط (م.ط)</th>
                  <th className="p-3 text-center">الارتفاع (م)</th>
                  <th className="p-3 text-center bg-[#c5a880]/5 text-[#c5a880]">مساحة الحوائط التشطيبية (م²)</th>
                  <th className="p-3 text-center">مساحة الأسقف (م²)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222634] text-slate-300">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-slate-900/20">
                    <td className="p-3 text-white font-bold">{zone.name}</td>
                    <td className="p-3 text-center">{zone.floorArea.toFixed(1)}</td>
                    <td className="p-3 text-center">{zone.perimeter.toFixed(1)}</td>
                    <td className="p-3 text-center">{zone.height.toFixed(1)}</td>
                    <td className="p-3 text-center bg-[#c5a880]/5 text-[#c5a880] font-bold">{zone.wallArea.toFixed(1)}</td>
                    <td className="p-3 text-center">{zone.ceilingArea.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Detailed BOQ Tree View */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 px-1">
            <ClipboardCheck className="h-4 w-4 text-[#c5a880]" />
            شجرة تفاصيل بنود الحصر والمقايسة المعتمدة
          </h3>

          <div className="space-y-3">
            {sections.filter(sec => sec.enabled).map((sec) => {
              const isExpanded = expandedSections[sec.id];
              const secItems = items.filter(it => it.sectionId === sec.id && it.isActive);
              
              // Sum cost of section items
              const sectionTotal = secItems.reduce((acc, it) => {
                const res = calculateItemTotal(it, zones);
                return acc + res.total;
              }, 0);

              if (secItems.length === 0) return null;

              return (
                <div key={sec.id} className="rounded-xl border border-[#222634] bg-[#13151c] overflow-hidden">
                  
                  {/* Section Title Header */}
                  <div 
                    onClick={() => toggleSection(sec.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-900/35 transition"
                  >
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-slate-500 font-bold">{sec.id}</span>
                      {sec.title}
                    </h4>

                    <div className="flex items-center gap-3">
                      {showPrices && (
                        <span className="text-xs font-bold text-[#c5a880] bg-[#c5a880]/10 px-2 py-0.5 rounded">
                          إجمالي القسم: {sectionTotal.toLocaleString()} ج.م
                        </span>
                      )}
                      <button className="text-slate-500">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Section items list */}
                  {isExpanded && (
                    <div className="border-t border-[#222634] divide-y divide-[#222634] p-3 bg-slate-950/15">
                      {secItems.map((item) => {
                        const res = calculateItemTotal(item, zones);

                        return (
                          <div key={item.id} className="p-3 text-right">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div>
                                <span className="text-xs font-bold text-white block">{item.title}</span>
                                {item.notes && (
                                  <span className="text-[10px] text-slate-400 block mt-1">ملاحظة: {item.notes}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-300 font-medium">{res.quantity.toFixed(1)} {item.unit}</span>
                                {showPrices && showDetailedPricing && (
                                  <span className="text-xs text-[#c5a880] font-bold w-20 text-left">
                                    {res.total.toLocaleString()} ج.م
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Render specs fields if present and relevant to client */}
                            {Object.keys(item.specs).length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] text-slate-400">
                                {Object.entries(item.specs).map(([k, v]) => {
                                  if (k === 'coverageRate' || k === 'canSize') return null; // skip raw maths variables
                                  return (
                                    <span key={k} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                      {k === 'colorCode' ? 'كود اللون' : k === 'paintType' ? 'نوع الدهان' : k === 'flooringType' ? 'نوع الأرضية' : k}: {String(v)}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Client Financial Summary */}
        {showPrices && summary && (
          <div className="rounded-2xl border border-[#222634] bg-[#13151c] p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-[#222634] pb-2">
              <FileSpreadsheet className="h-4 w-4 text-[#c5a880]" />
              الملخص المالي ومقايسة الحصر النهائية
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1a1c24] text-slate-400 font-bold border-b border-[#222634]">
                  <tr>
                    <th className="p-3 text-right">كود القسم</th>
                    <th className="p-3 text-right">البند / القسم الرئيسي</th>
                    <th className="p-3 text-center">إجمالي التكلفة المقدرة للقسم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222634] text-slate-300">
                  {Object.values(summary.bySection).map((sec) => (
                    <tr key={sec.sectionId} className="hover:bg-slate-900/20">
                      <td className="p-3 text-slate-500 font-bold">{sec.sectionId}</td>
                      <td className="p-3 text-white font-bold">{sec.title}</td>
                      <td className="p-3 text-center font-bold text-white">{sec.totalCost.toLocaleString()} ج.م</td>
                    </tr>
                  ))}
                  <tr className="bg-[#1a1c24]/50 border-t border-[#222634] text-sm text-white font-extrabold">
                    <td className="p-4" colSpan={2}>الإجمالي الكلي التقديري للمقايسة (شامل المواد والمصنعيات)</td>
                    <td className="p-4 text-center bg-[#c5a880]/15 text-[#c5a880] font-black">
                      {summary.grandTotal.toLocaleString()} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-[#c5a880]/5 border border-[#c5a880]/20 p-4 text-[10px] text-slate-400 font-medium leading-relaxed">
              * الأسعار المذكورة أعلاه هي أسعار تقديرية مبنية على حصر كميات الأبعاد المسطحة للموقع (Floor & Wall dimensions) وتخضع لشروط التوريد ومدة تنفيذ مجملها {summary.totalDays} أيام عمل متواصلة.
            </div>
          </div>
        )}

      </main>

      {/* Corporate stamp footer */}
      <footer className="mt-auto max-w-5xl w-full mx-auto px-6 border-t border-[#222634] pt-8 text-center text-slate-500 text-[10px] font-semibold space-y-1 bg-[#0b0c10]">
        <p className="text-slate-400">مكتب رامون الفني للتشطيبات والمقاولات العامة والإنشاءات</p>
        <p>مصر - جميع الحقوق محفوظة لشركة رامون © 2026</p>
      </footer>

    </div>
  );
}
