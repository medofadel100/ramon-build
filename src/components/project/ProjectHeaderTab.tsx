'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { ProjectHeader, formatDate } from '@/lib/project-service';
import { Save, Info, User, Phone, MapPin, Calendar, CheckSquare, Eye, Trash2, Copy, ExternalLink, Calculator } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProjectHeaderTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateHeader = useProjectStore((state) => state.updateHeader);
  const deleteCurrentProject = useProjectStore((state) => state.deleteCurrentProject);
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
  const [applyVat, setApplyVat] = useState(currentProject?.header.applyVat ?? true);
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
      status,
      applyVat
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

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    const confirmDelete = window.prompt(
      `لحذف المشروع نهائياً، اكتب اسم المشروع التالي: ${currentProject.header.name}`
    );

    if (confirmDelete !== currentProject.header.name) {
      alert('لم يتم حذف المشروع. لم تتطابق الكتابة مع اسم المشروع.');
      return;
    }

    const finalConfirm = window.confirm('هذا الإجراء سيحذف المشروع نهائياً ولا يمكن التراجع عنه. تابع؟');
    if (!finalConfirm) return;

    setIsDeleting(true);
    try {
      await deleteCurrentProject();
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting project', err);
      alert('حدث خطأ أثناء محاولة حذف المشروع.');
    } finally {
      setIsDeleting(false);
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
        <div className="rounded-xl border border-border bg-[#1a1c24] p-5">
          <span className="block text-xs font-semibold text-muted-foreground mb-1">رمز التعريف والمسلسل</span>
          <p className="text-xl font-extrabold text-primary tracking-wider">{currentProject.header.projectCode}</p>
        </div>
        <div className="rounded-xl border border-border bg-[#1a1c24] p-5">
          <span className="block text-xs font-semibold text-muted-foreground mb-1">نوع المشروع</span>
          <p className="text-sm font-bold text-foreground mt-1">{getWorkTypeLabel(currentProject.header.projectType.workType)}</p>
        </div>
        <div className="rounded-xl border border-border bg-[#1a1c24] p-5">
          <span className="block text-xs font-semibold text-muted-foreground mb-1">حالة المستند الحالية</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
            <p className="text-sm font-bold text-foreground">{getStatusLabel(currentProject.header.status)}</p>
          </div>
        </div>
      </div>

      {/* Main Details Form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">تفاصيل وملف المشروع</h3>
            <p className="text-xs text-muted-foreground mt-0.5">البيانات الفنية وتفاصيل الاتصال الخاصة بالعميل والموقع.</p>
          </div>
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-1.5 rounded-lg bg-muted border border-border text-xs font-semibold text-primary hover:bg-slate-800 transition"
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
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                اسم المشروع
              </label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1c24]/50 disabled:bg-slate-900/30 disabled:border-slate-850 px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                اسم المالك (العميل)
              </label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Owner Phone */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                رقم تليفون المالك
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  disabled={!isEditing}
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
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
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                اسم الاستشاري
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={consultantName}
                onChange={(e) => setConsultantName(e.target.value)}
                placeholder="اسم المهندس الاستشاري أو المكتب"
                className="w-full rounded-lg border border-border bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Design Code */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                الكود التصميمي / المرجعي
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={designCode}
                onChange={(e) => setDesignCode(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Governorate */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                الموقع / المحافظة
              </label>
              <select
                disabled={!isEditing}
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
              >
                {governorates.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Location details */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                العنوان التفصيلي
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1c24]/50 disabled:bg-slate-900/30 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                تاريخ الإصدار (بدء المشروع)
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
                />
              ) : (
                <div className="w-full rounded-lg border border-border bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-foreground">
                  {formatDate(issueDate)}
                </div>
              )}
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                تاريخ التسليم المتوقع
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
                />
              ) : (
                <div className="w-full rounded-lg border border-border bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-foreground">
                  {formatDate(expectedDeliveryDate)}
                </div>
              )}
            </div>

            {/* Actual Delivery Date */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                تاريخ التسليم الفعلي
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
                />
              ) : (
                <div className="w-full rounded-lg border border-border bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-foreground">
                  {formatDate(actualDeliveryDate)}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                حالة المستند
              </label>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-[#1a1c24]/50 px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
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
                <div className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground">
                  {getStatusLabel(status)}
                </div>
              )}
            </div>

            {/* VAT */}
            <div>
              <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                حساب ضريبة القيمة المضافة (VAT 14%)
              </label>
              {isEditing ? (
                <div className="flex items-center justify-end gap-3 w-full rounded-lg border border-border bg-card px-4 py-2.5">
                  <span className="text-sm font-semibold text-foreground">تفعيل الضريبة لأوامر الشراء</span>
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                    className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary focus:ring-2"
                  />
                </div>
              ) : (
                <div className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-right text-sm text-foreground">
                  {applyVat ? 'مفعلة (14%)' : 'غير مفعلة'}
                </div>
              )}
            </div>

          </div>

          {/* Form Actions */}
          {isEditing && (
            <div className="flex gap-3 justify-end border-t border-border pt-5 mt-8">
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
                  setApplyVat(currentProject.header.applyVat ?? true);
                }}
                className="px-4 py-2 rounded-lg bg-muted border border-border text-xs font-semibold text-muted-foreground hover:text-white transition"
              >
                إلغاء التغييرات
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow hover:brightness-110 transition animate-pulse"
              >
                <Save className="h-4 w-4" />
                حفظ التعديلات
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Client Portal Link */}
      <div className="rounded-xl border border-indigo-900/30 bg-indigo-950/10 p-6 shadow-xl mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              بوابة العميل (Client Portal)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">شارك هذا الرابط مع العميل لمتابعة إنجاز المشروع والمستخلصات الخاصة به.</p>
            <div className="mt-3 flex items-center gap-2 max-w-lg">
              <input 
                type="text" 
                readOnly 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/projects/${currentProject.id}/client`} 
                className="w-full rounded-lg border border-border bg-[#1a1c24]/50 px-4 py-2 text-left text-xs text-muted-foreground focus:outline-none"
                dir="ltr"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/projects/${currentProject.id}/client`);
                  alert('تم نسخ الرابط بنجاح!');
                }}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                نسخ
              </button>
            </div>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-6 shadow-xl mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-rose-500">
                منطقة الخطر (Danger Zone) 
                <span className="text-sm font-normal text-rose-400 mr-2 opacity-80">- اوعى تدوس هنا يا عزازي ابوس ايدك 😂</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">حذف المشروع سيؤدي إلى مسح جميع البيانات المتعلقة به بشكل نهائي (الأسعار، الحصر، الموردين، إلخ).</p>
            </div>
            <button
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-rose-900/50 border border-rose-800 text-sm font-bold text-rose-200 hover:bg-rose-600 hover:text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'جاري الحذف...' : 'حذف المشروع بالكامل'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
