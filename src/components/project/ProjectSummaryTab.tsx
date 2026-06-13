'use client';

import { useProjectStore } from '@/store/projectStore';
import { calculateProjectSummary, calculateItemTotal } from '@/lib/calculations';
import { DollarSign, Clock, Layout, Hammer, Percent, Save, Edit, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

export default function ProjectSummaryTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateHeader = useProjectStore((state) => state.updateHeader);

  const [supervisionPercentage, setSupervisionPercentage] = useState(currentProject?.header.supervisionPercentage || 0);
  const [isSaving, setIsSaving] = useState(false);

  if (!currentProject) return null;

  // Calculate project summary aggregates
  const summary = useMemo(() => {
    return calculateProjectSummary(
      currentProject.items,
      currentProject.sections,
      currentProject.zones,
      currentProject.header.supervisionPercentage || 0
    );
  }, [currentProject.items, currentProject.sections, currentProject.zones, currentProject.header.supervisionPercentage]);

  const handleSaveSupervision = async () => {
    setIsSaving(true);
    await updateHeader({ supervisionPercentage });
    setIsSaving(false);
  };

  // Generate sequential timeline schedules
  const defaultSequentialSchedule = useMemo(() => {
    let cumulativeDay = 0;
    
    return currentProject.sections
      .filter(sec => sec.enabled)
      .map(sec => {
        const secItems = currentProject.items.filter(it => it.sectionId === sec.id && it.isActive);
        const duration = secItems.reduce((acc, it) => {
          const res = calculateItemTotal(it, currentProject.zones);
          return acc + res.estimatedDays;
        }, 0);

        const startDay = cumulativeDay;
        const endDay = cumulativeDay + duration;
        cumulativeDay = endDay;

        return {
          id: sec.id,
          title: sec.title,
          duration,
          startDay,
          endDay
        };
      })
      .filter(sec => sec.duration > 0);
  }, [currentProject.sections, currentProject.items, currentProject.zones]);

  const hasOverrides = Array.isArray(currentProject.header.scheduleOverrides) && currentProject.header.scheduleOverrides.length > 0;
  const activeSchedule = hasOverrides 
    ? currentProject.header.scheduleOverrides!.map(s => ({...s, endDay: Number(s.startDay) + Number(s.duration)}))
    : defaultSequentialSchedule;

  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(activeSchedule);

  useEffect(() => {
    if (!isEditingTimeline) {
      setEditingSchedule(activeSchedule);
    }
  }, [activeSchedule, isEditingTimeline]);

  const displaySchedule = isEditingTimeline ? editingSchedule : activeSchedule;
  const projectTotalDays = displaySchedule.length > 0 ? Math.max(...displaySchedule.map(s => s.endDay)) : summary.totalDays;

  const handleSaveTimeline = async () => {
    setIsSaving(true);
    const overridesToSave = editingSchedule.map(s => ({
      id: s.id,
      title: s.title,
      startDay: Number(s.startDay) || 0,
      duration: Number(s.duration) || 0
    }));
    await updateHeader({ scheduleOverrides: overridesToSave });
    setIsEditingTimeline(false);
    setIsSaving(false);
  };

  const handleResetTimeline = async () => {
    if(!confirm('هل أنت متأكد من حذف التعديلات والعودة للجدول التلقائي المتسلسل؟')) return;
    setIsSaving(true);
    await updateHeader({ scheduleOverrides: [] });
    setIsEditingTimeline(false);
    setIsSaving(false);
  };

  const addTimelineStage = () => {
    setEditingSchedule([
      ...editingSchedule, 
      { id: `stage_${Date.now()}`, title: 'مرحلة جديدة', duration: 1, startDay: 0, endDay: 1 }
    ]);
  };

  const updateTimelineStage = (id: string, field: string, value: string | number) => {
    setEditingSchedule(editingSchedule.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        if (field === 'startDay' || field === 'duration') {
          updated.endDay = Number(updated.startDay || 0) + Number(updated.duration || 0);
        }
        return updated;
      }
      return s;
    }));
  };

  const removeTimelineStage = (id: string) => {
    setEditingSchedule(editingSchedule.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-8 font-cairo select-none">
      
      {/* 1. Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-500">التكلفة الصافية للمشروع</span>
            <p className="text-xl font-extrabold text-white tracking-wide">{summary.grandTotal.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 text-slate-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-500">إجمالي بند الخامات</span>
            <p className="text-xl font-extrabold text-white tracking-wide">{summary.grandMaterialCost.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
            <Layout className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-500">إجمالي بند المصنعية</span>
            <p className="text-xl font-extrabold text-white tracking-wide">{summary.grandLaborCost.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Hammer className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-500">مدة التنفيذ المتوقعة</span>
            <p className="text-xl font-extrabold text-white tracking-wide">{projectTotalDays} أيام عمل</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Supervision Fee Setting */}
      <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Percent className="h-4 w-4 text-[#c5a880]" />
            نسبة الإشراف الهندسي والإدارة
          </h3>
          <p className="text-xs text-slate-400">
            أدخل نسبة الأرباح أو الإشراف الهندسي ليتم إضافتها تلقائياً للإجمالي النهائي المعروض للعميل.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={supervisionPercentage}
              onChange={(e) => setSupervisionPercentage(parseFloat(e.target.value) || 0)}
              className="w-24 rounded-lg border border-[#222634] bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
            />
            <span className="absolute left-4 top-2.5 text-slate-500 font-bold">%</span>
          </div>
          <button
            onClick={handleSaveSupervision}
            disabled={isSaving || supervisionPercentage === currentProject.header.supervisionPercentage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-sm font-bold shadow hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'جاري الحفظ...' : <><Save className="h-4 w-4" /> حفظ النسبة</>}
          </button>
        </div>
      </div>

      {/* Financial Aggregation Table */}
      <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4">الملخص المالي التفصيلي للأقسام</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1a1c24] text-slate-400 font-bold border-b border-[#222634]">
              <tr>
                <th className="p-3 text-right">كود القسم</th>
                <th className="p-3 text-right">اسم القسم الفني</th>
                <th className="p-3 text-center">تكلفة الخامات (ج.م)</th>
                <th className="p-3 text-center">تكلفة المصنعية / اليوميات (ج.م)</th>
                <th className="p-3 text-center bg-[#c5a880]/5 text-[#c5a880]">إجمالي تكلفة القسم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222634] text-slate-300">
              {Object.values(summary.bySection).map((sec) => (
                <tr key={sec.sectionId} className="hover:bg-slate-900/40 transition">
                  <td className="p-3 text-slate-500 font-bold">{sec.sectionId}</td>
                  <td className="p-3 text-white font-bold">{sec.title}</td>
                  <td className="p-3 text-center">{sec.materialCost.toLocaleString()} ج.م</td>
                  <td className="p-3 text-center">{sec.laborCost.toLocaleString()} ج.م</td>
                  <td className="p-3 text-center bg-[#c5a880]/5 text-[#c5a880] font-black">
                    {sec.totalCost.toLocaleString()} ج.م
                  </td>
                </tr>
              ))}
              <tr className="bg-[#1a1c24]/50 border-t border-[#222634] text-white font-bold text-sm">
                <td className="p-3" colSpan={2}>التكلفة الصافية</td>
                <td className="p-3 text-center">{summary.grandMaterialCost.toLocaleString()} ج.م</td>
                <td className="p-3 text-center">{summary.grandLaborCost.toLocaleString()} ج.م</td>
                <td className="p-3 text-center font-black">
                  {summary.grandTotal.toLocaleString()} ج.م
                </td>
              </tr>
              <tr className="bg-[#1a1c24]/80 border-t border-slate-800 text-[#c5a880] font-bold text-sm">
                <td className="p-3" colSpan={4}>قيمة الإشراف الهندسي والإدارة ({currentProject.header.supervisionPercentage || 0}%)</td>
                <td className="p-3 text-center font-black">
                  + {summary.supervisionValue.toLocaleString()} ج.م
                </td>
              </tr>
              <tr className="bg-[#c5a880]/10 border-t-2 border-[#c5a880]/30 text-white font-extrabold text-base">
                <td className="p-4" colSpan={4}>الإجمالي الكلي النهائي (المعروض للعميل)</td>
                <td className="p-4 text-center text-[#c5a880] font-black drop-shadow-md">
                  {summary.grandTotalWithSupervision.toLocaleString()} ج.م
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Gantt Scheduling Schedule */}
      {displaySchedule.length > 0 && (
        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#c5a880]" />
              <h3 className="text-base font-bold text-white">الجدول الزمني ومسار التنفيذ (Gantt Chart)</h3>
            </div>
            
            {!isEditingTimeline ? (
              <button
                onClick={() => setIsEditingTimeline(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-[#c5a880] hover:bg-slate-800 transition"
              >
                <Edit className="h-4 w-4" />
                تخصيص وتعديل الجدول
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetTimeline}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-900 text-xs font-bold text-rose-400 hover:bg-rose-900 hover:text-white transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  إلغاء التعديلات
                </button>
                <button
                  onClick={() => setIsEditingTimeline(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveTimeline}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : <><Save className="h-4 w-4" /> حفظ الجدول</>}
                </button>
              </div>
            )}
          </div>
          
          <p className="text-xs text-slate-400 mb-6 leading-normal">
            {hasOverrides 
              ? 'يتم عرض الجدول الزمني المخصص والمحفوظ لهذا المشروع.'
              : 'محاكاة توضح تتابع مراحل العمل الفني بناءً على تقدير الأيام الإجمالية. يمكنك تعديلها بحرية عن طريق "تخصيص الجدول".'}
          </p>

          <div className="space-y-4">
            {displaySchedule.map((sec) => {
              const safeTotal = projectTotalDays > 0 ? projectTotalDays : 1;
              const startPercent = (sec.startDay / safeTotal) * 100;
              const widthPercent = (sec.duration / safeTotal) * 100;

              return (
                <div key={sec.id} className={`grid grid-cols-1 ${isEditingTimeline ? 'md:grid-cols-6' : 'md:grid-cols-4'} gap-4 items-center`}>
                  
                  {/* Left Label or Editor */}
                  {isEditingTimeline ? (
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input 
                        type="text" 
                        value={sec.title}
                        onChange={(e) => updateTimelineStage(sec.id, 'title', e.target.value)}
                        className="w-full rounded border border-[#222634] bg-[#1a1c24] px-2 py-1 text-xs text-white"
                        placeholder="اسم المرحلة"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">بداية:</span>
                        <input 
                          type="number" min="0" value={sec.startDay}
                          onChange={(e) => updateTimelineStage(sec.id, 'startDay', e.target.value)}
                          className="w-12 rounded border border-[#222634] bg-[#1a1c24] px-1 py-1 text-xs text-white text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">مدة:</span>
                        <input 
                          type="number" min="1" value={sec.duration}
                          onChange={(e) => updateTimelineStage(sec.id, 'duration', e.target.value)}
                          className="w-12 rounded border border-[#222634] bg-[#1a1c24] px-1 py-1 text-xs text-white text-center"
                        />
                      </div>
                      <button onClick={() => removeTimelineStage(sec.id)} className="text-rose-500 hover:text-rose-400 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-right">
                      {!sec.id.startsWith('stage_') && <span className="text-[10px] text-slate-500 font-bold block">{sec.id}</span>}
                      <span className="text-xs font-bold text-white truncate block">{sec.title}</span>
                    </div>
                  )}

                  {/* Visual timeline bar */}
                  <div className={`bg-slate-900 border border-slate-800/80 h-9 rounded-lg relative overflow-hidden flex items-center ${isEditingTimeline ? 'md:col-span-4' : 'md:col-span-3'}`}>
                    <div 
                      className={`absolute ${hasOverrides || isEditingTimeline ? 'bg-gradient-to-l from-emerald-600 to-emerald-400/60' : 'bg-gradient-to-l from-[#c5a880] to-[#e5c595]/60'} h-full rounded-md flex items-center justify-end px-3 transition-all duration-300 ease-in-out`}
                      style={{
                        right: `${Math.min(100, Math.max(0, startPercent))}%`,
                        width: `${Math.min(100, Math.max(0, widthPercent))}%`
                      }}
                    >
                      <span className="text-[9px] font-bold text-[#0d0e12] whitespace-nowrap bg-white/70 px-1 py-0.5 rounded leading-none">
                        {sec.duration} يوم
                      </span>
                    </div>

                    {/* Timeline dates markers */}
                    <div className="absolute right-0 left-0 flex justify-between px-3 text-[8px] text-slate-500 font-bold select-none pointer-events-none">
                      <span>اليوم {sec.startDay}</span>
                      <span>اليوم {sec.endDay}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isEditingTimeline && (
            <div className="mt-6 flex justify-center">
              <button 
                onClick={addTimelineStage}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                إضافة مرحلة جديدة للجدول
              </button>
            </div>
          )}

          <div className="border-t border-[#222634] pt-4 mt-8 flex justify-between text-xs font-semibold text-slate-400">
            <span>بداية المشروع: اليوم الأول</span>
            <span>نهاية المشروع التقديرية: اليوم {projectTotalDays}</span>
          </div>
        </div>
      )}

    </div>
  );
}
