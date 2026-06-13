import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_SECTIONS, DEFAULT_ITEMS } from './default-items';
import { Zone, BOQItem } from './calculations';

export interface ProjectHeader {
  name: string;
  ownerName: string;
  ownerPhone: string;
  designCode: string;
  projectCode: string;
  governorate: string;
  addressDetails: string;
  issueDate: string;
  status: 'draft' | 'review' | 'approved' | 'sent_to_client' | 'closed';
  projectType: {
    workType: 'new_build' | 'finishing_only' | 'renovation';
    hasArchModification: boolean;
    foundationType: 'full' | 'partial' | 'none';
  };
  assignedEngineers: string[];
}

export interface ProjectData {
  id: string;
  header: ProjectHeader;
  zones: Zone[];
  sections: Array<{ id: string; sectionKey: string; title: string; enabled: boolean }>;
  items: BOQItem[];
  clientShareToken: string;
  clientShareSettings: { showPrices: boolean; showDetailedPricing: boolean };
}

// Helper: Generate unique project code (e.g., RMD-2026-001)
export async function generateProjectCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const projectsRef = collection(db, 'projects');
  
  // Query all projects of the current year
  const q = query(
    projectsRef, 
    where('header.projectCode', '>=', `RMD-${currentYear}-000`),
    where('header.projectCode', '<=', `RMD-${currentYear}-999`),
    orderBy('header.projectCode', 'desc'),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  let nextNum = 1;

  if (!querySnapshot.empty) {
    const lastCode = querySnapshot.docs[0].data().header?.projectCode;
    if (lastCode) {
      const parts = lastCode.split('-');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
    }
  }

  const paddedNum = String(nextNum).padStart(3, '0');
  return `RMD-${currentYear}-${paddedNum}`;
}

// 1. Create a Project and Seed all Templates
export async function createProject(
  headerInput: Omit<ProjectHeader, 'projectCode' | 'assignedEngineers'>,
  zonesInput: Omit<Zone, 'id' | 'wallArea' | 'ceilingArea'>[],
  engineerId: string
): Promise<string> {
  const projectId = doc(collection(db, 'projects')).id;
  const projectCode = await generateProjectCode();
  
  const header: ProjectHeader = {
    ...headerInput,
    projectCode,
    assignedEngineers: [engineerId]
  };

  const clientShareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const clientShareSettings = { showPrices: true, showDetailedPricing: true };

  // 1. Write Project document
  const projectDocRef = doc(db, 'projects', projectId);
  await setDoc(projectDocRef, {
    id: projectId,
    header,
    clientShareToken,
    clientShareSettings,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const batch = writeBatch(db);

  // 2. Add Zones (calculate fields)
  const zones: Zone[] = zonesInput.map((z, idx) => {
    const id = `zone_${idx}_${Date.now()}`;
    const wallArea = (z.perimeter * z.height) - z.deductions;
    return {
      ...z,
      id,
      wallArea: Math.max(0, wallArea),
      ceilingArea: z.floorArea
    };
  });

  for (const zone of zones) {
    const zoneDocRef = doc(db, 'projects', projectId, 'areas', zone.id);
    batch.set(zoneDocRef, zone);
  }

  // 3. Add Sections (Filter and seed templates)
  const sections = DEFAULT_SECTIONS.map((sec) => {
    // Determine if section is enabled based on project wizard choices
    let enabled = true;
    if (sec.id === '1.1' && !header.projectType.hasArchModification) {
      enabled = false;
    }
    return {
      id: sec.id,
      sectionKey: sec.sectionKey,
      title: sec.title,
      enabled
    };
  });

  for (const sec of sections) {
    const secDocRef = doc(db, 'projects', projectId, 'sections', sec.id);
    batch.set(secDocRef, sec);
  }

  // 4. Add Items (Filter and seed templates)
  const itemsToSeed = DEFAULT_ITEMS.filter((item) => {
    // If section is disabled, or requiresArchModification is true but project doesn't have it, skip or set inactive
    if (item.requiresArchModification && !header.projectType.hasArchModification) {
      return false;
    }
    return true;
  });

  for (const item of itemsToSeed) {
    const itemDocRef = doc(db, 'projects', projectId, 'sections', item.sectionId, 'items', item.id);
    
    // Convert specs template fields to default values mapping
    const specsMap: Record<string, any> = {};
    item.specs.forEach(field => {
      specsMap[field.key] = field.defaultValue;
    });

    const boqItem: BOQItem = {
      id: item.id,
      sectionId: item.sectionId,
      title: item.title,
      unit: item.unit,
      quantitySource: item.quantitySource,
      calculationFormula: item.calculationFormula || '',
      specs: specsMap,
      perAreaOverrides: {},
      pricing: {
        mode: item.defaultPricing.mode,
        materialUnitPrice: item.defaultPricing.materialUnitPrice,
        laborUnitPrice: item.defaultPricing.laborUnitPrice,
        lumpSumPrice: item.defaultPricing.lumpSumPrice,
        dailyRate: item.defaultPricing.dailyRate,
        estimatedDays: item.defaultPricing.estimatedDays
      },
      notes: '',
      egyptianCodeRef: item.egyptianCodeRef || '',
      isActive: true
    };

    // If renovation, add the action property
    if (header.projectType.workType === 'renovation') {
      boqItem.renovationAction = 'new_addition';
    }

    batch.set(itemDocRef, boqItem);
  }

  await batch.commit();
  return projectId;
}

// 2. Fetch Complete Project Data Tree
export async function getProjectData(projectId: string): Promise<ProjectData | null> {
  const projectDocRef = doc(db, 'projects', projectId);
  const projectSnap = await getDoc(projectDocRef);
  
  if (!projectSnap.exists()) {
    return null;
  }

  const pData = projectSnap.data();

  // Fetch Areas (Zones)
  const areasSnapshot = await getDocs(collection(db, 'projects', projectId, 'areas'));
  const zones: Zone[] = areasSnapshot.docs.map(doc => doc.data() as Zone);

  // Fetch Sections
  const sectionsSnapshot = await getDocs(collection(db, 'projects', projectId, 'sections'));
  const sections = sectionsSnapshot.docs.map(doc => doc.data() as any);

  // Fetch all Items from all sections in parallel
  const items: BOQItem[] = [];
  const itemPromises = sections.map(async (sec) => {
    const itemsSnapshot = await getDocs(collection(db, 'projects', projectId, 'sections', sec.id, 'items'));
    itemsSnapshot.docs.forEach(doc => {
      items.push(doc.data() as BOQItem);
    });
  });

  await Promise.all(itemPromises);

  // Sort items by ID to keep consistent order
  items.sort((a, b) => a.id.localeCompare(b.id));

  // Sort sections by ID
  sections.sort((a, b) => a.id.localeCompare(b.id));

  return {
    id: projectId,
    header: pData.header,
    zones,
    sections,
    items,
    clientShareToken: pData.clientShareToken,
    clientShareSettings: pData.clientShareSettings || { showPrices: true, showDetailedPricing: true }
  };
}

// 3. Update Project Header Info
export async function updateProjectHeader(projectId: string, header: ProjectHeader): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    header,
    updatedAt: serverTimestamp()
  });
}

// 4. Update Sharing Settings
export async function updateProjectSharing(
  projectId: string, 
  settings: { showPrices: boolean; showDetailedPricing: boolean }
): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    clientShareSettings: settings,
    updatedAt: serverTimestamp()
  });
}

// 5. CRUD Zones
export async function dbAddZone(projectId: string, zone: Zone): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'areas', zone.id);
  await setDoc(docRef, zone);
  
  // Touch project updated timestamp
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbUpdateZone(projectId: string, zoneId: string, zone: Zone): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'areas', zoneId);
  await setDoc(docRef, zone);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbDeleteZone(projectId: string, zoneId: string): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'areas', zoneId);
  await deleteDoc(docRef);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

// 6. Item update operations
export async function dbUpdateItem(projectId: string, item: BOQItem): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'sections', item.sectionId, 'items', item.id);
  await setDoc(docRef, item);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbDeleteItem(projectId: string, sectionId: string, itemId: string): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'sections', sectionId, 'items', itemId);
  await deleteDoc(docRef);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

// 7. Toggle Section enabled
export async function dbToggleSection(projectId: string, sectionId: string, enabled: boolean): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'sections', sectionId);
  await updateDoc(docRef, { enabled });
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}
