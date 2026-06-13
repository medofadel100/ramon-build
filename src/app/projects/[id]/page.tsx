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
import { FileText, ClipboardList, Layers, Layout, Paperclip, Share2, Info, ChevronLeft, Users, Package, DollarSign, ClipboardCheck } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'info' | 'zones' | 'boq' | 'summary' | 'attachments' | 'sharing' | 'team' | 'suppliers' | 'accounting' | 'inspection'>('boq');

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
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d0e12]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
      </div>
    );
  }

  if (loadingProject) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d0e12] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
          <p className="font-cairo text-sm text-slate-400">جاري تحميل بيانات المشروع الفنية...</p>
        </div>
      </div>
    );
  }

  if (projectError || !currentProject) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex flex-col font-cairo">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
          <div className="max-w-md border border-slate-800 bg-[#13151c] p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">تعذر فتح المشروع</h2>
            <p className="text-sm text-slate-400 mb-6">{projectError || 'حدث خطأ غير متوقع أثناء معالجة الطلب.'}</p>
            <Link 
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold shadow hover:brightness-110 transition"
            >
              العودة إلى المشاريع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabList = [
    { id: 'boq', label: 'حصر الكميات (BOQ)', icon: ClipboardList },
    { id: 'summary', label: 'الملخص المالي والزمني', icon: Layout },
    { id: 'info', label: 'ملف المشروع وحالته', icon: Info },
    { id: 'team', label: 'فريق العمل (دعوات)', icon: Users },
    { id: 'zones', label: 'المساحات والحيّز', icon: Layers },
    { id: 'suppliers', label: 'الموردين والصناعية', icon: Package },
    { id: 'accounting', label: 'الحسابات والدفعات', icon: DollarSign },
    { id: 'inspection', label: 'استلام الأعمال', icon: ClipboardCheck },
    { id: 'attachments', label: 'المرفقات', icon: Paperclip },
    { id: 'sharing', label: 'مشاركة العميل', icon: Share2 }
  ] as const;

  return (
    <div className="min-h-screen bg-[#0d0e12] flex flex-col font-cairo select-none">
      <Navbar />

      {/* Project Sub-header Section */}
      <header className="border-b border-[#222634] bg-[#13151c]/45 py-5 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard" 
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="العودة للمشاريع"
            >
              <ChevronLeft className="h-4 w-4 transform rotate-180" />
            </Link>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#c5a880] tracking-wider">{currentProject.header.projectCode}</span>
                <span className="text-[10px] text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-medium">المالك: {currentProject.header.ownerName}</span>
                {currentProject.header.consultantName && (
                  <>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-xs text-slate-400 font-medium">الاستشاري: {currentProject.header.consultantName}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5">{currentProject.header.name}</h2>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/projects/${currentProject.id}/export`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-[#c5a880]/50 transition shadow"
            >
              <FileText className="h-4 w-4 text-[#c5a880]" />
              توليد وتصدير التقارير PDF
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation header */}
      <div className="mx-auto max-w-7xl w-full px-4 pt-6">
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[#222634] select-none">
          {tabList.map(tab => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${
                  active 
                    ? 'bg-[#c5a880]/10 border-[#c5a880] text-white shadow-sm shadow-[#c5a880]/5' 
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/20'
                }`}
              >
                <TabIcon className={`h-4 w-4 ${active ? 'text-[#c5a880]' : 'text-slate-500'}`} />
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
          {activeTab === 'zones' && <ProjectZonesTab />}
          {activeTab === 'summary' && <ProjectSummaryTab />}
          {activeTab === 'info' && <ProjectHeaderTab />}
          {activeTab === 'team' && <ProjectTeamTab />}
          {activeTab === 'suppliers' && <ProjectSuppliersTab />}
          {activeTab === 'accounting' && <ProjectAccountingTab />}
          {activeTab === 'inspection' && <ProjectInspectionTab />}
          {activeTab === 'attachments' && <ProjectAttachmentsTab />}
          {activeTab === 'sharing' && <ProjectSharingTab />}
        </div>
      </main>

    </div>
  );
}
