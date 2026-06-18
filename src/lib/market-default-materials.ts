import { MarketMaterial } from '@/types/market';
import { resolveSourceUrl } from '@/lib/market-sources';

const r = (storeName: string, materialName: string, url = '#') => resolveSourceUrl({ storeName, url }, materialName);

export const DEFAULT_MARKET_MATERIALS: MarketMaterial[] = [
  {
    id: 'bld_fiber_mesh',
    name: 'شبك فيبر جلاس للتشققات 50 متر',
    category: 'بناء',
    subCategory: 'شبك فيبر',
    phase: 'تأسيس',
    unit: 'لفة',
    lowestPrice: 250,
    sources: [
      { storeName: 'الشركة السويسرية', price: 250, isAvailable: true, url: r('الشركة السويسرية', 'شبك فيبر جلاس للتشققات 50 متر'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'bld_ready_mix_beton',
    name: 'خرسانة جاهزة (بيتون) إجهاد 300',
    category: 'بناء',
    subCategory: 'بيتون',
    phase: 'تأسيس',
    unit: 'متر مكعب',
    lowestPrice: 1400,
    sources: [
      { storeName: 'Cemex Egypt', price: 1400, isAvailable: true, url: r('Cemex Egypt', 'خرسانة جاهزة (بيتون) إجهاد 300'), lastUpdated: Date.now() },
      { storeName: 'Lafarge', price: 1450, isAvailable: true, url: r('Lafarge', 'خرسانة جاهزة (بيتون) إجهاد 300'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'bld_sand_coarse',
    name: 'رمل خشن (حرش) للخرسانة',
    category: 'بناء',
    subCategory: 'رمل خشن',
    phase: 'تأسيس',
    unit: 'متر مكعب',
    lowestPrice: 180,
    sources: [
      { storeName: 'محاجر محلية', price: 180, isAvailable: true, url: r('محاجر محلية', 'رمل خشن (حرش) للخرسانة'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'flr_marble_galala_60x60',
    name: 'رخام طبيعي جلالة مقاس 60×60 سم',
    category: 'أرضيات',
    subCategory: 'رخام طبيعي',
    phase: 'فنش',
    unit: 'متر مربع',
    lowestPrice: 420,
    sources: [
      { storeName: 'شق التعبان للرخام', price: 420, isAvailable: true, url: r('شق التعبان للرخام', 'رخام طبيعي جلالة مقاس 60×60 سم'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'flr_marble_galala_80x80',
    name: 'رخام طبيعي جلالة مقاس 80×80 سم',
    category: 'أرضيات',
    subCategory: 'رخام طبيعي',
    phase: 'فنش',
    unit: 'متر مربع',
    lowestPrice: 460,
    sources: [
      { storeName: 'شق التعبان للرخام', price: 460, isAvailable: true, url: r('شق التعبان للرخام', 'رخام طبيعي جلالة مقاس 80×80 سم'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'flr_spc_flooring_4mm',
    name: 'أرضيات SPC مقاومة للماء 4 مم',
    category: 'أرضيات',
    subCategory: 'SPC',
    phase: 'فنش',
    unit: 'متر مربع',
    lowestPrice: 520,
    sources: [
      { storeName: 'Krono Original', price: 520, isAvailable: true, url: r('Krono Original', 'أرضيات SPC مقاومة للماء 4 مم'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'flr_underlay_foam',
    name: 'لبادة فوم عزل صوتي ورطوبة 3 مم',
    category: 'أرضيات',
    subCategory: 'إكسسوارات أرضيات',
    phase: 'فنش',
    unit: 'متر مربع',
    lowestPrice: 35,
    sources: [
      { storeName: 'Masterfloor', price: 35, isAvailable: true, url: r('Masterfloor', 'لبادة فوم عزل صوتي ورطوبة 3 مم'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'gyp_omega_profile',
    name: 'قطاع أوميجا صاج مجلفن للجبسون بورد 0.4 مم',
    category: 'الأسقف والجبسون بورد',
    subCategory: 'جبسون بورد',
    phase: 'تأسيس',
    unit: 'عود (3 متر)',
    lowestPrice: 45,
    sources: [
      { storeName: 'Knauf Official', price: 45, isAvailable: true, url: r('Knauf Official', 'قطاع أوميجا صاج مجلفن للجبسون بورد 0.4 مم'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'gyp_joint_tape',
    name: 'شريط جوينت تيب للشقوق 90 متر',
    category: 'الأسقف والجبسون بورد',
    subCategory: 'جبسون بورد',
    phase: 'تأسيس',
    unit: 'لفة',
    lowestPrice: 85,
    sources: [
      { storeName: 'Knauf Official', price: 85, isAvailable: true, url: r('Knauf Official', 'شريط جوينت تيب للشقوق 90 متر'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'insul_rockwool_70',
    name: 'صوف صخري للعزل الحراري والصوتي Rockwool 70',
    category: 'العزل والمواد الخصوصية',
    subCategory: 'عزل حراري وصوتي',
    phase: 'تأسيس',
    unit: 'متر مربع',
    lowestPrice: 150,
    sources: [
      { storeName: 'Kimmco Egypt', price: 150, isAvailable: true, url: r('Kimmco Egypt', 'صوف صخري للعزل الحراري والصوتي Rockwool 70'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'hvac_duct_galvanized_24',
    name: 'صاج مجلفن لدكت التكييف مقاس 24',
    category: 'تكييف',
    subCategory: 'دكت',
    phase: 'تأسيس',
    unit: 'متر مربع',
    lowestPrice: 320,
    sources: [
      { storeName: 'مصانع الصاج', price: 320, isAvailable: true, url: r('مصانع الصاج', 'صاج مجلفن لدكت التكييف مقاس 24'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'elec_voltage_protector_63',
    name: 'حماية تغيير الفولت 63A',
    category: 'كهرباء',
    subCategory: 'حماية فولت',
    phase: 'تأسيس',
    unit: 'قطعة',
    lowestPrice: 580,
    sources: [
      { storeName: 'Amazon Egypt', price: 580, isAvailable: true, url: r('Amazon Egypt', 'حماية تغيير الفولت 63A'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'elec_wire_6mm',
    name: 'لفة سلك نحاس 6 مم (100 متر)',
    category: 'كهرباء',
    subCategory: 'أسلاك نحاس',
    phase: 'تأسيس',
    unit: 'لفة (100م)',
    lowestPrice: 3100,
    sources: [
      { storeName: 'Amazon Egypt', price: 3100, isAvailable: true, url: r('Amazon Egypt', 'لفة سلك نحاس 6 مم (100 متر)'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'elec_wire_10mm',
    name: 'لفة سلك نحاس 10 مم (100 متر)',
    category: 'كهرباء',
    subCategory: 'أسلاك نحاس',
    phase: 'تأسيس',
    unit: 'لفة (100م)',
    lowestPrice: 5200,
    sources: [
      { storeName: 'Amazon Egypt', price: 5200, isAvailable: true, url: r('Amazon Egypt', 'لفة سلك نحاس 10 مم (100 متر)'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'plm_heater_instant_9kw',
    name: 'سخان مياه فوري كهربائي 9 كيلو وات',
    category: 'سباكة',
    subCategory: 'سخانات مياه',
    phase: 'فنش',
    unit: 'قطعة',
    lowestPrice: 8500,
    sources: [
      { storeName: 'Stiebel Eltron Egypt', price: 8500, isAvailable: true, url: r('Stiebel Eltron Egypt', 'سخان مياه فوري كهربائي 9 كيلو وات'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'alum_ps_jumbo',
    name: 'قطاع ألوميتال PS جامبو دبل جلاس',
    category: 'الألوميتال والزجاج',
    subCategory: 'ألوميتال',
    phase: 'فنش',
    unit: 'متر مربع',
    lowestPrice: 3500,
    sources: [
      { storeName: 'ورش الألوميتال', price: 3500, isAvailable: true, url: r('ورش الألوميتال', 'قطاع ألوميتال PS جامبو دبل جلاس'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'kitch_granite_double_black',
    name: 'جرانيت دبل بلاك للمطابخ',
    category: 'المطابخ والرخام',
    subCategory: 'رخام وجرانيت',
    phase: 'فنش',
    unit: 'متر طولي',
    lowestPrice: 1800,
    sources: [
      { storeName: 'شق التعبان', price: 1800, isAvailable: true, url: r('شق التعبان', 'جرانيت دبل بلاك للمطابخ'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'facade_qarmid',
    name: 'قرميد بلاستيك تركي للواجهات',
    category: 'الواجهات واللاند سكيب',
    subCategory: 'حجر صناعي وطبيعي',
    phase: 'فنش',
    unit: 'متر مربع',
    lowestPrice: 380,
    sources: [
      { storeName: 'موردين القرميد', price: 380, isAvailable: true, url: r('موردين القرميد', 'قرميد بلاستيك تركي للواجهات'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'land_artificial_grass',
    name: 'نجيل صناعي كثافة عالية 4 سم',
    category: 'الواجهات واللاند سكيب',
    subCategory: 'لاند سكيب',
    phase: 'فنش',
    unit: 'متر مربع',
    lowestPrice: 220,
    sources: [
      { storeName: 'Green Cover', price: 220, isAvailable: true, url: r('Green Cover', 'نجيل صناعي كثافة عالية 4 سم'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'ppe_kit',
    name: 'عدة حماية شخصية PPE كاملة',
    brand: '3M / Honeywell',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'معدات حماية شخصية (PPE)',
    phase: 'تأسيس',
    unit: 'طقم',
    lowestPrice: 380,
    sources: [
      { storeName: '3M Egypt', price: 380, isAvailable: true, url: r('3M Egypt', 'عدة حماية شخصية PPE كاملة'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'n95_mask_box',
    name: 'كمامة N95 علبة 10 قطع',
    brand: '3M',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'معدات حماية شخصية (PPE)',
    phase: 'تأسيس',
    unit: 'علبة (10 قطع)',
    lowestPrice: 260,
    sources: [
      { storeName: '3M Egypt', price: 260, isAvailable: true, url: r('3M Egypt', 'كمامة N95 علبة 10 قطع'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'wpc_wall_panel',
    name: 'لوح ديكور بديل خشب WPC 122×18 سم',
    category: 'ديكورات وتكسيات',
    subCategory: 'بديل خشب WPC',
    phase: 'فنش',
    unit: 'متر مربع',
    lowestPrice: 420,
    sources: [
      { storeName: 'Decothane', price: 420, isAvailable: true, url: r('Decothane', 'لوح ديكور بديل خشب WPC 122×18 سم'), lastUpdated: Date.now() }
    ]
  },
  {
    id: 'wallpaper_vinyl',
    name: 'رول ورق حائط فينيل 53×10 متر',
    category: 'ديكورات وتكسيات',
    subCategory: 'ورق حائط',
    phase: 'فنش',
    unit: 'رول',
    lowestPrice: 280,
    sources: [
      { storeName: 'PaperWall', price: 280, isAvailable: true, url: r('PaperWall', 'رول ورق حائط فينيل 53×10 متر'), lastUpdated: Date.now() }
    ]
  }
];
