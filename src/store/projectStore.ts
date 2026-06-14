import { create } from 'zustand';
import { 
  ProjectData, 
  ProjectHeader, 
  Supplier,
  Worker,
  AccountEntry,
  getProjectData, 
  updateProjectHeader, 
  dbAddZone, 
  dbUpdateZone, 
  dbDeleteZone, 
  dbUpdateItem, 
  dbDeleteItem,
  dbToggleSection,
  updateProjectSharing,
  dbAddSupplier,
  dbUpdateSupplier,
  dbDeleteSupplier,
  dbAddWorker,
  dbUpdateWorker,
  dbDeleteWorker,
  dbAddAccount,
  dbUpdateAccount,
  dbDeleteAccount,
  deleteProject,
  dbUpdateProjectConstants
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
  
  // Project-wide operations
  updateProject: (updates: Partial<ProjectData>) => Promise<void>;

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

  // Supplier operations
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  removeSupplier: (supplierId: string) => Promise<void>;

  // Worker operations
  addWorker: (worker: Omit<Worker, 'id'>) => Promise<void>;
  updateWorkerData: (worker: Worker) => Promise<void>;
  removeWorker: (workerId: string) => Promise<void>;

  // Account operations
  addAccount: (account: Omit<AccountEntry, 'id'>) => Promise<void>;
  updateAccount: (account: AccountEntry) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;

  // Project deletion
  deleteCurrentProject: () => Promise<void>;
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

  updateProject: async (updates: Partial<ProjectData>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        ...updates
      },
      saving: true
    });

    try {
      if (updates.projectConstants || updates.customConstantsDefinitions) {
        await dbUpdateProjectConstants(
          currentProject.id, 
          updates.projectConstants || currentProject.projectConstants || {},
          updates.customConstantsDefinitions
        );
      }
      // Add other partial updates here if needed
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to update project:', err);
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
  },

  // ==========================================
  // Supplier operations
  // ==========================================
  addSupplier: async (supplierInput) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const id = `supplier_${Date.now()}`;
    const newSupplier: Supplier = { ...supplierInput, id };
    const updatedSuppliers = [...(currentProject.suppliers || []), newSupplier];

    set({
      currentProject: { ...currentProject, suppliers: updatedSuppliers },
      saving: true
    });

    try {
      await dbAddSupplier(currentProject.id, newSupplier);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to add supplier:', err);
      set({ saving: false });
    }
  },

  updateSupplier: async (supplier) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedSuppliers = (currentProject.suppliers || []).map(s => s.id === supplier.id ? supplier : s);
    set({
      currentProject: { ...currentProject, suppliers: updatedSuppliers },
      saving: true
    });

    try {
      await dbUpdateSupplier(currentProject.id, supplier);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to update supplier:', err);
      set({ saving: false });
    }
  },

  removeSupplier: async (supplierId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedSuppliers = (currentProject.suppliers || []).filter(s => s.id !== supplierId);
    set({
      currentProject: { ...currentProject, suppliers: updatedSuppliers },
      saving: true
    });

    try {
      await dbDeleteSupplier(currentProject.id, supplierId);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to delete supplier:', err);
      set({ saving: false });
    }
  },

  // ==========================================
  // Worker operations
  // ==========================================
  addWorker: async (workerInput) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const id = `worker_${Date.now()}`;
    const newWorker: Worker = { ...workerInput, id };
    const updatedWorkers = [...(currentProject.workers || []), newWorker];

    set({
      currentProject: { ...currentProject, workers: updatedWorkers },
      saving: true
    });

    try {
      await dbAddWorker(currentProject.id, newWorker);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to add worker:', err);
      set({ saving: false });
    }
  },

  updateWorkerData: async (worker) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedWorkers = (currentProject.workers || []).map(w => w.id === worker.id ? worker : w);
    set({
      currentProject: { ...currentProject, workers: updatedWorkers },
      saving: true
    });

    try {
      await dbUpdateWorker(currentProject.id, worker);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to update worker:', err);
      set({ saving: false });
    }
  },

  removeWorker: async (workerId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedWorkers = (currentProject.workers || []).filter(w => w.id !== workerId);
    set({
      currentProject: { ...currentProject, workers: updatedWorkers },
      saving: true
    });

    try {
      await dbDeleteWorker(currentProject.id, workerId);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to delete worker:', err);
      set({ saving: false });
    }
  },

  // ==========================================
  // Account operations
  // ==========================================
  addAccount: async (accountInput) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const id = `account_${Date.now()}`;
    const newAccount: AccountEntry = { ...accountInput, id };
    const updatedAccounts = [...(currentProject.accounts || []), newAccount];

    set({
      currentProject: { ...currentProject, accounts: updatedAccounts },
      saving: true
    });

    try {
      await dbAddAccount(currentProject.id, newAccount);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to add account:', err);
      set({ saving: false });
    }
  },

  updateAccount: async (account) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedAccounts = (currentProject.accounts || []).map(a => a.id === account.id ? account : a);
    set({
      currentProject: { ...currentProject, accounts: updatedAccounts },
      saving: true
    });

    try {
      await dbUpdateAccount(currentProject.id, account);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to update account:', err);
      set({ saving: false });
    }
  },

  removeAccount: async (accountId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedAccounts = (currentProject.accounts || []).filter(a => a.id !== accountId);
    set({
      currentProject: { ...currentProject, accounts: updatedAccounts },
      saving: true
    });

    try {
      await dbDeleteAccount(currentProject.id, accountId);
      set({ saving: false });
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      set({ saving: false });
    }
  },

  // ==========================================
  // Project deletion
  // ==========================================
  deleteCurrentProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ saving: true });

    try {
      await deleteProject(currentProject.id);
      set({ currentProject: null, saving: false });
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      set({ saving: false });
    }
  }
}));
