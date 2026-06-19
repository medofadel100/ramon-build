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
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_SECTIONS, DEFAULT_ITEMS } from './default-items';
import { Zone, BOQItem } from './calculations';
import { Attachment } from '@/components/project/ProjectAttachmentsTab';
import { ConstantDefinition, DEFAULT_CONSTANTS } from './constants';

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'غير متوفر';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// ==========================================
// Interfaces
// ==========================================

export interface AssignedEngineer {
  uid: string;
  name: string;
  email: string;
  specialty: 'electrical' | 'mechanical' | 'civil' | 'interior_design' | 'finishing_supervisor' | 'structural' | 'other';
  specialtyLabel: string;
  joinedAt: string;
}

export interface ScheduleOverride {
  id: string;
  title: string;
  startDay: number;
  duration: number;
  sourceSectionId?: string;
  color?: string;
  phase?: number;
}

export interface ProjectHeader {
  name: string;
  ownerName: string;
  ownerPhone: string;
  designCode: string;
  projectCode: string;
  governorate: string;
  addressDetails: string;
  issueDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  consultantName: string;
  status: 'quantity_prep' | 'pricing_prep' | 'review' | 'client_approval' | 'execution' | 'executed' | 'handover';
  supervisionPercentage?: number;
  projectType: {
    workType: 'new_build' | 'finishing_only' | 'renovation';
    hasArchModification: boolean;
    foundationType: 'full' | 'partial' | 'none';
  };
  assignedEngineers: string[];
  engineersDetails: AssignedEngineer[];
  scheduleOverrides?: ScheduleOverride[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  governorate?: string;
  address?: string;
  notes: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  trade: string;
  assignedItems: string[];
  dailyRate: number;
  governorate?: string;
  address?: string;
  notes: string;
}

export interface PaymentInstallment {
  id: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  paymentMethod?: string;
  receiptNote?: string;
}

export interface AccountEntry {
  id: string;
  personType: 'supplier' | 'worker' | 'client';
  personId: string;
  personName: string;
  totalAgreedAmount: number;
  retentionPercentage?: number;
  installments: PaymentInstallment[];
  notes: string;
}

export interface ProjectData {
  id: string;
  header: ProjectHeader;
  zones: Zone[];
  sections: Array<{ id: string; sectionKey: string; title: string; enabled: boolean }>;
  items: BOQItem[];
  clientShareToken: string;
  clientShareSettings: { showPrices: boolean; showDetailedPricing: boolean };
  suppliers?: Supplier[];
  workers?: Worker[];
  accounts?: AccountEntry[];
  attachments?: Attachment[];
  projectConstants?: Record<string, number>;
  customConstantsDefinitions?: ConstantDefinition[];
}

// ==========================================
// Helper: Generate unique project code
// ==========================================
export async function generateProjectCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const projectsRef = collection(db, 'projects');
  
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

// ==========================================
// Master Constants
// ==========================================
export async function dbGetMasterConstants(): Promise<ConstantDefinition[]> {
  const docRef = doc(db, 'settings', 'masterConstants');
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return DEFAULT_CONSTANTS;
    
    const data = snap.data();
    const dbConsts = Array.isArray(data?.constants) ? data.constants : [];
    
    const defaultMap = new Map(DEFAULT_CONSTANTS.map(c => [c.key, c]));
    
    const fixedDbConsts = dbConsts.map((c: Partial<ConstantDefinition>) => {
      if (!c || !c.key) return null;
      const def = defaultMap.get(c.key);
      if (def) {
        return {
          ...def,
          ...c,
          group: c.group || def.group,
          subgroup: c.subgroup || def.subgroup
        };
      }
      return c;
    }).filter(Boolean);

    const dbKeys = new Set(fixedDbConsts.map((c) => c?.key));
    const newDefaults = DEFAULT_CONSTANTS.filter(c => !dbKeys.has(c.key));
    
    return [...(fixedDbConsts.filter(Boolean) as ConstantDefinition[]), ...newDefaults];
  } catch (err) {
    console.error("Error fetching master constants:", err);
    return DEFAULT_CONSTANTS;
  }
}

export async function dbUpdateMasterConstants(constants: ConstantDefinition[]): Promise<void> {
  const docRef = doc(db, 'settings', 'masterConstants');
  await setDoc(docRef, { constants });
}

// ==========================================
// 1. Create a Project and Seed all Templates
// ==========================================
export async function createProject(
  headerInput: Omit<ProjectHeader, 'projectCode' | 'assignedEngineers' | 'engineersDetails' | 'expectedDeliveryDate' | 'actualDeliveryDate' | 'consultantName' | 'status' | 'supervisionPercentage'>,
  zonesInput: Omit<Zone, 'id' | 'wallArea' | 'ceilingArea'>[],
  engineerId: string,
  engineerName?: string,
  engineerEmail?: string,
  engineerSpecialty?: AssignedEngineer['specialty'],
  engineerSpecialtyLabel?: string
): Promise<string> {
  const projectId = doc(collection(db, 'projects')).id;
  const projectCode = await generateProjectCode();
  const masterConsts = await dbGetMasterConstants();
  
  const header: ProjectHeader = {
    ...headerInput,
    projectCode,
    expectedDeliveryDate: '',
    actualDeliveryDate: '',
    consultantName: '',
    status: 'quantity_prep',
    supervisionPercentage: 0,
    assignedEngineers: [engineerId],
    engineersDetails: [{
      uid: engineerId,
      name: engineerName || 'مهندس',
      email: engineerEmail || '',
      specialty: engineerSpecialty || 'finishing_supervisor',
      specialtyLabel: engineerSpecialtyLabel || 'مشرف تشطيبات',
      joinedAt: new Date().toISOString()
    }]
  };

  const clientShareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const clientShareSettings = { showPrices: true, showDetailedPricing: true };

  const projectConstantsMap: Record<string, number> = {};
  masterConsts.forEach(c => {
    projectConstantsMap[c.key] = c.defaultValue;
  });

  // 1. Write Project document
  const projectDocRef = doc(db, 'projects', projectId);
  await setDoc(projectDocRef, {
    id: projectId,
    header,
    clientShareToken,
    clientShareSettings,
    projectConstants: projectConstantsMap,
    customConstantsDefinitions: masterConsts.filter(c => !DEFAULT_CONSTANTS.find(dc => dc.key === c.key)),
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
    if (item.requiresArchModification && !header.projectType.hasArchModification) {
      return false;
    }
    return true;
  });

  for (const item of itemsToSeed) {
    const itemDocRef = doc(db, 'projects', projectId, 'sections', item.sectionId, 'items', item.id);
    
    const specsMap: Record<string, string | number | boolean> = {};
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

    if (header.projectType.workType === 'renovation') {
      boqItem.renovationAction = 'new_addition';
    }

    batch.set(itemDocRef, boqItem);
  }

  await batch.commit();
  return projectId;
}

// ==========================================
// 2. Fetch Complete Project Data Tree
// ==========================================
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
  const sections = sectionsSnapshot.docs.map(doc => doc.data() as { id: string; sectionKey: string; title: string; enabled: boolean });

  // Fetch all Items from all sections in parallel
  const items: BOQItem[] = [];
  const itemPromises = sections.map(async (sec) => {
    const itemsSnapshot = await getDocs(collection(db, 'projects', projectId, 'sections', sec.id, 'items'));
    itemsSnapshot.docs.forEach(doc => {
      items.push(doc.data() as BOQItem);
    });
  });

  await Promise.all(itemPromises);

  items.sort((a, b) => a.id.localeCompare(b.id));
  sections.sort((a, b) => a.id.localeCompare(b.id));

  // Fetch Suppliers
  const suppliersSnapshot = await getDocs(collection(db, 'projects', projectId, 'suppliers'));
  const suppliers: Supplier[] = suppliersSnapshot.docs.map(doc => doc.data() as Supplier);

  // Fetch Workers
  const workersSnapshot = await getDocs(collection(db, 'projects', projectId, 'workers'));
  const workers: Worker[] = workersSnapshot.docs.map(doc => doc.data() as Worker);

  // Fetch Accounts
  const accountsSnapshot = await getDocs(collection(db, 'projects', projectId, 'accounts'));
  const accounts: AccountEntry[] = accountsSnapshot.docs.map(doc => doc.data() as AccountEntry);

  const header: ProjectHeader = {
    ...pData.header,
    expectedDeliveryDate: pData.header?.expectedDeliveryDate || '',
    actualDeliveryDate: pData.header?.actualDeliveryDate || '',
    consultantName: pData.header?.consultantName || '',
    status: pData.header?.status === 'draft' ? 'quantity_prep' : pData.header?.status || 'quantity_prep',
    supervisionPercentage: pData.header?.supervisionPercentage || 0,
    engineersDetails: pData.header?.engineersDetails || []
  };

  return {
    id: projectId,
    header,
    zones,
    sections,
    items,
    clientShareToken: pData.clientShareToken,
    clientShareSettings: pData.clientShareSettings || { showPrices: true, showDetailedPricing: true },
    suppliers,
    workers,
    accounts,
    attachments: pData.attachments || [],
    projectConstants: pData.projectConstants || {},
    customConstantsDefinitions: pData.customConstantsDefinitions || []
  };
}

// ==========================================
// 3. Update Project Header Info
// ==========================================
export async function updateProjectHeader(projectId: string, header: ProjectHeader): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    header,
    updatedAt: serverTimestamp()
  });
}

// ==========================================
// 4. Update Sharing Settings
// ==========================================
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

// ==========================================
// 5. CRUD Zones
// ==========================================
export async function dbAddZone(projectId: string, zone: Zone): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'areas', zone.id);
  await setDoc(docRef, zone);
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

// ==========================================
// 6. Item update operations
// ==========================================
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

// ==========================================
// 7. Toggle Section enabled
// ==========================================
export async function dbToggleSection(projectId: string, sectionId: string, enabled: boolean): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'sections', sectionId);
  await updateDoc(docRef, { enabled });
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

// ==========================================
// 8. CRUD Suppliers
// ==========================================
export async function dbAddSupplier(projectId: string, supplier: Supplier): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'suppliers', supplier.id);
  await setDoc(docRef, supplier);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbUpdateSupplier(projectId: string, supplier: Supplier): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'suppliers', supplier.id);
  await setDoc(docRef, supplier);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbDeleteSupplier(projectId: string, supplierId: string): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'suppliers', supplierId);
  await deleteDoc(docRef);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

// ==========================================
// 9. CRUD Workers
// ==========================================
export async function dbAddWorker(projectId: string, worker: Worker): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'workers', worker.id);
  await setDoc(docRef, worker);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbUpdateWorker(projectId: string, worker: Worker): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'workers', worker.id);
  await setDoc(docRef, worker);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbDeleteWorker(projectId: string, workerId: string): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'workers', workerId);
  await deleteDoc(docRef);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

// ==========================================
// 10. CRUD Accounts
// ==========================================
export async function dbAddAccount(projectId: string, account: AccountEntry): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'accounts', account.id);
  await setDoc(docRef, account);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbUpdateAccount(projectId: string, account: AccountEntry): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'accounts', account.id);
  await setDoc(docRef, account);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

export async function dbDeleteAccount(projectId: string, accountId: string): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'accounts', accountId);
  await deleteDoc(docRef);
  await updateDoc(doc(db, 'projects', projectId), { updatedAt: serverTimestamp() });
}

// ==========================================
// 11. Engineer Invite System
// ==========================================
export async function generateEngineerInviteToken(
  projectId: string, 
  specialty: AssignedEngineer['specialty'],
  specialtyLabel: string
): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const inviteDocRef = doc(db, 'projects', projectId, 'inviteTokens', token);
  await setDoc(inviteDocRef, {
    token,
    projectId,
    specialty,
    specialtyLabel,
    createdAt: serverTimestamp(),
    used: false
  });
  return token;
}

export async function getInviteTokenData(projectId: string, token: string): Promise<Record<string, unknown> | null> {
  const docRef = doc(db, 'projects', projectId, 'inviteTokens', token);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

export async function acceptEngineerInvite(
  projectId: string,
  token: string,
  userId: string,
  userName: string,
  userEmail: string,
  userJobTitle?: string
): Promise<boolean> {
  const inviteRef = doc(db, 'projects', projectId, 'inviteTokens', token);
  const inviteSnap = await getDoc(inviteRef);
  
  if (!inviteSnap.exists() || inviteSnap.data()?.used) {
    return false;
  }

  const inviteData = inviteSnap.data();
  const projectRef = doc(db, 'projects', projectId);

  const newEngineer: AssignedEngineer = {
    uid: userId,
    name: userName,
    email: userEmail,
    specialty: inviteData.specialty,
    specialtyLabel: userJobTitle && userJobTitle.trim() !== '' ? userJobTitle : inviteData.specialtyLabel,
    joinedAt: new Date().toISOString()
  };

  await updateDoc(projectRef, {
    'header.assignedEngineers': arrayUnion(userId),
    'header.engineersDetails': arrayUnion(newEngineer),
    updatedAt: serverTimestamp()
  });

  await updateDoc(inviteRef, {
    used: true,
    usedBy: userId,
    usedAt: serverTimestamp()
  });

  return true;
}

export async function removeEngineerFromProject(projectId: string, engineerUid: string): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) return;

  const pData = projectSnap.data();
  const updatedEngineers = (pData.header?.assignedEngineers || []).filter((uid: string) => uid !== engineerUid);
  const updatedDetails = (pData.header?.engineersDetails || []).filter((e: AssignedEngineer) => e.uid !== engineerUid);

  await updateDoc(projectRef, {
    'header.assignedEngineers': updatedEngineers,
    'header.engineersDetails': updatedDetails,
    updatedAt: serverTimestamp()
  });
}

// ==========================================
// 12. Delete Project (with all subcollections)
// ==========================================
async function deleteCollectionDocuments(projectId: string, collectionName: string): Promise<void> {
  const collectionRef = collection(db, 'projects', projectId, collectionName);
  const snapshot = await getDocs(collectionRef);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
}

async function deleteCollectionDocumentsPath(pathSegments: string[]): Promise<void> {
  const collectionRef = collection(db, pathSegments.join('/'));
  const snapshot = await getDocs(collectionRef);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
}

export async function deleteProject(projectId: string): Promise<void> {
  const subcollections = ['areas', 'suppliers', 'workers', 'accounts', 'inviteTokens', 'attachments'];

  for (const sub of subcollections) {
    await deleteCollectionDocuments(projectId, sub);
  }

  const sectionsSnapshot = await getDocs(collection(db, 'projects', projectId, 'sections'));
  for (const secDoc of sectionsSnapshot.docs) {
    await deleteCollectionDocumentsPath(['projects', projectId, 'sections', secDoc.id, 'items']);
    await deleteDoc(secDoc.ref);
  }

  await deleteDoc(doc(db, 'projects', projectId));
}
// 13. Update Constants
// ==========================================
export async function dbUpdateProjectConstants(
  projectId: string, 
  constants: Record<string, number>,
  customDefinitions?: ConstantDefinition[]
): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  
  const updates: Record<string, unknown> = {
    projectConstants: constants,
    updatedAt: serverTimestamp()
  };

  if (customDefinitions !== undefined) {
    updates.customConstantsDefinitions = customDefinitions;
  }

  await updateDoc(projectRef, updates);
}
