import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

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

// Helper to escape CSV fields containing commas or quotes
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportMaterials() {
  console.log('Fetching materials from Firestore...');
  const querySnapshot = await getDocs(collection(db, 'market_materials'));
  
  const materials: any[] = [];
  querySnapshot.forEach((doc) => {
    materials.push(doc.data());
  });

  console.log(`Found ${materials.length} materials. Generating CSV...`);

  const headers = [
    'ID', 'Name', 'Category', 'SubCategory', 'Phase', 
    'Brand', 'Unit', 'LowestPrice', 'Description', 'SourcesCount'
  ];

  const csvRows = [
    headers.join(',')
  ];

  for (const mat of materials) {
    const row = [
      escapeCSV(mat.id),
      escapeCSV(mat.name),
      escapeCSV(mat.category),
      escapeCSV(mat.subCategory),
      escapeCSV(mat.phase),
      escapeCSV(mat.brand),
      escapeCSV(mat.unit),
      escapeCSV(mat.lowestPrice),
      escapeCSV(mat.description),
      escapeCSV(mat.sources ? mat.sources.length : 0)
    ];
    csvRows.push(row.join(','));
  }

  // Use BOM for Excel to open UTF-8 CSV properly
  const bom = '\uFEFF';
  const csvContent = bom + csvRows.join('\n');
  
  const outputPath = path.join(process.cwd(), 'exported_materials.csv');
  fs.writeFileSync(outputPath, csvContent, 'utf8');

  console.log(`✅ Successfully exported to ${outputPath}`);
}

exportMaterials().catch(console.error);
