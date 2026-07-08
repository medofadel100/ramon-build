'use client';

import { useProjectStore } from '@/store/projectStore';
import { calculateProjectSummary, calculateItemTotal } from '@/lib/calculations';
import { DollarSign, Clock, Layout, Hammer, Percent, Save, Edit, Trash2, Plus, RefreshCw, Split } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];

interface ScheduleItem {
  id: string;
  title: string;
  duration: number;
  startDay: number;
  endDay: number;
  sourceSectionId?: string;
  color?: string;
  phase?: number;
}

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
      currentProject.header.supervisionPercentage || 0,
      currentProject.projectConstants
    );
  }, [currentProject.items, currentProject.sections, currentProject.zones, currentProject.header.supervisionPercentage, currentProject.projectConstants]);

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
          const res = calculateItemTotal(it, currentProject.zones, currentProject.projectConstants);
          return acc + res.estimatedDays;
        }, 0);

        const startDay = cumulativeDay;
        const endDay = cumulativeDay + duration;
        cumulativeDay = endDay;

        const item: ScheduleItem = {
          id: sec.id,
          title: sec.title,
          duration,
          startDay,
          endDay
        };
        return item;
      })
      .filter(sec => sec.duration > 0);
  }, [currentProject.sections, currentProject.items, currentProject.zones]);

  const hasOverrides = Array.isArray(currentProject.header.scheduleOverrides) && currentProject.header.scheduleOverrides.length > 0;
  const activeSchedule: ScheduleItem[] = hasOverrides 
    ? currentProject.header.scheduleOverrides!.map(s => ({...s, endDay: Number(s.startDay) + Number(s.duration)} as ScheduleItem))
    : defaultSequentialSchedule;

  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem[]>(activeSchedule);

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
      duration: Number(s.duration) || 0,
      sourceSectionId: s.sourceSectionId,
      color: s.color,
      phase: s.phase
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

      {/* Financial Dashboards (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-6">توزيع تكلفة المشروع بالأقسام</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.values(summary.bySection).filter(s => s.totalCost > 0)}
                  dataKey="totalCost"
                  nameKey="title"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {Object.values(summary.bySection).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => `${Number(value || 0).toLocaleString()} ج.م`}
                  contentStyle={{ backgroundColor: '#13151c', borderColor: '#222634', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-6">مقارنة الخامات والمصنعيات للأقسام</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.values(summary.bySection).filter(s => s.totalCost > 0)}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222634" />
                <XAxis dataKey="title" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <RechartsTooltip
                  formatter={(value: any) => `${Number(value || 0).toLocaleString()} ج.م`}
                  contentStyle={{ backgroundColor: '#13151c', borderColor: '#222634', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="materialCost" name="الخامات" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="laborCost" name="المصنعيات" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Professional Gantt Chart */}
      <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-xl relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#c5a880]" />
            <h3 className="text-base font-bold text-white">الجدول الزمني ومسار التنفيذ (Gantt Chart)</h3>
          </div>
          
          {!isEditingTimeline ? (
            <button
              onClick={() => { setIsEditingTimeline(true); setEditingSchedule(activeSchedule.map(s => ({...s}))); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-[#c5a880] hover:bg-slate-800 transition"
            >
              <Edit className="h-4 w-4" />
              تخصيص وتعديل الجدول
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleResetTimeline}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-900 text-xs font-bold text-rose-400 hover:bg-rose-900 hover:text-white transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                إعادة للتلقائي
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
        
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {hasOverrides 
            ? '✅ يتم عرض الجدول الزمني المخصص المحفوظ لهذا المشروع. اضغط "تخصيص" لتعديله.'
            : 'جدول تلقائي بناءً على تقدير أيام كل قسم. اضغط "تخصيص وتعديل" لتغيير الترتيب أو تقسيم أي مرحلة.'}
        </p>

        {/* Timeline Ruler - horizontal axis */}
        {projectTotalDays > 0 && (
          <div className="mb-2 relative h-6 border-b border-[#222634]">
            {Array.from({ length: Math.min(Math.ceil(projectTotalDays / Math.max(1, Math.ceil(projectTotalDays / 10))), 12) }, (_, i) => {
              const step = Math.max(1, Math.ceil(projectTotalDays / 10));
              const day = i * step;
              const leftPercent = (day / projectTotalDays) * 100;
              return (
                <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${Math.min(leftPercent, 98)}%` }}>
                  <div className="w-px h-2 bg-[#222634]"></div>
                  <span className="text-[8px] text-slate-600 font-bold mt-0.5">يوم {day}</span>
                </div>
              );
            })}
            <div className="absolute top-0 left-full flex flex-col items-end" style={{ right: 0, left: 'auto' }}>
              <div className="w-px h-2 bg-[#c5a880]"></div>
              <span className="text-[8px] text-[#c5a880] font-bold mt-0.5">{projectTotalDays}</span>
            </div>
          </div>
        )}

        {/* Gantt Bars */}
        <div className="space-y-2">
          {displaySchedule.map((sec, idx) => {
            const safeTotal = projectTotalDays > 0 ? projectTotalDays : 1;
            const leftPercent = (Number(sec.startDay) / safeTotal) * 100;
            const widthPercent = (Number(sec.duration) / safeTotal) * 100;
            
            const COLORS = [
              'from-blue-500 to-blue-600',
              'from-emerald-500 to-emerald-600',
              'from-amber-500 to-amber-600',
              'from-purple-500 to-purple-600',
              'from-rose-500 to-rose-600',
              'from-cyan-500 to-cyan-600',
              'from-orange-500 to-orange-600',
              'from-indigo-500 to-indigo-600',
              'from-pink-500 to-pink-600',
              'from-teal-500 to-teal-600',
            ];
            const colorClass = sec.color 
              ? '' 
              : COLORS[idx % COLORS.length];
            
            const isPhase = sec.phase && sec.phase > 1;

            return (
              <div key={sec.id} className="group">
                {isEditingTimeline ? (
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <input 
                      type="text" 
                      value={sec.title}
                      onChange={(e) => updateTimelineStage(sec.id, 'title', e.target.value)}
                      className="flex-1 min-w-[140px] rounded border border-[#222634] bg-[#1a1c24] px-2 py-1.5 text-xs text-white focus:border-[#c5a880] focus:outline-none"
                      placeholder="اسم المرحلة"
                    />
                    <div className="flex items-center gap-1 bg-[#1a1c24] rounded border border-[#222634] px-2 py-1">
                      <span className="text-[10px] text-slate-500">بداية:</span>
                      <input 
                        type="number" min="0" value={sec.startDay}
                        onChange={(e) => updateTimelineStage(sec.id, 'startDay', e.target.value)}
                        className="w-14 bg-transparent text-xs text-white text-center focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-[#1a1c24] rounded border border-[#222634] px-2 py-1">
                      <span className="text-[10px] text-slate-500">مدة:</span>
                      <input 
                        type="number" min="1" value={sec.duration}
                        onChange={(e) => updateTimelineStage(sec.id, 'duration', e.target.value)}
                        className="w-14 bg-transparent text-xs text-white text-center focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500">يوم</span>
                    </div>
                    <button
                      onClick={() => {
                        const newPhase = {
                          id: `split_${sec.id}_${Date.now()}`,
                          title: `${sec.title} (مرحلة ${(sec.phase || 1) + 1})`,
                          duration: Math.max(1, Math.floor(Number(sec.duration) / 2)),
                          startDay: Number(sec.startDay) + Number(sec.duration),
                          endDay: 0,
                          sourceSectionId: sec.sourceSectionId || sec.id,
                          phase: (sec.phase || 1) + 1
                        };
                        newPhase.endDay = newPhase.startDay + newPhase.duration;
                        const newSchedule = [...editingSchedule];
                        newSchedule.splice(idx + 1, 0, newPhase);
                        setEditingSchedule(newSchedule);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-blue-950/40 border border-blue-800/50 text-[10px] font-bold text-blue-400 hover:bg-blue-900 hover:text-white transition whitespace-nowrap"
                      title="تقسيم هذا البند لمرحلة إضافية"
                    >
                      <Split className="h-3 w-3" />
                      تقسيم
                    </button>
                    <button onClick={() => removeTimelineStage(sec.id)} className="text-rose-500 hover:text-rose-400 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-0.5">
                    {isPhase && <span className="text-[9px] text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">مرحلة {sec.phase}</span>}
                    <span className="text-[11px] font-bold text-white truncate max-w-[200px]">{sec.title}</span>
                    <span className="text-[9px] text-slate-500">
                      (يوم {sec.startDay} → يوم {sec.endDay})
                    </span>
                  </div>
                )}
                
                {/* Gantt Bar */}
                <div className="bg-slate-900/60 border border-slate-800/50 h-8 rounded-md relative overflow-hidden">
                  <div 
                    className={`absolute h-full rounded-md bg-gradient-to-r ${colorClass} flex items-center justify-center transition-all duration-500 ease-out shadow-lg`}
                    style={{
                      left: `${Math.min(100, Math.max(0, leftPercent))}%`,
                      width: `${Math.min(100 - leftPercent, Math.max(1, widthPercent))}%`,
                      ...(sec.color ? { background: sec.color } : {})
                    }}
                  >
                    <span className="text-[10px] font-extrabold text-white drop-shadow-md whitespace-nowrap px-2">
                      {sec.duration} يوم
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Phase Button in Edit Mode */}
        {isEditingTimeline && (
          <div className="mt-6 flex justify-center gap-3">
            <button 
              onClick={addTimelineStage}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition text-xs font-bold"
            >
              <Plus className="h-4 w-4" />
              إضافة مرحلة حرة
            </button>
          </div>
        )}

        {/* Footer Summary */}
        <div className="border-t border-[#222634] pt-4 mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <span className="text-[10px] text-slate-400">أعمال مختلفة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
              <span className="text-[10px] text-slate-400">يمكن التداخل</span>
            </div>
          </div>
          <div className="flex gap-6 text-xs font-bold">
            <span className="text-slate-500">إجمالي المدة: <span className="text-[#c5a880]">{projectTotalDays} يوم عمل</span></span>
            <span className="text-slate-500">مراحل العمل: <span className="text-white">{displaySchedule.length} مرحلة</span></span>
          </div>
        </div>
      </div>

    </div>
  );
}
