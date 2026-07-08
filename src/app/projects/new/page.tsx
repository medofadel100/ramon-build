'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createProject } from '@/lib/project-service';
import Navbar from '@/components/Navbar';
import { ChevronLeft, ChevronRight, Save, Trash2, Plus, Info, LayoutGrid, CheckCircle } from 'lucide-react';

interface ZoneInput {
  name: string;
  floorArea: number;
  perimeter: number;
  height: number;
  deductions: number;
}

export default function NewProjectWizard() {
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const router = useRouter();

  // Wizard Step State
  const [step, setStep] = useState(1);
  const [loadingSeed, setLoadingSeed] = useState(false);

  // Form State - Step 1: Basic Info
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [designCode, setDesignCode] = useState('الكود المصري للتشطيبات');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [addressDetails, setAddressDetails] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'draft' | 'review'>('draft');

  // Form State - Step 2: Project Type Wizard Options
  const [workType, setWorkType] = useState<'new_build' | 'finishing_only' | 'renovation'>('finishing_only');
  const [hasArchModification, setHasArchModification] = useState(false);
  const [foundationType, setFoundationType] = useState<'full' | 'partial' | 'none'>('full');

  // Form State - Step 3: Areas/Zones
  const [zones, setZones] = useState<ZoneInput[]>([
    { name: 'ريسبشن', floorArea: 35, perimeter: 24, height: 3.0, deductions: 4.5 },
    { name: 'غرفة نوم رئيسية', floorArea: 16, perimeter: 16, height: 3.0, deductions: 2.8 },
    { name: 'مطبخ', floorArea: 10, perimeter: 13, height: 3.0, deductions: 2.2 },
    { name: 'حمام رئيسي', floorArea: 6, perimeter: 10, height: 3.0, deductions: 1.5 }
  ]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  // Quick Room templates
  const addRoomTemplate = (type: string) => {
    let newRoom: ZoneInput;
    switch (type) {
      case 'reception':
        newRoom = { name: `ريسبشن ${zones.filter(z => z.name.includes('ريسبشن')).length + 1}`, floorArea: 30, perimeter: 22, height: 3.0, deductions: 4.0 };
        break;
      case 'bedroom':
        newRoom = { name: `غرفة نوم ${zones.filter(z => z.name.includes('غرفة نوم')).length + 1}`, floorArea: 15, perimeter: 16, height: 3.0, deductions: 2.5 };
        break;
      case 'kitchen':
        newRoom = { name: `مطبخ ${zones.filter(z => z.name.includes('مطبخ')).length + 1}`, floorArea: 9, perimeter: 12, height: 3.0, deductions: 2.0 };
        break;
      case 'bathroom':
        newRoom = { name: `حمام ${zones.filter(z => z.name.includes('حمام')).length + 1}`, floorArea: 5, perimeter: 9, height: 3.0, deductions: 1.2 };
        break;
      default:
        newRoom = { name: 'فضاء جديد', floorArea: 12, perimeter: 14, height: 3.0, deductions: 2.0 };
    }
    setZones([...zones, newRoom]);
  };

  const handleZoneChange = (index: number, field: keyof ZoneInput, value: any) => {
    const updated = [...zones];
    if (field === 'name') {
      updated[index].name = value;
    } else {
      updated[index][field] = Number(value) || 0;
    }
    setZones(updated);
  };

  const deleteZone = (index: number) => {
    setZones(zones.filter((_, idx) => idx !== index));
  };

  const addCustomZone = () => {
    setZones([...zones, { name: 'غرفة جديدة', floorArea: 12, perimeter: 14, height: 3.0, deductions: 2.0 }]);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!name || !ownerName || !ownerPhone) {
        alert('يرجى ملء البيانات الأساسية للمشروع');
        return;
      }
    }
    if (step === 3 && zones.length === 0) {
      alert('يجب إضافة مساحة واحدة على الأقل للمشروع');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleCreateProject = async () => {
    if (!user) return;
    setLoadingSeed(true);
    try {
      const projectId = await createProject(
        {
          name,
          ownerName,
          ownerPhone,
          designCode,
          governorate,
          addressDetails,
          issueDate,
          projectType: {
            workType,
            hasArchModification,
            foundationType
          }
        },
        zones,
        user.uid,
        user.name,
        user.email,
        'other',
        user.jobTitle || 'مدير المشروع'
      );
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      console.error(err);
      alert(`حدث خطأ أثناء إنشاء المشروع وتسكين البنود: ${err.message || err.code || err}`);
      setLoadingSeed(false);
    }
  };

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'المنوفية', 
    'الغربية', 'البحيرة', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'كفر الشيخ', 
    'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 
    'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'
  ];

  if (loadingAuth || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-cairo select-none">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        
        {/* Progress Stepper Stepper */}
        <div className="flex justify-between items-center max-w-md mx-auto mb-10">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
              step >= 1 ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground bg-card'
            }`}>1</div>
            <span className={`text-[11px] font-semibold ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>بيانات المشروع</span>
          </div>
          <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-accent'}`}></div>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
              step >= 2 ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground bg-card'
            }`}>2</div>
            <span className={`text-[11px] font-semibold ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>نوع العمل والتأسيس</span>
          </div>
          <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-accent'}`}></div>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
              step >= 3 ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground bg-card'
            }`}>3</div>
            <span className={`text-[11px] font-semibold ${step >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>المساحات والحيّز</span>
          </div>
        </div>

        {/* Loading Seeding Overlay Seeding */}
        {loadingSeed ? (
          <div className="flex flex-col items-center justify-center py-20 border border-border rounded-2xl bg-card shadow-2xl gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <h2 className="text-xl font-bold text-foreground">جاري إنشاء المشروع وتسكين البنود...</h2>
            <p className="text-sm text-muted-foreground max-w-sm text-center">
              نقوم حالياً ببناء شجرة البنود والأقسام الافتراضية المناسبة لخيارات التعديل والتأسيس، وحساب مساحات الحوائط الأولية.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-2xl bg-card p-6 sm:p-8 shadow-2xl">
            
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">بيانات المشروع الأساسية</h2>
                  <p className="text-xs text-muted-foreground">أدخل المعرفات الفنية وتفاصيل المالك لإدراجها في ترويسة التقارير وعقود التنفيذ.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">اسم المشروع *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: شقة م. أحمد - التجمع الخامس"
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                    />
                  </div>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">اسم المالك *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="اسم العميل الكامل"
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                    />
                  </div>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">رقم تليفون المالك * (مع كود الدولة - بدون +)</label>
                    <input
                      type="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="مثال: 01012345678"
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                    />
                  </div>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">كود التصميم المرجعي</label>
                    <select
                      value={designCode}
                      onChange={(e) => setDesignCode(e.target.value)}
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                    >
                      <option value="الكود المصري للتشطيبات">الكود المصري للتشطيبات (ECP)</option>
                      <option value="كود البناء السعودي (SBC)">كود البناء السعودي (SBC)</option>
                      <option value="كود البناء الإماراتي">كود البناء الإماراتي (UAE UBC)</option>
                      <option value="كود البناء القطري (QCS)">كود البناء القطري (QCS)</option>
                      <option value="كود البناء الكويتي (MEW)">كود البناء الكويتي (MEW)</option>
                      <option value="كودات دولية عامة (IBC/UPC)">كودات دولية عامة (IBC/UPC)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">الموقع / المحافظة *</label>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                    >
                      {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">تفاصيل العنوان والموقع</label>
                    <input
                      type="text"
                      value={addressDetails}
                      onChange={(e) => setAddressDetails(e.target.value)}
                      placeholder="الحي، المربع السكني، رقم العمارة/الفيلا"
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-foreground placeholder-slate-600 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                    />
                  </div>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">تاريخ الإصدار</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-right text-xs font-semibold text-muted-foreground mb-1.5">حالة المستند الابتدائية</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-4 py-2.5 text-right text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
                    >
                      <option value="draft">مسودة داخلية</option>
                      <option value="review">تحت المراجعة والاعتماد</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Project Type & Seeding Rules */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">نوع المشروع وخيارات التأسيس</h2>
                  <p className="text-xs text-muted-foreground">تحدد هذه الخيارات بنود المحاكاة والتأسيس والهدم التي سيتم إضافتها تلقائيًا لشجرة المشروع.</p>
                </div>

                <div className="space-y-5">
                  {/* Q1: Work Type */}
                  <div className="rounded-xl bg-[#1a1c24] border border-border p-5">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      ١. نوع العمل (Work Type)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setWorkType('new_build')}
                        className={`p-4 rounded-lg text-right border transition ${
                          workType === 'new_build' 
                            ? 'bg-primary/10 border-primary text-foreground' 
                            : 'border-border bg-card text-muted-foreground hover:border-slate-700'
                        }`}
                      >
                        <h4 className="font-bold text-sm">إنشاء جديد كامل</h4>
                        <p className="text-[10px] mt-1 leading-normal">تأسيس خرسانات ومباني وتشطيب متكامل من الصفر (Core & Shell)</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkType('finishing_only')}
                        className={`p-4 rounded-lg text-right border transition ${
                          workType === 'finishing_only' 
                            ? 'bg-primary/10 border-primary text-foreground' 
                            : 'border-border bg-card text-muted-foreground hover:border-slate-700'
                        }`}
                      >
                        <h4 className="font-bold text-sm">تشطيب فقط</h4>
                        <p className="text-[10px] mt-1 leading-normal">المبنى قائم على الطوب الأحمر، والتأسيس والتشطيب يبدأ من الصفر</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkType('renovation')}
                        className={`p-4 rounded-lg text-right border transition ${
                          workType === 'renovation' 
                            ? 'bg-primary/10 border-primary text-foreground' 
                            : 'border-border bg-card text-muted-foreground hover:border-slate-700'
                        }`}
                      >
                        <h4 className="font-bold text-sm">تجديد / تشطيب جزئي</h4>
                        <p className="text-[10px] mt-1 leading-normal">ترميم وتعديل لعقار قائم، يشمل فك/هدم بنود قديمة وتركيب بدائل جديدة</p>
                      </button>
                    </div>
                  </div>

                  {/* Q2: Has architectural modification */}
                  <div className="rounded-xl bg-[#1a1c24] border border-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="max-w-md">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                        <Info className="h-4 w-4 text-primary" />
                        ٢. هل يوجد تعديل معماري؟
                      </h3>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        يتيح هذا الخيار تفعيل قسم "أعمال الهدم والمباني" بالكامل (هدم حوائط قائمة، نقل ردم ومخلفات، وبناء جدران بديلة).
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHasArchModification(true)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                          hasArchModification 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'border-border bg-card text-muted-foreground hover:border-slate-700'
                        }`}
                      >
                        نعم
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasArchModification(false)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                          !hasArchModification 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'border-border bg-card text-muted-foreground hover:border-slate-700'
                        }`}
                      >
                        لا
                      </button>
                    </div>
                  </div>

                  {/* Q3: Foundation Type */}
                  <div className="rounded-xl bg-[#1a1c24] border border-border p-5">
                    <h3 className="text-sm font-bold text-foreground mb-2">٣. متطلبات تأسيسات السباكة والكهرباء</h3>
                    <p className="text-[10px] text-muted-foreground mb-4">اختر ما إذا كان المشروع يتطلب شبكة أنابيب وكابلات جديدة بالكامل أم تعديلات خفيفة.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFoundationType('full')}
                        className={`p-3 rounded-lg text-center border text-xs font-semibold transition ${
                          foundationType === 'full' 
                            ? 'bg-primary/10 border-primary text-foreground' 
                            : 'border-border bg-card text-muted-foreground hover:border-slate-700'
                        }`}
                      >
                        تأسيس كامل جديد بالكامل
                      </button>
                      <button
                        type="button"
                        onClick={() => setFoundationType('partial')}
                        className={`p-3 rounded-lg text-center border text-xs font-semibold transition ${
                          foundationType === 'partial' 
                            ? 'bg-primary/10 border-primary text-foreground' 
                            : 'border-border bg-card text-muted-foreground hover:border-slate-700'
                        }`}
                      >
                        تعديل وإضافة على شبكة قائمة
                      </button>
                      <button
                        type="button"
                        onClick={() => setFoundationType('none')}
                        className={`p-3 rounded-lg text-center border text-xs font-semibold transition ${
                          foundationType === 'none' 
                            ? 'bg-primary/10 border-primary text-foreground' 
                            : 'border-border bg-card text-muted-foreground hover:border-slate-700'
                        }`}
                      >
                        بدون تأسيس (تشطيب فوق القائم)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Areas/Zones Configuration */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">تعريف المساحات والحيّز (Areas/Zones)</h2>
                  <p className="text-xs text-muted-foreground">أضف الغرف والحيّزات المكونة للموقع. تُستخدم هذه الأبعاد في الحساب التلقائي لكميات المحارة، الأرضيات، والدهان.</p>
                </div>

                {/* Templates Helper */}
                <div className="bg-[#1a1c24] border border-border p-4 rounded-xl">
                  <span className="block text-right text-xs font-semibold text-muted-foreground mb-2.5">إضافة سريعة من القوالب:</span>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => addRoomTemplate('reception')}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-secondary-foreground hover:text-[#c5a880] hover:border-[#c5a880]/50 transition flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      + ريسبشن (٣٠ م²)
                    </button>
                    <button
                      type="button"
                      onClick={() => addRoomTemplate('bedroom')}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-secondary-foreground hover:text-[#c5a880] hover:border-[#c5a880]/50 transition flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      + غرفة نوم (١٥ م²)
                    </button>
                    <button
                      type="button"
                      onClick={() => addRoomTemplate('kitchen')}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-secondary-foreground hover:text-[#c5a880] hover:border-[#c5a880]/50 transition flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      + مطبخ (٩ م²)
                    </button>
                    <button
                      type="button"
                      onClick={() => addRoomTemplate('bathroom')}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-secondary-foreground hover:text-[#c5a880] hover:border-[#c5a880]/50 transition flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      + حمام (٥ م²)
                    </button>
                  </div>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto border border-border rounded-xl bg-card">
                  <table className="w-full text-right text-xs font-medium">
                    <thead className="bg-[#1a1c24] text-muted-foreground border-b border-border font-bold">
                      <tr>
                        <th className="p-3 text-right">اسم الغرفة/المساحة</th>
                        <th className="p-3 text-center">الأرضية (م²)</th>
                        <th className="p-3 text-center">المحيط (م.ط)</th>
                        <th className="p-3 text-center">الارتفاع (م)</th>
                        <th className="p-3 text-center">خصم أبواب/شبابيك (م²)</th>
                        <th className="p-3 text-center bg-primary/5 text-primary">الحوائط المحسوبة (م²)</th>
                        <th className="p-3 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222634] text-secondary-foreground">
                      {zones.map((zone, idx) => {
                        const calculatedWall = (zone.perimeter * zone.height) - zone.deductions;
                        return (
                          <tr key={idx} className="hover:bg-slate-900/40 transition">
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={zone.name}
                                onChange={(e) => handleZoneChange(idx, 'name', e.target.value)}
                                className="w-full bg-[#1a1c24] border border-transparent hover:border-slate-700 focus:border-[#c5a880] rounded px-2 py-1 text-right text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                step="any"
                                value={zone.floorArea}
                                onChange={(e) => handleZoneChange(idx, 'floorArea', e.target.value)}
                                className="w-16 bg-[#1a1c24] border border-transparent hover:border-slate-700 focus:border-[#c5a880] rounded px-2 py-1 text-center text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                step="any"
                                value={zone.perimeter}
                                onChange={(e) => handleZoneChange(idx, 'perimeter', e.target.value)}
                                className="w-16 bg-[#1a1c24] border border-transparent hover:border-slate-700 focus:border-[#c5a880] rounded px-2 py-1 text-center text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                step="any"
                                value={zone.height}
                                onChange={(e) => handleZoneChange(idx, 'height', e.target.value)}
                                className="w-16 bg-[#1a1c24] border border-transparent hover:border-slate-700 focus:border-[#c5a880] rounded px-2 py-1 text-center text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                step="any"
                                value={zone.deductions}
                                onChange={(e) => handleZoneChange(idx, 'deductions', e.target.value)}
                                className="w-16 bg-[#1a1c24] border border-transparent hover:border-slate-700 focus:border-[#c5a880] rounded px-2 py-1 text-center text-xs text-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 text-center bg-primary/5 text-primary font-bold">
                              {calculatedWall > 0 ? calculatedWall.toFixed(1) : 0}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => deleteZone(idx)}
                                className="p-1.5 rounded hover:bg-slate-800 text-rose-500 hover:text-rose-400 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={addCustomZone}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground hover:text-[#c5a880] transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة مساحة مخصصة
                  </button>
                  <div className="text-left text-xs text-muted-foreground font-semibold">
                    إجمالي مساحات الأرضية: <span className="text-foreground text-sm font-bold">{zones.reduce((acc, z) => acc + z.floorArea, 0)}</span> م²
                  </div>
                </div>
              </div>
            )}

            {/* Nav controls */}
            <div className="flex justify-between mt-8 border-t border-border pt-5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-secondary-foreground bg-muted border border-border rounded-lg hover:bg-slate-800 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:brightness-110 active:scale-95 transition"
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateProject}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-primary-foreground bg-gradient-to-r from-[#c5a880] to-[#e5c595] rounded-lg shadow hover:brightness-110 active:scale-95 transition"
                >
                  <CheckCircle className="h-4 w-4" />
                  إنشاء المشروع وتسكين البنود
                </button>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
