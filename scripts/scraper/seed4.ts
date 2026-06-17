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

const finalMissingMaterials = [
  { id: 'bld_sand_coarse', name: 'رمل خشن (حرش) للخرسانة', category: 'بناء', subCategory: 'رمل خشن', phase: 'تأسيس', unit: 'متر مكعب', lowestPrice: 180, sources: [{ storeName: 'محاجر محلية', price: 180, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'pnt_primer_glc', name: 'برايمر مائي مانع للرطوبة GLC', category: 'دهانات', subCategory: 'بريمر', phase: 'تأسيس', unit: 'بستلة', lowestPrice: 520, sources: [{ storeName: 'GLC Official', price: 520, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'pnt_acrylic_scib', name: 'دهان أكريليك قابل للغسيل سايب (SCIB)', category: 'دهانات', subCategory: 'أكريليك', phase: 'فنش', unit: 'بستلة', lowestPrice: 1450, sources: [{ storeName: 'SCIB Paints', price: 1450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'wall_glass_cladding', name: 'تجليد حوائط زجاج سيكوريت 10 مم ديكور', category: 'أخرى', subCategory: 'تغليف حوائط', phase: 'فنش', unit: 'متر مربع', lowestPrice: 1800, sources: [{ storeName: 'مصانع الزجاج', price: 1800, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'hvac_duct_flexible', name: 'دكت فليكسيبول معزول حرارياً 6 بوصة', category: 'تكييف', subCategory: 'دكت', phase: 'تأسيس', unit: 'متر', lowestPrice: 85, sources: [{ storeName: 'موردين التكييف المركزي', price: 85, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_wire_6', name: 'لفة سلك نحاس 6 مم السويدي', category: 'كهرباء', subCategory: 'أسلاك نحاس', phase: 'تأسيس', unit: 'لفة (100م)', lowestPrice: 3100, sources: [{ storeName: 'Amazon.eg', price: 3100, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_wire_10', name: 'لفة سلك نحاس 10 مم السويدي', category: 'كهرباء', subCategory: 'أسلاك نحاس', phase: 'تأسيس', unit: 'لفة (100م)', lowestPrice: 5200, sources: [{ storeName: 'Amazon.eg', price: 5200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
];

async function seed() {
  console.log("Starting to seed final missing products...");
  let count = 0;
  for (const material of finalMissingMaterials) {
    const docRef = doc(db, 'market_materials', material.id);
    await setDoc(docRef, material);
    console.log(`Added: ${material.name}`);
    count++;
  }
  console.log(`\nSuccessfully seeded ${count} final missing products!`);
  process.exit(0);
}

seed().catch(console.error);
