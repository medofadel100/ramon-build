import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { DEFAULT_MARKET_MATERIALS } from '../../src/lib/market-default-materials';
import { normalizeMarketMaterialSources } from '../../src/lib/market-sources';

// Use the same firebaseConfig as other scraper scripts in this repo
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

async function seedDefaults() {
  console.log(`Seeding ${DEFAULT_MARKET_MATERIALS.length} default market materials...`);
  let count = 0;
  for (const mat of DEFAULT_MARKET_MATERIALS) {
    const id = mat.id || mat.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const docRef = doc(db, 'market_materials', id);
    const normalizedMaterial = normalizeMarketMaterialSources({ ...mat, id });
    try {
      await setDoc(docRef, normalizedMaterial);
      console.log(`Seeded: ${mat.name} (id: ${id})`);
      count++;
    } catch (err) {
      console.error('Failed to seed', mat.name, err);
    }
  }
  console.log(`Completed seeding ${count} items.`);
  process.exit(0);
}

seedDefaults().catch((e) => {
  console.error(e);
  process.exit(1);
});
