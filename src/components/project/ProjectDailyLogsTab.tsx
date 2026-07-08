'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { DailyLog } from '@/lib/project-service';
import { Plus, Camera, Navigation, MapPin, CalendarDays, CloudSun, User, Save } from 'lucide-react';
import { generateId } from '@/lib/utils';

export default function ProjectDailyLogsTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const user = useAuthStore((state) => state.user);

  const [isAdding, setIsAdding] = useState(false);
  const [newLog, setNewLog] = useState<Partial<DailyLog>>({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    weather: 'مشمس',
  });

  if (!currentProject) return null;

  const logs = currentProject.dailyLogs || [];

  const handleSaveLog = async () => {
    if (!newLog.notes || !newLog.date) return;

    const log: DailyLog = {
      id: generateId(),
      date: newLog.date,
      engineerId: user?.uid || 'unknown',
      engineerName: user?.name || user?.email?.split('@')[0] || 'مهندس الموقع',
      notes: newLog.notes,
      weather: newLog.weather,
      photos: [], // placeholders
    };

    const updatedLogs = [log, ...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await updateProject({ dailyLogs: updatedLogs });
    setIsAdding(false);
    setNewLog({ date: new Date().toISOString().split('T')[0], notes: '', weather: 'مشمس' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            المتابعة الميدانية والتقارير اليومية
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">توثيق أحداث الموقع اليومية، الطقس، والصور الميدانية للرجوع إليها لاحقاً.</p>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" />
            إضافة تقرير يومي جديد
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-card border border-border p-5 rounded-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-right text-xs font-bold text-muted-foreground mb-1">تاريخ التقرير</label>
              <input 
                type="date"
                value={newLog.date}
                onChange={e => setNewLog({...newLog, date: e.target.value})}
                className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-right text-xs font-bold text-muted-foreground mb-1">حالة الطقس</label>
              <input 
                type="text"
                placeholder="مثال: مشمس، ممطر، غبار..."
                value={newLog.weather}
                onChange={e => setNewLog({...newLog, weather: e.target.value})}
                className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-right text-xs font-bold text-muted-foreground mb-1">تفاصيل التقرير والأعمال المنجزة</label>
            <textarea 
              rows={4}
              placeholder="اكتب هنا ما تم إنجازه اليوم، أي عقبات واجهت فريق العمل، أعداد العمالة..."
              value={newLog.notes}
              onChange={e => setNewLog({...newLog, notes: e.target.value})}
              className="w-full bg-[#1a1c24] border border-border rounded px-3 py-2 text-xs text-foreground focus:border-[#c5a880] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded bg-accent text-secondary-foreground text-xs font-bold hover:bg-slate-700 transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveLog}
              disabled={!newLog.notes || !newLog.date}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 text-foreground text-xs font-bold hover:bg-emerald-500 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              حفظ التقرير
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
        {logs.map((log) => (
          <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0d0e12] bg-[#1a1c24] text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-10">
              <CalendarDays className="w-4 h-4" />
            </div>

            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-4 rounded-xl shadow-lg hover:border-[#c5a880]/30 transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{log.date}</span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-secondary-foreground">{log.engineerName}</span>
                  </div>
                </div>
                {log.weather && (
                  <div className="flex items-center gap-1 bg-[#1a1c24] px-2 py-1 rounded text-xs text-muted-foreground">
                    <CloudSun className="w-3.5 h-3.5" />
                    {log.weather}
                  </div>
                )}
              </div>
              <p className="text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap">{log.notes}</p>
            </div>
          </div>
        ))}

        {logs.length === 0 && !isAdding && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-bold">لا توجد تقارير ميدانية بعد.</p>
          </div>
        )}
      </div>

    </div>
  );
}
