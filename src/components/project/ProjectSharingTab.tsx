'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Share2, Copy, RefreshCw, Eye, EyeOff, ShieldAlert, Link as LinkIcon, Check } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ProjectSharingTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateSharing = useProjectStore((state) => state.updateSharing);
  const user = useAuthStore((state) => state.user);

  const [copied, setCopied] = useState(false);
  const [showPrices, setShowPrices] = useState(currentProject?.clientShareSettings.showPrices ?? true);
  const [showDetailedPricing, setShowDetailedPricing] = useState(currentProject?.clientShareSettings.showDetailedPricing ?? true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setShowPrices(currentProject.clientShareSettings.showPrices);
      setShowDetailedPricing(currentProject.clientShareSettings.showDetailedPricing);
    }
  }, [currentProject]);

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/view/${currentProject.clientShareToken}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSettingChange = async (key: 'showPrices' | 'showDetailedPricing', value: boolean) => {
    const updated = {
      showPrices: key === 'showPrices' ? value : showPrices,
      showDetailedPricing: key === 'showDetailedPricing' ? value : showDetailedPricing
    };
    
    if (key === 'showPrices') setShowPrices(value);
    if (key === 'showDetailedPricing') setShowDetailedPricing(value);

    await updateSharing(updated);
  };

  const handleRegenerateToken = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في تغيير الرابط؟ الرابط القديم المرسل للعميل سيتوقف عن العمل فوراً.')) return;
    setRegenerating(true);
    try {
      const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const docRef = doc(db, 'projects', currentProject.id);
      await updateDoc(docRef, {
        clientShareToken: newToken,
        updatedAt: serverTimestamp()
      });

      // Reload project state locally
      const storeLoad = useProjectStore.getState().loadProject;
      await storeLoad(currentProject.id);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء تحديث الرابط.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6 font-cairo select-none max-w-2xl">
      
      <div>
        <h3 className="text-lg font-bold text-white">إعدادات مشاركة العميل</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          يتيح لك هذا القسم مشاركة نسخة للعرض فقط (Read-only) مع العميل لمتابعة تفاصيل الحصر والمواصفات والأبعاد والكميات.
        </p>
      </div>

      {/* Share Link Card */}
      <div className="rounded-xl border border-[#222634] bg-[#13151c] p-5 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
          <LinkIcon className="h-4 w-4 text-[#c5a880]" />
          رابط المشاركة الخاص بالعميل
        </h4>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-[#1a1c24] border border-[#222634] rounded-lg px-4 py-2.5 text-xs text-slate-400 text-left dir-ltr focus:outline-none focus:ring-0"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-[#c5a880] hover:bg-slate-800 transition"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                تم النسخ
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                نسخ الرابط
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-slate-500 leading-normal flex items-start gap-1.5 pt-2">
          <ShieldAlert className="h-4 w-4 text-amber-500/80 shrink-0" />
          <span>
            هذا الرابط يعمل دون الحاجة لتسجيل دخول. يستطيع أي شخص لديه الرابط استعراض حصر بنود المشروع.
          </span>
        </p>
      </div>

      {/* View Configurations */}
      <div className="rounded-xl border border-[#222634] bg-[#13151c] p-6 space-y-5">
        <h4 className="text-sm font-bold text-white">إعدادات رؤية الأسعار للعميل</h4>
        <p className="text-xs text-slate-400">تحكم فيما يراه العميل من تفاصيل مالية وأسعار بنود في نسخته المفتوحة.</p>

        <div className="space-y-4 pt-2">
          {/* Option 1: Show/Hide total costs */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1c24]/40 border border-[#222634]">
            <div className="max-w-md">
              <span className="block text-xs font-bold text-white mb-0.5">إظهار الأسعار والتكاليف</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                في حال تعطيل هذا الخيار، لن يرى العميل أي تكاليف مادية (سيتم إخفاء أسعار الوحدات، المجاميع للأقسام، والإجمالي الكلي).
              </p>
            </div>
            <button
              disabled={!canEdit}
              onClick={() => handleSettingChange('showPrices', !showPrices)}
              className="p-1 text-slate-400 hover:text-white"
            >
              {showPrices ? (
                <Eye className="h-6 w-6 text-[#c5a880]" />
              ) : (
                <EyeOff className="h-6 w-6 text-slate-600" />
              )}
            </button>
          </div>

          {/* Option 2: Show/Hide detailed unit rates */}
          {showPrices && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1c24]/40 border border-[#222634] animate-in fade-in duration-200">
              <div className="max-w-md">
                <span className="block text-xs font-bold text-white mb-0.5">إظهار الأسعار التفصيلية للبنود (BOQ Detailed Rates)</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  في حال تعطيل هذا الخيار، سيرى العميل فقط "إجمالي التكلفة التقديرية للقسم" (مثال: إجمالي السباكة التأسيس) بدون رؤية تفاصيل ومصنعية كل بند ومحارة ودهان بمفرده.
                </p>
              </div>
              <button
                disabled={!canEdit}
                onClick={() => handleSettingChange('showDetailedPricing', !showDetailedPricing)}
                className="p-1 text-slate-400 hover:text-white"
              >
                {showDetailedPricing ? (
                  <Eye className="h-6 w-6 text-[#c5a880]" />
                ) : (
                  <EyeOff className="h-6 w-6 text-slate-600" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced admin options */}
      {canEdit && (
        <div className="rounded-xl border border-rose-950/30 bg-rose-950/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-md">
            <span className="block text-xs font-bold text-rose-400 mb-0.5">خيارات أمنية متقدمة</span>
            <p className="text-[10px] text-slate-400 leading-normal">
              إعادة توليد المعرف العشوائي للرابط لتأمين المستند وإبطال صلاحية الرابط الحالي الموزع للعملاء.
            </p>
          </div>
          <button
            disabled={regenerating}
            onClick={handleRegenerateToken}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-rose-400 hover:bg-rose-950/20 hover:border-rose-900 transition shrink-0"
          >
            {regenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin text-rose-400" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            تجديد رابط المشاركة
          </button>
        </div>
      )}

    </div>
  );
}
