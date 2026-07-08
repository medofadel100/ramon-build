import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Settings, ClipboardCheck, DollarSign, Package, Share2, Calendar, HardHat } from 'lucide-react';

const AVAILABLE_MODULES = [
  {
    id: 'boq',
    name: 'حصر الكميات والمقايسات',
    description: 'الأداة الأساسية لبناء بنود المشروع وحساب الكميات (لا يمكن إيقافها).',
    icon: HardHat,
    required: true
  },
  {
    id: 'schedule',
    name: 'الجدول الزمني',
    description: 'إدارة الجدول الزمني (Gantt Chart) وتتبع نسب الإنجاز.',
    icon: Calendar,
    required: false
  },
  {
    id: 'qa_qc',
    name: 'إدارة الموقع والجودة',
    description: 'طلبات الفحص والاستلام، RFI، وتوثيق الملاحظات الميدانية.',
    icon: ClipboardCheck,
    required: false
  },
  {
    id: 'financials',
    name: 'المالية والمستخلصات',
    description: 'الحسابات والدفعات وحسابات الموردين ومقاولي الباطن.',
    icon: DollarSign,
    required: false
  },
  {
    id: 'inventory',
    name: 'المخازن والمعدات',
    description: 'إدارة مسحوبات المشروع من المخزن والموردين.',
    icon: Package,
    required: false
  },
  {
    id: 'client_portal',
    name: 'بوابة العميل',
    description: 'مشاركة لوحة تحكم مخصصة للمالك لمتابعة المشروع.',
    icon: Share2,
    required: false
  }
];

export default function ProjectModulesTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const saving = useProjectStore((state) => state.savingOperation === 'updateProject');

  // Fallback to ['boq', 'financials', 'inventory', 'client_portal'] for backwards compatibility if empty
  const activeModules = currentProject?.activeModules || ['boq', 'financials', 'inventory', 'client_portal'];

  const toggleModule = async (moduleId: string) => {
    if (saving) return;
    
    let newModules = [...activeModules];
    if (newModules.includes(moduleId)) {
      newModules = newModules.filter(id => id !== moduleId);
    } else {
      newModules.push(moduleId);
    }
    
    await updateProject({ activeModules: newModules });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">إعدادات الأدوات (Modules)</h2>
          <p className="text-xs text-muted-foreground mt-1">قم بتفعيل الأدوات التي ستحتاجها في هذا المشروع فقط لتسريع العمل وتخفيف الزحام في الواجهة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = activeModules.includes(module.id);
          
          return (
            <div 
              key={module.id} 
              className={`p-5 rounded-xl border transition-all ${
                isActive ? 'bg-accent/40 border-primary/40' : 'bg-card/50 border-border'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-lg ${isActive ? 'bg-primary/20 text-primary' : 'bg-accent text-muted-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {module.required ? (
                  <span className="text-[10px] font-bold text-muted-foreground bg-accent px-2 py-1 rounded">أساسي</span>
                ) : (
                  <button
                    onClick={() => toggleModule(module.id)}
                    disabled={saving}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none ${
                      isActive ? 'bg-primary' : 'bg-slate-700'
                    }`}
                  >
                    <span className="sr-only">Toggle module</span>
                    <span
                      className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        isActive ? '-translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              </div>
              
              <h3 className={`font-bold text-sm mb-1.5 ${isActive ? 'text-foreground' : 'text-secondary-foreground'}`}>
                {module.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {module.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
