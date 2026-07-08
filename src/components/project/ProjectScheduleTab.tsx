'use client';

import React, { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { BOQItem, calculateItemTotal } from '@/lib/calculations';
import { CalendarDays, Save, Play, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export default function ProjectScheduleTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateItem = useProjectStore((state) => state.updateItem);
  const user = useAuthStore((state) => state.user);

  const canEdit = user?.role === 'admin' || currentProject?.header.assignedEngineers.includes(user?.uid || '');

  // Extract active items that belong to enabled sections
  const activeItems = useMemo(() => {
    if (!currentProject) return [];
    const enabledSectionIds = currentProject.sections.filter(s => s.enabled).map(s => s.id);
    return currentProject.items.filter(it => it.isActive && enabledSectionIds.includes(it.sectionId));
  }, [currentProject]);

  // Handle schedule update
  const handleScheduleUpdate = async (item: BOQItem, field: keyof NonNullable<BOQItem['schedule']>, value: any) => {
    const currentSchedule = item.schedule || {};
    const updatedSchedule = { ...currentSchedule, [field]: value };
    await updateItem({
      ...item,
      schedule: updatedSchedule
    });
  };

  if (!currentProject) return null;

  // Simple timeline calculation
  let minDate = new Date('2050-01-01').getTime();
  let maxDate = new Date('2000-01-01').getTime();

  activeItems.forEach(item => {
    if (item.schedule?.startDate) {
      const d = new Date(item.schedule.startDate).getTime();
      if (d < minDate) minDate = d;
    }
    if (item.schedule?.endDate) {
      const d = new Date(item.schedule.endDate).getTime();
      if (d > maxDate) maxDate = d;
    }
  });

  const totalDurationMs = maxDate - minDate;
  const hasDates = totalDurationMs > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            الجدول الزمني التفاعلي (Gantt)
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">متابعة سير المشروع زمنياً، وتحديث نسب الإنجاز الميدانية.</p>
        </div>
      </div>

      <div className="bg-[#13151c] rounded-xl border border-[#222634] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#222634] bg-[#1a1c24] text-[10px] font-bold text-slate-400 text-right">
          <div className="col-span-4">البند / المهمة</div>
          <div className="col-span-2 text-center">تاريخ البدء</div>
          <div className="col-span-2 text-center">تاريخ الانتهاء</div>
          <div className="col-span-2 text-center">المدة التقديرية</div>
          <div className="col-span-2 text-center">نسبة الإنجاز</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#222634] max-h-[60vh] overflow-y-auto">
          {activeItems.map((item) => {
            const res = calculateItemTotal(item, currentProject.zones, currentProject.projectConstants);
            const estDays = res.estimatedDays || 0;
            const progress = item.schedule?.progress || 0;

            // Visual bar width
            let leftPercent = 0;
            let widthPercent = 100;
            
            if (hasDates && item.schedule?.startDate && item.schedule?.endDate) {
              const s = new Date(item.schedule.startDate).getTime();
              const e = new Date(item.schedule.endDate).getTime();
              leftPercent = ((s - minDate) / totalDurationMs) * 100;
              widthPercent = ((e - s) / totalDurationMs) * 100;
            }

            return (
              <div key={item.id} className="p-4 hover:bg-slate-900/40 transition">
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Title & Timeline Bar */}
                  <div className="col-span-4 space-y-2">
                    <div className="text-xs font-bold text-slate-200 line-clamp-1" title={item.title}>
                      {item.title}
                    </div>
                    {/* Tiny Gantt Bar preview */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                      {hasDates && item.schedule?.startDate && item.schedule?.endDate ? (
                        <div 
                          className="absolute h-full bg-indigo-500 rounded-full"
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        >
                          <div 
                            className="h-full bg-emerald-400 transition-all" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      ) : (
                        <div className="h-full w-full bg-slate-700/50 striped-bg" />
                      )}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="col-span-2">
                    <input 
                      type="date" 
                      disabled={!canEdit}
                      value={item.schedule?.startDate || ''}
                      onChange={(e) => handleScheduleUpdate(item, 'startDate', e.target.value)}
                      className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* End Date */}
                  <div className="col-span-2">
                    <input 
                      type="date" 
                      disabled={!canEdit}
                      value={item.schedule?.endDate || ''}
                      onChange={(e) => handleScheduleUpdate(item, 'endDate', e.target.value)}
                      className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Estimated Duration */}
                  <div className="col-span-2 text-center text-xs font-bold text-slate-500">
                    {estDays > 0 ? `${estDays} يوم` : '-'}
                  </div>

                  {/* Progress */}
                  <div className="col-span-2 flex items-center gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      disabled={!canEdit}
                      value={progress}
                      onChange={(e) => handleScheduleUpdate(item, 'progress', parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <span className="text-[10px] font-black text-emerald-400 w-8">{progress}%</span>
                  </div>

                </div>
              </div>
            );
          })}

          {activeItems.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-bold">لا توجد بنود مفعلة في هذا المشروع لعرضها في الجدول الزمني.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
