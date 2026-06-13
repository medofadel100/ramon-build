import { create } from 'zustand';
import { 
  ProjectData, 
  ProjectHeader, 
  getProjectData, 
  updateProjectHeader, 
  dbAddZone, 
  dbUpdateZone, 
  dbDeleteZone, 
  dbUpdateItem, 
  dbDeleteItem,
  dbToggleSection,
  updateProjectSharing
} from '@/lib/project-service';
import { Zone, BOQItem, calculateWallArea } from '@/lib/calculations';

interface ProjectState {
  currentProject: ProjectData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // Database actions
  loadProject: (projectId: string) => Promise<void>;
  
  // Header operations
  updateHeader: (headerUpdates: Partial<ProjectHeader>) => Promise<void>;
  
  // Sharing operations
  updateSharing: (settings: { showPrices: boolean; showDetailedPricing: boolean }) => Promise<void>;

  // Zone operations
  addZone: (zoneInput: Omit<Zone, 'id' | 'wallArea' | 'ceilingArea'>) => Promise<void>;
  updateZone: (zoneId: string, zoneInput: Partial<Zone>) => Promise<void>;
  deleteZone: (zoneId: string) => Promise<void>;
  
  // Item operations
  updateItem: (item: BOQItem) => Promise<void>;
  addCustomItem: (sectionId: string, item: Omit<BOQItem, 'id' | 'sectionId'>) => Promise<void>;
  deleteItem: (sectionId: string, itemId: string) => Promise<void>;
  
  // Section operations
  toggleSection: (sectionId: string, enabled: boolean) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  loading: false,
  saving: false,
  error: null,

  loadProject: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await getProjectData(projectId);
      if (data) {
        set({ currentProject: data, loading: false });
      } else {
        set({ error: 'المشروع غير موجود', loading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'خطأ أثناء تحميل البيانات', loading: false });
    }
  },

  updateHeader: async (headerUpdates: Partial<ProjectHeader>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedHeader = { ...currentProject.header, ...headerUpdates };
    
    // Update local state immediately
    set({
      currentProject: {
        ...currentProject,
        header: updatedHeader
      },
      saving: true
    });

    try {
      await updateProjectHeader(currentProject.id, updatedHeader);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to save header updates:', err);
      set({ saving: false });
    }
  },

  updateSharing: async (settings: { showPrices: boolean; showDetailedPricing: boolean }) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        clientShareSettings: settings
      },
      saving: true
    });

    try {
      await updateProjectSharing(currentProject.id, settings);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to save sharing updates:', err);
      set({ saving: false });
    }
  },

  addZone: async (zoneInput) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const id = `zone_${Date.now()}`;
    const wallArea = calculateWallArea(zoneInput.perimeter, zoneInput.height, zoneInput.deductions);
    const newZone: Zone = {
      ...zoneInput,
      id,
      wallArea,
      ceilingArea: zoneInput.floorArea
    };

    // Update locally
    const updatedZones = [...currentProject.zones, newZone];
    set({
      currentProject: {
        ...currentProject,
        zones: updatedZones
      },
      saving: true
    });

    try {
      await dbAddZone(currentProject.id, newZone);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to add zone:', err);
      set({ saving: false });
    }
  },

  updateZone: async (zoneId, zoneUpdates) => {
    const { currentProject } = get();
    if (!currentProject) return;

    // Map and recalculate
    const updatedZones = currentProject.zones.map(z => {
      if (z.id === zoneId) {
        const merged = { ...z, ...zoneUpdates };
        const wallArea = calculateWallArea(merged.perimeter, merged.height, merged.deductions);
        return {
          ...merged,
          wallArea,
          ceilingArea: merged.floorArea
        };
      }
      return z;
    });

    set({
      currentProject: {
        ...currentProject,
        zones: updatedZones
      },
      saving: true
    });

    const targetZone = updatedZones.find(z => z.id === zoneId);
    if (!targetZone) return;

    try {
      await dbUpdateZone(currentProject.id, zoneId, targetZone);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to update zone:', err);
      set({ saving: false });
    }
  },

  deleteZone: async (zoneId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedZones = currentProject.zones.filter(z => z.id !== zoneId);
    set({
      currentProject: {
        ...currentProject,
        zones: updatedZones
      },
      saving: true
    });

    try {
      await dbDeleteZone(currentProject.id, zoneId);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to delete zone:', err);
      set({ saving: false });
    }
  },

  updateItem: async (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedItems = currentProject.items.map(it => it.id === item.id ? item : it);
    set({
      currentProject: {
        ...currentProject,
        items: updatedItems
      },
      saving: true
    });

    try {
      await dbUpdateItem(currentProject.id, item);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to update item:', err);
      set({ saving: false });
    }
  },

  addCustomItem: async (sectionId, itemInput) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const id = `item_custom_${Date.now()}`;
    const newItem: BOQItem = {
      ...itemInput,
      id,
      sectionId,
      isActive: true
    } as BOQItem;

    const updatedItems = [...currentProject.items, newItem];
    set({
      currentProject: {
        ...currentProject,
        items: updatedItems
      },
      saving: true
    });

    try {
      await dbUpdateItem(currentProject.id, newItem);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to add custom item:', err);
      set({ saving: false });
    }
  },

  deleteItem: async (sectionId, itemId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedItems = currentProject.items.filter(it => it.id !== itemId);
    set({
      currentProject: {
        ...currentProject,
        items: updatedItems
      },
      saving: true
    });

    try {
      await dbDeleteItem(currentProject.id, sectionId, itemId);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      set({ saving: false });
    }
  },

  toggleSection: async (sectionId, enabled) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedSections = currentProject.sections.map(sec => 
      sec.id === sectionId ? { ...sec, enabled } : sec
    );

    set({
      currentProject: {
        ...currentProject,
        sections: updatedSections
      },
      saving: true
    });

    try {
      await dbToggleSection(currentProject.id, sectionId, enabled);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to toggle section:', err);
      set({ saving: false });
    }
  }
}));
