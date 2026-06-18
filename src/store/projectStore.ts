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
  savingOperation: string | null;
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
  deleteProjectById: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const setSaving = (operation: string | null) => set({ saving: operation !== null, savingOperation: operation });

  return {
    currentProject: null,
    loading: false,
    saving: false,
    savingOperation: null,
    error: null,

  loadProject: async (projectId: string) => {
    setSaving('loadProject');
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
    } finally {
      setSaving(null);
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
      }
    });
    setSaving('updateHeader');

    try {
      await updateProjectHeader(currentProject.id, updatedHeader);
    } catch (err: any) {
      console.error('Failed to save header updates:', err);
    } finally {
      setSaving(null);
    }
  },

  updateSharing: async (settings: { showPrices: boolean; showDetailedPricing: boolean }) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        clientShareSettings: settings
      }
    });
    setSaving('updateSharing');

    try {
      await updateProjectSharing(currentProject.id, settings);
    } catch (err: any) {
      console.error('Failed to save sharing updates:', err);
    } finally {
      setSaving(null);
    }
  },

  updateProject: async (updates: Partial<ProjectData>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        ...updates
      }
    });
    setSaving('updateProject');

    try {
      if (updates.header) {
        await updateProjectHeader(currentProject.id, { ...currentProject.header, ...updates.header });
      }
      if (updates.clientShareSettings) {
        await updateProjectSharing(currentProject.id, updates.clientShareSettings);
      }
      if (updates.projectConstants || updates.customConstantsDefinitions) {
        await dbUpdateProjectConstants(
          currentProject.id,
          updates.projectConstants || currentProject.projectConstants || {},
          updates.customConstantsDefinitions
        );
      }
    } catch (err: any) {
      console.error('Failed to update project:', err);
    } finally {
      setSaving(null);
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

    const updatedZones = [...currentProject.zones, newZone];
    set({
      currentProject: {
        ...currentProject,
        zones: updatedZones
      }
    });
    setSaving('addZone');

    try {
      await dbAddZone(currentProject.id, newZone);
    } catch (err: any) {
      console.error('Failed to add zone:', err);
    } finally {
      setSaving(null);
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
      }
    });
    setSaving('updateZone');

    const targetZone = updatedZones.find(z => z.id === zoneId);
    if (!targetZone) {
      setSaving(null);
      return;
    }

    try {
      await dbUpdateZone(currentProject.id, zoneId, targetZone);
    } catch (err: any) {
      console.error('Failed to update zone:', err);
    } finally {
      setSaving(null);
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
      }
    });
    setSaving('deleteZone');

    try {
      await dbDeleteZone(currentProject.id, zoneId);
    } catch (err: any) {
      console.error('Failed to delete zone:', err);
    } finally {
      setSaving(null);
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
      }
    });
    setSaving('updateItem');

    try {
      await dbUpdateItem(currentProject.id, item);
    } catch (err: any) {
      console.error('Failed to update item:', err);
    } finally {
      setSaving(null);
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
      }
    });
    setSaving('addCustomItem');

    try {
      await dbUpdateItem(currentProject.id, newItem);
    } catch (err: any) {
      console.error('Failed to add custom item:', err);
    } finally {
      setSaving(null);
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
      }
    });
    setSaving('deleteItem');

    try {
      await dbDeleteItem(currentProject.id, sectionId, itemId);
    } catch (err: any) {
      console.error('Failed to delete item:', err);
    } finally {
      setSaving(null);
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
      }
    });
    setSaving('toggleSection');

    try {
      await dbToggleSection(currentProject.id, sectionId, enabled);
    } catch (err: any) {
      console.error('Failed to toggle section:', err);
    } finally {
      setSaving(null);
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

    set({ currentProject: { ...currentProject, suppliers: updatedSuppliers } });
    setSaving('addSupplier');

    try {
      await dbAddSupplier(currentProject.id, newSupplier);
    } catch (err: any) {
      console.error('Failed to add supplier:', err);
    } finally {
      setSaving(null);
    }
  },

  updateSupplier: async (supplier) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedSuppliers = (currentProject.suppliers || []).map(s => s.id === supplier.id ? supplier : s);
    set({ currentProject: { ...currentProject, suppliers: updatedSuppliers } });
    setSaving('updateSupplier');

    try {
      await dbUpdateSupplier(currentProject.id, supplier);
    } catch (err: any) {
      console.error('Failed to update supplier:', err);
    } finally {
      setSaving(null);
    }
  },

  removeSupplier: async (supplierId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedSuppliers = (currentProject.suppliers || []).filter(s => s.id !== supplierId);
    set({ currentProject: { ...currentProject, suppliers: updatedSuppliers } });
    setSaving('removeSupplier');

    try {
      await dbDeleteSupplier(currentProject.id, supplierId);
    } catch (err: any) {
      console.error('Failed to delete supplier:', err);
    } finally {
      setSaving(null);
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

    set({ currentProject: { ...currentProject, workers: updatedWorkers } });
    setSaving('addWorker');

    try {
      await dbAddWorker(currentProject.id, newWorker);
    } catch (err: any) {
      console.error('Failed to add worker:', err);
    } finally {
      setSaving(null);
    }
  },

  updateWorkerData: async (worker) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedWorkers = (currentProject.workers || []).map(w => w.id === worker.id ? worker : w);
    set({ currentProject: { ...currentProject, workers: updatedWorkers } });
    setSaving('updateWorkerData');

    try {
      await dbUpdateWorker(currentProject.id, worker);
    } catch (err: any) {
      console.error('Failed to update worker:', err);
    } finally {
      setSaving(null);
    }
  },

  removeWorker: async (workerId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedWorkers = (currentProject.workers || []).filter(w => w.id !== workerId);
    set({ currentProject: { ...currentProject, workers: updatedWorkers } });
    setSaving('removeWorker');

    try {
      await dbDeleteWorker(currentProject.id, workerId);
    } catch (err: any) {
      console.error('Failed to delete worker:', err);
    } finally {
      setSaving(null);
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

    set({ currentProject: { ...currentProject, accounts: updatedAccounts } });
    setSaving('addAccount');

    try {
      await dbAddAccount(currentProject.id, newAccount);
    } catch (err: any) {
      console.error('Failed to add account:', err);
    } finally {
      setSaving(null);
    }
  },

  updateAccount: async (account) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedAccounts = (currentProject.accounts || []).map(a => a.id === account.id ? account : a);
    set({ currentProject: { ...currentProject, accounts: updatedAccounts } });
    setSaving('updateAccount');

    try {
      await dbUpdateAccount(currentProject.id, account);
    } catch (err: any) {
      console.error('Failed to update account:', err);
    } finally {
      setSaving(null);
    }
  },

  removeAccount: async (accountId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedAccounts = (currentProject.accounts || []).filter(a => a.id !== accountId);
    set({ currentProject: { ...currentProject, accounts: updatedAccounts } });
    setSaving('removeAccount');

    try {
      await dbDeleteAccount(currentProject.id, accountId);
    } catch (err: any) {
      console.error('Failed to delete account:', err);
    } finally {
      setSaving(null);
    }
  },

  // ==========================================
  // Project deletion
  // ==========================================
  deleteCurrentProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    setSaving('deleteCurrentProject');

    try {
      await deleteProject(currentProject.id);
      set({ currentProject: null });
    } catch (err: any) {
      console.error('Failed to delete project:', err);
    } finally {
      setSaving(null);
    }
  },

  deleteProjectById: async (projectId: string) => {
    const { currentProject } = get();
    setSaving('deleteCurrentProject');

    try {
      await deleteProject(projectId);
      if (currentProject?.id === projectId) {
        set({ currentProject: null });
      }
    } catch (err: any) {
      console.error('Failed to delete project by id:', err);
    } finally {
      setSaving(null);
    }
  }
  }
});
