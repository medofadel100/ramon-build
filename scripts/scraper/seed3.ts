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

const missingMaterials = [
  // البناء والأساسيات
  { id: 'bld_fiber_mesh', name: 'شبك فيبر جلاس للتشققات 50 متر', category: 'بناء', subCategory: 'شبك فيبر', unit: 'لفة', lowestPrice: 250, sources: [{ storeName: 'الشركة السويسرية', price: 250, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_ready_mix_beton', name: 'خرسانة جاهزة (بيتون) إجهاد 300', category: 'بناء', subCategory: 'بيتون', unit: 'متر مكعب', lowestPrice: 1400, sources: [{ storeName: 'Cemex Egypt', price: 1400, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'Lafarge', price: 1450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // الأرضيات والرخام
  { id: 'flr_marble_galala', name: 'رخام طبيعي جلالة سادة مقاسات', category: 'أرضيات', subCategory: 'رخام طبيعي', unit: 'متر مربع', lowestPrice: 450, sources: [{ storeName: 'شق التعبان للرخام', price: 450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'flr_spc_flooring', name: 'أرضيات SPC مقاومة للماء 4 مم', category: 'أرضيات', subCategory: 'SPC', unit: 'متر مربع', lowestPrice: 520, sources: [{ storeName: 'Krono Original', price: 520, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // ملحقات الجبسون بورد والعزل
  { id: 'gyp_omega_profile', name: 'قطاع أوميجا صاج مجلفن للجبسون بورد 0.4 مم', category: 'أخرى', subCategory: 'جبسون بورد', unit: 'عود (3 متر)', lowestPrice: 45, sources: [{ storeName: 'Knauf Official', price: 45, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'gyp_c_channel', name: 'قطاع سي تشانل صاج 0.4 مم', category: 'أخرى', subCategory: 'جبسون بورد', unit: 'عود (3 متر)', lowestPrice: 38, sources: [{ storeName: 'Knauf Official', price: 38, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'gyp_joint_tape', name: 'شريط فواصل (جوينت تيب) شبك 90 متر', category: 'أخرى', subCategory: 'جبسون بورد', unit: 'لفة', lowestPrice: 85, sources: [{ storeName: 'Knauf Official', price: 85, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'insul_rockwool', name: 'صوف صخري للعزل الحراري والصوتي (Rockwool) كثافة 70', category: 'أخرى', subCategory: 'عزل جدران', unit: 'متر مربع', lowestPrice: 150, sources: [{ storeName: 'Kimmco Egypt', price: 150, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // التكييف والتهوية المتقدمة
  { id: 'hvac_duct_galvanized', name: 'صاج مجلفن لتصنيع الدكت (Duct) قياس 24', category: 'تكييف', subCategory: 'دكت', unit: 'متر مربع', lowestPrice: 320, sources: [{ storeName: 'مصانع الصاج', price: 320, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'hvac_grille_aluminum', name: 'جريلات تهوية ألومنيوم تكييف مركزي 60×15 سم', category: 'تكييف', subCategory: 'جريلات تهوية', unit: 'قطعة', lowestPrice: 450, sources: [{ storeName: 'Andalusia HVAC', price: 450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // لوحات وتأسيس كهرباء إضافي
  { id: 'elec_voltage_protector', name: 'قاطع حماية تغيير الفولت (Over/Under Voltage Relay) 63A', category: 'كهرباء', subCategory: 'حماية فولت', unit: 'قطعة', lowestPrice: 580, sources: [{ storeName: 'Amazon.eg', price: 580, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'Tomzn Official', price: 600, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  
  // السخانات
  { id: 'plm_heater_instant', name: 'سخان مياه فوري كهربائي 9 كيلو وات (Stiebel Eltron)', category: 'سباكة', subCategory: 'سخانات مياه', unit: 'جهاز', lowestPrice: 8500, sources: [{ storeName: 'Stiebel Eltron Egypt', price: 8500, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'B.TECH', price: 8650, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
];

async function seedMissing() {
  console.log("Starting to seed missing products...");
  let count = 0;
  for (const material of missingMaterials) {
    const docRef = doc(db, 'market_materials', material.id);
    await setDoc(docRef, material);
    console.log(`Added: ${material.name}`);
    count++;
  }
  console.log(`\nSuccessfully seeded ${count} MORE missing products to the marketplace!`);
  process.exit(0);
}

seedMissing().catch(console.error);
