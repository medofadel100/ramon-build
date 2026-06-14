'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { DEFAULT_CONSTANTS, ConstantDefinition } from '@/lib/constants';
import { dbUpdateMasterConstants } from '@/lib/project-service';
import { Save, RefreshCw, AlertTriangle, Plus, X, Globe, FileText } from 'lucide-react';

export default function ProjectConstantsTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const user = useAuthStore((state) => state.user);

  const [isSaving, setIsSaving] = useState(false);
  const [localConstants, setLocalConstants] = useState<Record<string, number>>(
    currentProject?.projectConstants || {}
  );
  const [localDefinitions, setLocalDefinitions] = useState<ConstantDefinition[]>(
    currentProject?.customConstantsDefinitions || []
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);
  const [newConst, setNewConst] = useState<Partial<ConstantDefinition> & { value: number }>({
    key: '',
    label: '',
    group: 'materials',
    subgroup: 'general',
    defaultValue: 0,
    unit: 'ج.م',
    value: 0
  });

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

  const handleSaveInit = () => {
    if (!canEdit) return;
    if (user?.role === 'admin') {
      setShowSaveOptionsModal(true);
    } else {
      handleSave('project_only');
    }
  };

  const handleSave = async (scope: 'project_only' | 'global') => {
    setIsSaving(true);
    setShowSaveOptionsModal(false);
    try {
      await updateProject({
        projectConstants: localConstants,
        customConstantsDefinitions: localDefinitions
      });

      if (scope === 'global' && user?.role === 'admin') {
        // Merge definitions and constants into a new global master list
        const mergedDefs = [...DEFAULT_CONSTANTS, ...localDefinitions].map(c => {
          return {
            ...c,
            defaultValue: localConstants[c.key] !== undefined ? localConstants[c.key] : c.defaultValue
          };
        });
        await dbUpdateMasterConstants(mergedDefs);
        alert('تم تحديث الكتالوج العالمي بنجاح. أي مشروع جديد سيعتمد هذه الأسعار.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomConstant = () => {
    if (!newConst.label || !newConst.key) return;
    
    const key = `custom_${newConst.key.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    const def: ConstantDefinition = {
      key,
      label: newConst.label,
      group: newConst.group as any,
      subgroup: newConst.subgroup as any,
      defaultValue: newConst.value,
      unit: newConst.unit || ''
    };

    setLocalDefinitions(prev => [...prev, def]);
    setLocalConstants(prev => ({ ...prev, [key]: newConst.value }));
    setShowAddModal(false);
    setNewConst({
      key: '',
      label: '',
      group: 'materials',
      subgroup: 'general',
      defaultValue: 0,
      unit: 'ج.م',
      value: 0
    });
  };

  // Group constants (Merge defaults with local customs)
  const allConstants = [...DEFAULT_CONSTANTS, ...localDefinitions];
  const materials = allConstants.filter(c => c.group === 'materials');
  const rates = allConstants.filter(c => c.group === 'rates');

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
        <div className="flex flex-col gap-3">
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-bold hover:bg-slate-700 transition"
            >
              <Plus className="h-4 w-4" />
              إضافة خامة / معدل جديد
            </button>
            <button
              onClick={handleSaveInit}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-sm font-bold shadow hover:brightness-110 transition disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التعديلات
            </button>
          </div>
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

      {/* Add Custom Constant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#13151c] border border-[#222634] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#222634] bg-[#1a1c24]">
              <h3 className="text-lg font-bold text-white">إضافة خامة / معدل مخصص</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">اسم الخامة أو المعدل (باللغة العربية)</label>
                <input
                  type="text"
                  placeholder="مثال: سعر متر عزل فوم"
                  value={newConst.label}
                  onChange={(e) => setNewConst({...newConst, label: e.target.value, key: e.target.value})}
                  className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">النوع</label>
                  <select
                    value={newConst.group}
                    onChange={(e) => setNewConst({...newConst, group: e.target.value as any})}
                    className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  >
                    <option value="materials">خامة مركزية (سعر)</option>
                    <option value="rates">معدل استهلاك هندسي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">القسم الهندسي</label>
                  <select
                    value={newConst.subgroup}
                    onChange={(e) => setNewConst({...newConst, subgroup: e.target.value as any})}
                    className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  >
                    <option value="general">خامات عامة</option>
                    <option value="masonry">أعمال المباني</option>
                    <option value="plastering">المحارة والدهانات</option>
                    <option value="flooring">أعمال السيراميك</option>
                    <option value="plumbing">السباكة والعزل</option>
                    <option value="electrical">الكهرباء والتيار الخفيف</option>
                    <option value="hvac">التكييف المركزي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">القيمة</label>
                  <input
                    type="number"
                    value={newConst.value || ''}
                    onChange={(e) => setNewConst({...newConst, value: parseFloat(e.target.value)})}
                    className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">وحدة القياس</label>
                  <input
                    type="text"
                    placeholder="مثال: ج.م، متر، لتر"
                    value={newConst.unit}
                    onChange={(e) => setNewConst({...newConst, unit: e.target.value})}
                    className="w-full rounded-lg bg-[#1a1c24] border border-[#222634] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleAddCustomConstant}
                  disabled={!newConst.label || !newConst.value}
                  className="w-full py-3 rounded-xl bg-[#c5a880] text-[#0d0e12] font-bold shadow hover:brightness-110 transition disabled:opacity-50"
                >
                  إضافة الخامة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Options Modal */}
      {showSaveOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#13151c] border border-[#222634] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#222634] bg-[#1a1c24]">
              <h3 className="text-lg font-bold text-white">نطاق حفظ التعديلات</h3>
              <button 
                onClick={() => setShowSaveOptionsModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                أنت على وشك حفظ تعديلات في أسعار وخامات المشروع. هل تريد أن يقتصر هذا التعديل على هذا المشروع فقط، أم تريد اعتماده كأسعار قياسية جديدة لكل المشاريع القادمة؟
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleSave('project_only')}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[#222634] bg-[#1a1c24] hover:bg-slate-800 transition text-right"
                >
                  <div className="p-3 bg-blue-900/20 text-blue-400 rounded-lg shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">للمشروع الحالي فقط</h4>
                    <p className="text-xs text-slate-400 mt-1">المشاريع الأخرى والجديدة لن تتأثر بهذه التعديلات.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSave('global')}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[#c5a880]/30 bg-amber-950/10 hover:bg-amber-950/30 transition text-right"
                >
                  <div className="p-3 bg-amber-900/30 text-[#c5a880] rounded-lg shrink-0">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#c5a880]">تحديث الكتالوج العالمي</h4>
                    <p className="text-xs text-slate-400 mt-1">سيتم تعميم هذه الأسعار والخامات لتكون الافتراضية لأي مشروع جديد.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
