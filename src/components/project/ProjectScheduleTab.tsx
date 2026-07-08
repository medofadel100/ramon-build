'use client';

import React, { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { BOQItem, calculateItemTotal } from '@/lib/calculations';
import { CalendarDays, Save, Play, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

export default function ProjectScheduleTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateItem = useProjectStore((state) => state.updateItem);
  const user = useAuthStore((state) => state.user);

  const [view, setView] = useState<ViewMode>(ViewMode.Day);

  const canEdit = user?.role === 'admin' || currentProject?.header.assignedEngineers.includes(user?.uid || '');

  // Extract active items that belong to enabled sections
  const activeItems = useMemo(() => {
    if (!currentProject) return [];
    const enabledSectionIds = currentProject.sections.filter(s => s.enabled).map(s => s.id);
    return currentProject.items.filter(it => it.isActive && enabledSectionIds.includes(it.sectionId));
  }, [currentProject]);

  const tasks: Task[] = useMemo(() => {
    if (activeItems.length === 0) return [];
    
    return activeItems.map(item => {
      const today = new Date();
      // default start is today, end is today + estimated days or 7 days
      const res = calculateItemTotal(item, currentProject?.zones || [], currentProject?.projectConstants || {});
      const estDays = res.estimatedDays || 7;
      
      const start = item.schedule?.startDate ? new Date(item.schedule.startDate) : today;
      const end = item.schedule?.endDate ? new Date(item.schedule.endDate) : new Date(today.getTime() + estDays * 24 * 60 * 60 * 1000);
      
      return {
        start,
        end,
        name: item.title,
        id: item.id,
        type: 'task',
        progress: item.schedule?.progress || 0,
        isDisabled: !canEdit,
        styles: { 
          progressColor: '#c5a880', 
          progressSelectedColor: '#e5c595',
          backgroundColor: '#1e293b',
          backgroundSelectedColor: '#334155'
        }
      };
    });
  }, [activeItems, canEdit, currentProject]);

  // Handlers for Gantt interactions
  const handleTaskChange = async (task: Task) => {
    const item = activeItems.find(it => it.id === task.id);
    if (!item) return;

    // Local offset to prevent timezone mismatch on stringification
    const tzOffset = task.start.getTimezoneOffset() * 60000;
    const newStart = new Date(task.start.getTime() - tzOffset).toISOString().split('T')[0];
    const newEnd = new Date(task.end.getTime() - tzOffset).toISOString().split('T')[0];

    await updateItem({
      ...item,
      schedule: {
        ...item.schedule,
        startDate: newStart,
        endDate: newEnd,
        progress: task.progress
      }
    });
  };

  const handleProgressChange = async (task: Task) => {
    const item = activeItems.find(it => it.id === task.id);
    if (!item) return;

    await updateItem({
      ...item,
      schedule: {
        ...item.schedule,
        progress: task.progress
      }
    });
  };

  if (!currentProject) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            الجدول الزمني التفاعلي (Gantt)
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">اسحب البنود لتعديل تاريخ البداية والنهاية، واسحب الشريط الأخضر لتحديث نسبة الإنجاز.</p>
        </div>

        <div className="flex bg-[#1a1c24] border border-border rounded-lg p-1">
          <button
            onClick={() => setView(ViewMode.Day)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === ViewMode.Day ? 'bg-indigo-500 text-foreground' : 'text-muted-foreground hover:text-white'}`}
          >
            يومي
          </button>
          <button
            onClick={() => setView(ViewMode.Week)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === ViewMode.Week ? 'bg-indigo-500 text-foreground' : 'text-muted-foreground hover:text-white'}`}
          >
            أسبوعي
          </button>
          <button
            onClick={() => setView(ViewMode.Month)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === ViewMode.Month ? 'bg-indigo-500 text-foreground' : 'text-muted-foreground hover:text-white'}`}
          >
            شهري
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto p-4">
        {tasks.length > 0 ? (
          <div className="min-w-[800px]">
            <Gantt
              tasks={tasks}
              viewMode={view}
              onDateChange={handleTaskChange}
              onProgressChange={handleProgressChange}
              listCellWidth="200px"
              columnWidth={view === ViewMode.Month ? 200 : view === ViewMode.Week ? 150 : 60}
              ganttHeight={Math.max(300, tasks.length * 50)}
              fontFamily="Cairo, sans-serif"
              locale="ar"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-bold">لا توجد بنود مفعلة في هذا المشروع لعرضها في الجدول الزمني.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Overrides for gantt-task-react to match dark mode theme */
        .gantt .grid-header { fill: #1a1c24 !important; stroke: #222634 !important; }
        .gantt .grid-row { fill: #13151c !important; stroke: #222634 !important; }
        .gantt .grid-row:nth-child(even) { fill: #1a1c24 !important; }
        .gantt .tick { stroke: #222634 !important; }
        .gantt .tick text { fill: #94a3b8 !important; font-family: Cairo !important; font-weight: bold; }
        .gantt .task-list-header { fill: #1a1c24 !important; stroke: #222634 !important; }
        .gantt .task-list-row { stroke: #222634 !important; }
        .gantt .task-list-item text { fill: #e2e8f0 !important; font-family: Cairo !important; font-weight: bold; font-size: 12px; }
      `}} />
    </div>
  );
}
