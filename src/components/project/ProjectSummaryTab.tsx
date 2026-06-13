'use client';

import { useProjectStore } from '@/store/projectStore';
import { calculateProjectSummary, calculateItemTotal } from '@/lib/calculations';
import { DollarSign, Clock, Layout, Hammer } from 'lucide-react';
import { useMemo } from 'react';

export default function ProjectSummaryTab() {
  const currentProject = useProjectStore((state) => state.currentProject);

  if (!currentProject) return null;

  // Calculate project summary aggregates
  const summary = useMemo(() => {
    return calculateProjectSummary(
      currentProject.items,
      currentProject.sections,
      currentProject.zones
    );
  }, [currentProject.items, currentProject.sections, currentProject.zones]);

  // Generate cumulative timeline schedules
  const sectionSchedules = useMemo(() => {
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

  const totalProjectDays = summary.totalDays;

  return (
    <div className="space-y-8 font-cairo select-none">
      
      {/* 1. Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-500">التكلفة الإجمالية للمشروع</span>
            <p className="text-xl font-extrabold text-[#c5a880] tracking-wide">{summary.grandTotal.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 rounded-lg bg-[#c5a880]/15 text-[#c5a880]">
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
            <p className="text-xl font-extrabold text-white tracking-wide">{totalProjectDays} أيام عمل</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 2. Financial Aggregation Table */}
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
                <td className="p-3" colSpan={2}>الإجمالي الكلي النهائي</td>
                <td className="p-3 text-center">{summary.grandMaterialCost.toLocaleString()} ج.م</td>
                <td className="p-3 text-center">{summary.grandLaborCost.toLocaleString()} ج.m</td>
                <td className="p-3 text-center bg-[#c5a880]/10 text-[#c5a880] font-black">
                  {summary.grandTotal.toLocaleString()} ج.م
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Gantt Scheduling Schedule */}
      {sectionSchedules.length > 0 && (
        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-[#c5a880]" />
            <h3 className="text-base font-bold text-white">الجدول الزمني ومسار التنفيذ التراكمي (Sequential Timeline)</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6 leading-normal">
            محاكاة توضح تتابع مراحل العمل الفني بناءً على تقدير الأيام الإجمالية لكل قسم. يبدأ كل قسم عقب انتهاء القسم السابق مباشرة.
          </p>

          <div className="space-y-4">
            {sectionSchedules.map((sec) => {
              const startPercent = totalProjectDays > 0 ? (sec.startDay / totalProjectDays) * 100 : 0;
              const widthPercent = totalProjectDays > 0 ? (sec.duration / totalProjectDays) * 100 : 0;

              return (
                <div key={sec.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Left Label */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">{sec.id}</span>
                    <span className="text-xs font-bold text-white truncate block">{sec.title}</span>
                  </div>

                  {/* Visual timeline bar */}
                  <div className="md:col-span-3 bg-slate-900 border border-slate-800/80 h-9 rounded-lg relative overflow-hidden flex items-center">
                    <div 
                      className="absolute bg-gradient-to-l from-[#c5a880] to-[#e5c595]/60 h-full rounded-md flex items-center justify-end px-3"
                      style={{
                        right: `${startPercent}%`,
                        width: `${widthPercent}%`
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

          <div className="border-t border-[#222634] pt-4 mt-8 flex justify-between text-xs font-semibold text-slate-400">
            <span>بداية المشروع: اليوم الأول</span>
            <span>نهاية المشروع التقديرية: اليوم {totalProjectDays}</span>
          </div>
        </div>
      )}

    </div>
  );
}
