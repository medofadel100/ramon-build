'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClipboardCheck, CheckCircle2, Circle, Clock, AlertTriangle, MessageSquare, Filter, Save, ChevronDown, ChevronUp } from 'lucide-react';

type InspectionStatus = 'not_started' | 'in_progress' | 'partial_handover' | 'fully_received';

interface InspectionItem {
  itemId: string;
  sectionId: string;
  title: string;
  sectionTitle: string;
  status: InspectionStatus;
  notes: string;
  inspectionDate?: string;
  phase?: string;
}

const STATUS_CONFIG: Record<InspectionStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
  not_started: { label: 'لم يبدأ', color: 'text-muted-foreground', bgColor: 'bg-muted/60', borderColor: 'border-border', icon: Circle },
  in_progress: { label: 'جاري التنفيذ', color: 'text-amber-400', bgColor: 'bg-amber-950/30', borderColor: 'border-amber-800/50', icon: Clock },
  partial_handover: { label: 'استلام جزئي', color: 'text-blue-400', bgColor: 'bg-blue-950/30', borderColor: 'border-blue-800/50', icon: AlertTriangle },
  fully_received: { label: 'تم الاستلام', color: 'text-emerald-400', bgColor: 'bg-emerald-950/30', borderColor: 'border-emerald-800/50', icon: CheckCircle2 },
};

const STATUS_ORDER: InspectionStatus[] = ['not_started', 'in_progress', 'partial_handover', 'fully_received'];

export default function ProjectInspectionTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const user = useAuthStore((state) => state.user);

  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [filter, setFilter] = useState<'all' | InspectionStatus>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (!currentProject) return;
    loadInspection();
  }, [currentProject?.id]);

  const loadInspection = async () => {
    if (!currentProject) return;
    
    const projectRef = doc(db, 'projects', currentProject.id);
    const snap = await getDoc(projectRef);
    const savedChecklist: InspectionItem[] = snap.data()?.inspectionChecklist || [];

    // Auto-generate from project items
    const autoItems: InspectionItem[] = [];
    for (const sec of currentProject.sections.filter(s => s.enabled)) {
      const secItems = currentProject.items.filter(it => it.sectionId === sec.id && it.isActive);
      for (const item of secItems) {
        const existing = savedChecklist.find(s => s.itemId === item.id);
        autoItems.push({
          itemId: item.id,
          sectionId: sec.id,
          title: item.title,
          sectionTitle: sec.title,
          status: existing?.status || 'not_started',
          notes: existing?.notes || '',
          inspectionDate: existing?.inspectionDate,
          phase: existing?.phase,
        });
      }
    }
    
    setInspectionItems(autoItems);
    // Expand all sections by default
    setExpandedSections(new Set(currentProject.sections.map(s => s.id)));
  };

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  // Group by section
  const groupedItems = useMemo(() => {
    const groups: Record<string, { sectionTitle: string; items: InspectionItem[] }> = {};
    for (const item of inspectionItems) {
      if (!groups[item.sectionId]) {
        groups[item.sectionId] = { sectionTitle: item.sectionTitle, items: [] };
      }
      groups[item.sectionId].items.push(item);
    }
    return groups;
  }, [inspectionItems]);

  // Stats
  const totalItems = inspectionItems.length;
  const completedItems = inspectionItems.filter(i => i.status === 'fully_received').length;
  const inProgressItems = inspectionItems.filter(i => i.status === 'in_progress').length;
  const partialItems = inspectionItems.filter(i => i.status === 'partial_handover').length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const filteredGroups = useMemo(() => {
    if (filter === 'all') return groupedItems;
    const filtered: Record<string, { sectionTitle: string; items: InspectionItem[] }> = {};
    for (const [secId, group] of Object.entries(groupedItems)) {
      const items = group.items.filter(i => i.status === filter);
      if (items.length > 0) {
        filtered[secId] = { sectionTitle: group.sectionTitle, items };
      }
    }
    return filtered;
  }, [groupedItems, filter]);

  const updateItemStatus = (itemId: string, status: InspectionStatus) => {
    setInspectionItems(prev => prev.map(i => 
      i.itemId === itemId 
        ? { ...i, status, inspectionDate: status === 'fully_received' ? new Date().toISOString() : i.inspectionDate } 
        : i
    ));
  };

  const cycleStatus = (itemId: string) => {
    const item = inspectionItems.find(i => i.itemId === itemId);
    if (!item) return;
    const currentIdx = STATUS_ORDER.indexOf(item.status);
    const nextStatus = STATUS_ORDER[(currentIdx + 1) % STATUS_ORDER.length];
    updateItemStatus(itemId, nextStatus);
  };

  const saveNoteForItem = (itemId: string) => {
    setInspectionItems(prev => prev.map(i => 
      i.itemId === itemId ? { ...i, notes: noteText } : i
    ));
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const projectRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectRef, { inspectionChecklist: inspectionItems });
    } catch (err) {
      console.error('Error saving inspection checklist:', err);
      alert('حدث خطأ أثناء حفظ قائمة الاستلام.');
    }
    setIsSaving(false);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) newSet.delete(sectionId);
      else newSet.add(sectionId);
      return newSet;
    });
  };

  return (
    <div className="space-y-6 font-cairo select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            قائمة استلام الأعمال (Inspection Checklist)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">تتبع حالة استلام كل بند من بنود المشروع مع ملاحظات المهندس المسؤول.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition disabled:opacity-50"
          >
            {isSaving ? 'جاري الحفظ...' : <><Save className="h-4 w-4" /> حفظ التعديلات</>}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">نسبة إنجاز الاستلام</span>
          <span className="text-2xl font-black text-primary">{progressPercent}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-border">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[#c5a880] to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-6 mt-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> مستلم: {completedItems}
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <AlertTriangle className="h-3.5 w-3.5" /> جزئي: {partialItems}
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <Clock className="h-3.5 w-3.5" /> جاري: {inProgressItems}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Circle className="h-3.5 w-3.5" /> لم يبدأ: {totalItems - completedItems - inProgressItems - partialItems}
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(['all', ...STATUS_ORDER] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${
              filter === f
                ? 'bg-primary/10 border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-white hover:bg-slate-900'
            }`}
          >
            {f === 'all' ? `الكل (${totalItems})` : `${STATUS_CONFIG[f].label} (${inspectionItems.filter(i => i.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Sections & Items */}
      {Object.entries(filteredGroups).map(([secId, group]) => {
        const isExpanded = expandedSections.has(secId);
        const secCompleted = group.items.filter(i => i.status === 'fully_received').length;
        const secTotal = group.items.length;

        return (
          <div key={secId} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(secId)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded">{secId}</span>
                <span className="text-sm font-bold text-foreground">{group.sectionTitle}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  secCompleted === secTotal && secTotal > 0
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {secCompleted}/{secTotal}
                </span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {/* Items */}
            {isExpanded && (
              <div className="border-t border-border divide-y divide-[#1a1c24]">
                {group.items.map(item => {
                  const config = STATUS_CONFIG[item.status];
                  const StatusIcon = config.icon;

                  return (
                    <div key={item.itemId} className={`p-4 ${config.bgColor} transition-colors duration-300`}>
                      <div className="flex items-start gap-3">
                        {/* Status Toggle */}
                        {canEdit ? (
                          <button 
                            onClick={() => cycleStatus(item.itemId)}
                            className={`mt-0.5 ${config.color} hover:scale-110 transition-transform`}
                            title="اضغط لتغيير الحالة"
                          >
                            <StatusIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <StatusIcon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">{item.title}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${config.borderColor} ${config.color}`}>
                              {config.label}
                            </span>
                            {item.inspectionDate && item.status === 'fully_received' && (
                              <span className="text-[9px] text-muted-foreground">
                                تاريخ الاستلام: {new Date(item.inspectionDate).toLocaleDateString('ar-EG')}
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {item.notes && editingNoteId !== item.itemId && (
                            <p className="text-[11px] text-muted-foreground mt-1.5 bg-muted/40 rounded px-2 py-1 border-r-2 border-amber-600">
                              📝 {item.notes}
                            </p>
                          )}

                          {editingNoteId === item.itemId && (
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="اكتب ملاحظة الاستلام..."
                                className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => saveNoteForItem(item.itemId)}
                                className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-2 py-1.5 rounded bg-accent text-muted-foreground text-xs hover:text-white transition"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {canEdit && editingNoteId !== item.itemId && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditingNoteId(item.itemId); setNoteText(item.notes); }}
                              className="p-1.5 rounded hover:bg-slate-800 text-muted-foreground hover:text-[#c5a880] transition"
                              title="إضافة/تعديل ملاحظة"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                            {/* Quick status buttons */}
                            <select
                              value={item.status}
                              onChange={(e) => updateItemStatus(item.itemId, e.target.value as InspectionStatus)}
                              className="text-[10px] bg-transparent border border-border rounded px-1 py-1 text-muted-foreground focus:outline-none focus:border-[#c5a880]"
                            >
                              {STATUS_ORDER.map(s => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(filteredGroups).length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ClipboardCheck className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-muted-foreground font-semibold">لا يوجد بنود مطابقة للفلتر المحدد</p>
        </div>
      )}
    </div>
  );
}
