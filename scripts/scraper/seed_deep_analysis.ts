import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCaAKLGHq-kbPbxjgCG_mBaBmshTsIHH3Y",
  authDomain: "ramon-build.firebaseapp.com",
  projectId: "ramon-build",
  storageBucket: "ramon-build.firebasestorage.app",
  messagingSenderId: "598966235253",
  appId: "1:598966235253:web:a9f709fbef7ab13da0883c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const deepAnalysisProducts = [
  // 1. قسم البناء والمقاولات الرئيسية
  { id: 'bld_rebar_ezz_12', name: 'حديد تسليح عز 12 مم', brand: 'Ezz Steel', category: 'بناء', subCategory: 'حديد تسليح', phase: 'تأسيس', unit: 'طن', lowestPrice: 38000, sources: [{ storeName: 'Ezz Steel', price: 38000, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'موردين الحديد', price: 38500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_rebar_beshay_16', name: 'حديد تسليح بشاي 16 مم', brand: 'Beshay Steel', category: 'بناء', subCategory: 'حديد تسليح', phase: 'تأسيس', unit: 'طن', lowestPrice: 37500, sources: [{ storeName: 'Beshay Steel', price: 37500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_gravel_sen1', name: 'زلط سن 1 للخرسانة', category: 'بناء', subCategory: 'زلط وسن', phase: 'تأسيس', unit: 'متر مكعب', lowestPrice: 280, sources: [{ storeName: 'محاجر محلية', price: 280, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_wood_latzana', name: 'خشب لاتزانة للشدات الخشبية', category: 'بناء', subCategory: 'خشب مقاولات', phase: 'تأسيس', unit: 'متر مكعب', lowestPrice: 12500, sources: [{ storeName: 'مغلق أخشاب', price: 12500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_block_hollow', name: 'طوب أسمنتي مفرغ 20×20×40', category: 'بناء', subCategory: 'طوب أسمنتي', phase: 'تأسيس', unit: 'ألف طوبة', lowestPrice: 2100, sources: [{ storeName: 'مصانع الطوب', price: 2100, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // 2. قسم السباكة وتأسيس المياه
  { id: 'plumb_pump_calpeda_1hp', name: 'موتور مياه كالبيدا 1 حصان إيطالي', brand: 'Calpeda', category: 'سباكة', subCategory: 'مواتير مياه', phase: 'تأسيس', unit: 'قطعة', lowestPrice: 5800, sources: [{ storeName: 'Calpeda Egypt', price: 5800, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'Amazon.eg', price: 6100, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plumb_tank_poly_1000', name: 'خزان مياه بولي إيثيلين 1000 لتر 3 طبقات', category: 'سباكة', subCategory: 'خزانات مياه', phase: 'تأسيس', unit: 'قطعة', lowestPrice: 3200, sources: [{ storeName: 'الخزانات المصرية', price: 3200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plumb_toilet_duravit_starck', name: 'طقم تواليت ديورافيت ستاركي 3 مع السديلي', brand: 'Duravit', category: 'سباكة', subCategory: 'أطقم حمامات', phase: 'فنش', unit: 'طقم', lowestPrice: 4800, sources: [{ storeName: 'Duravit Official', price: 4800, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'Ahmed Elsallab', price: 4950, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // 3. قسم الكهرباء والتيار الخفيف
  { id: 'elec_cable_armored_16', name: 'كابل ألومنيوم مسلح 4x16 مم', brand: 'Elsewedy', category: 'التيار الخفيف والأنظمة', subCategory: 'كابلات مسلحة', phase: 'تأسيس', unit: 'متر', lowestPrice: 120, sources: [{ storeName: 'El Sewedy Stores', price: 120, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_intercom_farfisa', name: 'جهاز إنتركم صوتي فرفيزا إيطالي (لوحة + سماعة)', brand: 'Farfisa', category: 'التيار الخفيف والأنظمة', subCategory: 'إنتركم', phase: 'فنش', unit: 'طقم', lowestPrice: 1850, sources: [{ storeName: 'Farfisa Egypt', price: 1850, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // 4. قسم الدهانات والديكور
  { id: 'pnt_deco_velvet', name: 'دهان ديكوري قطيفة لؤلؤي', brand: 'GLC', category: 'دهانات', subCategory: 'دهانات ديكورية', phase: 'فنش', unit: 'جالون', lowestPrice: 450, sources: [{ storeName: 'GLC Official', price: 450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'pnt_thinner_cold', name: 'تنر بارد دبابة (للتخفيف والتنظيف)', category: 'دهانات', subCategory: 'تنر ومذيبات', phase: 'فنش', unit: 'جالون', lowestPrice: 180, sources: [{ storeName: 'محلات البويات', price: 180, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // 5. قسم النجارة والإكسسوارات
  { id: 'wood_lock_smart_yale', name: 'كالون باب ذكي ببصمة الإصبع وكارت (Yale)', brand: 'Yale', category: 'نجارة', subCategory: 'إكسسوارات أبواب', phase: 'فنش', unit: 'قطعة', lowestPrice: 8500, sources: [{ storeName: 'Yale Security', price: 8500, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'B.TECH', price: 8900, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'wood_lock_ahram', name: 'كالون باب شقة عادة أسطواني الأهرام', brand: 'Ahram', category: 'نجارة', subCategory: 'إكسسوارات أبواب', phase: 'فنش', unit: 'قطعة', lowestPrice: 350, sources: [{ storeName: 'Ahram Metals', price: 350, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // 6. قسم المطابخ
  { id: 'kitch_hpl_board', name: 'لوح مطبخ HPL مضاد للخدش والمياه 122x280', category: 'المطابخ والرخام', subCategory: 'خامات مطابخ', phase: 'فنش', unit: 'لوح', lowestPrice: 2200, sources: [{ storeName: 'موردين الأخشاب', price: 2200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'kitch_builtin_oven_bosch', name: 'فرن كهرباء بلت إن بوش 60 سم (Bosch)', brand: 'Bosch', category: 'المطابخ والرخام', subCategory: 'أجهزة بلت-إن', phase: 'فنش', unit: 'جهاز', lowestPrice: 22500, sources: [{ storeName: 'Bosch Egypt', price: 22500, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'RayaShop', price: 23000, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'kitch_builtin_hob_fresh', name: 'مسطح غاز بلت إن فريش 5 شعلة زجاج', brand: 'Fresh', category: 'المطابخ والرخام', subCategory: 'أجهزة بلت-إن', phase: 'فنش', unit: 'جهاز', lowestPrice: 6500, sources: [{ storeName: 'Fresh Official', price: 6500, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'B.TECH', price: 6700, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
];

async function seedDeepAnalysis() {
  console.log(`Starting to seed ${deepAnalysisProducts.length} new deep-analysis products...`);
  let count = 0;
  for (const material of deepAnalysisProducts) {
    const docRef = doc(db, 'market_materials', material.id);
    await setDoc(docRef, material);
    console.log(`Added: ${material.name} (Brand: ${material.brand || 'N/A'})`);
    count++;
  }
  console.log(`\nSuccessfully seeded ${count} products!`);
  process.exit(0);
}

seedDeepAnalysis().catch(console.error);
