'use client';

import { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { calculateItemTotal, calculateItemMaterials, BOQItem, Zone } from '@/lib/calculations';
import { DEFAULT_ITEMS, ItemTemplate } from '@/lib/default-items';
import { DEFAULT_CONSTANTS } from '@/lib/constants';
import { 
  ChevronDown, ChevronUp, CheckSquare, Square, ToggleLeft, ToggleRight, 
  Plus, Trash2, Edit2, Settings, FileText, CheckCircle2, MessageSquare, ShieldAlert,
  LayoutGrid, X
} from 'lucide-react';

export default function ProjectBOQTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateItem = useProjectStore((state) => state.updateItem);
  const addCustomItem = useProjectStore((state) => state.addCustomItem);
  const deleteItem = useProjectStore((state) => state.deleteItem);
  const toggleSection = useProjectStore((state) => state.toggleSection);
  const user = useAuthStore((state) => state.user);

  // UI state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ '1.1': true, '1.2': true });
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Custom item modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customUnit, setCustomUnit] = useState('م²');

  // Constants mapping
  const allMaterials = [...DEFAULT_CONSTANTS, ...(currentProject?.customConstantsDefinitions || [])].filter(c => c.group === 'materials');

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');
  const isRenovation = currentProject.header.projectType.workType === 'renovation';

  const toggleSectionExpand = (secId: string) => {
    setExpandedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Get specs template for an item based on its template ID (e.g. 1.1.1)
  const getItemTemplate = (itemId: string): ItemTemplate | undefined => {
    // If it's a custom item, it won't have a template.
    const baseId = itemId.split('_custom_')[0];
    return DEFAULT_ITEMS.find(it => it.id === baseId);
  };

  // Handle active status toggle
  const handleToggleActive = async (item: BOQItem, active: boolean) => {
    await updateItem({
      ...item,
      isActive: active
    });
  };

  // Handle item property changes
  const handleItemPropChange = async (item: BOQItem, key: string, value: any) => {
    await updateItem({
      ...item,
      [key]: value
    });
  };

  // Handle nested spec change
  const handleSpecChange = async (item: BOQItem, specKey: string, value: any) => {
    const updatedSpecs = { ...item.specs, [specKey]: value };
    await updateItem({
      ...item,
      specs: updatedSpecs
    });
  };

  // Handle pricing property change
  const handlePricingChange = async (item: BOQItem, key: string, value: any) => {
    const updatedPricing = { ...item.pricing, [key]: Number(value) || 0 };
    await updateItem({
      ...item,
      pricing: updatedPricing
    });
  };

  const handlePricingModeChange = async (item: BOQItem, mode: BOQItem['pricing']['mode']) => {
    const updatedPricing = { ...item.pricing, mode };
    await updateItem({
      ...item,
      pricing: updatedPricing
    });
  };

  // perAreaOverride logic
  const handleAddAreaOverride = async (item: BOQItem) => {
    if (currentProject.zones.length === 0) {
      alert('الرجاء إضافة مساحات/غرف أولاً في تبويب "المساحات" قبل تفعيل تقسيم المساحات.');
      return;
    }
    const defaultZone = currentProject.zones[0];
    const overrides = item.perAreaOverrides || {};
    
    // Seed default spec values for this override
    const itemTemplate = getItemTemplate(item.id);
    const specsMap: Record<string, any> = {};
    if (itemTemplate) {
      itemTemplate.specs.forEach(field => {
        specsMap[field.key] = field.defaultValue;
      });
    }

    const updatedOverrides = {
      ...overrides,
      [defaultZone.id]: {
        specs: specsMap,
        quantity: defaultZone.floorArea // default quantity matching floor area
      }
    };

    await updateItem({
      ...item,
      perAreaOverrides: updatedOverrides
    });
  };

  const handleUpdateAreaOverride = async (
    item: BOQItem, 
    zoneId: string, 
    newZoneId: string, 
    specsUpdates: Record<string, any>, 
    quantity: number
  ) => {
    const overrides = { ...item.perAreaOverrides };
    const oldOverride = overrides[zoneId];
    if (!oldOverride) return;

    const updatedOverride = {
      specs: { ...oldOverride.specs, ...specsUpdates },
      quantity: Number(quantity) || 0
    };

    if (zoneId !== newZoneId) {
      // Swap keys if user changed the room assignment
      delete overrides[zoneId];
      overrides[newZoneId] = updatedOverride;
    } else {
      overrides[zoneId] = updatedOverride;
    }

    await updateItem({
      ...item,
      perAreaOverrides: overrides
    });
  };

  const handleDeleteAreaOverride = async (item: BOQItem, zoneId: string) => {
    const overrides = { ...item.perAreaOverrides };
    delete overrides[zoneId];
    await updateItem({
      ...item,
      perAreaOverrides: overrides
    });
  };

  // Custom Materials logic
  const handleAddCustomMaterial = async (item: BOQItem) => {
    const customMaterials = item.customMaterials || [];
    const newMat = {
      id: `mat_${Date.now()}`,
      name: '',
      unit: '',
      quantity: 1,
      unitPrice: 0,
      constantKey: '',
      multiplier: 0
    };
    await updateItem({
      ...item,
      customMaterials: [...customMaterials, newMat]
    });
  };

  const handleUpdateCustomMaterial = async (item: BOQItem, matId: string, updates: any) => {
    const customMaterials = item.customMaterials || [];
    const updated = customMaterials.map(mat => mat.id === matId ? { ...mat, ...updates } : mat);
    await updateItem({
      ...item,
      customMaterials: updated
    });
  };

  const handleDeleteCustomMaterial = async (item: BOQItem, matId: string) => {
    const customMaterials = item.customMaterials || [];
    const updated = customMaterials.filter(mat => mat.id !== matId);
    await updateItem({
      ...item,
      customMaterials: updated
    });
  };

  // Section cost calculation
  const getSectionTotal = (sectionId: string) => {
    const secItems = currentProject.items.filter(it => it.sectionId === sectionId);
    return secItems.reduce((acc, it) => {
      const res = calculateItemTotal(it, currentProject.zones);
      return acc + res.total;
    }, 0);
  };

  // Add Custom Item Form submit
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    await addCustomItem(targetSectionId, {
      title: customTitle,
      unit: customUnit,
      quantitySource: 'manual',
      specs: {},
      pricing: {
        mode: 'materials_labor_split',
        materialUnitPrice: 0,
        laborUnitPrice: 0,
        lumpSumPrice: 0,
        dailyRate: 0,
        estimatedDays: 0
      },
      notes: '',
      egyptianCodeRef: '',
      isActive: true,
      quantity: 0
    });

    setCustomTitle('');
    setIsCustomModalOpen(false);
  };

  const triggerAddCustomModal = (secId: string) => {
    setTargetSectionId(secId);
    setIsCustomModalOpen(true);
  };

  return (
    <div className="space-y-6 font-cairo select-none">
      
      {/* Sections List */}
      <div className="space-y-4">
        {currentProject.sections.map((section) => {
          const sectionTotal = getSectionTotal(section.id);
          const isExpanded = expandedSections[section.id];
          const sectionItems = currentProject.items.filter(it => it.sectionId === section.id);

          return (
            <div 
              key={section.id} 
              className={`rounded-xl border transition ${
                section.enabled 
                  ? 'border-[#222634] bg-[#13151c]' 
                  : 'border-[#1b1c24] bg-slate-900/20 opacity-60'
              }`}
            >
              
              {/* Section Header */}
              <div 
                onClick={() => toggleSectionExpand(section.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-900/35 transition rounded-t-xl"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(section.id, !section.enabled);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title={section.enabled ? 'تعطيل القسم بالكامل' : 'تفعيل القسم'}
                  >
                    {section.enabled ? (
                      <ToggleRight className="h-6 w-6 text-[#c5a880]" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-slate-600" />
                    )}
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span className="text-slate-500 text-xs">{section.id}</span>
                      {section.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">عدد البنود: {sectionItems.length}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                  {section.enabled && (
                    <span className="text-xs font-extrabold text-[#c5a880] bg-[#c5a880]/10 px-2.5 py-1 rounded">
                      إجمالي القسم: {sectionTotal.toLocaleString()} ج.م
                    </span>
                  )}
                  {section.enabled && canEdit && (
                    <button
                      onClick={() => triggerAddCustomModal(section.id)}
                      className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
                      title="إضافة بند مخصص"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button 
                    onClick={() => toggleSectionExpand(section.id)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-500"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Section Items Body */}
              {isExpanded && section.enabled && (
                <div className="p-4 border-t border-[#222634] space-y-4">
                  {sectionItems.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-4 font-semibold">لا يوجد بنود في هذا القسم حالياً.</p>
                  ) : (
                    sectionItems.map((item) => {
                      const itemResult = calculateItemTotal(item, currentProject.zones);
                      const isItemExpanded = expandedItems[item.id];
                      const template = getItemTemplate(item.id);

                      return (
                        <div 
                          key={item.id}
                          className={`rounded-lg border transition ${
                            item.isActive 
                              ? 'border-[#222634] bg-[#1a1c24]/30' 
                              : 'border-slate-900/40 bg-slate-950/20 opacity-50'
                          }`}
                        >
                          {/* Item Summary Row */}
                          <div 
                            onClick={() => toggleItemExpand(item.id)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 cursor-pointer hover:bg-slate-900/30 transition rounded-t-lg gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canEdit) handleToggleActive(item, !item.isActive);
                                }}
                                className="text-slate-400 hover:text-white transition"
                              >
                                {item.isActive ? (
                                  <CheckSquare className="h-4.5 w-4.5 text-[#c5a880]" />
                                ) : (
                                  <Square className="h-4.5 w-4.5" />
                                )}
                              </button>
                              
                              <div>
                                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                                {item.egyptianCodeRef && (
                                  <span className="text-[9px] text-[#c5a880] font-semibold block mt-0.5">
                                    مرجع: {item.egyptianCodeRef}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6" onClick={e => e.stopPropagation()}>
                              {/* Renovation Action Select */}
                              {isRenovation && item.isActive && canEdit && (
                                <select
                                  value={item.renovationAction || 'new_addition'}
                                  onChange={(e) => handleItemPropChange(item, 'renovationAction', e.target.value)}
                                  className="bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                                >
                                  <option value="new_addition">إضافة جديدة</option>
                                  <option value="keep">إبقاء القائم</option>
                                  <option value="remove_only">إزالة/هدم فقط</option>
                                  <option value="remove_and_replace">إزالة واستبدال</option>
                                </select>
                              )}

                              {item.isActive && (
                                <div className="text-right">
                                  <div className="flex items-center gap-1.5">
                                    {item.quantitySource === 'calculated' && !item.perAreaOverrides && (
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-[#c5a880]/15 text-[#c5a880] text-[8px] font-bold">حساب تلقائي</span>
                                    )}
                                    <span className="text-xs text-white font-bold">{itemResult.quantity.toFixed(1)} {item.unit}</span>
                                  </div>
                                </div>
                              )}

                              {item.isActive && (
                                <span className="text-xs font-bold text-white w-24 text-left">
                                  {itemResult.total.toLocaleString()} ج.م
                                </span>
                              )}

                              <button 
                                onClick={() => toggleItemExpand(item.id)}
                                className="p-1 rounded hover:bg-slate-800 text-slate-500"
                              >
                                {isItemExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Specifications Spec Editor Card */}
                          {isItemExpanded && item.isActive && (
                            <div className="p-4 border-t border-[#222634] bg-[#13151c]/40 rounded-b-lg space-y-5">
                              
                              {/* 1. Specs Form */}
                              {template && template.specs.length > 0 && (
                                <div className="space-y-4">
                                  <h5 className="text-xs font-bold text-slate-400 border-b border-[#222634] pb-1.5 flex items-center gap-1.5">
                                    <Settings className="h-3.5 w-3.5 text-[#c5a880]" />
                                    مواصفات البند الفنية
                                  </h5>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {template.specs.map((field) => {
                                      const val = item.specs[field.key] !== undefined ? item.specs[field.key] : field.defaultValue;

                                      return (
                                        <div key={field.key}>
                                          <label className="block text-right text-[10px] font-semibold text-slate-400 mb-1">
                                            {field.label} {field.unit && `(${field.unit})`}
                                          </label>
                                          
                                          {field.type === 'select' ? (
                                            <select
                                              disabled={!canEdit}
                                              value={val}
                                              onChange={(e) => handleSpecChange(item, field.key, e.target.value)}
                                              className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                                            >
                                              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                          ) : field.type === 'number' ? (
                                            <input
                                              type="number"
                                              disabled={!canEdit}
                                              value={val}
                                              onChange={(e) => handleSpecChange(item, field.key, Number(e.target.value) || 0)}
                                              className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2.5 py-1.5 text-center text-xs text-white focus:outline-none focus:border-[#c5a880]"
                                            />
                                          ) : (
                                            <input
                                              type="text"
                                              disabled={!canEdit}
                                              value={val}
                                              onChange={(e) => handleSpecChange(item, field.key, e.target.value)}
                                              className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2.5 py-1.5 text-right text-xs text-white focus:outline-none focus:border-[#c5a880]"
                                            />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* 2. perAreaOverride Editor */}
                              {template?.perAreaOverride && (
                                <div className="space-y-3 bg-[#13151c]/60 p-4 border border-[#222634] rounded-lg">
                                  <div className="flex items-center justify-between border-b border-[#222634] pb-2">
                                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                      <LayoutGrid className="h-3.5 w-3.5 text-[#c5a880]" />
                                      تعدد المواصفات والكميات لكل مساحة (Accents)
                                    </h5>
                                    {canEdit && (
                                      <button
                                        onClick={() => handleAddAreaOverride(item)}
                                        className="text-[10px] font-bold text-[#c5a880] hover:underline"
                                      >
                                        + تفعيل مساحة إضافية
                                      </button>
                                    )}
                                  </div>

                                  {Object.keys(item.perAreaOverrides || {}).length === 0 ? (
                                    <p className="text-[10px] text-slate-500 font-semibold text-center py-2">
                                      هذا البند يغذي المشروع بكامل مساحته المجمعة. اضغط بالأعلى لتقسيم البند بمواصفات مختلفة لكل غرفة.
                                    </p>
                                  ) : (
                                    <div className="space-y-3">
                                      {Object.entries(item.perAreaOverrides || {}).map(([zoneId, override]) => (
                                        <div key={zoneId} className="flex flex-col sm:flex-row items-center gap-3 border border-slate-900 bg-slate-900/30 p-2.5 rounded-lg">
                                          {/* Select room */}
                                          <div className="w-full sm:w-1/4">
                                            <label className="block text-right text-[9px] text-slate-400 mb-0.5">الغرفة/المساحة</label>
                                            <select
                                              disabled={!canEdit}
                                              value={zoneId}
                                              onChange={(e) => handleUpdateAreaOverride(item, zoneId, e.target.value, override.specs, override.quantity)}
                                              className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-xs text-white"
                                            >
                                              {currentProject.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                            </select>
                                          </div>

                                          {/* Render custom input selectors based on specs */}
                                          {template?.specs.map((field) => {
                                            const val = override.specs[field.key] !== undefined ? override.specs[field.key] : field.defaultValue;
                                            return (
                                              <div key={field.key} className="w-full sm:w-1/5">
                                                <label className="block text-right text-[9px] text-slate-400 mb-0.5">{field.label}</label>
                                                {field.type === 'select' ? (
                                                  <select
                                                    disabled={!canEdit}
                                                    value={val}
                                                    onChange={(e) => {
                                                      const updates = { [field.key]: e.target.value };
                                                      handleUpdateAreaOverride(item, zoneId, zoneId, updates, override.quantity);
                                                    }}
                                                    className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-xs text-white"
                                                  >
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                  </select>
                                                ) : (
                                                  <input
                                                    type="text"
                                                    disabled={!canEdit}
                                                    value={val}
                                                    onChange={(e) => {
                                                      const updates = { [field.key]: e.target.value };
                                                      handleUpdateAreaOverride(item, zoneId, zoneId, updates, override.quantity);
                                                    }}
                                                    className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-xs text-white"
                                                  />
                                                )}
                                              </div>
                                            );
                                          })}

                                          {/* Quantity */}
                                          <div className="w-full sm:w-20">
                                            <label className="block text-right text-[9px] text-slate-400 mb-0.5">الكمية ({item.unit})</label>
                                            <input
                                              type="number"
                                              disabled={!canEdit}
                                              value={override.quantity}
                                              onChange={(e) => handleUpdateAreaOverride(item, zoneId, zoneId, {}, Number(e.target.value) || 0)}
                                              className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-white"
                                            />
                                          </div>

                                          {/* Delete */}
                                          {canEdit && (
                                            <button
                                              onClick={() => handleDeleteAreaOverride(item, zoneId)}
                                              className="p-1 mt-3 sm:mt-0 rounded bg-slate-900 border border-slate-800 text-rose-500 hover:bg-rose-950/20 transition"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 2.5 Quantities Editor */}
                              <div className="space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 border-b border-[#222634] pb-1.5 flex items-center gap-1.5">
                                  <LayoutGrid className="h-3.5 w-3.5 text-[#c5a880]" />
                                  تعديل الكمية الإجمالية
                                </h5>
                                
                                <div className="flex flex-col md:flex-row gap-5">
                                  <div className="flex-1 bg-slate-900/30 border border-[#222634] p-4 rounded-lg space-y-3.5">
                                    <div>
                                      <label className="block text-right text-[10px] font-semibold text-slate-400 mb-1">مصدر حساب الكمية</label>
                                      <select
                                        disabled={!canEdit}
                                        value={item.quantitySource || 'calculated'}
                                        onChange={(e) => handleItemPropChange(item, 'quantitySource', e.target.value)}
                                        className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                      >
                                        <option value="calculated">حساب تلقائي من الغرف والمساحات</option>
                                        <option value="manual">تعديل وإدخال يدوي مباشر</option>
                                      </select>
                                    </div>
                                    
                                    {item.quantitySource === 'manual' && (
                                      <div>
                                        <label className="block text-right text-[9px] text-slate-400 mb-0.5">الكمية الإجمالية المعتمدة ({item.unit})</label>
                                        <input
                                          type="number"
                                          disabled={!canEdit}
                                          value={item.quantity || 0}
                                          onChange={(e) => handleItemPropChange(item, 'quantity', parseFloat(e.target.value) || 0)}
                                          className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-emerald-400 font-bold focus:border-[#c5a880] focus:outline-none"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 3. Pricing Editor */}
                              <div className="space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 border-b border-[#222634] pb-1.5 flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-[#c5a880]" />
                                  التسعير وبنود اليوميات
                                </h5>

                                <div className="flex flex-col md:flex-row gap-5">
                                  
                                  {/* Pricing Mode */}
                                  <div className="flex-1 bg-slate-900/30 border border-[#222634] p-4 rounded-lg space-y-3.5">
                                    <div>
                                      <label className="block text-right text-[10px] font-semibold text-slate-400 mb-1">طريقة الحساب والتسعير</label>
                                      <select
                                        disabled={!canEdit}
                                        value={item.pricing.mode}
                                        onChange={(e) => handlePricingModeChange(item, e.target.value as any)}
                                        className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                      >
                                        <option value="materials_labor_split">تجزئة خامات ومصنعية</option>
                                        <option value="lump_sum">مقطوعية كاملة (شامل)</option>
                                        <option value="daily_rate">يوميات عمل الصنيعي</option>
                                      </select>
                                    </div>

                                    {/* Sub inputs depending on mode */}
                                    <div className="grid grid-cols-2 gap-3">
                                      {item.pricing.mode === 'materials_labor_split' && (
                                        <>
                                          <div>
                                            <label className="block text-right text-[9px] text-slate-400 mb-0.5">سعر الوحدة خامات (ج.م)</label>
                                            <input
                                              type="number"
                                              disabled={!canEdit}
                                              value={item.pricing.materialUnitPrice}
                                              onChange={(e) => handlePricingChange(item, 'materialUnitPrice', e.target.value)}
                                              className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-white focus:outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-right text-[9px] text-slate-400 mb-0.5">سعر الوحدة مصنعية (ج.م)</label>
                                            <input
                                              type="number"
                                              disabled={!canEdit}
                                              value={item.pricing.laborUnitPrice}
                                              onChange={(e) => handlePricingChange(item, 'laborUnitPrice', e.target.value)}
                                              className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-white focus:outline-none"
                                            />
                                          </div>
                                        </>
                                      )}

                                      {item.pricing.mode === 'lump_sum' && (
                                        <div className="col-span-2">
                                          <label className="block text-right text-[9px] text-slate-400 mb-0.5">سعر المقطوعية المعتمد (ج.م)</label>
                                          <input
                                            type="number"
                                            disabled={!canEdit}
                                            value={item.pricing.lumpSumPrice}
                                            onChange={(e) => handlePricingChange(item, 'lumpSumPrice', e.target.value)}
                                            className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-white focus:outline-none"
                                          />
                                        </div>
                                      )}

                                      {item.pricing.mode === 'daily_rate' && (
                                        <>
                                          <div>
                                            <label className="block text-right text-[9px] text-slate-400 mb-0.5">يومية الصنايعي (ج.م)</label>
                                            <input
                                              type="number"
                                              disabled={!canEdit}
                                              value={item.pricing.dailyRate}
                                              onChange={(e) => handlePricingChange(item, 'dailyRate', e.target.value)}
                                              className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-white focus:outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-right text-[9px] text-slate-400 mb-0.5">أيام التنفيذ التقديرية</label>
                                            <input
                                              type="number"
                                              disabled={!canEdit}
                                              value={item.pricing.estimatedDays}
                                              onChange={(e) => handlePricingChange(item, 'estimatedDays', e.target.value)}
                                              className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-white focus:outline-none"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <label className="block text-right text-[9px] text-slate-400 mb-0.5">سعر الوحدة خامات (إذا كنت من سيورد الخامات)</label>
                                            <input
                                              type="number"
                                              disabled={!canEdit}
                                              value={item.pricing.materialUnitPrice}
                                              onChange={(e) => handlePricingChange(item, 'materialUnitPrice', e.target.value)}
                                              className="w-full bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-white focus:outline-none"
                                            />
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    
                                    {item.pricing.mode !== 'daily_rate' && (
                                      <div>
                                        <label className="block text-right text-[9px] text-slate-400 mb-0.5">مدة التنفيذ التقديرية (يوم)</label>
                                        <input
                                          type="number"
                                          disabled={!canEdit}
                                          value={item.pricing.estimatedDays}
                                          onChange={(e) => handlePricingChange(item, 'estimatedDays', e.target.value)}
                                          className="w-24 bg-[#13151c] border border-[#222634] rounded px-2 py-1 text-center text-xs text-white focus:outline-none"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Pricing Output */}
                                  <div className="flex-1 bg-[#c5a880]/5 border border-[#c5a880]/15 p-4 rounded-lg flex flex-col justify-between">
                                    <div className="space-y-2 text-xs font-semibold text-slate-400">
                                      <div className="flex justify-between">
                                        <span>إجمالي الخامات:</span>
                                        <span className="text-white">{itemResult.materialCost.toLocaleString()} ج.م</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>إجمالي المصنعية / اليوميات:</span>
                                        <span className="text-white">{itemResult.laborCost.toLocaleString()} ج.م</span>
                                      </div>
                                      <div className="flex justify-between border-t border-[#222634] pt-2 mt-2 font-bold text-sm">
                                        <span className="text-[#c5a880]">إجمالي البند:</span>
                                        <span className="text-[#c5a880]">{itemResult.total.toLocaleString()} ج.م</span>
                                      </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[#222634] text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                      <span>المدة المقدرة للجدول الزمني: {itemResult.estimatedDays} أيام عمل متواصلة.</span>
                                    </div>
                                  </div>

                                  {/* Custom Materials Editor */}
                                  {(item.pricing.mode === 'materials_labor_split' || item.pricing.mode === 'daily_rate') && (
                                    <div className="space-y-4 col-span-full md:col-span-1 mt-4 border-t border-[#222634] pt-4">
                                      <div className="flex items-center justify-between border-b border-[#222634] pb-1.5">
                                        <h5 className="text-xs font-bold text-[#c5a880] flex items-center gap-1.5">
                                          <LayoutGrid className="h-3.5 w-3.5" />
                                          تحليل أسعار الخامات والتوصيف التفصيلي (للتسعير الدقيق)
                                        </h5>
                                        {canEdit && (
                                          <button
                                            onClick={() => handleAddCustomMaterial(item)}
                                            className="text-[10px] font-bold bg-[#c5a880]/10 px-2 py-1 rounded text-[#c5a880] hover:bg-[#c5a880]/20 transition"
                                          >
                                            + إضافة خامة فرعية
                                          </button>
                                        )}
                                      </div>

                                      {item.customMaterials && item.customMaterials.length > 0 ? (
                                        <div className="overflow-x-auto bg-[#13151c]/60 p-3 rounded-lg border border-[#222634]">
                                          <table className="w-full text-right text-[10px] font-medium border-collapse">
                                            <thead>
                                              <tr className="text-slate-400 border-b border-[#222634]/60 pb-2 font-bold">
                                                <th className="pb-2 text-right">الخامة من الكتالوج المركزي</th>
                                                <th className="pb-2 text-center w-24">الكمية / النسبة</th>
                                                <th className="pb-2 text-center w-20">الوحدة</th>
                                                <th className="pb-2 text-center w-24">سعر الوحدة</th>
                                                <th className="pb-2 text-center w-24">الإجمالي</th>
                                                <th className="pb-2 w-10"></th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#222634]/30 text-slate-300">
                                              {item.customMaterials.map((mat) => (
                                                <tr key={mat.id} className="hover:bg-slate-900/10 transition">
                                                  <td className="py-2 pr-1">
                                                    <select
                                                      disabled={!canEdit}
                                                      value={mat.constantKey || ''}
                                                      onChange={(e) => {
                                                        const key = e.target.value;
                                                        if (!key) {
                                                          handleUpdateCustomMaterial(item, mat.id, { constantKey: '', name: '', unit: '', unitPrice: 0 });
                                                          return;
                                                        }
                                                        const constDef = allMaterials.find(c => c.key === key);
                                                        if (constDef) {
                                                          const pPrice = projectConstantsMap[key] !== undefined ? projectConstantsMap[key] : constDef.defaultValue;
                                                          handleUpdateCustomMaterial(item, mat.id, { 
                                                            constantKey: key, 
                                                            name: constDef.label, 
                                                            unit: constDef.unit, 
                                                            unitPrice: pPrice 
                                                          });
                                                        }
                                                      }}
                                                      className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                                                    >
                                                      <option value="">-- اختر خامة من الكتالوج --</option>
                                                      {allMaterials.map(m => (
                                                        <option key={m.key} value={m.key}>{m.label}</option>
                                                      ))}
                                                    </select>
                                                    {!mat.constantKey && (
                                                      <input
                                                        type="text"
                                                        disabled={!canEdit}
                                                        value={mat.name}
                                                        placeholder="أو اكتب اسم خامة خارجية يدوياً"
                                                        onChange={(e) => handleUpdateCustomMaterial(item, mat.id, { name: e.target.value })}
                                                        className="w-full mt-1 bg-[#1a1c24] border border-[#222634] rounded px-2 py-1 text-xs text-white focus:outline-none"
                                                      />
                                                    )}
                                                  </td>
                                                  <td className="py-2 px-1">
                                                    <div className="flex flex-col gap-1">
                                                      <input
                                                        type="number"
                                                        disabled={!canEdit}
                                                        value={mat.multiplier || ''}
                                                        placeholder={`نسبة (من ${item.quantity || 0})`}
                                                        title="استخدم هذه الخانة لربط الكمية بإجمالي كمية البند"
                                                        onChange={(e) => handleUpdateCustomMaterial(item, mat.id, { multiplier: parseFloat(e.target.value) || 0, quantity: 0 })}
                                                        className="w-full bg-[#1a1c24] border border-[#c5a880]/30 rounded px-2 py-1 text-center text-[10px] text-amber-200 placeholder:text-[#c5a880]/50 focus:outline-none"
                                                      />
                                                      <input
                                                        type="number"
                                                        disabled={!canEdit || mat.multiplier > 0}
                                                        value={mat.quantity || ''}
                                                        placeholder="رقم ثابت"
                                                        onChange={(e) => handleUpdateCustomMaterial(item, mat.id, { quantity: parseFloat(e.target.value) || 0, multiplier: 0 })}
                                                        className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-1 text-center text-xs text-emerald-400 font-bold focus:outline-none disabled:opacity-30"
                                                      />
                                                    </div>
                                                  </td>
                                                  <td className="py-2 px-1">
                                                    <input
                                                      type="text"
                                                      disabled={!canEdit || !!mat.constantKey}
                                                      value={mat.unit}
                                                      placeholder="الوحدة"
                                                      onChange={(e) => handleUpdateCustomMaterial(item, mat.id, { unit: e.target.value })}
                                                      className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-2 text-center text-xs text-slate-400 focus:outline-none disabled:bg-[#13151c]"
                                                    />
                                                  </td>
                                                  <td className="py-2 px-1">
                                                    <input
                                                      type="number"
                                                      disabled={!canEdit || !!mat.constantKey}
                                                      value={mat.unitPrice}
                                                      onChange={(e) => handleUpdateCustomMaterial(item, mat.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                                      className="w-full bg-[#1a1c24] border border-[#222634] rounded px-2 py-2 text-center text-xs text-white focus:outline-none disabled:bg-[#13151c]"
                                                    />
                                                  </td>
                                                  <td className="py-2 pl-1 text-center font-bold text-[#c5a880]">
                                                    {(() => {
                                                      const calcQty = mat.multiplier ? (item.quantity || 0) * mat.multiplier : (mat.quantity || 0);
                                                      return (calcQty * (mat.unitPrice || 0)).toLocaleString();
                                                    })()} ج.م
                                                  </td>
                                                  <td className="py-2 text-center">
                                                    {canEdit && (
                                                      <button
                                                        onClick={() => handleDeleteCustomMaterial(item, mat.id)}
                                                        className="p-1 rounded text-rose-500 hover:bg-rose-950/20 transition"
                                                      >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                      </button>
                                                    )}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-slate-500 text-center py-2">لم يتم إدخال خامات تفصيلية. سيتم الاعتماد على خانة سعر الوحدة خامات الأساسية المكتوبة بالأعلى.</p>
                                      )}
                                    </div>
                                  )}

                                  {/* 3.5 Detailed Material Recipe Breakdown */}
                                  {(() => {
                                    const mats = calculateItemMaterials(item, currentProject.zones);
                                    if (mats.length === 0) return null;
                                    return (
                                      <div className="space-y-3 bg-[#13151c]/60 border border-[#222634] p-4 rounded-lg">
                                        <h5 className="text-xs font-bold text-[#c5a880] flex items-center gap-1.5 border-b border-[#222634] pb-2">
                                          <LayoutGrid className="h-3.5 w-3.5" />
                                          تفاصيل وحصر الخامات المطلوبة للشراء والتسعير
                                        </h5>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-right text-[10px] font-medium border-collapse">
                                            <thead>
                                              <tr className="text-slate-400 border-b border-[#222634]/60 pb-2 font-bold">
                                                <th className="pb-2 text-right">الخامة / التوصيف</th>
                                                <th className="pb-2 text-center">الاحتياج الفعلي</th>
                                                <th className="pb-2 text-center">الكمية المقربة (شراء)</th>
                                                <th className="pb-2 text-center">وحدة التعبئة</th>
                                                <th className="pb-2 text-center">سعر الوحدة</th>
                                                <th className="pb-2 text-left">إجمالي التكلفة</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#222634]/30 text-slate-300">
                                              {mats.map((mat) => (
                                                <tr key={mat.key} className="hover:bg-slate-900/10 transition">
                                                  <td className="py-2.5 text-right font-semibold text-white">
                                                    {mat.name}
                                                    {mat.packagingDetails && (
                                                      <span className="block text-[8px] text-slate-500 font-normal mt-0.5">{mat.packagingDetails}</span>
                                                    )}
                                                  </td>
                                                  <td className="py-2.5 text-center">{mat.qtyRequired.toFixed(1)}</td>
                                                  <td className="py-2.5 text-center text-[#c5a880] font-bold">{mat.qtyRounded}</td>
                                                  <td className="py-2.5 text-center">{mat.unit}</td>
                                                  <td className="py-2.5 text-center">{mat.unitPrice.toLocaleString()} ج.م</td>
                                                  <td className="py-2.5 text-left font-bold text-white">{mat.totalCost.toLocaleString()} ج.م</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                </div>
                              </div>

                              {/* 4. Notes, Egyptian Code and Delete */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#222634] pt-4 mt-3">
                                <div>
                                  <label className="block text-right text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3 text-slate-500" />
                                    ملاحظات المهندس الفنية
                                  </label>
                                  <textarea
                                    disabled={!canEdit}
                                    value={item.notes}
                                    onChange={(e) => handleItemPropChange(item, 'notes', e.target.value)}
                                    rows={2}
                                    placeholder="ملاحظات حرة للصنايعي أو المورد..."
                                    className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] p-2.5 text-right text-xs text-white focus:outline-none"
                                  />
                                </div>
                                <div className="flex flex-col justify-between">
                                  <div>
                                    <label className="block text-right text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                                      <ShieldAlert className="h-3 w-3 text-slate-500" />
                                      كود البناء المصري (مرجع المواصفات)
                                    </label>
                                    <input
                                      type="text"
                                      disabled={!canEdit}
                                      value={item.egyptianCodeRef}
                                      onChange={(e) => handleItemPropChange(item, 'egyptianCodeRef', e.target.value)}
                                      placeholder="المستند / كود التركيب المرجعي"
                                      className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-3 py-1.5 text-right text-xs text-white focus:outline-none"
                                    />
                                  </div>

                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => deleteItem(item.sectionId, item.id)}
                                      className="flex items-center gap-1 text-rose-500 hover:text-rose-400 text-xs font-semibold mt-3 md:mt-0 mr-auto hover:underline"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      حذف البند نهائيًا من الحصر
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Add Custom Item Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#222634] pb-3 mb-5">
              <h4 className="text-base font-bold text-white">إضافة بند مخصص في القسم</h4>
              <button 
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-4">
              <div>
                <label className="block text-right text-xs font-semibold text-slate-400 mb-1">اسم البند المقترح *</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-3 py-2 text-right text-xs text-white focus:outline-none"
                  placeholder="مثال: توريد وتركيب ارضيات ايبوكسي"
                />
              </div>

              <div>
                <label className="block text-right text-xs font-semibold text-slate-400 mb-1">وحدة القياس المعتمدة *</label>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-3 py-2 text-right text-xs text-white focus:outline-none"
                >
                  <option value="م²">م² (متر مربع)</option>
                  <option value="م³">م³ (متر مكعب)</option>
                  <option value="متر طولي">متر طولي (م.ط)</option>
                  <option value="عدد">عدد (قطعة)</option>
                  <option value="نقطة">نقطة (مخرج)</option>
                  <option value="مقطوعية">مقطوعية (كامل)</option>
                </select>
              </div>

              <div className="flex gap-2.5 justify-end border-t border-[#222634] pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-5 py-2 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold shadow hover:brightness-110 transition"
                >
                  <Plus className="h-4 w-4" />
                  تثبيت وإضافة البند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
