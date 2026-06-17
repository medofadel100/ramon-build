import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { MarketMaterial } from '@/types/market';

interface MarketState {
  materials: MarketMaterial[];
  loading: boolean;
  error: string | null;
  fetchMaterials: () => Promise<void>;
  addOrUpdateMaterial: (material: MarketMaterial) => Promise<void>;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  materials: [],
  loading: false,
  error: null,

  fetchMaterials: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'market_materials'));
      const querySnapshot = await getDocs(q);
      const materials: MarketMaterial[] = [];
      querySnapshot.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() } as MarketMaterial);
      });
      set({ materials, loading: false });
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
