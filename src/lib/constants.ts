// Constants for Quantity Surveying and Material Pricing

export interface ConstantDefinition {
  key: string;
  label: string;
  group: 'materials' | 'rates';
  subgroup: 'general' | 'masonry' | 'plastering' | 'flooring' | 'electrical' | 'plumbing' | 'hvac';
  defaultValue: number;
  unit: string;
}

export const DEFAULT_CONSTANTS: ConstantDefinition[] = [
  // =====================
  // Master Material Prices (أسعار خامات مركزية)
  // =====================
  { key: 'price_cement_bag', label: 'سعر شيكارة الأسمنت (50 كجم)', group: 'materials', subgroup: 'general', defaultValue: 130, unit: 'ج.م' },
  { key: 'price_sand_m3', label: 'سعر متر الرمل', group: 'materials', subgroup: 'general', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_brick_1000', label: 'سعر الألف طوبة (أحمر مفرغ)', group: 'materials', subgroup: 'masonry', defaultValue: 1500, unit: 'ج.م' },
  
  { key: 'price_gypsum_bag', label: 'سعر شيكارة الجبس', group: 'materials', subgroup: 'plastering', defaultValue: 60, unit: 'ج.م' },
  { key: 'price_tile_adhesive_bag', label: 'سعر شيكارة غراء السيراميك', group: 'materials', subgroup: 'flooring', defaultValue: 180, unit: 'ج.م' },
  { key: 'price_grout_bag', label: 'سعر كيس سقية (ترويبة)', group: 'materials', subgroup: 'flooring', defaultValue: 40, unit: 'ج.م' },

  { key: 'price_membrane_roll', label: 'سعر لفة الممبرين (عزل مائي 10م)', group: 'materials', subgroup: 'plumbing', defaultValue: 1200, unit: 'ج.م' },
  { key: 'price_cement_insulation_bag', label: 'سعر شيكارة العزل الأسمنتي', group: 'materials', subgroup: 'plumbing', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_pvc_pipe_4', label: 'سعر ماسورة PVC (4 بوصة)', group: 'materials', subgroup: 'plumbing', defaultValue: 450, unit: 'ج.م' },

  { key: 'price_wire_1_5_roll', label: 'سعر لفة سلك 1.5 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 1200, unit: 'ج.م' },
  { key: 'price_wire_2_5_roll', label: 'سعر لفة سلك 2.5 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 1800, unit: 'ج.م' },
  { key: 'price_data_roll', label: 'سعر صندوق سلك داتا CAT6 (305م)', group: 'materials', subgroup: 'electrical', defaultValue: 3200, unit: 'ج.م' },

  { key: 'price_copper_roll_15m', label: 'سعر لفة نحاس تكييف (15م)', group: 'materials', subgroup: 'hvac', defaultValue: 5500, unit: 'ج.م' },
  { key: 'price_armaflex_m', label: 'سعر متر عزل أرماكفلكس', group: 'materials', subgroup: 'hvac', defaultValue: 35, unit: 'ج.م' },

  { key: 'price_paint_can', label: 'سعر بستلة الدهان النهائي', group: 'materials', subgroup: 'plastering', defaultValue: 1800, unit: 'ج.م' },
  { key: 'price_putty_bag', label: 'سعر شيكارة معجون الدهانات', group: 'materials', subgroup: 'plastering', defaultValue: 350, unit: 'ج.م' },
  { key: 'price_sealer_gallon', label: 'سعر جالون السيلر', group: 'materials', subgroup: 'plastering', defaultValue: 250, unit: 'ج.م' },

  // =====================
  // Consumption Rates (معدلات الاستهلاك)
  // =====================
  // Masonry
  { key: 'rate_bricks_per_sqm_half', label: 'طوب لكل متر مربع (نص طوبة - 12سم)', group: 'rates', subgroup: 'masonry', defaultValue: 58, unit: 'طوبة' },
  { key: 'rate_bricks_per_sqm_full', label: 'طوب لكل متر مربع (طوبة كاملة - 25سم)', group: 'rates', subgroup: 'masonry', defaultValue: 115, unit: 'طوبة' },
  { key: 'rate_cement_kg_per_sqm_masonry', label: 'أسمنت مباني لكل متر مربع (12سم)', group: 'rates', subgroup: 'masonry', defaultValue: 15, unit: 'كجم' },
  
  // Plastering
  { key: 'rate_cement_bags_per_sqm_plaster', label: 'أسمنت محارة لكل متر مربع', group: 'rates', subgroup: 'plastering', defaultValue: 0.25, unit: 'شكارة' },
  { key: 'rate_sand_m3_per_sqm_plaster', label: 'رمل محارة لكل متر مربع', group: 'rates', subgroup: 'plastering', defaultValue: 0.02, unit: 'م³' },

  // Finishes
  { key: 'rate_paint_sqm_per_liter', label: 'معدل فرد الدهان (متر مربع للتر للوجه الواحد)', group: 'rates', subgroup: 'plastering', defaultValue: 10, unit: 'م²' },
  { key: 'rate_putty_sqm_per_bag', label: 'معدل فرد المعجون (متر مربع للشيكارة سكينتين)', group: 'rates', subgroup: 'plastering', defaultValue: 20, unit: 'م²' },
  
  // Flooring
  { key: 'rate_adhesive_sqm_per_bag', label: 'معدل فرد غراء السيراميك (متر مربع للشيكارة)', group: 'rates', subgroup: 'flooring', defaultValue: 5, unit: 'م²' },
  { key: 'rate_grout_sqm_per_bag', label: 'معدل سقية الفواصل (متر مربع لكيس الترويبة)', group: 'rates', subgroup: 'flooring', defaultValue: 15, unit: 'م²' },
  { key: 'rate_wastage_percent_tiles', label: 'نسبة هالك السيراميك القياسية', group: 'rates', subgroup: 'flooring', defaultValue: 10, unit: '%' },

  // Electrical
  { key: 'rate_wire_m_per_light_point', label: 'أمتار سلك 1.5 مم لنقطة الإنارة', group: 'rates', subgroup: 'electrical', defaultValue: 10, unit: 'متر' },
  { key: 'rate_wire_m_per_socket_point', label: 'أمتار سلك 2.5 مم لنقطة البريزة', group: 'rates', subgroup: 'electrical', defaultValue: 15, unit: 'متر' },
  
  // Plumbing
  { key: 'rate_membrane_net_sqm', label: 'الصافي الفعلي للفة الممبرين (بعد الركوب)', group: 'rates', subgroup: 'plumbing', defaultValue: 8.5, unit: 'م²' },
  { key: 'rate_cement_insulation_sqm_per_bag', label: 'فرد العزل الأسمنتي للوجهين (متر للشيكارة)', group: 'rates', subgroup: 'plumbing', defaultValue: 8, unit: 'م²' }
];

export function getDefaultConstantsMap(): Record<string, number> {
  const map: Record<string, number> = {};
  DEFAULT_CONSTANTS.forEach(c => {
    map[c.key] = c.defaultValue;
  });
  return map;
}
