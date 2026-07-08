'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, Edit, Save, X, Info } from 'lucide-react';
import { Zone } from '@/lib/calculations';

export default function ProjectZonesTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const addZone = useProjectStore((state) => state.addZone);
  const updateZone = useProjectStore((state) => state.updateZone);
  const deleteZone = useProjectStore((state) => state.deleteZone);
  const user = useAuthStore((state) => state.user);

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [floorArea, setFloorArea] = useState(12);
  const [perimeter, setPerimeter] = useState(14);
  const [height, setHeight] = useState(3.0);
  const [deductions, setDeductions] = useState(2.0);

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  const openAddModal = () => {
    setEditingZoneId(null);
    setName('غرفة جديدة');
    setFloorArea(12);
    setPerimeter(14);
    setHeight(3.0);
    setDeductions(2.0);
    setIsModalOpen(true);
  };

  const openEditModal = (z: Zone) => {
    setEditingZoneId(z.id);
    setName(z.name);
    setFloorArea(z.floorArea);
    setPerimeter(z.perimeter);
    setHeight(z.height);
    setDeductions(z.deductions);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingZoneId) {
      await updateZone(editingZoneId, {
        name,
        floorArea,
        perimeter,
        height,
        deductions
      });
    } else {
      await addZone({
        name,
        floorArea,
        perimeter,
        height,
        deductions
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (zoneId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المساحة؟ قد يؤثر هذا على الكميات المحسوبة تلقائياً في بنود الحصر.')) {
      await deleteZone(zoneId);
    }
  };

  // Standard Room templates templates
  const injectRoomTemplate = async (type: string) => {
    let inputs;
    const roomCount = currentProject.zones.length;
    switch (type) {
      case 'reception':
        inputs = { name: `ريسبشن ${roomCount + 1}`, floorArea: 30, perimeter: 22, height: 3.0, deductions: 4.0 };
        break;
      case 'bedroom':
        inputs = { name: `غرفة نوم ${roomCount + 1}`, floorArea: 15, perimeter: 16, height: 3.0, deductions: 2.5 };
        break;
      case 'kitchen':
        inputs = { name: `مطبخ ${roomCount + 1}`, floorArea: 9, perimeter: 12, height: 3.0, deductions: 2.0 };
        break;
      case 'bathroom':
        inputs = { name: `حمام ${roomCount + 1}`, floorArea: 5, perimeter: 9, height: 3.0, deductions: 1.2 };
        break;
      default:
        inputs = { name: `فضاء جديد ${roomCount + 1}`, floorArea: 12, perimeter: 14, height: 3.0, deductions: 2.0 };
    }
    await addZone(inputs);
  };

  return (
    <div className="space-y-6 font-cairo select-none">
      
      {/* Quick Add and Summary Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">مساحات وحيّزات المشروع</h3>
          <p className="text-xs text-muted-foreground mt-0.5">جدول المساحات المستخدمة كمغذي أوتوماتيكي لبنود الحصر والدهانات والأرضيات.</p>
        </div>
        
        {canEdit && (
          <div className="flex gap-2.5">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#c5a880] to-[#e5c595] text-primary-foreground text-xs font-bold shadow hover:brightness-110 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" />
              إضافة مساحة جديدة
            </button>
          </div>
        )}
      </div>

      {/* Templates Row */}
      {canEdit && (
        <div className="bg-[#1a1c24]/50 border border-border p-4 rounded-xl flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">إضافة سريعة لمساحة نموذجية:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => injectRoomTemplate('reception')}
              className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-secondary-foreground hover:text-[#c5a880] transition"
            >
              + ريسبشن (٣٠ م²)
            </button>
            <button
              onClick={() => injectRoomTemplate('bedroom')}
              className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-secondary-foreground hover:text-[#c5a880] transition"
            >
              + غرفة نوم (١٥ م²)
            </button>
            <button
              onClick={() => injectRoomTemplate('kitchen')}
              className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-secondary-foreground hover:text-[#c5a880] transition"
            >
              + مطبخ (٩ م²)
            </button>
            <button
              onClick={() => injectRoomTemplate('bathroom')}
              className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-secondary-foreground hover:text-[#c5a880] transition"
            >
              + حمام (٥ م²)
            </button>
          </div>
        </div>
      )}

      {/* Grid List or Table of Areas */}
      <div className="overflow-x-auto border border-border rounded-xl bg-card">
        <table className="w-full text-right text-xs font-medium">
          <thead className="bg-[#1a1c24] text-muted-foreground border-b border-border font-bold">
            <tr>
              <th className="p-3 text-right">اسم الغرفة/المساحة</th>
              <th className="p-3 text-center">الأرضية (م²)</th>
              <th className="p-3 text-center">المحيط (م.ط)</th>
              <th className="p-3 text-center">الارتفاع (م)</th>
              <th className="p-3 text-center">خصم الفتحات (م²)</th>
              <th className="p-3 text-center bg-primary/5 text-primary">الحوائط (م²)</th>
              <th className="p-3 text-center">السقف (م²)</th>
              {canEdit && <th className="p-3 text-center">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222634] text-secondary-foreground">
            {currentProject.zones.map((zone) => (
              <tr key={zone.id} className="hover:bg-slate-900/40 transition">
                <td className="p-3 font-semibold text-foreground">{zone.name}</td>
                <td className="p-3 text-center">{zone.floorArea.toFixed(1)}</td>
                <td className="p-3 text-center">{zone.perimeter.toFixed(1)}</td>
                <td className="p-3 text-center">{zone.height.toFixed(1)}</td>
                <td className="p-3 text-center">{zone.deductions.toFixed(1)}</td>
                <td className="p-3 text-center bg-primary/5 text-primary font-bold">{zone.wallArea.toFixed(1)}</td>
                <td className="p-3 text-center">{zone.ceilingArea.toFixed(1)}</td>
                {canEdit && (
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(zone)}
                        className="p-1 rounded bg-muted border border-border text-muted-foreground hover:text-[#c5a880] transition"
                        title="تعديل الأبعاد"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        className="p-1 rounded bg-muted border border-border text-muted-foreground hover:text-rose-400 transition"
                        title="حذف المساحة"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="bg-[#1a1c24]/30 font-bold border-t border-border text-foreground">
              <td className="p-3">الإجمالي العام</td>
              <td className="p-3 text-center">{currentProject.zones.reduce((acc, z) => acc + z.floorArea, 0).toFixed(1)} م²</td>
              <td className="p-3 text-center">{currentProject.zones.reduce((acc, z) => acc + z.perimeter, 0).toFixed(1)} م.ط</td>
              <td className="p-3 text-center">-</td>
              <td className="p-3 text-center">{currentProject.zones.reduce((acc, z) => acc + z.deductions, 0).toFixed(1)} م²</td>
              <td className="p-3 text-center bg-primary/5 text-primary font-black">{currentProject.zones.reduce((acc, z) => acc + z.wallArea, 0).toFixed(1)} م²</td>
              <td className="p-3 text-center">{currentProject.zones.reduce((acc, z) => acc + z.ceilingArea, 0).toFixed(1)} م²</td>
              {canEdit && <td className="p-3"></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Edit / Add Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
              <h4 className="text-base font-bold text-foreground">
                {editingZoneId ? 'تعديل أبعاد المساحة' : 'إضافة مساحة جديدة'}
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-muted-foreground hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-right text-xs font-semibold text-muted-foreground mb-1">اسم الغرفة/المساحة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-[#1a1c24] px-3 py-2 text-right text-xs text-foreground focus:outline-none"
                  placeholder="مثال: غرفة المعيشة"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-right text-xs font-semibold text-muted-foreground mb-1">مساحة الأرضية (م²)</label>
                  <p className="text-[10px] text-muted-foreground mb-1.5 leading-tight">حاصل ضرب الطول × العرض. تُستخدم لحصر سيراميك الأرضيات والأسقف.</p>
                  <input
                    type="number"
                    step="any"
                    value={floorArea}
                    onChange={(e) => setFloorArea(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-[#1a1c24] px-3 py-2 text-center text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-right text-xs font-semibold text-muted-foreground mb-1">محيط الغرفة (متر طولي)</label>
                  <p className="text-[10px] text-muted-foreground mb-1.5 leading-tight">مجموع أطوال حوائط الغرفة الدائرية. تُستخدم لحصر دهانات ومحارة الحوائط والوزرات.</p>
                  <input
                    type="number"
                    step="any"
                    value={perimeter}
                    onChange={(e) => setPerimeter(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-[#1a1c24] px-3 py-2 text-center text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-right text-xs font-semibold text-muted-foreground mb-1">ارتفاع الحائط (متر)</label>
                  <input
                    type="number"
                    step="any"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-[#1a1c24] px-3 py-2 text-center text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-right text-xs font-semibold text-muted-foreground mb-1">خصم فتحات الأبواب/الشبابيك (م²)</label>
                  <input
                    type="number"
                    step="any"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-[#1a1c24] px-3 py-2 text-center text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time wall preview */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mt-4 text-center">
                <span className="text-[11px] font-semibold text-muted-foreground">مساحة الجدران المحسوبة للتشطيب والدهانات:</span>
                <p className="text-base font-extrabold text-primary mt-0.5">
                  {((perimeter * height) - deductions > 0 ? (perimeter * height) - deductions : 0).toFixed(2)} م²
                </p>
              </div>

              <div className="flex gap-2.5 justify-end border-t border-border pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-muted border border-border text-xs font-semibold text-muted-foreground hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow hover:brightness-110 transition"
                >
                  <Save className="h-4 w-4" />
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
