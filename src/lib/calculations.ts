import { getDefaultConstantsMap } from './constants';

export interface Zone {
  id: string;
  name: string;
  floorArea: number;
  perimeter: number;
  height: number;
  deductions: number; // sum of window/door area in m2
  wallArea: number;
  ceilingArea: number;
}

export interface BOQItem {
  id: string;
  sectionId: string;
  title: string;
  unit: string;
  quantitySource: 'manual' | 'calculated';
  calculationFormula?: string;
  specs: Record<string, string | number | boolean>;
  perAreaOverrides?: Record<string, {
    specs: Record<string, string | number | boolean>;
    quantity: number;
  }>;
  pricing: {
    mode: 'materials_labor_split' | 'lump_sum' | 'daily_rate' | 'detailed_breakdown';
    materialUnitPrice: number;
    laborUnitPrice: number;
    equipmentUnitPrice?: number;
    overheadUnitPrice?: number;
    lumpSumPrice: number;
    dailyRate: number;
    estimatedDays: number;
  };
  renovationAction?: 'keep' | 'remove_only' | 'remove_and_replace' | 'new_addition';
  notes: string;
  egyptianCodeRef: string;
  isActive: boolean;
  quantity?: number;
  customMaterials?: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    constantKey?: string;
    multiplier?: number;
    packageSize?: number;
  }[];
  schedule?: {
    startDate?: string;
    endDate?: string;
    progress?: number;
    dependencies?: string[];
  };
}

// 1. Calculate Wall Area
export function calculateWallArea(perimeter: number, height: number, deductions: number): number {
  const area = (perimeter * height) - deductions;
  return Math.max(0, area);
}

// 2. Calculate Demolition Debris Volume (m3)
export function calculateDemolitionDebrisVolume(areaInSqm: number, thicknessCm: number): number {
  return areaInSqm * (thicknessCm / 100);
}

// 3. Calculate Paint Quantity in Litres
export function calculatePaintQuantity(areaInSqm: number, coats: number, coverageRate: number): number {
  if (coverageRate <= 0) return 0;
  return (areaInSqm * coats) / coverageRate;
}

// 4. Calculate Tile Quantity and Box Counts
export interface TileCalculationResult {
  sqm: number;
  tileCount: number;
  boxesRequired: number;
  skirtingLength: number;
}

export function calculateTileQuantity(
  floorArea: number,
  perimeter: number,
  doorWidths: number,
  wastagePercent: number,
  tileSize: string, // e.g. "60x60" or "80x80"
  tilesPerBox: number = 4
): TileCalculationResult {
  const sqm = floorArea * (1 + (wastagePercent / 100));
  
  // Parse tile size to get area per tile in m2
  let tileArea = 0.36; // default 60x60
  if (tileSize) {
    const parts = tileSize.toLowerCase().split('x');
    if (parts.length === 2) {
      const w = parseFloat(parts[0]) / 100;
      const h = parseFloat(parts[1]) / 100;
      if (!isNaN(w) && !isNaN(h)) {
        tileArea = w * h;
      }
    }
  }

  const tileCount = tileArea > 0 ? Math.ceil(sqm / tileArea) : 0;
  const boxesRequired = tilesPerBox > 0 ? Math.ceil(tileCount / tilesPerBox) : 0;
  const skirtingLength = Math.max(0, perimeter - doorWidths);

  return {
    sqm,
    tileCount,
    boxesRequired,
    skirtingLength
  };
}

// 5. Calculate Skirting Length (L.M.)
export function calculateSkirtingLength(perimeter: number, doorWidths: number): number {
  return Math.max(0, perimeter - doorWidths);
}

// 6. Calculate Pricing Breakdown for an Item
export interface ItemTotalResult {
  quantity: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  overheadCost: number;
  total: number;
  estimatedDays: number;
}

export function calculateItemTotalRaw(item: BOQItem, zones: Zone[], _projectConstants?: Record<string, number>): { quantity: number; estimatedDays: number } {
  let quantity = 0;
  if (item.quantitySource === 'calculated') {
    if (item.perAreaOverrides && Object.keys(item.perAreaOverrides).length > 0) {
      quantity = Object.values(item.perAreaOverrides).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    } else {
      const formula = item.calculationFormula || '';
      if (formula === 'total.floorArea') quantity = zones.reduce((acc, z) => acc + z.floorArea, 0);
      else if (formula === 'total.wallArea') quantity = zones.reduce((acc, z) => acc + z.wallArea, 0);
      else if (formula === 'total.ceilingArea') quantity = zones.reduce((acc, z) => acc + z.ceilingArea, 0);
      else if (formula === 'total.perimeter') quantity = zones.reduce((acc, z) => acc + z.perimeter, 0);
      else quantity = Number(item.quantity) || 0;
    }
  } else {
    quantity = Number(item.quantity) || 0;
  }
  return { quantity, estimatedDays: Number(item.pricing.estimatedDays) || 0 };
}

export function calculateItemTotal(item: BOQItem, zones: Zone[], projectConstants?: Record<string, number>): ItemTotalResult {
  if (!item.isActive) {
    return { quantity: 0, materialCost: 0, laborCost: 0, equipmentCost: 0, overheadCost: 0, total: 0, estimatedDays: 0 };
  }

  const { quantity, estimatedDays } = calculateItemTotalRaw(item, zones, projectConstants);

  let materialCost = 0;
  let laborCost = 0;
  let equipmentCost = 0;
  let overheadCost = 0;
  let total = 0;

  const isRenovation = item.renovationAction !== undefined;
  const isKeep = isRenovation && item.renovationAction === 'keep';
  const isRemoveOnly = isRenovation && item.renovationAction === 'remove_only';

  if (isKeep) {
    return { quantity, materialCost: 0, laborCost: 0, equipmentCost: 0, overheadCost: 0, total: 0, estimatedDays: 0 };
  }

  const pricing = item.pricing;
  const materials = calculateItemMaterials(item, zones, projectConstants);
  const hasDetailedMaterials = materials.length > 0 && !item.id.includes('_custom_') && materials[0].key !== 'general_material';

  if (pricing.mode === 'materials_labor_split') {
    const matUnitPrice = pricing.materialUnitPrice || 0;
    const labUnitPrice = pricing.laborUnitPrice || 0;

    if (isRemoveOnly) {
      materialCost = 0;
    } else if (item.customMaterials && item.customMaterials.length > 0) {
      materialCost = item.customMaterials.reduce((sum, mat) => sum + ((mat.quantity || 0) * (mat.unitPrice || 0)), 0);
    } else if (hasDetailedMaterials) {
      materialCost = materials.reduce((sum, mat) => sum + mat.totalCost, 0);
    } else {
      materialCost = quantity * matUnitPrice;
    }

    laborCost = quantity * labUnitPrice;
    total = materialCost + laborCost;
  } else if (pricing.mode === 'lump_sum') {
    total = pricing.lumpSumPrice || 0;
    laborCost = total;
  } else if (pricing.mode === 'daily_rate') {
    const rate = pricing.dailyRate || 0;
    laborCost = rate * estimatedDays;
    const matUnitPrice = pricing.materialUnitPrice || 0;

    if (isRemoveOnly) {
      materialCost = 0;
    } else if (item.customMaterials && item.customMaterials.length > 0) {
      materialCost = item.customMaterials.reduce((sum, mat) => sum + ((mat.quantity || 0) * (mat.unitPrice || 0)), 0);
    } else if (hasDetailedMaterials) {
      materialCost = materials.reduce((sum, mat) => sum + mat.totalCost, 0);
    } else {
      materialCost = quantity * matUnitPrice;
    }

    total = laborCost + materialCost;
  } else if (pricing.mode === 'detailed_breakdown') {
    const matUnitPrice = pricing.materialUnitPrice || 0;
    const labUnitPrice = pricing.laborUnitPrice || 0;
    const eqUnitPrice = pricing.equipmentUnitPrice || 0;
    const ohUnitPrice = pricing.overheadUnitPrice || 0;

    materialCost = quantity * matUnitPrice;
    laborCost = quantity * labUnitPrice;
    equipmentCost = quantity * eqUnitPrice;
    overheadCost = quantity * ohUnitPrice;

    total = materialCost + laborCost + equipmentCost + overheadCost;
  }

  return {
    quantity,
    materialCost,
    laborCost,
    equipmentCost,
    overheadCost,
    total,
    estimatedDays
  };
}

// 7. Calculate Project Summary (financial aggregation)
export interface SectionSummary {
  sectionId: string;
  title: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  overheadCost: number;
  totalCost: number;
}

export interface ProjectSummaryResult {
  bySection: Record<string, SectionSummary>;
  grandMaterialCost: number;
  grandLaborCost: number;
  grandEquipmentCost: number;
  grandOverheadCost: number;
  grandTotal: number;
  totalDays: number;
  supervisionValue: number;
  grandTotalWithSupervision: number;
}

export function calculateProjectSummary(
  items: BOQItem[],
  sections: Array<{ id: string; title: string; enabled: boolean }>,
  zones: Zone[],
  supervisionPercentage: number = 0,
  projectConstants?: Record<string, number>
): ProjectSummaryResult {
  const bySection: Record<string, SectionSummary> = {};
  let grandMaterialCost = 0;
  let grandLaborCost = 0;
  let grandEquipmentCost = 0;
  let grandOverheadCost = 0;
  let grandTotal = 0;
  let totalDays = 0;

  sections.forEach((sec) => {
    if (sec.enabled) {
      bySection[sec.id] = {
        sectionId: sec.id,
        title: sec.title,
        materialCost: 0,
        laborCost: 0,
        equipmentCost: 0,
        overheadCost: 0,
        totalCost: 0,
      };
    }
  });

  items.forEach((item) => {
    if (item.isActive && bySection[item.sectionId]) {
      const res = calculateItemTotal(item, zones, projectConstants);
      bySection[item.sectionId].materialCost += res.materialCost;
      bySection[item.sectionId].laborCost += res.laborCost;
      bySection[item.sectionId].equipmentCost += res.equipmentCost;
      bySection[item.sectionId].overheadCost += res.overheadCost;
      bySection[item.sectionId].totalCost += res.total;
      
      grandMaterialCost += res.materialCost;
      grandLaborCost += res.laborCost;
      grandEquipmentCost += res.equipmentCost;
      grandOverheadCost += res.overheadCost;
      grandTotal += res.total;
      totalDays += res.estimatedDays;
    }
  });

  const supervisionValue = grandTotal * ((supervisionPercentage || 0) / 100);
  const grandTotalWithSupervision = grandTotal + supervisionValue;

  return {
    bySection,
    grandMaterialCost,
    grandLaborCost,
    grandEquipmentCost,
    grandOverheadCost,
    grandTotal,
    totalDays,
    supervisionValue,
    grandTotalWithSupervision
  };
}

export interface MaterialRequirement {
  key: string;
  name: string;
  qtyRequired: number;
  qtyRounded: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  packagingDetails: string;
}

export function calculateItemMaterials(item: BOQItem, zones: Zone[], projectConstants?: Record<string, number>): MaterialRequirement[] {
  if (!item.isActive) return [];

  const totalRes = calculateItemTotalRaw(item, zones, projectConstants);
  const qty = totalRes.quantity;
  const matList: MaterialRequirement[] = [];
  const specs = item.specs || {};

  const defaultConsts = getDefaultConstantsMap();

  // Helper to get constant from projectConstants -> specs -> defaults -> fallback
  const getConst = (key: string, def: number): number => {
    if (projectConstants && projectConstants[key] !== undefined) return projectConstants[key];
    if (specs[key] !== undefined) return Number(specs[key]);
    if (defaultConsts[key] !== undefined) return defaultConsts[key];
    return def;
  };

  // Helper to fetch price when the user selects a material from the catalog via the new material_selector
  const getMaterialPrice = (specKey: string, fallbackConstKey: string, defValue: number): number => {
    const selectedKey = specs[specKey];
    if (selectedKey && typeof selectedKey === 'string' && selectedKey.startsWith('price_')) {
      if (projectConstants && projectConstants[selectedKey] !== undefined) return projectConstants[selectedKey];
      if (defaultConsts[selectedKey] !== undefined) return defaultConsts[selectedKey];
    } else if (selectedKey !== undefined && !isNaN(Number(selectedKey))) {
      return Number(selectedKey);
    }
    if (projectConstants && projectConstants[fallbackConstKey] !== undefined) return projectConstants[fallbackConstKey];
    if (defaultConsts[fallbackConstKey] !== undefined) return defaultConsts[fallbackConstKey];
    return defValue;
  };

  // Helper to get spec value with fallback
  const getSpecNum = (key: string, def: number): number => {
    return getConst(key, def); // Redirect to getConst for backwards compatibility
  };
  const getSpecStr = (key: string, def: string): string => {
    const val = specs[key];
    return val !== undefined ? String(val) : def;
  };

  const itemId = item.id.split('_custom_')[0];

  switch (itemId) {
    // ==========================================
    // 1.1.3 - بناء حوائط جديدة
    // ==========================================
    case '1.1.3': {
      const thickness = getSpecStr('wallThickness', '12 سم');
      const isFullBrick = thickness.includes('25') || thickness.includes('20');
      const bricksPerSqm = isFullBrick ? getConst('rate_bricks_per_sqm_full', 115) : getConst('rate_bricks_per_sqm_half', 58);
      const cementKgPerSqm = getConst('rate_cement_kg_per_sqm_masonry', 15) * (isFullBrick ? 2 : 1);
      const sandCubicPerSqm = isFullBrick ? 0.05 : 0.025;

      const bricksPrice = getMaterialPrice('bricksPrice', 'price_brick_1000', 1500);
      const cementBagPrice = getMaterialPrice('cementBagPrice', 'price_cement_bag', 130);
      const sandCubicPrice = getMaterialPrice('sandCubicPrice', 'price_sand_m3', 250);

      const totalBricks = qty * bricksPerSqm;
      const bricksThousands = Math.ceil((totalBricks / 1000) * 10) / 10;

      const totalCementKg = qty * cementKgPerSqm;
      const cementBags = Math.ceil(totalCementKg / 50);

      const totalSand = qty * sandCubicPerSqm;
      const sandRounded = Math.ceil(totalSand * 2) / 2;

      matList.push({
        key: 'bricks',
        name: `طوب بناء (${getSpecStr('brickType', 'أحمر مفرغ')})`,
        qtyRequired: totalBricks,
        qtyRounded: bricksThousands,
        unit: 'ألف طوبة',
        unitPrice: bricksPrice,
        totalCost: bricksThousands * bricksPrice,
        packagingDetails: `معدل الاستهلاك: ${bricksPerSqm} طوبة/م² (السمك: ${thickness})`
      });

      matList.push({
        key: 'cement_bags',
        name: 'أسمنت بورتلاندي عادي (شيكارة ٥٠ كجم)',
        qtyRequired: totalCementKg / 50,
        qtyRounded: cementBags,
        unit: 'شكارة',
        unitPrice: cementBagPrice,
        totalCost: cementBags * cementBagPrice,
        packagingDetails: `معدل الاستهلاك: ${cementKgPerSqm} كجم/م²`
      });

      matList.push({
        key: 'sand_cubic',
        name: 'رمل مباني',
        qtyRequired: totalSand,
        qtyRounded: sandRounded,
        unit: 'م³',
        unitPrice: sandCubicPrice,
        totalCost: sandRounded * sandCubicPrice,
        packagingDetails: `معدل الاستهلاك: ${sandCubicPerSqm} م³/م²`
      });
      break;
    }

    // ==========================================
    // 1.2.1 & 1.2.2 - مواسير السباكة
    // ==========================================
    case '1.2.1':
    case '1.2.2': {
      const pipeLength = getSpecNum('pipeLength', 4);
      const pipePrice = getMaterialPrice('pipePrice', itemId === '1.2.1' ? 'price_pvc_pipe_4' : 'price_ppr_pipe_3_4', itemId === '1.2.1' ? 450 : 180);
      const fittingsPercent = getSpecNum('fittingsPercent', itemId === '1.2.1' ? 15 : 25);

      const totalPipes = Math.ceil(qty / pipeLength);
      const pipesCost = totalPipes * pipePrice;
      const fittingsCost = pipesCost * (fittingsPercent / 100);

      matList.push({
        key: 'pipes',
        name: `مواسير ${getSpecStr('material', 'PVC')} قطر ${getSpecStr('diameter', '4 بوصة')}`,
        qtyRequired: qty,
        qtyRounded: totalPipes,
        unit: `ماسورة (${pipeLength}م)`,
        unitPrice: pipePrice,
        totalCost: pipesCost,
        packagingDetails: `مجموع الطول: ${qty.toFixed(1)} متر طولي`
      });

      matList.push({
        key: 'fittings',
        name: 'إكسسوارات وقطع السباكة (أكواع، تيهات، غراء)',
        qtyRequired: 1,
        qtyRounded: 1,
        unit: 'مقطوعية',
        unitPrice: fittingsCost,
        totalCost: fittingsCost,
        packagingDetails: `تم تقديرها بنسبة ${fittingsPercent}% من قيمة المواسير`
      });
      break;
    }

    // ==========================================
    // 1.2.5 - العزل المائي
    // ==========================================
    case '1.2.5': {
      const type = getSpecStr('insulationType', 'عزل أسمنتي دهان');
      const isMembrane = type.includes('ممبرين');
      const coatsCount = getSpecNum('coatsCount', 2);
      const hasProtection = getSpecStr('protectionLayer', 'مطلوب') === 'مطلوب';

      if (isMembrane) {
        const rollPrice = getMaterialPrice('membraneRollPrice', 'price_membrane_roll', 1200);
        const netRoll = getSpecNum('membraneNetRollSqm', 8.5);
        const rolls = Math.ceil(qty / netRoll);
        matList.push({
          key: 'membrane_rolls',
          name: 'لفائف ممبرين عزل مائي (10 متر)',
          qtyRequired: qty / netRoll,
          qtyRounded: rolls,
          unit: 'لفة',
          unitPrice: rollPrice,
          totalCost: rolls * rollPrice,
          packagingDetails: `بمعدل لفة لكل ${netRoll} م² صافي (بعد الركوب)`
        });
      } else {
        const bagPrice = getMaterialPrice('cementCoatBagPrice', 'price_cement_insulation_bag', 450);
        const sqmPerBag = getSpecNum('sqmPerBag', 8);
        const coveragePerBag = sqmPerBag / (coatsCount || 1); 
        const bags = Math.ceil(qty / coveragePerBag);
        matList.push({
          key: 'cement_insulation',
          name: 'عزل أسمنتي مطاطي (شيكارة 20 كجم)',
          qtyRequired: qty / coveragePerBag,
          qtyRounded: bags,
          unit: 'شكارة',
          unitPrice: bagPrice,
          totalCost: bags * bagPrice,
          packagingDetails: `بمعدل شيكارة لكل ${coveragePerBag} م² لعدد ${coatsCount} أوجه`
        });
      }

      if (hasProtection) {
        const screedPrice = getSpecNum('protectionScreedPrice', 30);
        matList.push({
          key: 'protection_screed',
          name: 'خامات لياسة أسمنتية لحماية العزل (سكريد)',
          qtyRequired: qty,
          qtyRounded: Math.ceil(qty),
          unit: 'م²',
          unitPrice: screedPrice,
          totalCost: Math.ceil(qty) * screedPrice,
          packagingDetails: 'أسمنت ورمل بطبقة 3-5 سم لحماية العزل'
        });
      }
      break;
    }

    // ==========================================
    // 3.1.1 - تأسيس مواسير النحاس (التكييف)
    // ==========================================
    case '3.1.1': {
      const copperRollLength = getSpecNum('copperRollLength', 15);
      const copperRollPrice = getMaterialPrice('copperRollPrice', 'price_copper_roll_5_8', 5500);
      const armaflexPrice = getMaterialPrice('armaflexPrice', 'price_armaflex_m', 35);
      const controlWirePrice = getMaterialPrice('controlWirePrice', 'price_control_wire_m', 15);
      const drainPipePrice = getMaterialPrice('drainPipePrice', 'price_drain_pipe_m', 25);

      const copperRolls = Math.ceil(qty / copperRollLength);
      
      matList.push({
        key: 'copper_pipes',
        name: `مواسير نحاس تكييف مقاس ${getSpecStr('pipeDiameter', '1/4" + 5/8"')}`,
        qtyRequired: qty / copperRollLength,
        qtyRounded: copperRolls,
        unit: 'لفة (15م)',
        unitPrice: copperRollPrice,
        totalCost: copperRolls * copperRollPrice,
        packagingDetails: `مجموع الأطوال المطلوبة: ${qty.toFixed(1)} متر طولي`
      });

      matList.push({
        key: 'armaflex',
        name: 'عزل أرماكفلكس للمواسير',
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'متر',
        unitPrice: armaflexPrice,
        totalCost: Math.ceil(qty) * armaflexPrice,
        packagingDetails: 'عزل حراري للنحاس'
      });

      matList.push({
        key: 'control_wire',
        name: 'سلك كنترول تحكم للتكييف',
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'متر',
        unitPrice: controlWirePrice,
        totalCost: Math.ceil(qty) * controlWirePrice,
        packagingDetails: 'يمتد مع مواسير النحاس'
      });

      matList.push({
        key: 'drain_pipe',
        name: `مواسير صرف مكثفات (${getSpecStr('drainPipe', 'PVC 3/4 بوصة')})`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'متر',
        unitPrice: drainPipePrice,
        totalCost: Math.ceil(qty) * drainPipePrice,
        packagingDetails: 'لتصريف مياه الوحدة الداخلية'
      });
      break;
    }
    // ==========================================
    // 1.3.1 - تركيب علب ماجيك تأسيس
    // ==========================================
    case '1.3.1': {
      const boxPrice = getSpecNum('boxPrice', 15);
      const boxType = getSpecStr('boxType', 'بلاستيك عميق');

      matList.push({
        key: 'magic_box',
        name: `علب ماجيك تأسيس (${boxType})`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: boxPrice,
        totalCost: Math.ceil(qty) * boxPrice,
        packagingDetails: 'علبة لكل مخرج/نقطة'
      });
      break;
    }

    // ==========================================
    // 1.3.2 - تمديد خراطيم ومواسير كهرباء
    // ==========================================
    case '1.3.2': {
      const hoseRollPrice = getMaterialPrice('hoseRollPrice', 'price_aladdin_hose_roll', 250);
      const rollLength = getSpecNum('rollLength', 50);
      const hoseType = getSpecStr('hoseType', 'خرطوم علاء الدين');
      
      const hoseRolls = Math.ceil(qty / rollLength);

      matList.push({
        key: 'electrical_hose',
        name: `مواسير وخراطيم تأسيس (${hoseType})`,
        qtyRequired: qty,
        qtyRounded: hoseRolls,
        unit: 'لفة',
        unitPrice: hoseRolls > 0 ? hoseRollPrice : 0,
        totalCost: hoseRolls * hoseRollPrice,
        packagingDetails: `لفة ${rollLength} متر (مجموع الأمتار المطلوبة: ${qty.toFixed(1)} م)`
      });
      break;
    }

    // ==========================================
    // 1.3.3 - لوحة التوزيع الرئيسية ومفاتيح الأمان
    // ==========================================
    case '1.3.3': {
      const boardPrice = getMaterialPrice('boardPrice', 'price_db_12_way_venus', 1200);
      const breakersCount = getSpecNum('breakersCount', 24);
      const breakerPrice = getMaterialPrice('breakerPrice', 'price_breaker_schneider_1p', 250);

      matList.push({
        key: 'distribution_board',
        name: `لوحة توزيع فارغة (${breakersCount} خط)`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: boardPrice,
        totalCost: Math.ceil(qty) * boardPrice,
        packagingDetails: 'لوحة توزيع رئيسية'
      });

      const totalBreakers = qty * breakersCount;
      matList.push({
        key: 'breakers',
        name: 'مفاتيح أمان أوتوماتيكية (قواطع فرعية)',
        qtyRequired: totalBreakers,
        qtyRounded: Math.ceil(totalBreakers),
        unit: 'عدد',
        unitPrice: breakerPrice,
        totalCost: Math.ceil(totalBreakers) * breakerPrice,
        packagingDetails: `عدد ${breakersCount} قاطع لكل لوحة`
      });
      break;
    }

    // ==========================================
    // 1.3.6 - سحب كابلات تيار خفيف
    // ==========================================
    case '1.3.6': {
      const rollLength = getSpecNum('rollLength', 305);
      const dataRollPrice = getMaterialPrice('dataRollPrice', 'price_data_roll', 3200);
      const cableType = getSpecStr('cableType', 'داتا CAT6 UTP السويدي');
      
      const rolls = Math.ceil(qty / rollLength);

      matList.push({
        key: 'data_cable',
        name: `كابلات تيار خفيف (${cableType})`,
        qtyRequired: qty,
        qtyRounded: rolls,
        unit: 'لفة',
        unitPrice: rolls > 0 ? dataRollPrice : 0,
        totalCost: rolls * dataRollPrice,
        packagingDetails: `لفة ${rollLength} متر (مجموع الأمتار المطلوبة: ${qty.toFixed(1)} م)`
      });
      break;
    }

    // ==========================================
    // 1.5.1 - لياسة حوائط داخلية (محارة أسمنتية)
    // ==========================================
    case '1.5.1': {
      const cementPerSqm = getSpecNum('cementPerSqm', 0.25); // sacks (12.5kg) per m2
      const sandPerSqm = getSpecNum('sandPerSqm', 0.02); // m3 per m2
      const cementBagPrice = getMaterialPrice('cementBagPrice', 'price_cement_bag', 130);
      const sandCubicPrice = getMaterialPrice('sandCubicPrice', 'price_sand_m3', 250);

      const totalCementSacks = qty * cementPerSqm;
      const cementSacksRounded = Math.ceil(totalCementSacks);

      const totalSandCubic = qty * sandPerSqm;
      // Round sand to nearest 0.5 cubic meter
      const sandRounded = Math.ceil(totalSandCubic * 2) / 2;

      matList.push({
        key: 'cement_sacks',
        name: 'أسمنت بورتلاندي عادي (شيكارة ٥٠ كجم)',
        qtyRequired: totalCementSacks,
        qtyRounded: cementSacksRounded,
        unit: 'شكارة',
        unitPrice: cementBagPrice,
        totalCost: cementSacksRounded * cementBagPrice,
        packagingDetails: `معدل استهلاك: ${cementPerSqm.toFixed(2)} شيكارة للمتر المربع`
      });

      matList.push({
        key: 'sand_cubic',
        name: 'رمل محارة حرش ونظيف للمونة',
        qtyRequired: totalSandCubic,
        qtyRounded: sandRounded,
        unit: 'م³',
        unitPrice: sandCubicPrice,
        totalCost: sandRounded * sandCubicPrice,
        packagingDetails: `معدل استهلاك: ${sandPerSqm.toFixed(3)} م³ للمتر المربع`
      });
      break;
    }

    // ==========================================
    // 2.1.1 & 2.1.2 - أسقف معلقة (جبسون بورد)
    // ==========================================
    case '2.1.1':
    case '2.1.2': {
      const isFlat = itemId === '2.1.1';
      const gypsumPrice = getMaterialPrice('gypsumType', 'price_gypsum_board_sqm', isFlat ? 140 : 110);
      
      matList.push({
        key: 'gypsum_board',
        name: `ألواح جبسوم بورد والتوريد (${getSpecStr('gypsumType', 'كناوف عادي')})`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: isFlat ? 'م²' : 'متر طولي',
        unitPrice: gypsumPrice,
        totalCost: qty * gypsumPrice,
        packagingDetails: `النظام: ${getSpecStr('suspensionSystem', 'صاج محمل')}`
      });
      break;
    }

    // ==========================================
    // 2.4.2 - شبابيك الألمنيوم
    // ==========================================
    case '2.4.2': {
      const isJumbo = getSpecStr('profileSystem', '').includes('جامبو') || getSpecStr('profileSystem', '').toLowerCase().includes('jumbo');
      const alumPrice = getMaterialPrice('profileSystem', isJumbo ? 'price_alum_jumbo' : 'price_alum_tango', isJumbo ? 3500 : 2800);
      
      matList.push({
        key: 'aluminum_window',
        name: `شباك ألوميتال (${getSpecStr('profileSystem', 'جامبو')})`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'م²',
        unitPrice: alumPrice,
        totalCost: qty * alumPrice,
        packagingDetails: `الزجاج: ${getSpecStr('glassType', 'دبل جلاس')}`
      });
      break;
    }

    // ==========================================
    // 2.8.1 - مفاتيح ووشوش نهائية
    // ==========================================
    case '2.8.1': {
      const platePrice = getMaterialPrice('plateMaterial', 'price_plate_legrand', 25);
      const switchPrice = getMaterialPrice('switchMaterial', 'price_switch_legrand', 35);

      matList.push({
        key: 'cover_plate',
        name: 'وش علبة كهرباء خارجي (شاسيه ووش)',
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: platePrice,
        totalCost: Math.ceil(qty) * platePrice,
        packagingDetails: 'وش شامل الشاسيه'
      });

      matList.push({
        key: 'switch_pieces',
        name: 'لقمة مفتاح/بريزة إنارة',
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: switchPrice,
        totalCost: Math.ceil(qty) * switchPrice,
        packagingDetails: 'معدل تقديري للقم لكل وش'
      });
      break;
    }

    // ==========================================
    // 2.8.2 - وحدات الإنارة (سبوتات)
    // ==========================================
    case '2.8.2': {
      const lightPrice = getMaterialPrice('lightMaterial', 'price_spot_led_7w', 75);
      const colorTemp = getSpecStr('colorTemp', '3000K (أصفر دافئ)');

      matList.push({
        key: 'lighting_units',
        name: `وحدة إنارة / سبوت ليد (${colorTemp})`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: lightPrice,
        totalCost: Math.ceil(qty) * lightPrice,
        packagingDetails: 'وحدة لكل مخرج سقف'
      });
      break;
    }

    // ==========================================
    // 2.8.3 - شرائط إضاءة LED Strip
    // ==========================================
    case '2.8.3': {
      const stripRollLength = getSpecNum('stripRollLength', 50); // Default 50m per roll
      const stripRollPrice = getMaterialPrice('stripMaterial', 'price_led_strip_m', 60);
      const rolls = stripRollLength > 0 ? Math.ceil(qty / stripRollLength) : qty; // If 0, assume price is per meter
      const unitType = stripRollLength > 0 ? 'لفة' : 'متر';

      matList.push({
        key: 'led_strip',
        name: 'شريط ليد إضاءة مخفية',
        qtyRequired: qty,
        qtyRounded: rolls,
        unit: unitType,
        unitPrice: stripRollPrice,
        totalCost: rolls * stripRollPrice,
        packagingDetails: stripRollLength > 0 ? `لفة ${stripRollLength} متر` : 'متر طولي'
      });

      const driverBrand = getSpecStr('driverBrand', 'مين ويل Mean Well');
      const driversNeeded = Math.ceil(qty / 10); // Assume 1 driver per 10 meters
      const driverPrice = 350; // Estimated driver price

      matList.push({
        key: 'led_driver',
        name: `محول طاقة ليد (Driver - ${driverBrand})`,
        qtyRequired: qty / 10,
        qtyRounded: driversNeeded,
        unit: 'عدد',
        unitPrice: driverPrice,
        totalCost: driversNeeded * driverPrice,
        packagingDetails: 'محول لكل 10 متر تقريباً'
      });
      break;
    }

    // ==========================================
    // 2.10.1 - دهان الحوائط والأسقف (الوجه النهائي)
    // ==========================================
    case '2.10.1': {
      const coatsCount = getSpecNum('coatsCount', 2);
      const coverageRate = getSpecNum('coverageRate', 10); // m2 per L per coat
      const canSize = getSpecNum('canSize', 18); // L per can
      const paintCanPrice = getMaterialPrice('paintCanPrice', 'price_paint_can', 1800);

      const puttyCoats = getSpecNum('puttyCoats', 2);
      const puttyCoverageSqm = getSpecNum('puttyCoverageSqm', 20); // m2 per sack
      const puttyBagPrice = getMaterialPrice('puttyBagPrice', 'price_putty_bag', 350);

      const sealerCoverageSqm = getSpecNum('sealerCoverageSqm', 30); // m2 per gallon
      const sealerGallonPrice = getMaterialPrice('sealerGallonPrice', 'price_sealer_gallon', 250);

      // 1. Final paint can calculation
      const totalLiters = (qty * coatsCount) / (coverageRate > 0 ? coverageRate : 10);
      const paintCans = Math.ceil(totalLiters / canSize);

      // 2. Putty sacks calculation
      const totalPuttySacks = (qty * puttyCoats) / puttyCoverageSqm;
      const puttySacksRounded = Math.ceil(totalPuttySacks);

      // 3. Sealer gallons calculation
      const sealerGallons = Math.ceil(qty / sealerCoverageSqm);

      matList.push({
        key: 'paint_cans',
        name: `بستلة دهان بلاستيك ملون (${getSpecStr('paintType', 'فينوماستيك')})`,
        qtyRequired: totalLiters,
        qtyRounded: paintCans,
        unit: `بستلة (${canSize}ل)`,
        unitPrice: paintCanPrice,
        totalCost: paintCans * paintCanPrice,
        packagingDetails: `إجمالي الحجم المطلـوب: ${totalLiters.toFixed(1)} لتر (كود لون: ${getSpecStr('colorCode', 'Timeless')})`
      });

      matList.push({
        key: 'putty_bags',
        name: 'معجون دهانات جاهز (شيكارة أكريليك)',
        qtyRequired: totalPuttySacks,
        qtyRounded: puttySacksRounded,
        unit: 'شكارة',
        unitPrice: puttyBagPrice,
        totalCost: puttySacksRounded * puttyBagPrice,
        packagingDetails: `عدد ${puttyCoats} سكاكين معجون للمساحة`
      });

      matList.push({
        key: 'sealer_gallons',
        name: 'سيلر مائي عازل ومثبت للحوائط',
        qtyRequired: qty / sealerCoverageSqm,
        qtyRounded: sealerGallons,
        unit: 'جالون',
        unitPrice: sealerGallonPrice,
        totalCost: sealerGallons * sealerGallonPrice,
        packagingDetails: 'سيلر مائي قبل المعجون'
      });
      break;
    }

    // ==========================================
    // 2.11.1 - تركيب أرضيات الغرف والصالات
    // ==========================================
    case '2.11.1': {
      const wastagePercent = getSpecNum('wastagePercent', 10);
      const tilesPerBox = getSpecNum('tilesPerBox', 4);
      const tileBoxPrice = getSpecNum('tileBoxPrice', 350);

      const adhesiveCoverageSqm = getSpecNum('adhesiveCoverageSqm', 5); // m2 per bag
      const adhesiveBagPrice = getMaterialPrice('adhesiveBagPrice', 'price_tile_adhesive_bag', 180);

      const groutCoverageSqm = getSpecNum('groutCoverageSqm', 15); // m2 per bag
      const groutBagPrice = getMaterialPrice('groutBagPrice', 'price_grout_bag', 40);

      // Area with wastage
      const floorAreaWithWastage = qty * (1 + wastagePercent / 100);

      // Parse tile size to get area of 1 tile
      const tileSizeStr = getSpecStr('tileSize', '60x60');
      let tileArea = 0.36; // default
      const parts = tileSizeStr.toLowerCase().split('x');
      if (parts.length === 2) {
        const w = parseFloat(parts[0]) / 100;
        const h = parseFloat(parts[1]) / 100;
        if (!isNaN(w) && !isNaN(h)) {
          tileArea = w * h;
        }
      }

      const totalTiles = tileArea > 0 ? Math.ceil(floorAreaWithWastage / tileArea) : 0;
      const tileBoxes = tilesPerBox > 0 ? Math.ceil(totalTiles / tilesPerBox) : 0;

      // Adhesive Sacks
      const adhesiveSacks = Math.ceil(floorAreaWithWastage / adhesiveCoverageSqm);

      // Grout Bags
      const groutBags = Math.ceil(floorAreaWithWastage / groutCoverageSqm);

      matList.push({
        key: 'tile_boxes',
        name: `كرتونة بلاط أرضيات (${getSpecStr('flooringType', 'بورسلين')} - مقاس ${tileSizeStr})`,
        qtyRequired: totalTiles,
        qtyRounded: tileBoxes,
        unit: 'كرتونة',
        unitPrice: tileBoxPrice,
        totalCost: tileBoxes * tileBoxPrice,
        packagingDetails: `مساحة الحصر بالهالك: ${floorAreaWithWastage.toFixed(1)} م² (مجموع البلاطات: ${totalTiles} قطعة)`
      });

      matList.push({
        key: 'adhesive_bags',
        name: 'بودرة غراء لاصق سيراميك وبورسلين (شيكارة)',
        qtyRequired: floorAreaWithWastage / adhesiveCoverageSqm,
        qtyRounded: adhesiveSacks,
        unit: 'شكارة',
        unitPrice: adhesiveBagPrice,
        totalCost: adhesiveSacks * adhesiveBagPrice,
        packagingDetails: `معدل استهلاك: شيكارة لكل ${adhesiveCoverageSqm} م²`
      });

      matList.push({
        key: 'grout_bags',
        name: 'معجون ترويبة فواصل البلاط (كيس سقية)',
        qtyRequired: floorAreaWithWastage / groutCoverageSqm,
        qtyRounded: groutBags,
        unit: 'كيس',
        unitPrice: groutBagPrice,
        totalCost: groutBags * groutBagPrice,
        packagingDetails: `معدل استهلاك: كيس لكل ${groutCoverageSqm} م²`
      });
      break;
    }

    // ==========================================
    // 3.1.2 - وحدات تكييف سبليت (داخلية + خارجية)
    // ==========================================
    case '3.1.2': {
      const unitPrice = getMaterialPrice('unitPrice', 'price_ac_split_2_25', 22000);
      const bracketPrice = getMaterialPrice('bracketPrice', 'price_ac_bracket', 350);
      const copperLength = getSpecNum('copperLength', 5);
      const copperPricePerMeter = getMaterialPrice('copperPricePerMeter', 'price_copper_roll_5_8', 180);

      matList.push({
        key: 'ac_unit',
        name: `وحدة تكييف سبليت ${getSpecStr('capacity', '2.25 حصان')} - ${getSpecStr('brand', 'شارب')}`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'وحدة',
        unitPrice: unitPrice,
        totalCost: Math.ceil(qty) * unitPrice,
        packagingDetails: `${getSpecStr('acType', 'بارد وساخن')} - ${getSpecStr('technology', 'انفرتر')}`
      });

      matList.push({
        key: 'ac_bracket',
        name: 'حامل وحدة خارجية (براكت حديد)',
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: bracketPrice,
        totalCost: Math.ceil(qty) * bracketPrice,
        packagingDetails: 'حامل لكل وحدة خارجية'
      });

      const totalCopper = qty * copperLength;
      matList.push({
        key: 'copper_pipes',
        name: 'مواسير نحاس معزولة بالأرماكفلكس',
        qtyRequired: totalCopper,
        qtyRounded: Math.ceil(totalCopper),
        unit: 'متر طولي',
        unitPrice: copperPricePerMeter,
        totalCost: Math.ceil(totalCopper) * copperPricePerMeter,
        packagingDetails: `${copperLength} متر لكل وحدة تكييف`
      });
      break;
    }

    // ==========================================
    // 3.1.3 - نقاط كهرباء مخصصة للتكييف
    // ==========================================
    case '3.1.3': {
      const wirePerPoint = getSpecNum('wirePerPoint', 20);
      const rollLength = getSpecNum('rollLength', 100);
      const wireRollPrice = getMaterialPrice('wireRollPrice', 'price_wire_4_roll', 3500);
      const breakerPrice = getMaterialPrice('breakerPrice', 'price_breaker_schneider_1p', 280);
      const isolatorPrice = getMaterialPrice('isolatorPrice', 'price_isolator', 150);

      const totalWireLength = qty * wirePerPoint;
      const wireRolls = Math.ceil(totalWireLength / rollLength);

      matList.push({
        key: 'ac_wire',
        name: `سلك كهرباء السويدي ${getSpecStr('wireGauge', '4 مم')}`,
        qtyRequired: totalWireLength,
        qtyRounded: wireRolls,
        unit: 'لفة',
        unitPrice: wireRollPrice,
        totalCost: wireRolls * wireRollPrice,
        packagingDetails: `لفة ${rollLength} متر (مجموع الاحتياج: ${totalWireLength.toFixed(1)} م)`
      });

      matList.push({
        key: 'ac_breaker',
        name: `قاطع أوتوماتيك تكييف ${getSpecStr('breakerType', '20 أمبير')}`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: breakerPrice,
        totalCost: Math.ceil(qty) * breakerPrice,
        packagingDetails: 'قاطع لكل نقطة تكييف'
      });

      matList.push({
        key: 'ac_isolator',
        name: 'مفتاح أيزوليتور حائط (قطع التيار)',
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: isolatorPrice,
        totalCost: Math.ceil(qty) * isolatorPrice,
        packagingDetails: 'مفتاح لكل نقطة تكييف'
      });
      break;
    }

    // ==========================================
    // 3.2.3 - دكتات تهوية (مجاري الهواء)
    // ==========================================
    case '3.2.3': {
      const ductPricePerMeter = getMaterialPrice('ductPricePerMeter', 'price_duct_pvc', 120);
      const fittingsPercent = getSpecNum('fittingsPercent', 15);

      matList.push({
        key: 'duct_main',
        name: `دكت تهوية ${getSpecStr('ductMaterial', 'فليكسبل PVC')} - قطر ${getSpecStr('ductDiameter', '6 بوصة')}`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'متر طولي',
        unitPrice: ductPricePerMeter,
        totalCost: Math.ceil(qty) * ductPricePerMeter,
        packagingDetails: `خامة: ${getSpecStr('ductMaterial', 'فليكسبل PVC')}`
      });

      const fittingsCost = Math.ceil(qty) * ductPricePerMeter * (fittingsPercent / 100);
      matList.push({
        key: 'duct_fittings',
        name: 'وصلات وأكواع ومحولات (Fittings)',
        qtyRequired: fittingsPercent,
        qtyRounded: 1,
        unit: 'مجموعة',
        unitPrice: fittingsCost,
        totalCost: fittingsCost,
        packagingDetails: `${fittingsPercent}% من تكلفة الدكتات`
      });
      break;
    }

    case '3.2.1': {
      const hoodPrice = getMaterialPrice('hoodPrice', 'price_hood_90', 4500);
      matList.push({
        key: 'hood_unit',
        name: `شفاط مطبخ هرمي/مسطح`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: hoodPrice,
        totalCost: Math.ceil(qty) * hoodPrice,
        packagingDetails: `شفاط ${getSpecStr('size', '90 سم')}`
      });
      break;
    }

    case '3.2.2': {
      const fanPrice = getMaterialPrice('fanPrice', 'price_fan_15', 350);
      matList.push({
        key: 'exhaust_fan',
        name: `شفاط حمام/غرفة`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: fanPrice,
        totalCost: Math.ceil(qty) * fanPrice,
        packagingDetails: `شفاط ${getSpecStr('fanSize', '20x20 سم')}`
      });
      break;
    }

    case '3.2.4': {
      const grillePrice = getMaterialPrice('grillePrice', 'price_grille_30x30', 180);
      matList.push({
        key: 'air_grille',
        name: `فتحة تهوية / ديفيوزر`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: grillePrice,
        totalCost: Math.ceil(qty) * grillePrice,
        packagingDetails: `ديفيوزر مقاس ${getSpecStr('grilleSize', '30x30 سم')}`
      });
      break;
    }

    // ==========================================
    // Finishes (النجارة, تجاليد, مطابخ, كهرباء, صحي)
    // ==========================================
    case '2.4.1': {
      const woodMaterialPrice = getMaterialPrice('woodMaterial', 'price_wood_mosky_m3', 22000);
      const lockMaterialPrice = getMaterialPrice('lockMaterial', 'price_door_lock_kale', 650);
      
      // Assume 0.05 m3 of wood per door
      const woodCost = woodMaterialPrice * 0.05;
      
      matList.push({
        key: 'door_wood',
        name: `خشب الباب والحلوق`,
        qtyRequired: qty * 0.05,
        qtyRounded: qty * 0.05,
        unit: 'م³',
        unitPrice: woodMaterialPrice,
        totalCost: qty * woodCost,
        packagingDetails: `0.05 متر مكعب لكل باب`
      });
      matList.push({
        key: 'door_lock',
        name: `الكالون والمقابض`,
        qtyRequired: qty,
        qtyRounded: qty,
        unit: 'عدد',
        unitPrice: lockMaterialPrice,
        totalCost: qty * lockMaterialPrice,
        packagingDetails: `كالون ومقبض لكل باب`
      });
      break;
    }
    case '2.5.1': {
      const claddingMaterialPrice = getMaterialPrice('claddingMaterial', 'price_wpc_panel', 450);
      matList.push({
        key: 'wall_cladding',
        name: `خامات تجليد الحوائط`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'م²',
        unitPrice: claddingMaterialPrice,
        totalCost: Math.ceil(qty) * claddingMaterialPrice,
        packagingDetails: `ألواح/شرائح التجليد المحددة`
      });
      break;
    }
    case '2.6.1': {
      const cabinetMaterialPrice = getMaterialPrice('cabinetMaterial', 'price_kitchen_board_acrylic', 3500);
      const hingesMaterialPrice = getMaterialPrice('hingesMaterial', 'price_kitchen_hinge_blum', 120);
      
      // Assume 5 hinges per meter of cabinet
      const hingesCostPerMeter = 5 * hingesMaterialPrice;
      
      matList.push({
        key: 'kitchen_cabinet',
        name: `وحدات المطبخ الخشبية/الأكريليك`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'متر طولي',
        unitPrice: cabinetMaterialPrice,
        totalCost: Math.ceil(qty) * cabinetMaterialPrice,
        packagingDetails: `وحدات شاملة التقطيع والتجميع`
      });
      matList.push({
        key: 'kitchen_hinges',
        name: `المفصلات والإكسسوارات`,
        qtyRequired: qty * 5,
        qtyRounded: Math.ceil(qty * 5),
        unit: 'عدد',
        unitPrice: hingesMaterialPrice,
        totalCost: Math.ceil(qty * 5) * hingesMaterialPrice,
        packagingDetails: `بمتوسط 5 مفصلات للمتر الطولي`
      });
      break;
    }
    case '2.7.1': {
      const marbleMaterialPrice = getMaterialPrice('marbleMaterial', 'price_kitchen_granite_galaxy', 1800);
      matList.push({
        key: 'kitchen_marble',
        name: `رخام/جرانيت أسطح المطبخ`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'متر طولي',
        unitPrice: marbleMaterialPrice,
        totalCost: Math.ceil(qty) * marbleMaterialPrice,
        packagingDetails: `ألواح الرخام مع الشطف والتشطيب`
      });
      break;
    }
    case '2.8.1': {
      const plateMaterialPrice = getMaterialPrice('plateMaterial', 'price_plate_legrand', 45);
      const switchMaterialPrice = getMaterialPrice('switchMaterial', 'price_switch_legrand', 65);
      matList.push({
        key: 'elec_plates',
        name: `وشوش ومفاتيح الكهرباء النهائية`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: plateMaterialPrice,
        totalCost: Math.ceil(qty) * plateMaterialPrice,
        packagingDetails: `وش لكل نقطة`
      });
      matList.push({
        key: 'elec_switches',
        name: `لقم المفاتيح / البرايز`,
        qtyRequired: qty * 2, // Assume 2 switches/sockets per point
        qtyRounded: Math.ceil(qty * 2),
        unit: 'عدد',
        unitPrice: switchMaterialPrice,
        totalCost: Math.ceil(qty * 2) * switchMaterialPrice,
        packagingDetails: `متوسط 2 لقمة لكل نقطة`
      });
      break;
    }
    case '2.8.2': {
      const lightMaterialPrice = getMaterialPrice('lightMaterial', 'price_spot_led_7w', 120);
      matList.push({
        key: 'light_units',
        name: `وحدات الإنارة والسبوتات`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'عدد',
        unitPrice: lightMaterialPrice,
        totalCost: Math.ceil(qty) * lightMaterialPrice,
        packagingDetails: `وحدة إضاءة لكل نقطة`
      });
      break;
    }
    case '2.8.3': {
      const stripMaterialPrice = getMaterialPrice('stripMaterial', 'price_led_strip_m', 45);
      const stripRollLength = getSpecNum('stripRollLength', 0);
      
      let calcQty = qty;
      let unit = 'متر طولي';
      let details = `شريط ليد مع الوصلات`;
      
      if (stripRollLength > 0) {
        calcQty = Math.ceil(qty / stripRollLength);
        unit = 'لفة';
        details = `اللفة ${stripRollLength} متر`;
      }

      matList.push({
        key: 'led_strips',
        name: `شرائط الإضاءة المخفية LED`,
        qtyRequired: qty,
        qtyRounded: calcQty,
        unit: unit,
        unitPrice: stripMaterialPrice,
        totalCost: Math.ceil(calcQty) * stripMaterialPrice,
        packagingDetails: details
      });
      break;
    }
    case '2.9.1': {
      const sanitaryMaterialPrice = getMaterialPrice('sanitaryMaterial', 'price_toilet_duravit', 6500);
      matList.push({
        key: 'sanitary_ware',
        name: `أطقم الحمامات (قاعدة وحوض)`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'طقم',
        unitPrice: sanitaryMaterialPrice,
        totalCost: Math.ceil(qty) * sanitaryMaterialPrice,
        packagingDetails: `طقم صحي كامل لكل حمام`
      });
      break;
    }
    case '2.9.2': {
      const mixerMaterialPrice = getMaterialPrice('mixerMaterial', 'price_mixer_grohe', 12000);
      matList.push({
        key: 'mixers_set',
        name: `أطقم الخلاطات`,
        qtyRequired: qty,
        qtyRounded: Math.ceil(qty),
        unit: 'طقم',
        unitPrice: mixerMaterialPrice,
        totalCost: Math.ceil(qty) * mixerMaterialPrice,
        packagingDetails: `طقم خلاطات 3 قطع (بانيو، حوض، مطبخ)`
      });
      break;
    }

    default:
      break;
  }

  // Add User-defined Custom Materials (if any)
  if (item.customMaterials && item.customMaterials.length > 0) {
    item.customMaterials.forEach(cmat => {
      // If a multiplier is set, the quantity is dynamic based on item quantity
      let calcQty = cmat.multiplier ? qty * cmat.multiplier : cmat.quantity;
      let packagingText = cmat.multiplier ? `الكمية بناءً على نسبة (${cmat.multiplier}) من إجمالي البند` : 'كمية مخصصة';
      
      // If a packageSize is set (e.g. roll length 100m, can size 18L), divide the quantity by the package size
      if (cmat.packageSize && cmat.packageSize > 0) {
        calcQty = Math.ceil(calcQty / cmat.packageSize);
        packagingText = `الكمية المطلوبة تغطي معدل ${cmat.packageSize} للوحدة (${cmat.unit})`;
      }

      matList.push({
        key: cmat.id,
        name: cmat.name,
        qtyRequired: calcQty,
        qtyRounded: Math.ceil(calcQty),
        unit: cmat.unit,
        unitPrice: cmat.unitPrice,
        totalCost: Math.ceil(calcQty) * cmat.unitPrice,
        packagingDetails: packagingText
      });
    });
  } else if (item.pricing.mode === 'materials_labor_split' && matList.length === 0) {
    // Fallback for any other item using materials_labor_split
    matList.push({
      key: 'general_material',
      name: `مواد ومستلزمات: ${item.title}`,
      qtyRequired: qty,
      qtyRounded: Math.ceil(qty),
      unit: item.unit,
      unitPrice: item.pricing.materialUnitPrice || 0,
      totalCost: Math.ceil(qty) * (item.pricing.materialUnitPrice || 0),
      packagingDetails: `حسب وحدة البند (${item.unit})`
    });
  }

  return matList;
}
