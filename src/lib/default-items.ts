export interface SectionTemplate {
  id: string;
  sectionKey: string;
  title: string;
  applicableTo: ('new_build' | 'finishing_only' | 'renovation')[];
  requiresArchModification?: boolean;
}

export interface SpecFieldTemplate {
  key: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'color' | 'checkbox' | 'material_selector';
  options?: string[];
  materialGroup?: string;
  materialSubgroup?: string;
  unit?: string;
  defaultValue?: any;
}

export interface CodeReferences {
  egyptian?: string;
  saudiSBC?: string;
  uaeUBC?: string;
  kuwaitMEW?: string;
  qatarQCS?: string;
}

export interface ItemTemplate {
  id: string;
  sectionId: string;
  title: string;
  unit: string;
  quantitySource: 'manual' | 'calculated';
  calculationFormula?: string;
  requiresArchModification?: boolean;
  perAreaOverride?: boolean;
  specs: SpecFieldTemplate[];
  defaultPricing: {
    mode: 'materials_labor_split' | 'lump_sum' | 'daily_rate';
    materialUnitPrice: number;
    laborUnitPrice: number;
    lumpSumPrice: number;
    dailyRate: number;
    estimatedDays: number;
  };
  /** @deprecated Use codeReferences instead */
  egyptianCodeRef?: string;
  codeReferences?: CodeReferences;
}

export const DEFAULT_SECTIONS: SectionTemplate[] = [
  { id: '1.1', sectionKey: 'demolition', title: 'أعمال الهدم والمباني (التعديل المعماري)', applicableTo: ['new_build', 'finishing_only', 'renovation'], requiresArchModification: true },
  { id: '1.2', sectionKey: 'plumbing_foundation', title: 'تأسيس السباكة', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '1.3', sectionKey: 'electrical_foundation', title: 'تأسيس الكهرباء والتيار الخفيف', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '1.4', sectionKey: 'carpentry_frames', title: 'النجارة البدائية (تركيب الحلوق)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '1.5', sectionKey: 'plastering', title: 'أعمال المحارة / اللياسة (حلقة الوصل)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.1', sectionKey: 'gypsum_ceiling', title: 'الأسقف المعلقة (الجبسوم بورد)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.2', sectionKey: 'wall_floor_cladding_prep', title: 'أعمال الأرضيات والحوائط (التكسيات - التجهيز)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.3', sectionKey: 'first_paint', title: 'مرحلة الدهانات (المرحلة الأولى)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.4', sectionKey: 'carpentry_aluminum', title: 'النجارة والألومنيوم (التركيبات الظاهرية)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.5', sectionKey: 'wall_cladding', title: 'بند التجليدات للحوائط ونوعها', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.6', sectionKey: 'kitchen_cabinets', title: 'بند كباين المطابخ', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.7', sectionKey: 'kitchen_countertop', title: 'بند رخامة المطبخ أو الجرانيت', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.8', sectionKey: 'electrical_finishing', title: 'التشطيبات الكهربائية (النهائية)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.9', sectionKey: 'sanitary_finishing', title: 'التشطيبات الصحية (النهائية)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.10', sectionKey: 'final_paint', title: 'الوجه النهائي للدهانات', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '2.11', sectionKey: 'flooring', title: 'تركيب الأرضيات (سيراميك/بورسلين/HDF/SPC)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '3.1', sectionKey: 'hvac', title: 'أعمال التكييف والتبريد (HVAC)', applicableTo: ['new_build', 'finishing_only', 'renovation'] },
  { id: '3.2', sectionKey: 'exhaust_ventilation', title: 'الشفاطات والتهوية الميكانيكية', applicableTo: ['new_build', 'finishing_only', 'renovation'] }
];

export const DEFAULT_ITEMS: ItemTemplate[] = [
  // 1.1 أعمال الهدم والمباني
  {
    id: '1.1.1',
    sectionId: '1.1',
    title: 'هدم حوائط طوب طفلي/أحمر',
    unit: 'م²',
    quantitySource: 'manual',
    requiresArchModification: true,
    specs: [
      { key: 'wallThickness', label: 'سمك الحائط', type: 'select', options: ['12 سم', '25 سم'], defaultValue: '12 سم' },
      { key: 'brickType', label: 'نوع الطوب القديم', type: 'select', options: ['أحمر طفلي', 'خفان', 'طوب مصمت'], defaultValue: 'أحمر طفلي' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 0, laborUnitPrice: 45, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 },
    egyptianCodeRef: 'كود أعمال الهدم والترميم'
  },
  {
    id: '1.1.2',
    sectionId: '1.1',
    title: 'هدم أرضيات/تكسيات قديمة',
    unit: 'م²',
    quantitySource: 'manual',
    requiresArchModification: true,
    specs: [
      { key: 'claddingType', label: 'نوع التكسية القديمة', type: 'select', options: ['سيراميك', 'بورسلين', 'رخام', 'باركيه'], defaultValue: 'سيراميك' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 0, laborUnitPrice: 35, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },
  {
    id: '1.1.3',
    sectionId: '1.1',
    title: 'بناء حوائط جديدة',
    unit: 'م²',
    quantitySource: 'manual',
    requiresArchModification: true,
    specs: [
      { key: 'brickType', label: 'نوع الطوب', type: 'select', options: ['أحمر مفرغ', 'أحمر مصمت', 'خفان', 'بلوك أسمنتي'], defaultValue: 'أحمر مفرغ' },
      { key: 'wallThickness', label: 'سمك الحائط', type: 'select', options: ['12 سم', '20 سم', '25 سم'], defaultValue: '12 سم' },
      { key: 'mortarRatio', label: 'نسبة الأسمنت للمونة', type: 'select', options: ['1:4 (350 كجم)', '1:5 (300 كجم)'], defaultValue: '1:4 (350 كجم)' },
      { key: 'bricksPrice', label: 'نوع الطوب المستخدم', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'masonry', defaultValue: 'price_brick_1000' },
      { key: 'cementBagPrice', label: 'نوع الأسمنت المستخدم', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'general', defaultValue: 'price_cement_bag' },
      { key: 'sandCubicPrice', label: 'نوع الرمل المستخدم', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'general', defaultValue: 'price_sand_m3' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 85, laborUnitPrice: 60, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 },
    egyptianCodeRef: 'كود مباني الطوب - الجزء الرابع'
  },
  {
    id: '1.1.4',
    sectionId: '1.1',
    title: 'نقل المخلفات والردم خارج الموقع',
    unit: 'م³',
    quantitySource: 'calculated', // will be calculated manually or from debris volume
    requiresArchModification: true,
    specs: [
      { key: 'truckCapacity', label: 'سعة عربة النقل', type: 'select', options: ['4 م³', '10 م³', '20 م³'], defaultValue: '4 م³' },
      { key: 'expansionFactor', label: 'معامل انتفاش الردم', type: 'number', defaultValue: 1.2 }
    ],
    defaultPricing: { mode: 'lump_sum', materialUnitPrice: 0, laborUnitPrice: 0, lumpSumPrice: 1200, dailyRate: 0, estimatedDays: 1 }
  },

  // 1.2 تأسيس السباكة
  {
    id: '1.2.1',
    sectionId: '1.2',
    title: 'مواسير صرف صحي رئيسية',
    unit: 'متر طولي',
    quantitySource: 'manual',
    specs: [
      { key: 'diameter', label: 'القطر', type: 'select', options: ['4 بوصة', '6 بوصة'], defaultValue: '4 بوصة' },
      { key: 'pipePrice', label: 'مواسير PVC المستخدمة', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'plumbing', defaultValue: 'price_pvc_pipe_4' },
      { key: 'pipeLength', label: 'طول الماسورة الواحدة (متر)', type: 'number', defaultValue: 4 },
      { key: 'fittingsPercent', label: 'نسبة الإكسسوارات من المواسير (%)', type: 'number', defaultValue: 15 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 110, laborUnitPrice: 50, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 },
    egyptianCodeRef: 'كود التركيبات الصحية - الصرف الخارجي'
  },
  {
    id: '1.2.2',
    sectionId: '1.2',
    title: 'مواسير تغذية مياه بارد/سخن',
    unit: 'متر طولي',
    quantitySource: 'manual',
    specs: [
      { key: 'diameter', label: 'القطر', type: 'select', options: ['3/4 بوصة', '1 بوصة'], defaultValue: '3/4 بوصة' },
      { key: 'pipePrice', label: 'مواسير التغذية المستخدمة', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'plumbing', defaultValue: 'price_ppr_pipe_3_4' },
      { key: 'pipeLength', label: 'طول الماسورة الواحدة (متر)', type: 'number', defaultValue: 4 },
      { key: 'fittingsPercent', label: 'نسبة الإكسسوارات من المواسير (%)', type: 'number', defaultValue: 25 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 90, laborUnitPrice: 45, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 },
    egyptianCodeRef: 'كود تغذية المياه ومكافحة الحريق'
  },
  {
    id: '1.2.3',
    sectionId: '1.2',
    title: 'نقاط مياه صرف وتغذية (مطبخ / حمامات)',
    unit: 'عدد نقاط',
    quantitySource: 'manual',
    specs: [
      { key: 'useCase', label: 'الاستخدام', type: 'select', options: ['خلاط حوض', 'سيفون مدفون', 'غسالة ملابس', 'شاور شت شاور', 'غسالة أطباق'], defaultValue: 'خلاط حوض' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 180, laborUnitPrice: 120, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 3 }
  },
  {
    id: '1.2.4',
    sectionId: '1.2',
    title: 'اختبار ضغط الشبكة (Pressure Test)',
    unit: 'مقطوعية',
    quantitySource: 'manual',
    specs: [
      { key: 'testPressure', label: 'ضغط الاختبار (بار)', type: 'number', defaultValue: 15 },
      { key: 'durationHrs', label: 'مدة الضغط (ساعة)', type: 'number', defaultValue: 24 }
    ],
    defaultPricing: { mode: 'lump_sum', materialUnitPrice: 0, laborUnitPrice: 0, lumpSumPrice: 600, dailyRate: 0, estimatedDays: 1 }
  },
  {
    id: '1.2.5',
    sectionId: '1.2',
    title: 'عزل مائي أرضيات وحوائط (حمامات/مطابخ)',
    unit: 'م²',
    quantitySource: 'calculated',
    calculationFormula: 'total.floorArea',
    perAreaOverride: true,
    specs: [
      { key: 'insulationType', label: 'نوع العزل المائي', type: 'select', options: ['لفائف ممبرين (Membrane)', 'عزل أسمنتي دهان', 'عزل بيتومين ساخن', 'كيمابوكسي (Kemapoxy)'], defaultValue: 'عزل أسمنتي دهان' },
      { key: 'coatsCount', label: 'عدد الأوجه / الطبقات', type: 'number', defaultValue: 2 },
      { key: 'waterTestHrs', label: 'اختبار غمر بالماء (ساعة)', type: 'number', defaultValue: 48 },
      { key: 'protectionLayer', label: 'طبقة لياسة حماية (سكريد)', type: 'select', options: ['مطلوب', 'غير مطلوب'], defaultValue: 'مطلوب' },
      { key: 'membraneRollPrice', label: 'نوع الممبرين', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'plumbing', defaultValue: 'price_membrane_roll' },
      { key: 'cementCoatBagPrice', label: 'نوع العزل الأسمنتي', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'plumbing', defaultValue: 'price_cement_insulation_bag' },
      { key: 'protectionScreedPrice', label: 'سعر متر لياسة الحماية (خامات ج.م)', type: 'number', defaultValue: 30 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 65, laborUnitPrice: 45, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 3 },
    egyptianCodeRef: 'كود العزل المائي في المباني'
  },

  // 1.3 تأسيس الكهرباء والتيار الخفيف
  {
    id: '1.3.1',
    sectionId: '1.3',
    title: 'نقاط إنارة (مخارج سقف وحوائط)',
    unit: 'نقطة',
    quantitySource: 'calculated',
    calculationFormula: 'total.ceilingArea', // or manually overridden per area
    perAreaOverride: true,
    specs: [
      { key: 'wireGauge', label: 'سُمك السلك', type: 'select', options: ['1.5 مم السويدي', '2 مم السويدي'], defaultValue: '1.5 مم السويدي' },
      { key: 'lightType', label: 'نوع المخرج', type: 'select', options: ['إنارة سقف عادية', 'مخرج سبوت', 'مخرج إضاءة مخفية LED'], defaultValue: 'مخرج سبوت' },
      { key: 'wirePerPoint', label: 'سلك للنقطة (متر)', type: 'number', defaultValue: 10 },
      { key: 'rollLength', label: 'طول لفة السلك (متر)', type: 'number', defaultValue: 100 },
      { key: 'wireRollPrice', label: 'نوع السلك الرئيسي', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'electrical', defaultValue: 'price_wire_1_5_roll' },
      { key: 'boxPrice', label: 'سعر علبة الماجيك (ج.م)', type: 'number', defaultValue: 15 },
      { key: 'chassisPrice', label: 'سعر الشاسيه (ج.م)', type: 'number', defaultValue: 20 },
      { key: 'platePrice', label: 'سعر الوش (ج.م)', type: 'number', defaultValue: 25 },
      { key: 'switchPrice', label: 'سعر لقمة المفتاح (ج.م)', type: 'number', defaultValue: 35 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 45, laborUnitPrice: 35, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 },
    egyptianCodeRef: 'كود التركيبات الكهربائية في المباني السكنية'
  },
  {
    id: '1.3.2',
    sectionId: '1.3',
    title: 'نقاط بريز (فيش كهرباء)',
    unit: 'نقطة',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'socketType', label: 'شدة التيار والاستخدام', type: 'select', options: ['16 أمبير عادي', '20 أمبير تكييف/سخان', 'مزدوج للمطبخ'], defaultValue: '16 أمبير عادي' },
      { key: 'heightFromFloor', label: 'الارتفاع عن التشطيب (سم)', type: 'number', defaultValue: 45 },
      { key: 'wirePerPoint', label: 'سلك للنقطة (متر)', type: 'number', defaultValue: 15 },
      { key: 'rollLength', label: 'طول لفة السلك (متر)', type: 'number', defaultValue: 100 },
      { key: 'wireRollPrice', label: 'سعر لفة السلك (ج.م)', type: 'number', defaultValue: 1800 },
      { key: 'boxPrice', label: 'سعر علبة الماجيك (ج.م)', type: 'number', defaultValue: 15 },
      { key: 'chassisPrice', label: 'سعر الشاسيه (ج.م)', type: 'number', defaultValue: 20 },
      { key: 'platePrice', label: 'سعر الوش (ج.م)', type: 'number', defaultValue: 25 },
      { key: 'socketPerPoint', label: 'عدد اللقم لكل نقطة', type: 'number', defaultValue: 2 },
      { key: 'socketPrice', label: 'سعر لقمة البريزة (ج.م)', type: 'number', defaultValue: 45 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 55, laborUnitPrice: 40, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 }
  },
  {
    id: '1.3.3',
    sectionId: '1.3',
    title: 'لوحة التوزيع الرئيسية ومفاتيح الأمان',
    unit: 'عدد',
    quantitySource: 'manual',
    specs: [
      { key: 'linesCount', label: 'عدد الخطوط', type: 'select', options: ['12 خط', '18 خط', '24 خط', '36 خط'], defaultValue: '24 خط' },
      { key: 'breakerBrand', label: 'ماركة المفاتيح', type: 'select', options: ['شنايدر Schneider', 'هاجر Hager', 'ليجراند Legrand'], defaultValue: 'شنايدر Schneider' },
      { key: 'boardPrice', label: 'سعر اللوحة فارغة (ج.م)', type: 'number', defaultValue: 1200 },
      { key: 'breakersCount', label: 'عدد القواطع المعبأة', type: 'number', defaultValue: 24 },
      { key: 'breakerPrice', label: 'سعر القاطع الأوتوماتيك (ج.م)', type: 'number', defaultValue: 250 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 1200, laborUnitPrice: 350, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },
  {
    id: '1.3.4',
    sectionId: '1.3',
    title: 'تأسيس شبكة بيانات تيار خفيف (Data Network)',
    unit: 'نقطة',
    quantitySource: 'manual',
    specs: [
      { key: 'cableType', label: 'نوع الكابل', type: 'select', options: ['CAT6 UTP السويدي', 'CAT6A SFTP شيلد', 'مواسير فارغة فقط'], defaultValue: 'CAT6 UTP السويدي' },
      { key: 'rackProvision', label: 'تجهيز راك مركزي', type: 'select', options: ['نعم - 6U', 'نعم - 9U', 'لا يوجد'], defaultValue: 'لا يوجد' },
      { key: 'wirePerPoint', label: 'طول السلك للنقطة (متر)', type: 'number', defaultValue: 25 },
      { key: 'rollLength', label: 'طول لفة كابل الداتا (متر)', type: 'number', defaultValue: 305 },
      { key: 'dataRollPrice', label: 'سعر لفة الداتا (ج.م)', type: 'number', defaultValue: 3200 },
      { key: 'boxPrice', label: 'سعر علبة الماجيك (ج.م)', type: 'number', defaultValue: 15 },
      { key: 'chassisPrice', label: 'سعر الشاسيه (ج.م)', type: 'number', defaultValue: 20 },
      { key: 'platePrice', label: 'سعر الوش (ج.م)', type: 'number', defaultValue: 25 },
      { key: 'keystonePrice', label: 'سعر لقمة RJ45 (ج.م)', type: 'number', defaultValue: 80 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 140, laborUnitPrice: 80, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },

  // 1.4 النجارة البدائية (تركيب الحلوق)
  {
    id: '1.4.1',
    sectionId: '1.4',
    title: 'حلوق أبواب خشبية داخلية',
    unit: 'عدد',
    quantitySource: 'manual',
    specs: [
      { key: 'woodType', label: 'نوع خشب الحلق', type: 'select', options: ['خشب موسكي 2 بوصة', 'خشب عزيزي', 'MDF مقاوم للرطوبة'], defaultValue: 'خشب موسكي 2 بوصة' },
      { key: 'frameWidth', label: 'عرض الحلق (سم)', type: 'select', options: ['80 سم', '90 سم', '100 سم'], defaultValue: '90 سم' },
      { key: 'thickness', label: 'سُمك لوح الحلق', type: 'select', options: ['1.5 بوصة', '2 بوصة'], defaultValue: '2 بوصة' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 280, laborUnitPrice: 90, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },

  // 1.5 أعمال المحارة / اللياسة (حلقة الوصل)
  {
    id: '1.5.1',
    sectionId: '1.5',
    title: 'لياسة حوائط داخلية (محارة أسمنتية)',
    unit: 'م²',
    quantitySource: 'calculated',
    calculationFormula: 'total.wallArea',
    specs: [
      { key: 'mortarMix', label: 'نسبة خلط المونة', type: 'select', options: ['1:4 (350 كجم أسمنت)', '1:5 (300 كجم)'], defaultValue: '1:4 (350 كجم أسمنت)' },
      { key: 'thickness', label: 'متوسط السُمك (سم)', type: 'number', defaultValue: 2.0 },
      { key: 'finishMethod', label: 'طريقة التشطيب', type: 'select', options: ['بؤج وأوتار (ميزان)', 'قدي دراع (عادي)'], defaultValue: 'بؤج وأوتار (ميزان)' },
      { key: 'cementPerSqm', label: 'استهلاك الأسمنت (شكارة/م²)', type: 'number', defaultValue: 0.25 },
      { key: 'sandPerSqm', label: 'استهلاك الرمل (م³/م²)', type: 'number', defaultValue: 0.02 },
      { key: 'cementBagPrice', label: 'نوع الأسمنت المستخدم', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'general', defaultValue: 'price_cement_bag' },
      { key: 'sandCubicPrice', label: 'نوع الرمل المستخدم', type: 'material_selector', materialGroup: 'materials', materialSubgroup: 'general', defaultValue: 'price_sand_m3' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 30, laborUnitPrice: 45, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 4 },
    egyptianCodeRef: 'كود أعمال البياض والمحارة - الباب الخامس'
  },
  {
    id: '1.5.2',
    sectionId: '1.5',
    title: 'أعمال عزل مائي (حمامات ومطابخ وبلكونات)',
    unit: 'م²',
    quantitySource: 'manual',
    specs: [
      { key: 'insulationType', label: 'نوع العزل المائي', type: 'select', options: ['عزل كيميائي أكريليك (وجهين)', 'لفائف بيتومين انسومات', 'عزل أسمنتي سيكا 107'], defaultValue: 'عزل أسمنتي سيكا 107' },
      { key: 'layersCount', label: 'عدد الطبقات', type: 'number', defaultValue: 2 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 65, laborUnitPrice: 40, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 },
    egyptianCodeRef: 'كود العزل المائي والرطوبة للمباني'
  },

  // 2.1 الأسقف المعلقة (الجبسوم بورد)
  {
    id: '2.1.1',
    sectionId: '2.1',
    title: 'سقف معلق جبسوم بورد مستوي (Flat)',
    unit: 'م²',
    quantitySource: 'calculated',
    calculationFormula: 'total.ceilingArea',
    perAreaOverride: true,
    specs: [
      { key: 'gypsumType', label: 'نوع لوح الجبس', type: 'select', options: ['كناوف أبيض عادي 12.5 مم', 'كناوف أخضر مقاوم رطوبة', 'كناوف أحمر مقاوم حريق'], defaultValue: 'كناوف أبيض عادي 12.5 مم' },
      { key: 'suspensionSystem', label: 'نظام التعليق والصاج', type: 'select', options: ['صاج محمل 0.5 مم', 'صاج عادي 0.4 مم'], defaultValue: 'صاج محمل 0.5 مم' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 140, laborUnitPrice: 85, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 3 }
  },
  {
    id: '2.1.2',
    sectionId: '2.1',
    title: 'سقف معلق كرانيش وبيت نور (Cove/Cascade)',
    unit: 'متر طولي',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'levelsCount', label: 'عدد المستويات', type: 'number', defaultValue: 1 },
      { key: 'coveDepth', label: 'عمق بيت النور (سم)', type: 'number', defaultValue: 12 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 110, laborUnitPrice: 70, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 }
  },

  // 2.2 أعمال الأرضيات والحوائط (التكسيات - التجهيز)
  {
    id: '2.2.1',
    sectionId: '2.2',
    title: 'مونة لاصقة لتركيب السيراميك والبورسلين (أرضيات)',
    unit: 'م²',
    quantitySource: 'calculated',
    calculationFormula: 'total.floorArea',
    specs: [
      { key: 'adhesiveType', label: 'نوع مادة اللصق', type: 'select', options: ['لاصق أسمنتي عادي C1', 'لاصق مرن فلكسبل C2', 'مونة أسمنت ورمل تقليدية'], defaultValue: 'لاصق أسمنتي عادي C1' },
      { key: 'mortarThickness', label: 'سُمك المونة (سم)', type: 'number', defaultValue: 1.5 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 40, laborUnitPrice: 20, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 }
  },

  // 2.3 مرحلة الدهانات (المرحلة الأولى - معجون وسيلر)
  {
    id: '2.3.1',
    sectionId: '2.3',
    title: 'تجهيز دهان وسيلر وعزل الحوائط',
    unit: 'م²',
    quantitySource: 'calculated',
    calculationFormula: 'total.wallArea',
    specs: [
      { key: 'sealerBrand', label: 'ماركة السيلر المائي', type: 'select', options: ['جوتن Jotun سيلر', 'سايبس Sipes', 'GLC سيلر مائي'], defaultValue: 'جوتن Jotun سيلر' },
      { key: 'primingCoats', label: 'عدد أوجه السيلر', type: 'number', defaultValue: 1 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 15, laborUnitPrice: 10, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },
  {
    id: '2.3.2',
    sectionId: '2.3',
    title: 'سحب معجون حوائط وأسقف',
    unit: 'م²',
    quantitySource: 'calculated',
    calculationFormula: 'total.wallArea',
    specs: [
      { key: 'puttyBrand', label: 'نوع المعجون والشركة', type: 'select', options: ['معجون أكريليك جوتن', 'معجون بودرة سايبس', 'GLC معجون داخلي جاهز'], defaultValue: 'معجون أكريليك جوتن' },
      { key: 'puttyCoats', label: 'عدد سكاكين المعجون', type: 'number', defaultValue: 2 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 25, laborUnitPrice: 30, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 3 }
  },

  // 2.4 النجارة والألومنيوم (التركيبات الظاهرية)
  {
    id: '2.4.1',
    sectionId: '2.4',
    title: 'تركيب أبواب خشبية داخلية نهائية',
    unit: 'عدد',
    quantitySource: 'manual',
    specs: [
      { key: 'doorFinish', label: 'خامة الكسوة ولون الباب', type: 'select', options: ['HDF مغلف بقشرة طبيعية', 'خشب طبيعي أرو دهان أستر', 'دهان دوكو فرن مقاوم للمياه'], defaultValue: 'HDF مغلف بقشرة طبيعية' },
      { key: 'locksBrand', label: 'ماركة المقابض والكوالين', type: 'select', options: ['إيطالي ييل Yale', 'كالي تركي Kale', 'صيني نخب أول'], defaultValue: 'كالي تركي Kale' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 2800, laborUnitPrice: 250, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 }
  },
  {
    id: '2.4.2',
    sectionId: '2.4',
    title: 'شبابيك ألوميتال نهائية',
    unit: 'م²',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'profileSystem', label: 'قطاع الألمنيوم والشركة', type: 'select', options: ['جامبو Jumbo شريف علي حسن', 'تانجو Tango عادي', 'قطاعات حرارية Thermal Break'], defaultValue: 'جامبو Jumbo شريف علي حسن' },
      { key: 'glassType', label: 'نوع الزجاج والسُمك', type: 'select', options: ['دبل فاميه عاكس 6+9+6 مم', 'سنجل 6 مم شفاف', 'دبل جورجيا ديكور'], defaultValue: 'دبل فاميه عاكس 6+9+6 مم' },
      { key: 'profileColor', label: 'لون القطاع', type: 'select', options: ['أسود مطفي', 'أبيض الكتروستاتيك', 'رمادي غامق دولي'], defaultValue: 'أسود مطفي' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 2500, laborUnitPrice: 150, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 }
  },

  // 2.5 بند التجليدات للحوائط ونوعها
  {
    id: '2.5.1',
    sectionId: '2.5',
    title: 'تجليد حوائط خشبي (Cladding)',
    unit: 'م²',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'woodType', label: 'نوع خشب التجليد', type: 'select', options: ['شرائح خشب طبيعي أرو', 'بديل الخشب WPC', 'MDF قشرة أرو دهان أستر'], defaultValue: 'بديل الخشب WPC' },
      { key: 'direction', label: 'اتجاه التركيب', type: 'select', options: ['رأسي', 'أفقي', 'تصميم هندسي متقاطع'], defaultValue: 'رأسي' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 650, laborUnitPrice: 120, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 }
  },

  // 2.6 بند كباين المطابخ
  {
    id: '2.6.1',
    sectionId: '2.6',
    title: 'كباين مطبخ وحدات أرضية ومعلقة',
    unit: 'متر طولي',
    quantitySource: 'manual',
    specs: [
      { key: 'material', label: 'الخامة والواجهة', type: 'select', options: ['أكريليك مستورد على MDF', 'هايجلوس High-Gloss التركي', 'HPL مقاوم للرطوبة والخدش', 'خشب طبيعي بلوط'], defaultValue: 'هايجلوس High-Gloss التركي' },
      { key: 'hingesType', label: 'نوع المفصلات والملحقات', type: 'select', options: ['سوفت كلوز بلوم بلس Blum', 'عادي صيني نخب أول'], defaultValue: 'سوفت كلوز بلوم بلس Blum' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 3200, laborUnitPrice: 300, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 3 }
  },

  // 2.7 رخامة المطبخ أو الجرانيت
  {
    id: '2.7.1',
    sectionId: '2.7',
    title: 'رخام/جرانيت أسطح وجزيرة المطبخ',
    unit: 'متر طولي',
    quantitySource: 'manual',
    specs: [
      { key: 'stoneType', label: 'نوع الخامة والجرانيت', type: 'select', options: ['كوارتز Quartz مستورد', 'كوريان Corian أسطح صلبة', 'جرانيت جلاكسي أسود هندي', 'جرانيت حلايب محلي'], defaultValue: 'جرانيت جلاكسي أسود هندي' },
      { key: 'thicknessCm', label: 'السُمك (سم)', type: 'select', options: ['2 سم', '3 سم', 'دبل شفة 4 سم'], defaultValue: '2 سم' },
      { key: 'edgeProfile', label: 'شطف وتشطيب الحرف', type: 'select', options: ['حرف مستقيم مستوي', 'شطف نصف دائرة Bullnose', 'شطف دبل شفة'], defaultValue: 'حرف مستقيم مستوي' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 1800, laborUnitPrice: 200, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },

  // 2.8 التشطيبات الكهربائية
  {
    id: '2.8.1',
    sectionId: '2.8',
    title: 'تركيب وشوش ومفاتيح الكهرباء النهائية',
    unit: 'عدد',
    quantitySource: 'manual', // or matched to points count
    specs: [
      { key: 'brandModel', label: 'الماركة والموديل', type: 'select', options: ['ليجراند ساسي Legrand', 'شنايدر ديسنت Schneider', 'فينوس Venus'], defaultValue: 'ليجراند ساسي Legrand' },
      { key: 'finishColor', label: 'لون الأغطية والوشوش', type: 'select', options: ['أبيض ناصع', 'أسود مطفي شيك', 'رمادي سيلفر'], defaultValue: 'أسود مطفي شيك' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 45, laborUnitPrice: 15, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },
  {
    id: '2.8.2',
    sectionId: '2.8',
    title: 'تركيب وحدات الإنارة (سبوتات، نجف، معلقات)',
    unit: 'عدد',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'spotType', label: 'نوع الإضاءة', type: 'select', options: ['سبوت لايت LED COB 7 وات', 'نجف سقف كلاسيك/مودرن', 'أباليك حوائط'], defaultValue: 'سبوت لايت LED COB 7 وات' },
      { key: 'colorTemp', label: 'درجة حرارة اللون (كلفن)', type: 'select', options: ['3000K (أصفر دافئ)', '4000K (ورم إضاءة نهارية)', '6500K (أبيض بارد)'], defaultValue: '3000K (أصفر دافئ)' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 75, laborUnitPrice: 15, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 }
  },
  {
    id: '2.8.3',
    sectionId: '2.8',
    title: 'تركيب شرائط إضاءة LED Strip مخفية',
    unit: 'متر طولي',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'stripType', label: 'نوع الشريط والجهد', type: 'select', options: ['LED COB 24 فولت عالي الكثافة', 'SMD 120 ليد/متر 12 فولت'], defaultValue: 'LED COB 24 فولت عالي الكثافة' },
      { key: 'driverBrand', label: 'ماركة المحول (Driver)', type: 'select', options: ['مين ويل Mean Well الأصلي', 'محول صيني تجاري'], defaultValue: 'مين ويل Mean Well الأصلي' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 60, laborUnitPrice: 20, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },

  // 2.9 التشطيبات الصحية
  {
    id: '2.9.1',
    sectionId: '2.9',
    title: 'تركيب أطقم صحية (أحواض وكراسي وحوض دش)',
    unit: 'عدد طقم',
    quantitySource: 'manual',
    specs: [
      { key: 'brand', label: 'الماركة والمصنع', type: 'select', options: ['إيديال ستاندرد Ideal Standard', 'ديورافيت Duravit', 'جرافيت Graphite'], defaultValue: 'ديورافيت Duravit' },
      { key: 'cisternType', label: 'نوع صندوق الطرد والكرسي', type: 'select', options: ['معلق بصندوق مدفون (Geberit)', 'عادي ملاصق للحائط'], defaultValue: 'معلق بصندوق مدفون (Geberit)' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 6500, laborUnitPrice: 450, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 }
  },
  {
    id: '2.9.2',
    sectionId: '2.9',
    title: 'تركيب خلاطات وحنفيات مياه نهائية',
    unit: 'عدد خلاط',
    quantitySource: 'manual',
    specs: [
      { key: 'brand', label: 'ماركة الخلاطات', type: 'select', options: ['جروهي Grohe الماني', 'إيديال ستاندرد', 'خلاط دفن التركي'], defaultValue: 'جروهي Grohe الماني' }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 3500, laborUnitPrice: 150, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 }
  },

  // 2.10 الوجه النهائي للدهانات
  {
    id: '2.10.1',
    sectionId: '2.10',
    title: 'دهان الحوائط والأسقف (الوجه النهائي الملون)',
    unit: 'م²',
    quantitySource: 'calculated',
    calculationFormula: 'total.wallArea',
    perAreaOverride: true,
    specs: [
      { key: 'paintType', label: 'نوع الدهان النهائي واللمعان', type: 'select', options: ['بلاستيك مطفي جوتن فينوماستيك', 'نصف لمعة جوتن فينوماستيك', 'سمكو ربع لمعة اقتصادي', 'دهان زيتي مائي'], defaultValue: 'نصف لمعة جوتن فينوماستيك' },
      { key: 'colorCode', label: 'كود اللون والشركة', type: 'text', defaultValue: 'Jotun 1024 (Timeless)' },
      { key: 'coverageRate', label: 'معدل الفرد (م²/لتر/وجه)', type: 'number', defaultValue: 10.0 },
      { key: 'coatsCount', label: 'عدد أوجه الدهان الملون', type: 'number', defaultValue: 2 },
      { key: 'canSize', label: 'سعة بستلة الدهان (لتر)', type: 'number', defaultValue: 18 },
      { key: 'paintCanPrice', label: 'سعر بستلة الدهان (ج.م)', type: 'number', defaultValue: 1800 },
      { key: 'puttyCoats', label: 'عدد سكاكين المعجون', type: 'number', defaultValue: 2 },
      { key: 'puttyCoverageSqm', label: 'معدل فرد المعجون (م²/شكارة/وجه)', type: 'number', defaultValue: 20 },
      { key: 'puttyBagPrice', label: 'سعر شيكارة المعجون (ج.م)', type: 'number', defaultValue: 350 },
      { key: 'sealerCoverageSqm', label: 'معدل فرد السيلر (م²/جالون)', type: 'number', defaultValue: 30 },
      { key: 'sealerGallonPrice', label: 'سعر جالون السيلر (ج.م)', type: 'number', defaultValue: 250 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 45, laborUnitPrice: 35, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 3 },
    egyptianCodeRef: 'كود أعمال النقاشة والدهانات الداخلية'
  },

  // 2.11 تركيب الأرضيات (سيراميك/بورسلين/HDF/SPC)
  {
    id: '2.11.1',
    sectionId: '2.11',
    title: 'تركيب أرضيات الغرف والصالات',
    unit: 'م²',
    quantitySource: 'calculated',
    calculationFormula: 'total.floorArea',
    perAreaOverride: true,
    specs: [
      { key: 'flooringType', label: 'نوع خامة الأرضية', type: 'select', options: ['سيراميك فرز أول', 'بورسلين مستورد', 'رخام طبيعي مستورد', 'باركيه HDF الماني', 'أرضيات SPC ضد المياه'], defaultValue: 'بورسلين مستورد' },
      { key: 'tileSize', label: 'المقاس والقطع (سم)', type: 'select', options: ['60x60', '80x80', '120x60', '100x100', 'شرائح 120x20'], defaultValue: '60x60' },
      { key: 'colorCode', label: 'كود ونوع البلاط', type: 'text', defaultValue: 'كود المورد المختار' },
      { key: 'isRectified', label: 'نوع الفرز والقطع', type: 'select', options: ['ليزر كت (Rectified) - فاصل ضيق', 'عادي فرز شطف (غير Rectified)'], defaultValue: 'ليزر كت (Rectified) - فاصل ضيق' },
      { key: 'groutGap', label: 'عرض الفاصل (مم)', type: 'number', defaultValue: 1.5 },
      { key: 'skirtingType', label: 'نوع الوزرة (السكيرتنج)', type: 'select', options: ['من نفس خامة الأرضية', 'رخام طبيعي منفصل', 'وزرة مخفية Shadow Gap', 'وزرة فوم أسود مطفي'], defaultValue: 'من نفس خامة الأرضية' },
      { key: 'skirtingHeight', label: 'ارتفاع الوزرة (سم)', type: 'number', defaultValue: 8 },
      { key: 'wastagePercent', label: 'نسبة الهالك المضافة (%)', type: 'number', defaultValue: 10.0 },
      { key: 'tilesPerBox', label: 'عدد البلاطات في الكرتونة', type: 'number', defaultValue: 4 },
      { key: 'tileBoxPrice', label: 'سعر كرتونة البلاط (ج.م)', type: 'number', defaultValue: 350 },
      { key: 'adhesiveCoverageSqm', label: 'معدل فرد الغراء (م²/شكارة)', type: 'number', defaultValue: 5 },
      { key: 'adhesiveBagPrice', label: 'سعر شيكارة الغراء (ج.م)', type: 'number', defaultValue: 180 },
      { key: 'groutCoverageSqm', label: 'معدل فرد الترويبة (م²/كيس)', type: 'number', defaultValue: 15 },
      { key: 'groutBagPrice', label: 'سعر كيس الترويبة (ج.م)', type: 'number', defaultValue: 40 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 250, laborUnitPrice: 95, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 3 },
    egyptianCodeRef: 'كود تكسية الأرضيات والحوائط بالبلاط والرخام',
    codeReferences: { egyptian: 'كود تكسية الأرضيات والحوائط بالبلاط والرخام', saudiSBC: 'SBC 201 - الفصل 9', uaeUBC: 'UBC - Flooring Standards' }
  },

  // ============================================
  // 3.1 أعمال التكييف والتبريد (HVAC)
  // ============================================
  {
    id: '3.1.1',
    sectionId: '3.1',
    title: 'تأسيس مواسير دفن تكييف (نحاس معزول)',
    unit: 'متر طولي',
    quantitySource: 'manual',
    specs: [
      { key: 'pipeType', label: 'نوع الماسورة', type: 'select', options: ['نحاس معزول بالأرماكفلكس', 'PVC فليكس مرن', 'نحاس عاري + عزل منفصل'], defaultValue: 'نحاس معزول بالأرماكفلكس' },
      { key: 'pipeDiameter', label: 'مقاس الماسورة (بوصة)', type: 'select', options: ['1/4" + 1/2" (1.5 حصان)', '1/4" + 5/8" (2.25 حصان)', '3/8" + 3/4" (3 حصان)', '3/8" + 7/8" (4-5 حصان)'], defaultValue: '1/4" + 5/8" (2.25 حصان)' },
      { key: 'installationType', label: 'طريقة التركيب', type: 'select', options: ['مدفون في الحائط', 'مدفون في السقف', 'ظاهر مع تغطية'], defaultValue: 'مدفون في الحائط' },
      { key: 'drainPipe', label: 'ماسورة صرف المكثفات', type: 'select', options: ['PVC 3/4 بوصة', 'خرطوم مرن'], defaultValue: 'PVC 3/4 بوصة' },
      { key: 'copperRollLength', label: 'طول لفة النحاس (متر)', type: 'number', defaultValue: 15 },
      { key: 'copperRollPrice', label: 'سعر لفة النحاس (ج.م)', type: 'number', defaultValue: 5500 },
      { key: 'armaflexPrice', label: 'سعر المتر عزل أرماكفلكس (ج.م)', type: 'number', defaultValue: 35 },
      { key: 'controlWirePrice', label: 'سعر المتر سلك كنترول (ج.م)', type: 'number', defaultValue: 15 },
      { key: 'drainPipePrice', label: 'سعر المتر ماسورة صرف (ج.م)', type: 'number', defaultValue: 25 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 200, laborUnitPrice: 80, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 },
    egyptianCodeRef: 'كود MEP المصري - أعمال التكييف',
    codeReferences: { egyptian: 'كود MEP المصري - أعمال التكييف', saudiSBC: 'SBC 501 - HVAC Systems', uaeUBC: 'UBC - Mechanical', kuwaitMEW: 'MEW/R-6 (كفاءة الطاقة)', qatarQCS: 'QCS 2014 - Section 21' }
  },
  {
    id: '3.1.2',
    sectionId: '3.1',
    title: 'وحدات تكييف سبليت (داخلية + خارجية)',
    unit: 'وحدة',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'capacity', label: 'القدرة (حصان)', type: 'select', options: ['1.5 حصان (12000 BTU)', '2.25 حصان (18000 BTU)', '3 حصان (24000 BTU)', '4 حصان (30000 BTU)', '5 حصان (36000 BTU)'], defaultValue: '2.25 حصان (18000 BTU)' },
      { key: 'brand', label: 'الماركة والشركة', type: 'select', options: ['شارب Sharp', 'كاريير Carrier', 'يونيون إير Unionaire', 'LG إل جي', 'سامسونج Samsung', 'دايكن Daikin', 'جري Gree', 'ميديا Midea', 'تورنيدو Tornado'], defaultValue: 'شارب Sharp' },
      { key: 'acType', label: 'نوع التشغيل', type: 'select', options: ['بارد فقط (Cool Only)', 'بارد وساخن (Hot & Cold)'], defaultValue: 'بارد وساخن (Hot & Cold)' },
      { key: 'technology', label: 'تكنولوجيا الضاغط', type: 'select', options: ['انفرتر (Inverter) موفر للطاقة', 'عادي (Fixed Speed)'], defaultValue: 'انفرتر (Inverter) موفر للطاقة' },
      { key: 'mountType', label: 'نوع التركيب', type: 'select', options: ['حائطي (Wall Mounted)', 'سقفي كاسيت (Cassette)', 'كونسيلد مخفي (Concealed Ducted)', 'أرضي (Floor Standing)'], defaultValue: 'حائطي (Wall Mounted)' },
      { key: 'unitPrice', label: 'سعر الوحدة كاملة (ج.م)', type: 'number', defaultValue: 22000 },
      { key: 'bracketPrice', label: 'سعر الحامل الخارجي (ج.م)', type: 'number', defaultValue: 350 },
      { key: 'copperLength', label: 'طول مواسير النحاس المقدّر (متر)', type: 'number', defaultValue: 5 },
      { key: 'copperPricePerMeter', label: 'سعر متر النحاس المعزول (ج.م)', type: 'number', defaultValue: 180 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 22000, laborUnitPrice: 1500, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 },
    egyptianCodeRef: 'كود MEP المصري - معدات التكييف',
    codeReferences: { egyptian: 'كود MEP المصري - معدات التكييف', saudiSBC: 'SBC 501 - Equipment', uaeUBC: 'UBC - HVAC Equipment', kuwaitMEW: 'MEW/R-6', qatarQCS: 'QCS 2014 - Section 21' }
  },
  {
    id: '3.1.3',
    sectionId: '3.1',
    title: 'نقاط كهرباء مخصصة للتكييف (20-32 أمبير)',
    unit: 'نقطة',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'breakerType', label: 'نوع القاطع/المفتاح', type: 'select', options: ['قاطع 20 أمبير (1.5 - 2.25 حصان)', 'قاطع 25 أمبير (3 حصان)', 'قاطع 32 أمبير (4-5 حصان)'], defaultValue: 'قاطع 20 أمبير (1.5 - 2.25 حصان)' },
      { key: 'switchBrand', label: 'ماركة المفتاح والقاطع', type: 'select', options: ['شنايدر Schneider', 'ليجراند Legrand', 'هاجر Hager', 'ABB'], defaultValue: 'شنايدر Schneider' },
      { key: 'wireGauge', label: 'سُمك السلك', type: 'select', options: ['4 مم (حتى 2.25 حصان)', '6 مم (3 حصان فأكثر)'], defaultValue: '4 مم (حتى 2.25 حصان)' },
      { key: 'wirePerPoint', label: 'طول السلك للنقطة (متر)', type: 'number', defaultValue: 20 },
      { key: 'rollLength', label: 'طول اللفة (متر)', type: 'number', defaultValue: 100 },
      { key: 'wireRollPrice', label: 'سعر لفة السلك (ج.م)', type: 'number', defaultValue: 3500 },
      { key: 'breakerPrice', label: 'سعر القاطع (ج.م)', type: 'number', defaultValue: 280 },
      { key: 'isolatorPrice', label: 'سعر مفتاح الأيزوليتور (ج.م)', type: 'number', defaultValue: 150 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 450, laborUnitPrice: 120, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 },
    egyptianCodeRef: 'كود التركيبات الكهربائية - تغذية معدات التكييف',
    codeReferences: { egyptian: 'كود التركيبات الكهربائية - تغذية معدات التكييف', saudiSBC: 'SBC 401 - HVAC Electrical', uaeUBC: 'UBC - Electrical/HVAC' }
  },
  {
    id: '3.1.4',
    sectionId: '3.1',
    title: 'صيانة وتنظيف مجاري الهواء (تكييف مركزي)',
    unit: 'مقطوعية',
    quantitySource: 'manual',
    specs: [
      { key: 'systemType', label: 'نوع نظام التكييف', type: 'select', options: ['سبليت مركزي (VRF/VRV)', 'شيللر ومراوح (Fan Coil)', 'باكيدج مركزي'], defaultValue: 'سبليت مركزي (VRF/VRV)' },
      { key: 'supplyGrilles', label: 'عدد فتحات السبلاي (Supply)', type: 'number', defaultValue: 8 },
      { key: 'returnGrilles', label: 'عدد فتحات الريتيرن (Return)', type: 'number', defaultValue: 4 },
      { key: 'ductLength', label: 'إجمالي طول الدكتات (متر)', type: 'number', defaultValue: 30 }
    ],
    defaultPricing: { mode: 'lump_sum', materialUnitPrice: 0, laborUnitPrice: 0, lumpSumPrice: 8000, dailyRate: 0, estimatedDays: 2 },
    codeReferences: { egyptian: 'كود التهوية الميكانيكية للمباني', saudiSBC: 'SBC 501 - Ductwork', qatarQCS: 'QCS 2014 - Section 21' }
  },

  // ============================================
  // 3.2 الشفاطات والتهوية الميكانيكية
  // ============================================
  {
    id: '3.2.1',
    sectionId: '3.2',
    title: 'شفاط مطبخ (سحب هواء)',
    unit: 'وحدة',
    quantitySource: 'manual',
    specs: [
      { key: 'hoodType', label: 'نوع الشفاط', type: 'select', options: ['مسطح (Flat)', 'هرمي مدخنة (Chimney)', 'بلت إن مدمج (Built-In)', 'جزيرة (Island Hood)'], defaultValue: 'هرمي مدخنة (Chimney)' },
      { key: 'airflowCapacity', label: 'قدرة السحب (م³/ساعة)', type: 'select', options: ['350 م³/ساعة', '500 م³/ساعة', '750 م³/ساعة', '1000 م³/ساعة'], defaultValue: '500 م³/ساعة' },
      { key: 'brand', label: 'الماركة', type: 'select', options: ['فريش Fresh', 'تورنيدو Tornado', 'بوش Bosch', 'إلكتا Electa', 'أريستون Ariston', 'بيكو Beko'], defaultValue: 'فريش Fresh' },
      { key: 'size', label: 'المقاس (عرض)', type: 'select', options: ['60 سم', '90 سم', '120 سم'], defaultValue: '90 سم' },
      { key: 'color', label: 'لون الهيكل', type: 'select', options: ['ستانلس ستيل', 'أسود', 'أبيض', 'سيلفر'], defaultValue: 'ستانلس ستيل' },
      { key: 'hoodPrice', label: 'سعر الشفاط (ج.م)', type: 'number', defaultValue: 4500 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 4500, laborUnitPrice: 350, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 },
    codeReferences: { egyptian: 'كود التهوية الميكانيكية - شفاطات المطابخ', saudiSBC: 'SBC 501 - Kitchen Ventilation', uaeUBC: 'UBC - Kitchen Exhaust' }
  },
  {
    id: '3.2.2',
    sectionId: '3.2',
    title: 'شفاط حمام (مروحة طرد هواء)',
    unit: 'وحدة',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'fanSize', label: 'المقاس', type: 'select', options: ['15x15 سم (6 بوصة)', '20x20 سم (8 بوصة)', '25x25 سم (10 بوصة)', '30x30 سم (12 بوصة)'], defaultValue: '20x20 سم (8 بوصة)' },
      { key: 'operationType', label: 'نوع التشغيل', type: 'select', options: ['بمفتاح عادي', 'بسنسور حركة PIR', 'بتايمر تأخير', 'مع إضاءة مدمجة'], defaultValue: 'بمفتاح عادي' },
      { key: 'brand', label: 'الماركة', type: 'select', options: ['تورنيدو Tornado', 'فريش Fresh', 'ستاندرد Standard', 'باناسونيك Panasonic'], defaultValue: 'تورنيدو Tornado' },
      { key: 'fanPrice', label: 'سعر الشفاط (ج.م)', type: 'number', defaultValue: 350 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 350, laborUnitPrice: 80, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 },
    codeReferences: { egyptian: 'كود التهوية الميكانيكية - الحمامات', saudiSBC: 'SBC 501 - Bathroom Ventilation' }
  },
  {
    id: '3.2.3',
    sectionId: '3.2',
    title: 'دكتات تهوية (مجاري الهواء)',
    unit: 'متر طولي',
    quantitySource: 'manual',
    specs: [
      { key: 'ductMaterial', label: 'خامة الدكت', type: 'select', options: ['صاج مجلفن (Galvanized)', 'فليكسبل PVC مرن', 'ألومنيوم مرن', 'فايبر جلاس معزول'], defaultValue: 'فليكسبل PVC مرن' },
      { key: 'ductDiameter', label: 'القطر/المقاس', type: 'select', options: ['4 بوصة (100 مم)', '6 بوصة (150 مم)', '8 بوصة (200 مم)', '10 بوصة (250 مم)', '12 بوصة (300 مم)'], defaultValue: '6 بوصة (150 مم)' },
      { key: 'insulated', label: 'عزل حراري', type: 'select', options: ['نعم - معزول حرارياً', 'لا - بدون عزل'], defaultValue: 'لا - بدون عزل' },
      { key: 'ductPricePerMeter', label: 'سعر المتر دكت (ج.م)', type: 'number', defaultValue: 120 },
      { key: 'fittingsPercent', label: 'نسبة الوصلات والأكواع (%)', type: 'number', defaultValue: 15 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 120, laborUnitPrice: 60, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 2 },
    codeReferences: { egyptian: 'كود التهوية الميكانيكية - مجاري الهواء', saudiSBC: 'SBC 501 - Ductwork', uaeUBC: 'UBC - Duct Standards', qatarQCS: 'QCS 2014 - Section 21' }
  },
  {
    id: '3.2.4',
    sectionId: '3.2',
    title: 'فتحات تهوية وديفيوزرات (Grilles & Diffusers)',
    unit: 'عدد',
    quantitySource: 'manual',
    perAreaOverride: true,
    specs: [
      { key: 'grilleType', label: 'نوع الفتحة', type: 'select', options: ['شبك تهوية عادي (Grille)', 'ديفيوزر مربع (Square Diffuser)', 'ديفيوزر خطي (Linear Diffuser)', 'فتحة ريتيرن (Return Air Grille)'], defaultValue: 'ديفيوزر مربع (Square Diffuser)' },
      { key: 'grilleSize', label: 'المقاس', type: 'select', options: ['20x20 سم', '30x30 سم', '40x40 سم', '60x15 سم (خطي)', '120x15 سم (خطي)'], defaultValue: '30x30 سم' },
      { key: 'color', label: 'اللون', type: 'select', options: ['أبيض', 'سيلفر', 'أسود مطفي', 'لون حسب التصميم'], defaultValue: 'أبيض' },
      { key: 'grillePrice', label: 'سعر الفتحة الواحدة (ج.م)', type: 'number', defaultValue: 180 }
    ],
    defaultPricing: { mode: 'materials_labor_split', materialUnitPrice: 180, laborUnitPrice: 40, lumpSumPrice: 0, dailyRate: 0, estimatedDays: 1 },
    codeReferences: { egyptian: 'كود التهوية - فتحات التوزيع', saudiSBC: 'SBC 501 - Air Distribution' }
  }
];

