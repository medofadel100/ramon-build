import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, onSnapshot } from 'firebase/firestore';
import { DEFAULT_MARKET_MATERIALS } from '@/lib/market-default-materials';
import { normalizeMarketMaterialSources } from '@/lib/market-sources';
import { MarketMaterial } from '@/types/market';

interface MarketState {
  materials: MarketMaterial[];
  loading: boolean;
  error: string | null;
  lastSync: number | null;
  startMaterialSync: () => void;
  stopMaterialSync: () => void;
  fetchMaterials: () => Promise<void>;
  addOrUpdateMaterial: (material: MarketMaterial) => Promise<void>;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  materials: [],
  loading: false,
  error: null,
  lastSync: null,

  startMaterialSync: () => {
    const state = get() as any;
    if (state._materialSyncActive) return;
    set({ loading: true });
    const collectionRef = collection(db, 'market_materials');
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const materials: MarketMaterial[] = [];
      snapshot.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() } as MarketMaterial);
      });
      const merged = [...materials];
      DEFAULT_MARKET_MATERIALS.forEach((defaultItem) => {
        const normalizedDefault = normalizeMarketMaterialSources(defaultItem) as MarketMaterial;
        if (!merged.some((m) => m.id === normalizedDefault.id)) {
          merged.push(normalizedDefault);
        }
      });
      set({ materials: merged, loading: false, error: null, lastSync: Date.now(), _materialSyncActive: true, _materialSyncUnsubscribe: unsubscribe } as any);
    }, (error) => {
      console.error('Market sync failed:', error);
      set({ error: error.message, loading: false, _materialSyncActive: false } as any);
    });
  },

  stopMaterialSync: () => {
    const state = get() as any;
    if (state._materialSyncUnsubscribe) {
      state._materialSyncUnsubscribe();
      set({ _materialSyncUnsubscribe: null, _materialSyncActive: false } as any);
    }
  },

  fetchMaterials: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'market_materials'));
      const querySnapshot = await getDocs(q);
      const materials: MarketMaterial[] = [];
      querySnapshot.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() } as MarketMaterial);
      });
      const merged = [...materials];
      DEFAULT_MARKET_MATERIALS.forEach((defaultItem) => {
        const normalizedDefault = normalizeMarketMaterialSources(defaultItem) as MarketMaterial;
        if (!merged.some((m) => m.id === normalizedDefault.id)) {
          merged.push(normalizedDefault);
        }
      });
      set({ materials: merged, loading: false });
    } catch (error: any) {
      console.error("Error fetching market materials:", error);
      set({ error: error.message, loading: false });
    }
  },

  addOrUpdateMaterial: async (material: MarketMaterial) => {
    try {
      await setDoc(doc(db, 'market_materials', material.id), material);
      const currentMaterials = get().materials;
      const index = currentMaterials.findIndex(m => m.id === material.id);
      if (index >= 0) {
        const updated = [...currentMaterials];
        updated[index] = material;
        set({ materials: updated });
      } else {
        set({ materials: [...currentMaterials, material] });
      }
    } catch (error: any) {
      console.error("Error adding/updating material:", error);
      throw error;
    }
  }
}));
