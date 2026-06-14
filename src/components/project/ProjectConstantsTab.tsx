'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { DEFAULT_CONSTANTS, ConstantDefinition } from '@/lib/constants';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ProjectConstantsTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const user = useAuthStore((state) => state.user);

  const [isSaving, setIsSaving] = useState(false);
  const [localConstants, setLocalConstants] = useState<Record<string, number>>(
    currentProject?.projectConstants || {}
  );

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  const handleConstantChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    setLocalConstants(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleResetToDefault = (key: string) => {
    setLocalConstants(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setIsSaving(true);
    try {
      await updateProject({
        projectConstants: localConstants
      });
      // Optionally show a success toast here
    } finally {
      setIsSaving(false);
    }
  };

  // Group constants
  const materials = DEFAULT_CONSTANTS.filter(c => c.group === 'materials');
  const rates = DEFAULT_CONSTANTS.filter(c => c.group === 'rates');

  const renderConstantRow = (c: ConstantDefinition) => {
    const hasOverride = localConstants[c.key] !== undefined;
    const currentValue = hasOverride ? localConstants[c.key] : c.defaultValue;

    return (
      <div key={c.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#222634] bg-[#13151c] hover:border-[#c5a880]/30 transition">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white">{c.label}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">القيمة القياسية (الكود): {c.defaultValue}</span>
            {hasOverride && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-800/40">
                تم التعديل للمشروع الحالي
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-32">
            <input
              type="number"
              value={currentValue}
              onChange={(e) => handleConstantChange(c.key, e.target.value)}
              disabled={!canEdit}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#c5a880] ${
                hasOverride 
                  ? 'bg-amber-950/20 border-amber-800/50 text-amber-400' 
                  : 'bg-[#1a1c24] border-[#222634] text-white'
              } disabled:opacity-50`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
              {c.unit}
            </span>
          </div>
          {hasOverride && canEdit && (
            <button
              onClick={() => handleResetToDefault(c.key)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="استعادة القيمة القياسية"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderGroup = (title: string, list: ConstantDefinition[], subgroup: string) => {
    const items = list.filter(c => c.subgroup === subgroup);
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-sm font-bold text-[#c5a880] mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#c5a880]"></div>
          {title}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map(renderConstantRow)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#13151c] p-5 rounded-xl border border-[#222634]">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">الخامات المركزية ومعدلات الاستهلاك</h2>
          <p className="text-xs text-slate-400">
            تغيير الأسعار أو المعدلات هنا سيقوم فوراً بتحديث تكاليف الخامات في جميع بنود المشروع التي تعتمد عليها.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-sm font-bold shadow hover:brightness-110 transition disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التعديلات
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* الأسعار المركزية */}
        <div className="bg-[#1a1c24] rounded-2xl p-6 border border-[#222634]">
          <h2 className="text-lg font-bold text-white mb-6 border-b border-[#222634] pb-3">
            أسعار الخامات المركزية (Master Prices)
          </h2>
          {renderGroup('خامات عامة (أسمنت، رمل)', materials, 'general')}
          {renderGroup('أعمال المباني', materials, 'masonry')}
          {renderGroup('أعمال المحارة والدهانات', materials, 'plastering')}
          {renderGroup('أعمال السيراميك', materials, 'flooring')}
          {renderGroup('تأسيس السباكة والعزل', materials, 'plumbing')}
          {renderGroup('تأسيس الكهرباء والشبكات', materials, 'electrical')}
          {renderGroup('تأسيس التكييف', materials, 'hvac')}
        </div>

        {/* معدلات الاستهلاك */}
        <div className="bg-[#1a1c24] rounded-2xl p-6 border border-[#222634]">
          <h2 className="text-lg font-bold text-white mb-6 border-b border-[#222634] pb-3">
            معدلات الاستهلاك الهندسية (Consumption Rates)
          </h2>
          
          <div className="mb-6 p-4 rounded-xl bg-sky-950/20 border border-sky-900/30 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-200/80 leading-relaxed">
              المعدلات المدرجة هنا مطابقة لأكواد البناء. لا تقم بتعديلها إلا إذا كانت مواصفات المواد التي تستخدمها مختلفة (مثلاً مقاس طوب مختلف، أو معجون ذو فرد أعلى).
            </p>
          </div>

          {renderGroup('أعمال المباني', rates, 'masonry')}
          {renderGroup('أعمال المحارة والدهانات', rates, 'plastering')}
          {renderGroup('أعمال السيراميك', rates, 'flooring')}
          {renderGroup('أعمال العزل والسباكة', rates, 'plumbing')}
          {renderGroup('أعمال الكهرباء', rates, 'electrical')}
        </div>
      </div>
    </div>
  );
}
