'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { ProjectHeader, deleteProject, formatDate } from '@/lib/project-service';
import { Save, Info, User, Phone, MapPin, Calendar, CheckSquare, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProjectHeaderTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateHeader = useProjectStore((state) => state.updateHeader);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const [name, setName] = useState(currentProject?.header.name || '');
  const [ownerName, setOwnerName] = useState(currentProject?.header.ownerName || '');
  const [ownerPhone, setOwnerPhone] = useState(currentProject?.header.ownerPhone || '');
  const [consultantName, setConsultantName] = useState(currentProject?.header.consultantName || '');
  const [designCode, setDesignCode] = useState(currentProject?.header.designCode || '');
  const [governorate, setGovernorate] = useState(currentProject?.header.governorate || '');
  const [addressDetails, setAddressDetails] = useState(currentProject?.header.addressDetails || '');
  const [issueDate, setIssueDate] = useState(currentProject?.header.issueDate || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(currentProject?.header.expectedDeliveryDate || '');
  const [actualDeliveryDate, setActualDeliveryDate] = useState(currentProject?.header.actualDeliveryDate || '');
  const [status, setStatus] = useState<ProjectHeader['status']>(currentProject?.header.status || 'quantity_prep');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!currentProject) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateHeader({
      name,
      ownerName,
      ownerPhone,
      consultantName,
      designCode,
      governorate,
      addressDetails,
      issueDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      status
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'quantity_prep': return 'تجهيز الكميات';
      case 'pricing_prep': return 'تجهيز الأسعار';
      case 'review': return 'المراجعة';
      case 'client_approval': return 'موافقة العميل';
      case 'execution': return 'التنفيذ';
      case 'executed': return 'تم التنفيذ';
      case 'handover': return 'التسليم';
      default: return s;
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذا المشروع بالكامل؟ لا يمكن التراجع عن هذا الإجراء.');
    if (confirmDelete) {
      try {
        await deleteProject(currentProject.id);
        router.push('/dashboard');
      } catch (err) {
        console.error("Error deleting project", err);
        alert('حدث خطأ أثناء محاولة حذف المشروع.');
      }
    }
  };

  const getWorkTypeLabel = (w: string) => {
    switch (w) {
      case 'new_build': return 'إنشاء جديد كامل (Core & Shell)';
      case 'finishing_only': return 'تشطيب فقط';
      case 'renovation': return 'تجديد / ترميم جزئي';
      default: return w;
    }
  };

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'المنوفية', 
    'الغربية', 'البحيرة', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'كفر الشيخ', 
    'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 
    'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'
  ];

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  return (
    <div className="space-y-6 font-cairo select-none">
      
      {/* Overview Metadata Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5">
          <span className="block text-xs font-semibold text-slate-500 mb-1">رمز التعريف والمسلسل</span>
          <p className="text-xl font-extrabold text-[#c5a880] tracking-wider">{currentProject.header.projectCode}</p>
        </div>
        <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5">
          <span className="block text-xs font-semibold text-slate-500 mb-1">نوع المشروع</span>
          <p className="text-sm font-bold text-white mt-1">{getWorkTypeLabel(currentProject.header.projectType.workType)}</p>
        </div>
        <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5">
          <span className="block text-xs font-semibold text-slate-500 mb-1">حالة المستند الحالية</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c5a880] animate-pulse"></span>
            <p className="text-sm font-bold text-white">{getStatusLabel(currentProject.header.status)}</p>
          </div>
        </div>
      </div>

      {/* Main Details Form */}
      <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#222634] pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">تفاصيل وملف المشروع</h3>
            <p className="text-xs text-slate-400 mt-0.5">البيانات الفنية وتفاصيل الاتصال الخاصة بالعميل والموقع.</p>
          </div>
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-[#c5a880] hover:bg-slate-800 transition"
            >
              تعديل البيانات
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="mb-6 rounded-lg bg-emerald-950/40 border border-emerald-800/60 p-3 text-center text-xs text-emerald-400 font-semibold animate-pulse">
            تم حفظ تعديلات المشروع بنجاح ومزامنتها مع قاعدة البيانات.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Project Name */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-slate-500" />
                اسم المشروع
              </label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 disabled:bg-slate-900/30 disabled:border-slate-850 px-4 py-2.5 text-right text-sm text-white placeholder-slate-600 focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                اسم المالك (العميل)
              </label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Owner Phone */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                رقم تليفون المالك
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  disabled={!isEditing}
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
                />
                {!isEditing && ownerPhone && (
                  <a
                    href={`https://wa.me/2${ownerPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute left-3 top-2.5 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-[10px] text-emerald-400 flex items-center gap-1 hover:brightness-110 transition"
                  >
                    واتساب
                  </a>
                )}
              </div>
            </div>

            {/* Consultant Name */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                اسم الاستشاري
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={consultantName}
                onChange={(e) => setConsultantName(e.target.value)}
                placeholder="اسم المهندس الاستشاري أو المكتب"
                className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Design Code */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-slate-500" />
                الكود التصميمي / المرجعي
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={designCode}
                onChange={(e) => setDesignCode(e.target.value)}
                className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Governorate */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                الموقع / المحافظة
              </label>
              <select
                disabled={!isEditing}
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
              >
                {governorates.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Location details */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                العنوان التفصيلي
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                تاريخ الإصدار (بدء المشروع)
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
                />
              ) : (
                <div className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-white">
                  {formatDate(issueDate)}
                </div>
              )}
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                تاريخ التسليم المتوقع
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
                />
              ) : (
                <div className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-white">
                  {formatDate(expectedDeliveryDate)}
                </div>
              )}
            </div>

            {/* Actual Delivery Date */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                تاريخ التسليم الفعلي
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
                />
              ) : (
                <div className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-white">
                  {formatDate(actualDeliveryDate)}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                حالة المستند
              </label>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none"
                >
                  <option value="quantity_prep">تجهيز الكميات</option>
                  <option value="pricing_prep">تجهيز الأسعار</option>
                  <option value="review">المراجعة</option>
                  <option value="client_approval">موافقة العميل</option>
                  <option value="execution">التنفيذ</option>
                  <option value="executed">تم التنفيذ</option>
                  <option value="handover">التسليم</option>
                </select>
              ) : (
                <div className="w-full rounded-lg border border-[#222634] bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-white">
                  {getStatusLabel(status)}
                </div>
              )}
            </div>

          </div>

          {/* Form Actions */}
          {isEditing && (
            <div className="flex gap-3 justify-end border-t border-[#222634] pt-5 mt-8">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Reset states
                  setName(currentProject.header.name);
                  setOwnerName(currentProject.header.ownerName);
                  setOwnerPhone(currentProject.header.ownerPhone);
                  setConsultantName(currentProject.header.consultantName || '');
                  setDesignCode(currentProject.header.designCode);
                  setGovernorate(currentProject.header.governorate);
                  setAddressDetails(currentProject.header.addressDetails);
                  setIssueDate(currentProject.header.issueDate);
                  setExpectedDeliveryDate(currentProject.header.expectedDeliveryDate || '');
                  setActualDeliveryDate(currentProject.header.actualDeliveryDate || '');
                  setStatus(currentProject.header.status);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                إلغاء التغييرات
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold shadow hover:brightness-110 transition animate-pulse"
              >
                <Save className="h-4 w-4" />
                حفظ التعديلات
              </button>
            </div>
          )}
        </form>
      </div>

      {canEdit && (
        <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-6 shadow-xl mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-rose-500">منطقة الخطر (Danger Zone)</h3>
              <p className="text-xs text-slate-400 mt-1">حذف المشروع سيؤدي إلى مسح جميع البيانات المتعلقة به بشكل نهائي (الأسعار، الحصر، الموردين، إلخ).</p>
            </div>
            <button
              onClick={handleDeleteProject}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-rose-900/50 border border-rose-800 text-sm font-bold text-rose-200 hover:bg-rose-600 hover:text-white transition"
            >
              <Trash2 className="h-4 w-4" />
              حذف المشروع بالكامل
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
