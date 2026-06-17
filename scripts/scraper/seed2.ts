import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Initialize Firebase with the project config
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

const extendedMaterials = [
  // التكييفات من المواقع الرسمية
  { id: 'ac_fresh_2.25_cool', name: 'تكييف فريش 2.25 حصان بارد فقط', category: 'تكييف', subCategory: 'تكييفات', unit: 'جهاز', lowestPrice: 28500, sources: [{ storeName: 'Fresh Official', price: 28500, isAvailable: true, url: 'https://fresh.com.eg', lastUpdated: Date.now() }, { storeName: 'B.TECH', price: 28999, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'ac_fresh_1.5_inv', name: 'تكييف فريش 1.5 حصان إنفرتر بارد/ساخن', category: 'تكييف', subCategory: 'تكييفات', unit: 'جهاز', lowestPrice: 26000, sources: [{ storeName: 'Fresh Official', price: 26000, isAvailable: true, url: 'https://fresh.com.eg', lastUpdated: Date.now() }] },
  { id: 'ac_lg_1.5_inv', name: 'تكييف LG 1.5 حصان دوال إنفرتر بارد', category: 'تكييف', subCategory: 'تكييفات', unit: 'جهاز', lowestPrice: 32000, sources: [{ storeName: 'LG Egypt Official', price: 32000, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'B.TECH', price: 32500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // الأجهزة المنزلية والشفاطات
  { id: 'vent_fresh_20', name: 'شفاط مطبخ فريش 20 سم', category: 'تكييف', subCategory: 'شفاطات', unit: 'قطعة', lowestPrice: 550, sources: [{ storeName: 'Fresh Official', price: 550, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'Amazon.eg', price: 580, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'vent_kdk_25', name: 'شفاط سقف باناسونيك (KDK) 25 سم', category: 'تكييف', subCategory: 'شفاطات', unit: 'قطعة', lowestPrice: 1200, sources: [{ storeName: 'Panasonic Egypt', price: 1200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // أبواب وحلوق (نجارة)
  { id: 'door_mdf_room', name: 'باب غرفة خشب MDF جاهز بالقشرة', category: 'نجارة', subCategory: 'أبواب وحلوق', unit: 'قطعة', lowestPrice: 3500, sources: [{ storeName: 'El-Sallab Doors', price: 3500, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'موردين محليين', price: 3800, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'door_steel_main', name: 'باب شقة مصفح تركي فئة أولى', category: 'نجارة', subCategory: 'أبواب مصفحة', unit: 'قطعة', lowestPrice: 8500, sources: [{ storeName: 'محلات أبواب مصفحة', price: 8500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // الدهانات (المواقع الرسمية)
  { id: 'pnt_jotashield', name: 'دهان خارجي جوتاشيلد كلر لاست', category: 'دهانات', subCategory: 'خارجي', unit: 'بستلة', lowestPrice: 2200, sources: [{ storeName: 'Jotun Official Centers', price: 2200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'pnt_glc_storm', name: 'دهان خارجي ستورم شيلد GLC', category: 'دهانات', subCategory: 'خارجي', unit: 'بستلة', lowestPrice: 1850, sources: [{ storeName: 'GLC Official', price: 1850, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // حجر صناعي وواجهات
  { id: 'stone_hashma', name: 'حجر هاشمي هيصم للواجهات', category: 'أخرى', subCategory: 'حجر صناعي', unit: 'متر مربع', lowestPrice: 350, sources: [{ storeName: 'شقاير للمقاولات', price: 350, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'stone_mica', name: 'حجر مايكا ديكور داخلي', category: 'أخرى', subCategory: 'حجر صناعي', unit: 'متر مربع', lowestPrice: 650, sources: [{ storeName: 'أحمد السلاب', price: 650, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // الساوند سيستم والسمارت هوم
  { id: 'smart_hub_tuya', name: 'وحدة تحكم مركزية Smart Gateway (Tuya)', category: 'سمارت هوم', subCategory: 'سمارت هوم', unit: 'قطعة', lowestPrice: 1250, sources: [{ storeName: 'Amazon.eg', price: 1250, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'SmartHome Egypt', price: 1300, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'sound_speaker_ceil', name: 'سماعة سقف غاطس 6 وات بوش (Bosch)', category: 'أخرى', subCategory: 'ساوند سيستم', unit: 'قطعة', lowestPrice: 950, sources: [{ storeName: 'RadioShack', price: 950, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'Amazon.eg', price: 1050, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'sound_amp_60w', name: 'مكبر صوت Amplifier 60W', category: 'أخرى', subCategory: 'ساوند سيستم', unit: 'قطعة', lowestPrice: 3200, sources: [{ storeName: 'Amazon.eg', price: 3200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // أدوات صحية وإكسسوارات من الشركات الرسمية
  { id: 'plm_acc_ideal', name: 'طقم إكسسوار حمام 6 قطع إيديال ستاندرد', category: 'سباكة', subCategory: 'إكسسوارات حمام', unit: 'طقم', lowestPrice: 2800, sources: [{ storeName: 'Ideal Standard Official', price: 2800, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'أحمد السلاب', price: 2850, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_sink_duravit', name: 'حوض وتواليت معلق ديورافيت ستاركي', category: 'سباكة', subCategory: 'خلاطات وأحواض', unit: 'طقم', lowestPrice: 7500, sources: [{ storeName: 'Duravit Egypt', price: 7500, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'محجوب', price: 7600, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // عزل وتغليف حوائط
  { id: 'wall_pvc_panel', name: 'تجليد حوائط بديل الخشب PVC', category: 'أخرى', subCategory: 'تغليف حوائط', unit: 'لوح (12سم×2.8م)', lowestPrice: 220, sources: [{ storeName: 'السويفي', price: 220, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'wall_marble_sheet', name: 'تجليد بديل الرخام', category: 'أخرى', subCategory: 'تغليف حوائط', unit: 'لوح (1.2م×2.4م)', lowestPrice: 650, sources: [{ storeName: 'محلات ديكور', price: 650, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
];

async function seed() {
  console.log("Starting to seed extended products database...");
  let count = 0;
  for (const material of extendedMaterials) {
    const docRef = doc(db, 'market_materials', material.id);
    await setDoc(docRef, material);
    console.log(`Added: ${material.name}`);
    count++;
  }
  console.log(`\nSuccessfully seeded ${count} MORE products to the marketplace!`);
  process.exit(0);
}

seed().catch(console.error);
