'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Zone, BOQItem, calculateProjectSummary, calculateItemTotal } from '@/lib/calculations';
import { formatDate } from '@/lib/project-service';
import { 
  MapPin, Calendar, User, Layers, ClipboardCheck, Info, FileSpreadsheet, Lock, 
  ChevronUp, ChevronDown, Shield, Users, Zap, Wrench, Building2, Paintbrush, HardHat, Ruler, Phone, Image as ImageIcon, DollarSign, Activity
} from 'lucide-react';

interface ClientViewPageProps {
  params: Promise<{ token: string }>;
}

const SPECIALTIES: Record<string, { label: string; icon: any; color: string }> = {
  'electrical': { label: 'مهندس كهرباء', icon: Zap, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  'mechanical': { label: 'مهندس ميكانيكا', icon: Wrench, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  'civil': { label: 'مهندس إنشائي / مدني', icon: Building2, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  'interior_design': { label: 'مهندس تصميم داخلي', icon: Paintbrush, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  'finishing_supervisor': { label: 'مشرف تشطيبات', icon: HardHat, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  'structural': { label: 'مهندس إنشائي', icon: Ruler, color: 'text-teal-400 bg-teal-400/10 border-teal-400/20' },
  'other': { label: 'أخرى', icon: Shield, color: 'text-muted-foreground bg-slate-400/10 border-slate-400/20' }
};

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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'boq' | 'financials' | 'gallery'>('boq');

  useEffect(() => {
    if (!shareToken) return;

    async function loadSharedProject() {
      setLoading(true);
      setError(null);
      try {
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

        zonesList.sort((a, b) => a.name.localeCompare(b.name));
        sectionsList.sort((a, b) => a.id.localeCompare(b.id));
        itemsList.sort((a, b) => a.id.localeCompare(b.id));

        // Fetch Invoices
        const invoicesSnap = await getDocs(collection(db, 'projects', projectId, 'invoices'));
        const invoicesList = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // filter client invoices only? actually client shouldn't see subcontractor invoices
        const clientInvoices = invoicesList.filter((inv: any) => inv.type === 'client');

        // Fetch Daily Logs
        const logsSnap = await getDocs(collection(db, 'projects', projectId, 'dailylogs'));
        const logsList = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logsList.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setProject({ id: projectId, ...pData });
        setZones(zonesList);
        setSections(sectionsList);
        setItems(itemsList);
        setInvoices(clientInvoices);
        setDailyLogs(logsList);

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

  const summary = useMemo(() => {
    if (!project) return null;
    return calculateProjectSummary(items, sections, zones, project.header.supervisionPercentage || 0, project.projectConstants);
  }, [project, items, sections, zones]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(197,168,128,0.5)]"></div>
          <p className="font-cairo text-sm text-muted-foreground font-semibold tracking-wide animate-pulse">جاري فتح ملف حصر العميل المعتمد...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 select-none font-cairo relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-md border border-border/50 bg-card/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl space-y-5 z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-950/50 border border-rose-900/50 text-rose-500 shadow-inner">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">رابط المشاركة مقيد</h2>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">{error || 'الملف المطلوب غير متاح.'}</p>
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

  const engineers = project.header.engineersDetails || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-cairo select-none flex flex-col pb-16 relative">
      
      {/* Subtle Background Glow */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-[#c5a880]/10 to-transparent pointer-events-none"></div>

      {/* Corporate Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#c5a880] to-[#e5c595] flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg">
              R
            </div>
            <div>
              <h1 className="text-base font-extrabold text-foreground tracking-wide">رامون</h1>
              <p className="text-[10px] text-primary font-bold tracking-widest">للتشطيبات والمقاولات العامة</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-900/50 bg-emerald-900/20 text-emerald-400 text-xs font-bold shadow-inner">
            <Shield className="h-3.5 w-3.5" />
            نسخة معتمدة للعميل
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-10 z-10">
        
        {/* 1. Hero Section */}
        <section className="relative rounded-3xl border border-border bg-gradient-to-br from-[#13151c] to-[#0d0e12] p-8 md:p-10 shadow-2xl overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 blur-[80px] rounded-full group-hover:bg-[#c5a880]/10 transition duration-700"></div>
          
          <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full tracking-wide shadow-sm">
                  {project.header.projectCode}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground border border-border bg-accent/50 px-3 py-1 rounded-full shadow-sm">
                  حالة الملف: {
                    project.header.status === 'quantity_prep' ? 'تجهيز الكميات' :
                    project.header.status === 'pricing_prep' ? 'تجهيز الأسعار' :
                    project.header.status === 'review' ? 'المراجعة' :
                    project.header.status === 'client_approval' ? 'موافقة العميل' :
                    project.header.status === 'execution' ? 'قيد التنفيذ' :
                    project.header.status === 'executed' ? 'تم التنفيذ' :
                    project.header.status === 'handover' ? 'تم التسليم' : project.header.status
                  }
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight drop-shadow-md">
                {project.header.name}
              </h2>
            </div>
          </div>
        </section>

        {/* 2. Metadata Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-5 flex items-start gap-4 hover:border-[#c5a880]/30 transition group shadow-lg">
            <div className="p-3 rounded-xl bg-muted/80 border border-border group-hover:bg-[#c5a880]/10 transition">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold mb-1">العميل المالك</span>
              <p className="text-sm font-bold text-foreground leading-tight">{project.header.ownerName}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{project.header.ownerPhone}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-5 flex items-start gap-4 hover:border-[#c5a880]/30 transition group shadow-lg">
            <div className="p-3 rounded-xl bg-muted/80 border border-border group-hover:bg-[#c5a880]/10 transition">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold mb-1">موقع المشروع</span>
              <p className="text-sm font-bold text-foreground leading-tight">{project.header.governorate}</p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1" title={project.header.addressDetails}>
                {project.header.addressDetails}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-5 flex items-start gap-4 hover:border-[#c5a880]/30 transition group shadow-lg">
            <div className="p-3 rounded-xl bg-muted/80 border border-border group-hover:bg-[#c5a880]/10 transition">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold mb-1">المكتب الاستشاري</span>
              <p className="text-sm font-bold text-foreground leading-tight">{project.header.consultantName || 'رامون'}</p>
              <p className="text-[11px] text-muted-foreground mt-1">كود التصميم: <span className="text-primary font-semibold">{project.header.designCode || 'المصري (ECP)'}</span></p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-5 flex items-start gap-4 hover:border-[#c5a880]/30 transition group shadow-lg">
            <div className="p-3 rounded-xl bg-muted/80 border border-border group-hover:bg-[#c5a880]/10 transition">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold mb-1">تاريخ الإصدار</span>
              <p className="text-sm font-bold text-foreground leading-tight">{formatDate(project.header.issueDate)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">مدة التنفيذ التقديرية: <span className="font-semibold text-foreground">{summary?.totalDays || 0} يوم</span></p>
            </div>
          </div>
        </section>

        {/* 3. Engineering Team Section */}
        {engineers.length > 0 && (
          <section className="space-y-5 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 rounded-lg bg-primary/10 shadow-inner">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">فريق العمل الهندسي</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {engineers.map((eng: any, idx: number) => {
                const specConfig = SPECIALTIES[eng.specialty] || SPECIALTIES['other'];
                const Icon = specConfig.icon;
                
                return (
                  <div key={idx} className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 flex items-center gap-4 hover:border-slate-600 transition shadow-lg group">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-border flex items-center justify-center text-primary font-bold text-xl shadow-inner group-hover:border-[#c5a880]/50 transition">
                      {eng.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-1.5">{eng.name}</h4>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border shadow-sm ${specConfig.color}`}>
                        <Icon className="h-3 w-3" />
                        {specConfig.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. Zones Table */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 rounded-lg bg-primary/10 shadow-inner">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">تفاصيل المساحات والحيّز الداخلي</h3>
          </div>

          <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs whitespace-nowrap">
                <thead className="bg-[#1a1c24] text-secondary-foreground font-bold border-b border-border">
                  <tr>
                    <th className="p-5 text-right border-l border-border">المنطقة / الغرفة</th>
                    <th className="p-5 text-center">مساحة الأرضية (م²)</th>
                    <th className="p-5 text-center">المحيط (م.ط)</th>
                    <th className="p-5 text-center border-r border-border">الارتفاع (م)</th>
                    <th className="p-5 text-center text-primary border-r border-primary/20 bg-primary/5">مساحة الحوائط (م²)</th>
                    <th className="p-5 text-center">مساحة الأسقف (م²)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222634] text-secondary-foreground font-medium">
                  {zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-5 text-foreground font-bold border-l border-border">{zone.name}</td>
                      <td className="p-5 text-center">{zone.floorArea.toFixed(1)}</td>
                      <td className="p-5 text-center">{zone.perimeter.toFixed(1)}</td>
                      <td className="p-5 text-center border-r border-border">{zone.height.toFixed(1)}</td>
                      <td className="p-5 text-center text-primary font-bold bg-primary/5 border-r border-primary/20 shadow-[inset_0_0_10px_rgba(197,168,128,0.02)]">{zone.wallArea.toFixed(1)}</td>
                      <td className="p-5 text-center">{zone.ceilingArea.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 3. Tabs Navigation */}
        <section className="bg-card/80 backdrop-blur-md rounded-2xl border border-border p-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('boq')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
              activeTab === 'boq' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            حصر الكميات والمقايسة
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
              activeTab === 'financials' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            الماليات والمستخلصات
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
              activeTab === 'gallery' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            معرض الصور واليوميات
          </button>
        </section>

        {/* Tab Content */}
        {activeTab === 'boq' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="space-y-5">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 rounded-lg bg-primary/10 shadow-inner">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">تفاصيل حصر الكميات والمقايسة</h3>
          </div>

          <div className="space-y-4">
            {sections.filter(sec => sec.enabled).map((sec) => {
              const isExpanded = expandedSections[sec.id];
              const secItems = items.filter(it => it.sectionId === sec.id && it.isActive);
              
              const sectionTotal = secItems.reduce((acc, it) => {
                const res = calculateItemTotal(it, zones, project.projectConstants);
                return acc + res.total;
              }, 0);

              if (secItems.length === 0) return null;

              return (
                <div key={sec.id} className="rounded-3xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-xl transition-all">
                  
                  <div 
                    onClick={() => toggleSection(sec.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer hover:bg-slate-800/40 transition gap-4 group"
                  >
                    <h4 className="text-base font-bold text-foreground flex items-center gap-4">
                      <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted border border-border text-primary font-black text-sm group-hover:scale-105 transition shadow-inner">
                        {sec.id}
                      </span>
                      {sec.title}
                    </h4>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      {showPrices && (
                        <span className="text-sm font-bold text-primary-foreground bg-gradient-to-r from-[#c5a880] to-[#e5c595] px-4 py-2 rounded-xl shadow-md">
                          {sectionTotal.toLocaleString()} ج.م
                        </span>
                      )}
                      <div className={`p-2 rounded-lg bg-muted text-muted-foreground transition ${isExpanded ? 'bg-accent text-foreground' : ''}`}>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border divide-y divide-[#222634] bg-background/40">
                      {secItems.map((item) => {
                        const res = calculateItemTotal(item, zones, project.projectConstants);

                        return (
                          <div key={item.id} className="p-6 text-right hover:bg-slate-900/30 transition">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                              <div className="flex-1">
                                <span className="text-base font-bold text-foreground block leading-relaxed">{item.title}</span>
                                {item.notes && (
                                  <span className="text-xs text-muted-foreground block mt-2.5 p-2.5 rounded-lg bg-muted/80 border border-border shadow-sm inline-block">
                                    <span className="text-muted-foreground font-bold ml-1.5">ملاحظة فنية:</span> {item.notes}
                                  </span>
                                )}
                                
                                {Object.keys(item.specs).length > 0 && (
                                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-secondary-foreground">
                                    {Object.entries(item.specs).map(([k, v]) => {
                                      if (k === 'coverageRate' || k === 'canSize') return null;
                                      return (
                                        <span key={k} className="bg-muted/80 border border-border px-3 py-1.5 rounded-lg shadow-sm">
                                          {k === 'colorCode' ? 'كود اللون' : k === 'paintType' ? 'نوع الدهان' : k === 'flooringType' ? 'نوع الأرضية' : k}: <span className="text-foreground font-bold">{String(v)}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-row md:flex-col items-end md:items-end gap-4 justify-between md:justify-start min-w-[160px] bg-muted/50 border border-border/50 md:bg-transparent md:border-none p-4 md:p-0 rounded-xl md:rounded-none shadow-inner md:shadow-none">
                                <div className="text-left w-full md:w-auto">
                                  <span className="block text-[11px] text-muted-foreground font-bold mb-1">الكمية المقدرة</span>
                                  <span className="text-sm text-foreground font-bold bg-accent px-3 py-1 rounded-lg border border-border shadow-sm">
                                    {res.quantity.toFixed(1)} {item.unit}
                                  </span>
                                </div>
                                
                                {showPrices && showDetailedPricing && (
                                  <div className="text-left w-full md:w-auto mt-2 md:mt-0">
                                    <span className="block text-[11px] text-primary/70 font-bold mb-1">إجمالي البند</span>
                                    <span className="text-lg text-primary font-black">
                                      {res.total.toLocaleString()} ج.م
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Client Financial Summary */}
        {showPrices && summary && (
          <section className="space-y-5">
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 rounded-lg bg-emerald-500/10 shadow-inner">
                <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground">الملخص المالي النهائي</h3>
            </div>

            <div className="rounded-[32px] border border-emerald-900/40 bg-gradient-to-b from-[#13151c] to-[#0a100d] p-1.5 shadow-2xl overflow-hidden">
              <div className="rounded-[26px] overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-[#1a1c24] text-muted-foreground font-bold">
                      <tr>
                        <th className="p-6 text-right w-24 border-l border-border">كود</th>
                        <th className="p-6 text-right">القسم الرئيسي</th>
                        <th className="p-6 text-left w-56 border-r border-border">إجمالي التكلفة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222634] text-secondary-foreground">
                      {Object.values(summary.bySection).map((sec) => (
                        <tr key={sec.sectionId} className="hover:bg-slate-800/40 transition">
                          <td className="p-6 text-muted-foreground font-black border-l border-border">{sec.sectionId}</td>
                          <td className="p-6 text-foreground font-bold text-base">{sec.title}</td>
                          <td className="p-6 text-left font-bold text-foreground bg-muted/30 border-r border-border text-base">{sec.totalCost.toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                      <tr className="bg-[#1a1c24]/50 text-foreground font-bold text-sm border-t border-border">
                        <td className="p-6" colSpan={2}>إجمالي التكلفة الصافية</td>
                        <td className="p-6 text-left font-bold text-foreground">{summary.grandTotal.toLocaleString()} ج.م</td>
                      </tr>
                      {project.header.supervisionPercentage > 0 && (
                        <tr className="bg-[#1a1c24]/80 text-primary font-bold text-sm border-t border-border">
                          <td className="p-6" colSpan={2}>نسبة الإشراف الهندسي والإدارة ({project.header.supervisionPercentage}%)</td>
                          <td className="p-6 text-left font-black">+ {summary.supervisionValue.toLocaleString()} ج.م</td>
                        </tr>
                      )}
                      <tr className="bg-gradient-to-l from-emerald-950/40 to-emerald-900/10 text-foreground font-extrabold text-lg border-t-2 border-emerald-900/50">
                        <td className="p-8" colSpan={2}>
                          الإجمالي الكلي التقديري للمقايسة 
                          <span className="block text-sm font-semibold text-emerald-500/80 mt-1.5">شامل حسابات المواد والمصنعيات والإشراف</span>
                        </td>
                        <td className="p-8 text-left text-emerald-400 font-black text-2xl drop-shadow-md">
                          {summary.grandTotalWithSupervision.toLocaleString()} ج.م
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-sm text-muted-foreground font-medium leading-relaxed flex items-start gap-4 shadow-inner">
              <Info className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <p>الأسعار المذكورة أعلاه هي أسعار تقديرية مبنية على حصر كميات الأبعاد المسطحة للموقع (Floor & Wall dimensions) وتخضع لشروط التوريد. مدة التنفيذ المقدرة مجملها <span className="text-primary font-bold px-1">{summary.totalDays} أيام</span> عمل متواصلة.</p>
            </div>
          </section>
        )}
        </div>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border p-5 rounded-2xl">
                <div className="text-xs text-muted-foreground font-medium mb-1">إجمالي المستخلصات</div>
                <div className="text-2xl font-black text-foreground">{invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0).toLocaleString()} ج.م</div>
              </div>
              <div className="bg-emerald-900/20 border border-emerald-900/50 p-5 rounded-2xl">
                <div className="text-xs text-emerald-500 font-medium mb-1">إجمالي المدفوعات (تقريبي)</div>
                <div className="text-2xl font-black text-emerald-400">{invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0).toLocaleString()} ج.م</div>
              </div>
              <div className="bg-rose-900/20 border border-rose-900/50 p-5 rounded-2xl">
                <div className="text-xs text-rose-500 font-medium mb-1">المتبقي للدفع</div>
                <div className="text-2xl font-black text-rose-400">{invoices.filter(i => i.status !== 'paid').reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0).toLocaleString()} ج.م</div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-border bg-[#1a1c24]">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  المستخلصات المالية
                </h3>
              </div>
              <div className="p-6">
                {invoices.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground font-medium">لا توجد مستخلصات مالية معتمدة للعميل حتى الآن.</div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice, idx) => (
                      <div key={invoice.id} className="border border-border rounded-2xl p-5 bg-card flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-bold text-foreground">مستخلص رقم #{idx + 1}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${invoice.status === 'paid' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-amber-900/30 text-amber-400 border border-amber-800'}`}>
                              {invoice.status === 'paid' ? 'تم الدفع' : 'معلق / قيد المراجعة'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            تاريخ الإصدار: {formatDate(invoice.createdAt)}
                          </div>
                        </div>
                        <div className="text-xl font-black text-primary">
                          {Number(invoice.totalAmount).toLocaleString()} ج.م
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                اليوميات الميدانية ومعرض الصور
              </h3>
              
              {dailyLogs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground font-medium">لا توجد يوميات ميدانية منشورة في هذا المشروع حتى الآن.</div>
              ) : (
                <div className="space-y-8">
                  {dailyLogs.map(log => (
                    <div key={log.id} className="border-b border-border pb-8 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border border-border shrink-0">
                          <Activity className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">يومية بتاريخ: {formatDate(log.date)}</h4>
                          <span className="text-xs text-muted-foreground">كتبها مهندس الموقع</span>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4 text-sm text-secondary-foreground leading-relaxed mb-4 border border-border/50">
                        {log.notes || 'لا توجد ملاحظات تفصيلية.'}
                      </div>
                      {log.photos && log.photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                          {log.photos.map((photo: string, i: number) => (
                            <a href={photo} target="_blank" rel="noopener noreferrer" key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-border block">
                              <img src={photo} alt="صورة الموقع" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-foreground drop-shadow" />
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Corporate Contact Footer */}
      <footer className="mt-16 bg-background border-t border-border py-16 relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#c5a880] to-[#e5c595] flex items-center justify-center text-primary-foreground font-black text-lg shadow-lg">
                R
              </div>
              <span className="text-xl font-extrabold text-foreground">رامون للتشطيبات والمقاولات</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
              نقدم حلولاً هندسية متكاملة لضمان تنفيذ مشاريعكم بأعلى معايير الجودة والاحترافية. ثقتكم هي أساس نجاحنا.
            </p>
          </div>
          
          <div className="flex flex-col md:items-end justify-center gap-4">
            <a href="tel:+201000000000" className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-card border border-border hover:border-[#c5a880]/50 transition shadow-lg group w-fit hover:-translate-y-1">
              <div className="p-3 rounded-xl bg-muted shadow-inner group-hover:bg-[#c5a880]/20 transition">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <span className="block text-[11px] text-muted-foreground font-bold mb-1">تواصل مع المكتب الفني لدعمك</span>
                <span className="text-base font-bold text-foreground direction-ltr">+20 100 000 0000</span>
              </div>
            </a>
          </div>
        </div>
        
        <div className="max-w-6xl w-full mx-auto px-6 mt-16 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-bold tracking-wide">© 2026 جميع الحقوق محفوظة لشركة رامون</p>
          <div className="flex gap-4">
            <span className="text-[10px] text-slate-600 font-bold bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">صُنع بواسطة رامون سيستم</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
