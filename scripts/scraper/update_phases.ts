import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

// Logic to determine the phase based on subcategory or name
function determinePhase(material: MarketMaterial): 'تأسيس' | 'فنش' | 'إكسسوارات' {
  const taseesSubs = [
    'أسمنت', 'رمل ناعم', 'رمل خشن', 'طوب أحمر', 'بيتون', 'شبك فيبر', 'عزل جدران',
    'لوحات توزيع', 'قواطع', 'RCCB', 'أسلاك نحاس', 'خراطيم', 'علب تأسيس', 'حماية فولت',
    'مواسير سباكة', 'صرف', 'عزل حراري', 'مواسير تأسيس', 'دكت',
    'بريمر', 'سيلر', 'معجون'
  ];

  const finishSubs = [
    'سيراميك', 'بورسلين', 'رخام طبيعي', 'SPC', 'باركيه', 'HDF/MDF', 'لاصق بلاط', 'واتر بروف',
    'بلاستيك', 'أكريليك', 'لاكيه', 'خارجي',
    'مفاتيح وفيش', 'كشافات وإضاءة',
    'خلاطات وأحواض', 'سخانات مياه',
    'تكييفات', 'شفاطات', 'جريلات تهوية',
    'أبواب وحلوق', 'أبواب مصفحة',
    'جبسون بورد', 'حجر صناعي', 'تغليف حوائط'
  ];

  const accessoriesSubs = [
    'إكسسوارات حمام', 'سمارت هوم', 'ساوند سيستم'
  ];

  if (taseesSubs.includes(material.subCategory)) return 'تأسيس';
  if (finishSubs.includes(material.subCategory)) return 'فنش';
  if (accessoriesSubs.includes(material.subCategory)) return 'إكسسوارات';

  // Fallback checks by category
  if (material.category === 'بناء') return 'تأسيس';
  if (material.category === 'أرضيات' || material.category === 'دهانات') return 'فنش';
  if (material.category === 'سمارت هوم') return 'إكسسوارات';

  // Default fallback
  return 'فنش';
}

async function updatePhases() {
  console.log("Fetching materials to update phases...");
  const snapshot = await getDocs(collection(db, 'market_materials'));
  let count = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as MarketMaterial;
    const phase = determinePhase(data);
    
    await updateDoc(doc(db, 'market_materials', docSnap.id), {
      phase
    });
    
    console.log(`Updated [${data.name}] -> ${phase}`);
    count++;
  }
  
  console.log(`\nSuccessfully updated phases for ${count} products!`);
  process.exit(0);
}

updatePhases().catch(console.error);
