'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import Navbar from '@/components/Navbar';
import ProjectHeaderTab from '@/components/project/ProjectHeaderTab';
import ProjectZonesTab from '@/components/project/ProjectZonesTab';
import ProjectBOQTab from '@/components/project/ProjectBOQTab';
import ProjectSummaryTab from '@/components/project/ProjectSummaryTab';
import ProjectAttachmentsTab from '@/components/project/ProjectAttachmentsTab';
import ProjectSharingTab from '@/components/project/ProjectSharingTab';
import ProjectTeamTab from '@/components/project/ProjectTeamTab';
import ProjectSuppliersTab from '@/components/project/ProjectSuppliersTab';
import ProjectAccountingTab from '@/components/project/ProjectAccountingTab';
import ProjectInspectionTab from '@/components/project/ProjectInspectionTab';
import ProjectConstantsTab from '@/components/project/ProjectConstantsTab';
import ProjectMaterialsMarketTab from '@/components/project/ProjectMaterialsMarketTab';
import ProjectModulesTab from '@/components/project/ProjectModulesTab';
import ProjectScheduleTab from '@/components/project/ProjectScheduleTab';
import ProjectDailyLogsTab from '@/components/project/ProjectDailyLogsTab';
import ProjectRfiTab from '@/components/project/ProjectRfiTab';
import ProjectProcurementTab from '@/components/project/ProjectProcurementTab';
import ProjectInventoryTab from '@/components/project/ProjectInventoryTab';
import ProjectInvoicesTab from '@/components/project/ProjectInvoicesTab';
import ProjectBimTab from '@/components/project/ProjectBimTab';
import { FileText, ClipboardList, Layers, Layout, Paperclip, Share2, Info, ChevronLeft, Users, Package, DollarSign, ClipboardCheck, Settings2, Store, CalendarDays, Navigation, FileQuestion, ShoppingCart, Box, Bot, Receipt } from 'lucide-react';
import Link from 'next/link';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailsPage({ params }: ProjectPageProps) {
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;

  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const router = useRouter();

  const loadProject = useProjectStore((state) => state.loadProject);
  const currentProject = useProjectStore((state) => state.currentProject);
  const loadingProject = useProjectStore((state) => state.loading);
  const projectError = useProjectStore((state) => state.error);

  const [activeTab, setActiveTab] = useState<'info' | 'zones' | 'boq' | 'schedule' | 'dailylogs' | 'rfi' | 'summary' | 'attachments' | 'sharing' | 'team' | 'suppliers' | 'accounting' | 'inspection' | 'constants' | 'market' | 'modules' | 'procurement' | 'inventory_track' | 'bim' | 'invoices'>('boq');

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

  if (loadingAuth || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (loadingProject) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-cairo text-sm text-muted-foreground">جاري تحميل بيانات المشروع الفنية...</p>
        </div>
      </div>
    );
  }

  if (projectError || !currentProject) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-cairo">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
          <div className="max-w-md border border-border bg-card p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-foreground mb-2">تعذر فتح المشروع</h2>
            <p className="text-sm text-muted-foreground mb-6">{projectError || 'حدث خطأ غير متوقع أثناء معالجة الطلب.'}</p>
            <Link 
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow hover:brightness-110 transition"
            >
              العودة إلى المشاريع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeModules = currentProject.activeModules || ['boq', 'schedule', 'qa_qc', 'financials', 'inventory', 'client_portal'];

  const allTabs = [
    { id: 'boq', label: 'حصر الكميات (BOQ)', icon: ClipboardList, module: 'boq' },
    { id: 'summary', label: 'الملخص المالي والزمني', icon: Layout, module: 'boq' },
    { id: 'schedule', label: 'الجدول الزمني (Gantt)', icon: CalendarDays, module: 'schedule' },
    { id: 'dailylogs', label: 'اليوميات الميدانية', icon: Navigation, module: 'qa_qc' },
    { id: 'rfi', label: 'طلبات واعتمادات', icon: FileQuestion, module: 'qa_qc' },
    { id: 'inspection', label: 'استلام الأعمال', icon: ClipboardCheck, module: 'qa_qc' },
    { id: 'info', label: 'ملف المشروع وحالته', icon: Info, module: 'boq' },
    { id: 'team', label: 'فريق العمل', icon: Users, module: 'boq' },
    { id: 'zones', label: 'المساحات والحيّز', icon: Layers, module: 'boq' },
    { id: 'suppliers', label: 'الموردين والصناعية', icon: Package, module: 'inventory' },
    { id: 'accounting', label: 'الحسابات والدفعات', icon: DollarSign, module: 'financials' },
    { id: 'invoices', label: 'المستخلصات', icon: Receipt, module: 'financials' },
    { id: 'constants', label: 'الخامات والثوابت', icon: Settings2, module: 'boq' },
    { id: 'inventory_track', label: 'المخازن والمواد', icon: Package, module: 'inventory' },
    { id: 'procurement', label: 'عطاءات ومشتريات', icon: ShoppingCart, module: 'inventory' },
    { id: 'market', label: 'سوق الخامات', icon: Store, module: 'inventory' },
    { id: 'bim', label: 'مجسمات BIM', icon: Box, module: 'boq' },
    { id: 'attachments', label: 'المرفقات', icon: Paperclip, module: 'boq' },
    { id: 'sharing', label: 'مشاركة العميل', icon: Share2, module: 'client_portal' },
    { id: 'modules', label: 'إعدادات الأدوات', icon: Settings2, module: 'boq' }
  ] as const;

  const tabList = allTabs.filter(tab => activeModules.includes(tab.module));

  return (
    <div className="min-h-screen bg-background flex flex-col font-cairo select-none">
      <Navbar />

      {/* Project Sub-header Section */}
      <header className="border-b border-border bg-card/45 py-5 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard" 
              className="p-2 rounded-lg bg-muted border border-border hover:bg-slate-800 text-muted-foreground hover:text-white transition"
              title="العودة للمشاريع"
            >
              <ChevronLeft className="h-4 w-4 transform rotate-180" />
            </Link>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary tracking-wider">{currentProject.header.projectCode}</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground font-medium">المالك: {currentProject.header.ownerName}</span>
                {currentProject.header.consultantName && (
                  <>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-medium">الاستشاري: {currentProject.header.consultantName}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mt-1.5">{currentProject.header.name}</h2>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/projects/${currentProject.id}/export`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted border border-border text-xs font-bold text-secondary-foreground hover:text-white hover:border-[#c5a880]/50 transition shadow"
            >
              <FileText className="h-4 w-4 text-primary" />
              توليد وتصدير التقارير PDF
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation header */}
      <div className="mx-auto max-w-7xl w-full px-4 pt-6">
        <div className="flex flex-nowrap md:flex-wrap items-center gap-2 pb-4 border-b border-border select-none overflow-x-auto md:overflow-x-visible whitespace-nowrap scrollbar-hide">
          {tabList.map(tab => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${
                  active 
                    ? 'bg-primary/10 border-primary text-foreground shadow-sm shadow-[#c5a880]/5' 
                    : 'border-transparent text-muted-foreground hover:text-white hover:bg-slate-800/20'
                }`}
              >
                <TabIcon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs active panel content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="animate-in fade-in duration-200">
          {activeTab === 'boq' && <ProjectBOQTab />}
          {activeTab === 'schedule' && <ProjectScheduleTab />}
          {activeTab === 'dailylogs' && <ProjectDailyLogsTab />}
          {activeTab === 'rfi' && <ProjectRfiTab />}
          {activeTab === 'zones' && <ProjectZonesTab />}
          {activeTab === 'summary' && <ProjectSummaryTab />}
          {activeTab === 'info' && <ProjectHeaderTab />}
          {activeTab === 'team' && <ProjectTeamTab />}
          {activeTab === 'suppliers' && <ProjectSuppliersTab />}
          {activeTab === 'accounting' && <ProjectAccountingTab />}
          {activeTab === 'inspection' && <ProjectInspectionTab />}
          {activeTab === 'constants' && <ProjectConstantsTab />}
          {activeTab === 'market' && <ProjectMaterialsMarketTab />}
          {activeTab === 'inventory_track' && <ProjectInventoryTab />}
          {activeTab === 'procurement' && <ProjectProcurementTab />}
          {activeTab === 'invoices' && <ProjectInvoicesTab />}
          {activeTab === 'bim' && <ProjectBimTab />}
          {activeTab === 'attachments' && <ProjectAttachmentsTab />}
          {activeTab === 'sharing' && <ProjectSharingTab />}
          {activeTab === 'modules' && <ProjectModulesTab />}
        </div>
      </main>

    </div>
  );
}
