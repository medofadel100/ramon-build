import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { MARKET_SOURCE_REGISTRY, findSourceDefinitionByDomain, findSourceDefinitionByStoreName, resolveSourceUrl, normalizeMarketMaterialSources, buildMarketSource } from '../../src/lib/market-sources';
import { scrapePriceFromSource } from './market-price-scrapers';

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

function guessSourceDefinition(source: any) {
  const fromUrl = source?.url ? findSourceDefinitionByDomain(source.url) : undefined;
  const fromName = findSourceDefinitionByStoreName(source?.storeName || '');
  return fromUrl || fromName;
}

async function refreshPriceForSource(source: any, materialName: string) {
  const resolvedUrl = resolveSourceUrl(source, materialName);
  const sourceWithUrl = { ...source, url: resolvedUrl, lastUpdated: Date.now() };
  const definition = guessSourceDefinition(sourceWithUrl);
  const updatedSource = buildMarketSource(sourceWithUrl, materialName);

  if (!definition || !resolvedUrl || resolvedUrl === '#') {
    return updatedSource;
  }

  const scrapedPrice = await scrapePriceFromSource(sourceWithUrl);
  if (scrapedPrice !== null) {
    return buildMarketSource({ ...updatedSource, price: scrapedPrice, isAvailable: true, lastUpdated: Date.now() }, materialName);
  }

  return updatedSource;
}

async function refreshSourcePrices(material: any) {
  const normalizedMaterial = normalizeMarketMaterialSources(material);
  const updatedSources = await Promise.all((normalizedMaterial.sources || []).map((source: any) => refreshPriceForSource(source, normalizedMaterial.name)));
  const lowestPrice = updatedSources.length > 0 ? Math.min(...updatedSources.map((s: any) => s.price)) : ((normalizedMaterial as any).lowestPrice || 0);
  return { sources: updatedSources, lowestPrice };
}

async function run() {
  console.log('Starting market price updater...');
  console.log(`Known supplier domains: ${MARKET_SOURCE_REGISTRY.map((source) => source.domain).join(', ')}`);

  const colRef = collection(db, 'market_materials');
  const snapshot = await getDocs(colRef);
  let updated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    try {
      const { sources, lowestPrice } = await refreshSourcePrices(data);
      await updateDoc(doc(db, 'market_materials', docSnap.id), {
        sources,
        lowestPrice,
        updatedAt: Date.now()
      } as any);
      updated++;
    } catch (err) {
      console.error('Failed to update', docSnap.id, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Market updater completed. Updated ${updated} items.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
