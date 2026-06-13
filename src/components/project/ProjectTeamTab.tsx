'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { generateEngineerInviteToken, removeEngineerFromProject, AssignedEngineer } from '@/lib/project-service';
import { Users, UserPlus, Copy, CheckCircle, Trash2, Shield, Wrench, Zap, Paintbrush, Building2, Ruler, HardHat, Edit2, Save, X } from 'lucide-react';

const SPECIALTIES: { value: AssignedEngineer['specialty']; label: string; icon: any }[] = [
  { value: 'electrical', label: 'مهندس كهرباء', icon: Zap },
  { value: 'mechanical', label: 'مهندس ميكانيكا', icon: Wrench },
  { value: 'civil', label: 'مهندس إنشائي / مدني', icon: Building2 },
  { value: 'interior_design', label: 'مهندس تصميم داخلي', icon: Paintbrush },
  { value: 'finishing_supervisor', label: 'مشرف تشطيبات', icon: HardHat },
  { value: 'structural', label: 'مهندس إنشائي', icon: Ruler },
  { value: 'other', label: 'أخرى', icon: Shield }
];

export default function ProjectTeamTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateHeader = useProjectStore((state) => state.updateHeader);
  const user = useAuthStore((state) => state.user);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<AssignedEngineer['specialty']>('electrical');
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');
  const engineers = currentProject.header.engineersDetails || [];

  // Edit Engineer State
  const [editingEngineer, setEditingEngineer] = useState<AssignedEngineer | null>(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState<AssignedEngineer['specialty']>('other');

  // Manual Add State
  const [inviteMode, setInviteMode] = useState<'link' | 'manual'>('link');
  const [manualName, setManualName] = useState('');

  const handleGenerateInvite = async () => {
    if (!currentProject) return;
    setGenerating(true);
    try {
      const spec = SPECIALTIES.find(s => s.value === selectedSpecialty);
      const token = await generateEngineerInviteToken(
        currentProject.id,
        selectedSpecialty,
        spec?.label || 'مهندس'
      );
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      setGeneratedLink(`${baseUrl}/invite/${currentProject.id}/${token}`);
    } catch (err) {
      console.error('Failed to generate invite:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleRemoveEngineer = async (engineerUid: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا المهندس من المشروع؟')) return;
    try {
      await removeEngineerFromProject(currentProject.id, engineerUid);
      const updatedEngineers = currentProject.header.assignedEngineers.filter(uid => uid !== engineerUid);
      const updatedDetails = engineers.filter(e => e.uid !== engineerUid);
      await updateHeader({
        assignedEngineers: updatedEngineers,
        engineersDetails: updatedDetails
      });
    } catch (err) {
      console.error('Failed to remove engineer:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEngineer || !editName.trim()) return;
    const updatedDetails = engineers.map(eng => {
      if (eng.uid === editingEngineer.uid) {
        const spec = SPECIALTIES.find(s => s.value === editSpecialty);
        return {
          ...eng,
          name: editName,
          specialty: editSpecialty,
          specialtyLabel: spec?.label || eng.specialtyLabel
        };
      }
      return eng;
    });
    
    await updateHeader({ engineersDetails: updatedDetails });
    setEditingEngineer(null);
  };

  const handleManualAdd = async () => {
    if (!manualName.trim()) return;
    const spec = SPECIALTIES.find(s => s.value === selectedSpecialty);
    const fakeUid = `manual_${Date.now()}`;
    
    const newEngineer: AssignedEngineer = {
      uid: fakeUid,
      name: manualName,
      email: '',
      specialty: selectedSpecialty,
      specialtyLabel: spec?.label || 'مهندس',
      joinedAt: new Date().toISOString()
    };

    await updateHeader({
      assignedEngineers: [...currentProject.header.assignedEngineers, fakeUid],
      engineersDetails: [...engineers, newEngineer]
    });
    
    setShowInviteModal(false);
    setManualName('');
  };

  const getSpecialtyIcon = (specialty: string) => {
    const spec = SPECIALTIES.find(s => s.value === specialty);
    const Icon = spec?.icon || Shield;
    return <Icon className="h-4 w-4" />;
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case 'electrical': return 'text-amber-400 bg-amber-950/40 border-amber-800/50';
      case 'mechanical': return 'text-blue-400 bg-blue-950/40 border-blue-800/50';
      case 'civil': return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50';
      case 'interior_design': return 'text-purple-400 bg-purple-950/40 border-purple-800/50';
      case 'finishing_supervisor': return 'text-orange-400 bg-orange-950/40 border-orange-800/50';
      case 'structural': return 'text-teal-400 bg-teal-950/40 border-teal-800/50';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 font-cairo select-none">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#c5a880]" />
            فريق العمل والمهندسين
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">المهندسين المُعيَّنين على هذا المشروع وتخصصاتهم.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setShowInviteModal(true); setGeneratedLink(''); setInviteMode('link'); setManualName(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition"
          >
            <UserPlus className="h-4 w-4" />
            إضافة مهندس للمشروع
          </button>
        )}
      </div>

      {/* Consultant Name Display */}
      <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-[#c5a880]" />
          <span className="text-xs font-bold text-slate-400">المهندس الاستشاري</span>
        </div>
        <p className="text-sm font-bold text-white">
          {currentProject.header.consultantName || 'لم يتم تحديده بعد (يمكنك إضافته من تاب ملف المشروع)'}
        </p>
      </div>

      {/* Engineers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {engineers.map((eng, idx) => {
          const isEditing = editingEngineer?.uid === eng.uid;
          
          if (isEditing) {
            return (
              <div key={eng.uid || idx} className="rounded-xl border border-[#c5a880] bg-[#1a1c24] p-5 shadow-lg">
                <div className="space-y-3">
                  <div>
                    <label className="block text-right text-[10px] font-semibold text-slate-400 mb-1">اسم المهندس</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-md border border-[#222634] bg-[#13151c] px-3 py-1.5 text-xs text-white focus:border-[#c5a880] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-right text-[10px] font-semibold text-slate-400 mb-1">تخصص المهندس</label>
                    <select
                      value={editSpecialty}
                      onChange={(e) => setEditSpecialty(e.target.value as AssignedEngineer['specialty'])}
                      className="w-full rounded-md border border-[#222634] bg-[#13151c] px-3 py-1.5 text-xs text-white focus:border-[#c5a880] focus:outline-none"
                    >
                      {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setEditingEngineer(null)} className="px-3 py-1.5 rounded bg-slate-900 text-slate-400 hover:text-white text-[10px] font-bold">إلغاء</button>
                    <button onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#c5a880] text-[#0d0e12] text-[10px] font-bold hover:brightness-110">
                      <Save className="h-3.5 w-3.5" /> حفظ
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={eng.uid || idx}
              className="rounded-xl border border-[#222634] bg-[#13151c] p-5 hover:border-[#c5a880]/30 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${getSpecialtyColor(eng.specialty)}`}>
                  {getSpecialtyIcon(eng.specialty)}
                  {eng.specialtyLabel}
                </div>
                {canEdit && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEditingEngineer(eng);
                        setEditName(eng.name);
                        setEditSpecialty(eng.specialty);
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="تعديل بيانات المهندس"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {engineers.length > 1 && (
                      <button
                        onClick={() => handleRemoveEngineer(eng.uid)}
                        className="p-1 rounded hover:bg-slate-800 text-rose-500/60 hover:text-rose-400 transition"
                        title="إزالة من المشروع"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <h4 className="text-sm font-bold text-white">{eng.name}</h4>
              {eng.email && <p className="text-xs text-slate-400 mt-0.5">{eng.email}</p>}
              <p className="text-[10px] text-slate-500 mt-2">
                انضم: {new Date(eng.joinedAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          );
        })}

        {engineers.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-[#222634] rounded-xl bg-[#13151c]/40">
            <Users className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">لا يوجد مهندسين معينين حالياً</p>
            <p className="text-xs text-slate-500 mt-1">استخدم زر "دعوة مهندس جديد" لإضافة أعضاء الفريق</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-[#222634] bg-[#13151c] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">إضافة مهندس للمشروع</h3>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setInviteMode('link')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${
                  inviteMode === 'link' ? 'bg-[#c5a880]/10 border-[#c5a880] text-[#c5a880]' : 'border-[#222634] text-slate-400 hover:text-white'
                }`}
              >
                توليد رابط دعوة
              </button>
              <button
                onClick={() => setInviteMode('manual')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${
                  inviteMode === 'manual' ? 'bg-[#c5a880]/10 border-[#c5a880] text-[#c5a880]' : 'border-[#222634] text-slate-400 hover:text-white'
                }`}
              >
                إضافة يدوية مباشرة
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-right text-xs font-semibold text-slate-400 mb-2">اختر التخصص / الدور</label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.map(spec => {
                    const SpecIcon = spec.icon;
                    return (
                      <button
                        key={spec.value}
                        onClick={() => setSelectedSpecialty(spec.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                          selectedSpecialty === spec.value
                            ? 'bg-[#c5a880]/10 border-[#c5a880] text-white'
                            : 'border-slate-800 bg-[#1a1c24] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <SpecIcon className="h-3.5 w-3.5" />
                        {spec.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {inviteMode === 'manual' ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-right text-xs font-semibold text-slate-400">اسم المهندس</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="اكتب اسم المهندس..."
                    className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-4 py-2.5 text-xs text-white text-right focus:border-[#c5a880] focus:outline-none"
                  />
                  <button
                    onClick={handleManualAdd}
                    disabled={!manualName.trim()}
                    className="w-full py-2.5 mt-2 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition disabled:opacity-50"
                  >
                    إضافة المهندس فوراً
                  </button>
                </div>
              ) : (
                <>
                  {!generatedLink && (
                    <button
                      onClick={handleGenerateInvite}
                      disabled={generating}
                      className="w-full py-2.5 mt-2 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition disabled:opacity-50"
                    >
                      {generating ? 'جاري التوليد...' : 'توليد رابط الدعوة'}
                    </button>
                  )}

                  {generatedLink && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-right text-xs font-semibold text-slate-400">رابط الدعوة (أرسله للمهندس للتسجيل بنفسه)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedLink}
                          className="flex-1 rounded-lg border border-[#222634] bg-[#1a1c24] px-3 py-2 text-xs text-white text-left direction-ltr"
                          dir="ltr"
                        />
                        <button
                          onClick={handleCopyLink}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                            linkCopied
                              ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {linkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 text-right">
                        هذا الرابط صالح لاستخدام واحد فقط. عند فتحه سيتم إضافة المهندس تلقائياً للمشروع.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
