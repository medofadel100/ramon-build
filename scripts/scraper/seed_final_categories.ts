import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

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

// New products to be added to the new categories
const newFinalProducts = [
  // العزل والمواد الخصوصية
  { id: 'insul_membrane_4mm', name: 'لفائف ممبرين عزل أسطح 4 مم (بيتومين)', category: 'العزل والمواد الخصوصية', subCategory: 'عزل مائي', phase: 'تأسيس', unit: 'لفة (10 متر)', lowestPrice: 850, sources: [{ storeName: 'Bitumode', price: 850, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'insul_epoxy_floor', name: 'دهان إيبوكسي للأرضيات (سيكا)', category: 'العزل والمواد الخصوصية', subCategory: 'إيبوكسي', phase: 'فنش', unit: 'مجموعة (20 كجم)', lowestPrice: 3200, sources: [{ storeName: 'Sika Egypt', price: 3200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // الألوميتال والزجاج
  { id: 'alum_ps_jumbo', name: 'قطاع ألوميتال PS جامبو دبل جلاس', category: 'الألوميتال والزجاج', subCategory: 'ألوميتال', phase: 'فنش', unit: 'متر مربع', lowestPrice: 3500, sources: [{ storeName: 'ورش الألوميتال', price: 3500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'upvc_window_soundproof', name: 'شباك uPVC دبل جلاس عازل للصوت والحرارة', category: 'الألوميتال والزجاج', subCategory: 'uPVC', phase: 'فنش', unit: 'متر مربع', lowestPrice: 4200, sources: [{ storeName: 'Deceuninck', price: 4200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'glass_shower_cabin', name: 'كابينة شاور زجاج سيكوريت 10 مم مفصلات', category: 'الألوميتال والزجاج', subCategory: 'كبائن شاور', phase: 'فنش', unit: 'متر مربع', lowestPrice: 2100, sources: [{ storeName: 'موردين الزجاج', price: 2100, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // التيار الخفيف والأنظمة
  { id: 'data_cable_cat6', name: 'لفة سلك إنترنت (Data) Cat 6 السويدي', category: 'التيار الخفيف والأنظمة', subCategory: 'شبكات وإنترنت', phase: 'تأسيس', unit: 'لفة (305م)', lowestPrice: 2400, sources: [{ storeName: 'Amazon.eg', price: 2400, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'cctv_camera_hikvision', name: 'كاميرا مراقبة خارجية 5 ميجا بكسل Hikvision', category: 'التيار الخفيف والأنظمة', subCategory: 'كاميرات مراقبة', phase: 'إكسسوارات', unit: 'قطعة', lowestPrice: 1100, sources: [{ storeName: 'Hikvision Official', price: 1100, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'B.TECH', price: 1150, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'fire_smoke_detector', name: 'حساس دخان للإنذار المبكر (Smoke Detector)', category: 'التيار الخفيف والأنظمة', subCategory: 'إنذار حريق', phase: 'إكسسوارات', unit: 'قطعة', lowestPrice: 450, sources: [{ storeName: 'Amazon.eg', price: 450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // المطابخ والرخام
  { id: 'kitch_granite_double_black', name: 'جرانيت دبل بلاك هندي للمطابخ', category: 'المطابخ والرخام', subCategory: 'رخام وجرانيت', phase: 'فنش', unit: 'متر طولي', lowestPrice: 1800, sources: [{ storeName: 'شق التعبان', price: 1800, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'kitch_sink_franke', name: 'حوض مطبخ استانلس ستيل 2 عين فرانكي (Franke)', category: 'المطابخ والرخام', subCategory: 'أحواض مطابخ', phase: 'فنش', unit: 'قطعة', lowestPrice: 4500, sources: [{ storeName: 'Franke Official', price: 4500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // الواجهات واللاند سكيب
  { id: 'facade_qarmid', name: 'قرميد بلاستيك تركي معالج للأسقف والواجهات', category: 'الواجهات واللاند سكيب', subCategory: 'حجر صناعي وطبيعي', phase: 'فنش', unit: 'متر مربع', lowestPrice: 380, sources: [{ storeName: 'موردين القرميد', price: 380, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'land_artificial_grass', name: 'نجيل صناعي كثافة عالية 4 سم (لاند سكيب)', category: 'الواجهات واللاند سكيب', subCategory: 'لاند سكيب', phase: 'فنش', unit: 'متر مربع', lowestPrice: 220, sources: [{ storeName: 'Green Cover', price: 220, isAvailable: true, url: '#', lastUpdated: Date.now() }] }
];

async function run() {
  console.log("Migrating old categories...");
  const snapshot = await getDocs(collection(db, 'market_materials'));
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    let updates: any = {};

    // Map old categories to new ones
    if (data.category === 'سمارت هوم') {
      updates.category = 'التيار الخفيف والأنظمة';
    } 
    else if (data.category === 'أخرى' || data.category === 'بناء') {
      if (data.subCategory === 'جبسون بورد') {
        updates.category = 'الأسقف والجبسون بورد';
      }
      else if (data.subCategory === 'عزل جدران' || data.subCategory === 'واتر بروف') {
        updates.category = 'العزل والمواد الخصوصية';
        if (data.subCategory === 'واتر بروف') updates.subCategory = 'عزل مائي';
        if (data.subCategory === 'عزل جدران') updates.subCategory = 'عزل حراري وصوتي';
      }
      else if (data.subCategory === 'تغليف حوائط') {
        updates.category = 'المطابخ والرخام';
        if (data.name.includes('زجاج')) {
           updates.category = 'الألوميتال والزجاج';
           updates.subCategory = 'زجاج ومرايا';
        }
      }
      else if (data.subCategory === 'حجر صناعي' || data.name.includes('حجر')) {
        updates.category = 'الواجهات واللاند سكيب';
        updates.subCategory = 'حجر صناعي وطبيعي';
      }
      else if (data.subCategory === 'ساوند سيستم') {
        updates.category = 'التيار الخفيف والأنظمة';
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(docSnap.ref, updates);
      console.log(`Updated category for [${data.name}] to ${updates.category}`);
      updatedCount++;
    }
  }

  console.log(`\nStarting to seed ${newFinalProducts.length} new items...`);
  let addedCount = 0;
  for (const material of newFinalProducts) {
    const docRef = doc(db, 'market_materials', material.id);
    await setDoc(docRef, material);
    console.log(`Added: ${material.name}`);
    addedCount++;
  }

  console.log(`\nCompleted! Migrated: ${updatedCount}, Added: ${addedCount}`);
  process.exit(0);
}

run().catch(console.error);
