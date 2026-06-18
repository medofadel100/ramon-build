import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

let __dirnameStr = '';
try {
  __dirnameStr = dirname(fileURLToPath(import.meta.url));
} catch (e) {
  __dirnameStr = __dirname || process.cwd() + '/scripts/scraper';
}

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

async function seedMissingMaterials() {
  const dataPath = join(__dirnameStr, '../../data/missing_materials.json');
  console.log('Reading data from:', dataPath);
  
  const rawData = readFileSync(dataPath, 'utf-8');
  const materials = JSON.parse(rawData);

  console.log(`Starting seed process for ${materials.length} items...`);
  
  const collectionRef = collection(db, 'market_materials');

  let batch = writeBatch(db);
  let count = 0;

  for (const material of materials) {
    const newDocRef = doc(collectionRef, material.id);
    
    // Normalize sources structure to ensure Date objects aren't strings in firestore if not desired, 
    // but the DB can handle ISO strings or timestamps. The existing data uses timestamps. 
    // Let's use Date.now() for lastUpdated.
    material.sources = material.sources.map((s: any) => ({
        ...s,
        lastUpdated: Date.now()
    }));

    batch.set(newDocRef, material);
    count++;
    console.log(`Prepared: [${material.category}] ${material.name}`);
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${count} missing materials to Firestore!`);
}

seedMissingMaterials().catch(console.error);
