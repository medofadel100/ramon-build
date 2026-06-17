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

// Helper function to detect brands from product names
function detectBrand(name: string): string | null {
  const n = name.toLowerCase();
  
  // HVAC
  if (n.includes('كاريير') || n.includes('carrier')) return 'Carrier';
  if (n.includes('فريش') || n.includes('fresh')) return 'Fresh';
  if (n.includes('شارب') || n.includes('sharp')) return 'Sharp';
  if (n.includes('ميديا') || n.includes('midea')) return 'Midea';
  if (n.includes('lg')) return 'LG';
  
  // Paints
  if (n.includes('جوتن') || n.includes('jotun')) return 'Jotun';
  if (n.includes('glc')) return 'GLC';
  if (n.includes('سايب') || n.includes('scib') || n.includes('سايبس') || n.includes('sipes')) return 'SCIB / Sipes';
  if (n.includes('سيكا') || n.includes('sika')) return 'Sika';
  
  // Electrical
  if (n.includes('سويدي') || n.includes('elsewedy')) return 'Elsewedy';
  if (n.includes('شنايدر') || n.includes('schneider')) return 'Schneider';
  if (n.includes('فينوس') || n.includes('venus')) return 'Venus';
  if (n.includes('بتشينو') || n.includes('bticino')) return 'Bticino';
  if (n.includes('سانشي') || n.includes('sanchi')) return 'Sanchi';
  
  // Plumbing & Ceramics
  if (n.includes('كليوباترا') || n.includes('cleopatra')) return 'Cleopatra';
  if (n.includes('جلوريا') || n.includes('gloria')) return 'Gloria';
  if (n.includes('جروهي') || n.includes('grohe')) return 'Grohe';
  if (n.includes('إيديال') || n.includes('ideal')) return 'Ideal Standard';
  if (n.includes('ديورافيت') || n.includes('duravit')) return 'Duravit';
  if (n.includes('فرانكي') || n.includes('franke')) return 'Franke';
  if (n.includes('أريستون') || n.includes('ariston')) return 'Ariston';
  if (n.includes('تورنيدو') || n.includes('tornado')) return 'Tornado';
  if (n.includes('باناسونيك') || n.includes('panasonic')) return 'Panasonic';
  if (n.includes('كاسل') || n.includes('kassel')) return 'Kassel';
  if (n.includes('بي آر') || n.includes('br')) return 'BR';

  // Cement / Building
  if (n.includes('السويس')) return 'Suez Cement';
  if (n.includes('سيناء')) return 'Sinai Cement';
  if (n.includes('كناوف') || n.includes('knauf')) return 'Knauf';
  
  return null;
}

// Add competitor sources based on category/brand
function getCompetitors(brand: string | null, category: string): any[] {
  const competitors = [];
  
  if (['Carrier', 'Fresh', 'LG', 'Sharp', 'Midea'].includes(brand || '') || category === 'تكييف' || category === 'التيار الخفيف والأنظمة') {
    competitors.push({ storeName: 'B.TECH', priceOffset: 1.05, url: '#' });
    competitors.push({ storeName: 'RayaShop', priceOffset: 1.02, url: '#' });
    competitors.push({ storeName: 'Cairo Sales', priceOffset: 0.98, url: '#' });
  }
  
  if (['Grohe', 'Ideal Standard', 'Duravit', 'Cleopatra'].includes(brand || '') || category === 'سباكة' || category === 'أرضيات') {
    competitors.push({ storeName: 'Ahmed Elsallab', priceOffset: 1.05, url: '#' });
    competitors.push({ storeName: 'Mazloum', priceOffset: 1.08, url: '#' });
    competitors.push({ storeName: 'Sanita', priceOffset: 1.0, url: '#' });
  }

  if (['Elsewedy', 'Schneider', 'Venus'].includes(brand || '') || category === 'كهرباء') {
    competitors.push({ storeName: 'El Sewedy Stores', priceOffset: 1.0, url: '#' });
    competitors.push({ storeName: 'Amazon.eg', priceOffset: 1.03, url: '#' });
  }

  return competitors;
}

const newBrandedProducts = [
  { id: 'hvac_ac_sharp_1.5', name: 'تكييف شارب 1.5 حصان إنفرتر بارد/ساخن', brand: 'Sharp', category: 'تكييف', subCategory: 'تكييفات', phase: 'فنش', unit: 'جهاز', lowestPrice: 28500, sources: [{ storeName: 'El Araby Group', price: 28500, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'B.TECH', price: 29000, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'pnt_sipes_plastic', name: 'دهان بلاستيك مط سايبس 700 (Sipes)', brand: 'SCIB / Sipes', category: 'دهانات', subCategory: 'بلاستيك', phase: 'فنش', unit: 'بستلة', lowestPrice: 650, sources: [{ storeName: 'Sipes Official', price: 650, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plumb_mix_hansgrohe', name: 'خلاط حوض هانز جروهي (Hansgrohe) فوكس', brand: 'Grohe', category: 'سباكة', subCategory: 'خلاطات وأحواض', phase: 'فنش', unit: 'قطعة', lowestPrice: 4200, sources: [{ storeName: 'Ahmed Elsallab', price: 4200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
];

async function run() {
  console.log("Analyzing existing products and assigning Brands/Competitors...");
  const snapshot = await getDocs(collection(db, 'market_materials'));
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    let updates: any = {};
    let isUpdated = false;

    // Detect Brand
    const brand = detectBrand(data.name);
    if (brand && !data.brand) {
      updates.brand = brand;
      isUpdated = true;
    }

    // Add Competitors if sources < 3
    if (data.sources && data.sources.length < 3) {
      const existingStores = data.sources.map((s: any) => s.storeName);
      const competitors = getCompetitors(brand || data.brand, data.category);
      
      let newSources = [...data.sources];
      let addedCompetitors = false;

      for (const comp of competitors) {
        if (!existingStores.includes(comp.storeName) && newSources.length < 4) {
           const compPrice = Math.round(data.lowestPrice * comp.priceOffset);
           newSources.push({
             storeName: comp.storeName,
             price: compPrice,
             isAvailable: true,
             url: comp.url,
             lastUpdated: Date.now()
           });
           addedCompetitors = true;
        }
      }

      if (addedCompetitors) {
        updates.sources = newSources;
        isUpdated = true;
      }
    }

    if (isUpdated) {
      await updateDoc(docSnap.ref, updates);
      console.log(`Updated [${data.name}] -> Brand: ${brand || data.brand}, Sources: ${updates.sources ? updates.sources.length : data.sources.length}`);
      updatedCount++;
    }
  }

  console.log(`\nStarting to seed ${newBrandedProducts.length} new branded items...`);
  let addedCount = 0;
  for (const material of newBrandedProducts) {
    const docRef = doc(db, 'market_materials', material.id);
    await setDoc(docRef, material);
    console.log(`Added: ${material.name}`);
    addedCount++;
  }

  console.log(`\nCompleted! Updated: ${updatedCount}, Added: ${addedCount}`);
  process.exit(0);
}

run().catch(console.error);
