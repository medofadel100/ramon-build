import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { MarketMaterial } from '../../src/types/market';

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

// Generates a random realistic price within a range
function generatePrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Stores to use
const STORES = [
  { name: 'الرويعي للمعدات', url: 'https://google.com/search?q={query}' },
  { name: 'السوق المصري للتشطيبات', url: 'https://google.com/search?q={query}' },
  { name: 'المتحدة للكيماويات', url: 'https://google.com/search?q={query}' },
  { name: 'بيت الإباء الديكوري', url: 'https://google.com/search?q={query}' },
  { name: 'مظلوم', url: 'https://google.com/search?q={query}' }
];

const newMaterials: Partial<MarketMaterial>[] = [
  // ==================== أدوات ومعدات التنفيذ ====================
  {
    name: 'خوذة حماية هندسية (نظارة، حماية أذن)',
    brand: '3M / Honeywell',
    description: 'معدات حماية شخصية (PPE) مطابقة للمواصفات',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'معدات حماية شخصية (PPE)',
    phase: 'تأسيس',
    unit: 'طقم',
  },
  {
    name: 'كمامة حماية من الغبار N95',
    brand: '3M',
    description: 'ضرورية أثناء أعمال الهدم والصنفرة',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'معدات حماية شخصية (PPE)',
    phase: 'تأسيس',
    unit: 'علبة (10 قطع)',
  },
  {
    name: 'شاكوش تكسير / هيلتي (SDS-Max)',
    brand: 'Bosch / Hilti',
    description: '1500W-1800W لأعمال التكسير والهدم الشاق',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'أدوات يدوية وكهربائية',
    phase: 'تأسيس',
    unit: 'قطعة',
  },
  {
    name: 'ميزان ليزر 3D تسوية ذاتية',
    brand: 'Bosch / Leica',
    description: 'ليزر أخضر للودع والبؤج وتركيب السيراميك',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'أدوات يدوية وكهربائية',
    phase: 'تأسيس',
    unit: 'قطعة',
  },
  {
    name: 'سقالة معدنية ألومنيوم (متر مربع / إيجار)',
    brand: 'Layher / محلية',
    description: 'إيجار سقالات للواجهات والأعمال المرتفعة',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'سقالات ومعدات ثقيلة',
    phase: 'تأسيس',
    unit: 'متر',
  },
  {
    name: 'أكياس ردم ومخلفات بولي بروبيلين',
    brand: 'محلية',
    description: 'مقاومة للتمزق، تحمل 50-100 كجم',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'مستلزمات نظافة وحماية',
    phase: 'تأسيس',
    unit: 'كيس/100',
  },
  {
    name: 'بكرة تغليف حماية للأرضيات (رول فوم بولي ايثيلين)',
    brand: 'Tyvek',
    description: 'حماية السيراميك والباركيه أثناء التشطيب',
    category: 'أدوات ومعدات التنفيذ',
    subCategory: 'مستلزمات نظافة وحماية',
    phase: 'فنش',
    unit: 'متر مربع',
  },

  // ==================== أرضيات وإكسسواراتها ====================
  {
    name: 'أرضيات SPC فلورينج (مقاوم للماء)',
    brand: 'Egger / Decno',
    description: 'بديل الباركيه الخشبي، سماكة 5 مم مقاوم للماء 100%',
    category: 'أرضيات',
    subCategory: 'SPC',
    phase: 'فنش',
    unit: 'متر مربع',
  },
  {
    name: 'لبادة (Underlay) باركيه فوم',
    brand: 'Masterfloor',
    description: 'عازل رطوبة وصوت 3 مم يوضع تحت الباركيه والـ HDF',
    category: 'أرضيات',
    subCategory: 'إكسسوارات أرضيات',
    phase: 'فنش',
    unit: 'متر مربع',
  },
  {
    name: 'شريط تمدد (Expansion Joint) ألومنيوم',
    brand: 'Schlüter',
    description: 'بروفيل فواصل للبورسلين والسيراميك في المساحات الواسعة',
    category: 'أرضيات',
    subCategory: 'إكسسوارات أرضيات',
    phase: 'فنش',
    unit: 'متر طولي',
  },
  {
    name: 'موكيت غرف وقطيفة',
    brand: 'Mac / Tretford',
    description: 'موكيت غرف وزن 800 جم/م2',
    category: 'أرضيات',
    subCategory: 'موكيت',
    phase: 'فنش',
    unit: 'متر مربع',
  },

  // ==================== ديكورات وتكسيات ====================
  {
    name: 'بديل خشب WPC مضلع داخلي',
    brand: 'Decothane / Walltech',
    description: 'ديكور حوائط مضاد للرطوبة والحشرات مقاس اللوح 122*18سم',
    category: 'ديكورات وتكسيات',
    subCategory: 'بديل خشب WPC',
    phase: 'فنش',
    unit: 'متر مربع',
  },
  {
    name: 'ورق حائط فينيل قابل للغسيل',
    brand: 'AS Creation / Graham&Brown',
    description: 'رول ورق حائط عرض 53 سم / طول 10 متر',
    category: 'ديكورات وتكسيات',
    subCategory: 'ورق حائط',
    phase: 'فنش',
    unit: 'رول',
  },
  {
    name: 'بديل رخام (ألواح PVC)',
    brand: 'مستورد',
    description: 'لوح لامع 122*244 سم سمك 3 مم، مقاوم للماء والحرارة',
    category: 'ديكورات وتكسيات',
    subCategory: 'بديل رخام',
    phase: 'فنش',
    unit: 'لوح',
  },
  {
    name: 'كرانيش جبس هندسي / EPS فوم',
    brand: 'محلية',
    description: 'ديكور تقاطع السقف مع الحائط',
    category: 'ديكورات وتكسيات',
    subCategory: 'كرانيش وزوايا',
    phase: 'فنش',
    unit: 'متر طولي',
  },
  {
    name: 'حجر كلادينج / بازلت واجهات',
    brand: 'Eldorado Stone',
    description: 'حجر ديكوري للواجهات والخارج',
    category: 'ديكورات وتكسيات',
    subCategory: 'حجر ديكوري',
    phase: 'فنش',
    unit: 'متر مربع',
  },

  // ==================== كيماويات ودهانات متخصصة ====================
  {
    name: 'دهان مضاد للحشرات والصراصير',
    brand: 'Killpest',
    description: 'يدهن خلف الدواليب والمطابخ وقواعد الحمام',
    category: 'دهانات',
    subCategory: 'كيماويات وحماية',
    phase: 'تأسيس',
    unit: 'لتر',
  },
  {
    name: 'ورنيش بولي يوريثان للأرضيات (شفاف)',
    brand: 'Bona Traffic',
    description: 'لحماية الباركيه والأرضيات الطبيعية من الخدش',
    category: 'دهانات',
    subCategory: 'كيماويات وحماية',
    phase: 'فنش',
    unit: 'لتر',
  },
  {
    name: 'معجون شروخ خارجي (Elastomeric)',
    brand: 'Jotun Fillcoat',
    description: 'لسد شروخ الواجهات المرنة والمقاومة للماء',
    category: 'دهانات',
    subCategory: 'معجون',
    phase: 'تأسيس',
    unit: 'كجم',
  },
  {
    name: 'دهان لاكيه للأخشاب',
    brand: 'GLC / Sayerlack',
    description: 'لاكيه زيتي أو أكريليك للأبواب والأثاث',
    category: 'دهانات',
    subCategory: 'لاكيه',
    phase: 'فنش',
    unit: 'لتر',
  }
];

// Seed function
async function seedDocxMaterials() {
  console.log(`Starting DOCX materials seed process for ${newMaterials.length} items...`);
  const batch = writeBatch(db);
  const collectionRef = collection(db, 'market_materials');

  let count = 0;

  for (const material of newMaterials) {
    // Generate realistic lowest price
    let lowestPrice = 100;
    if (material.unit === 'متر مربع') lowestPrice = generatePrice(150, 450);
    if (material.unit === 'لتر') lowestPrice = generatePrice(70, 200);
    if (material.subCategory === 'أدوات يدوية وكهربائية') lowestPrice = generatePrice(1500, 7000);
    if (material.subCategory === 'ورق حائط') lowestPrice = generatePrice(400, 1200);

    // Create realistic sources
    const sources = [
      {
        storeName: STORES[0].name,
        price: lowestPrice,
        isAvailable: true,
        url: (STORES[0].url ?? '').replace('{query}', encodeURIComponent(material.name || '')),
        lastUpdated: Date.now()
      },
      {
        storeName: STORES[2].name,
        price: lowestPrice + generatePrice(10, 50),
        isAvailable: true,
        url: (STORES[2].url ?? '').replace('{query}', encodeURIComponent(material.name || '')),
        lastUpdated: Date.now()
      }
    ];

    const newDocRef = doc(collectionRef);
    const docData: MarketMaterial = {
      id: newDocRef.id,
      name: material.name as string,
      brand: material.brand,
      description: material.description,
      category: material.category as any,
      subCategory: material.subCategory as any,
      phase: material.phase as any,
      unit: material.unit as string,
      sources: sources,
      lowestPrice: lowestPrice,
    };

    batch.set(newDocRef, docData);
    count++;
    console.log(`Added: [${material.category}] ${material.name} - ${lowestPrice} ج.م`);
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${count} advanced DOCX materials to Firestore!`);
}

seedDocxMaterials().catch(console.error);
