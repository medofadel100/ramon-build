// Constants for Quantity Surveying and Material Pricing

export interface ConstantDefinition {
  key: string;
  label: string;
  group: 'materials' | 'rates';
  subgroup: 'general' | 'masonry' | 'plastering' | 'flooring' | 'electrical' | 'plumbing' | 'hvac';
  defaultValue: number;
  unit: string;
  supplierId?: string;
  supplierName?: string;
}

export const DEFAULT_CONSTANTS: ConstantDefinition[] = [
  // =====================
  // Master Material Prices (أسعار خامات مركزية)
  // =====================
  
  // General & Concrete (خامات عامة وخرسانات)
  { key: 'price_steel_ezz_ton', label: 'سعر طن حديد عز', group: 'materials', subgroup: 'general', defaultValue: 42000, unit: 'ج.م' },
  { key: 'price_steel_beshay_ton', label: 'سعر طن حديد بشاي', group: 'materials', subgroup: 'general', defaultValue: 41500, unit: 'ج.م' },
  { key: 'price_steel_invest_ton', label: 'سعر طن حديد استثماري', group: 'materials', subgroup: 'general', defaultValue: 39000, unit: 'ج.م' },
  { key: 'price_tie_wire_kg', label: 'سعر كيلو سلك الرباط', group: 'materials', subgroup: 'general', defaultValue: 45, unit: 'ج.م' },
  { key: 'price_nails_kg', label: 'سعر كيلو مسامير خشابي/صلب', group: 'materials', subgroup: 'general', defaultValue: 50, unit: 'ج.م' },
  { key: 'price_concrete_ready_250', label: 'سعر متر الخرسانة الجاهزة (مجهاد 250)', group: 'materials', subgroup: 'general', defaultValue: 1400, unit: 'ج.م' },
  { key: 'price_concrete_ready_300', label: 'سعر متر الخرسانة الجاهزة (مجهاد 300)', group: 'materials', subgroup: 'general', defaultValue: 1550, unit: 'ج.م' },
  { key: 'price_cement_bag', label: 'سعر شيكارة الأسمنت (بورتلاندي عادي)', group: 'materials', subgroup: 'general', defaultValue: 130, unit: 'ج.م' },
  { key: 'price_cement_seawater_bag', label: 'سعر شيكارة أسمنت مقاوم سي ووتر', group: 'materials', subgroup: 'general', defaultValue: 145, unit: 'ج.م' },
  { key: 'price_cement_white_bag', label: 'سعر شيكارة أسمنت أبيض', group: 'materials', subgroup: 'general', defaultValue: 180, unit: 'ج.م' },
  { key: 'price_sand_m3', label: 'سعر متر الرمل النظيف', group: 'materials', subgroup: 'general', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_gravel_m3', label: 'سعر متر الزلط الفينو', group: 'materials', subgroup: 'general', defaultValue: 350, unit: 'ج.م' },
  { key: 'price_crushed_stone_m3', label: 'سعر متر السن (زلط مكسر)', group: 'materials', subgroup: 'general', defaultValue: 300, unit: 'ج.م' },

  // Masonry (أعمال المباني)
  { key: 'price_brick_1000', label: 'سعر الألف طوبة (أحمر مفرغ نمطي)', group: 'materials', subgroup: 'masonry', defaultValue: 1500, unit: 'ج.م' },
  { key: 'price_brick_solid_1000', label: 'سعر الألف طوبة (أحمر مصمت)', group: 'materials', subgroup: 'masonry', defaultValue: 2200, unit: 'ج.م' },
  { key: 'price_brick_cement_1000', label: 'سعر الألف طوبة أسمنتي مصمت', group: 'materials', subgroup: 'masonry', defaultValue: 2500, unit: 'ج.م' },
  { key: 'price_brick_block_1000', label: 'سعر الألف بلوك أسمنتي', group: 'materials', subgroup: 'masonry', defaultValue: 7500, unit: 'ج.م' },
  { key: 'price_brick_white_1000', label: 'سعر الألف طوبة خفاف (أبيض)', group: 'materials', subgroup: 'masonry', defaultValue: 8500, unit: 'ج.م' },
  
  // Plastering & Finishes (المحارة والدهانات)
  { key: 'price_gypsum_bag', label: 'سعر شيكارة الجبس', group: 'materials', subgroup: 'plastering', defaultValue: 60, unit: 'ج.م' },
  { key: 'price_mesh_roll', label: 'سعر لفة الشبك الممدد (للفواصل)', group: 'materials', subgroup: 'plastering', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_gypsum_board_sqm', label: 'سعر متر الجبس بورد (خامات)', group: 'materials', subgroup: 'plastering', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_paint_can', label: 'سعر بستلة دهان بلاستيك (جوتن/سايبس)', group: 'materials', subgroup: 'plastering', defaultValue: 1800, unit: 'ج.م' },
  { key: 'price_putty_bag', label: 'سعر شيكارة معجون أكريليك', group: 'materials', subgroup: 'plastering', defaultValue: 350, unit: 'ج.م' },
  { key: 'price_sealer_gallon', label: 'سعر جالون سيلر مائي', group: 'materials', subgroup: 'plastering', defaultValue: 250, unit: 'ج.م' },

  // Flooring (السيراميك والأرضيات)
  { key: 'price_tile_ceramic_sqm', label: 'سعر متر السيراميك (فرز أول متوسط)', group: 'materials', subgroup: 'flooring', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_tile_porcelain_sqm', label: 'سعر متر البورسلين', group: 'materials', subgroup: 'flooring', defaultValue: 650, unit: 'ج.م' },
  { key: 'price_marble_galala_sqm', label: 'سعر متر رخام جلالة صني', group: 'materials', subgroup: 'flooring', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_tile_adhesive_bag', label: 'سعر شيكارة غراء السيراميك', group: 'materials', subgroup: 'flooring', defaultValue: 180, unit: 'ج.م' },
  { key: 'price_grout_bag', label: 'سعر كيس سقية (ترويبة)', group: 'materials', subgroup: 'flooring', defaultValue: 40, unit: 'ج.م' },

  // Plumbing & Insulation (السباكة والعزل)
  { key: 'price_membrane_roll', label: 'سعر لفة الممبرين أنسومات (10م)', group: 'materials', subgroup: 'plumbing', defaultValue: 1200, unit: 'ج.م' },
  { key: 'price_bitumen_cold_barrel', label: 'سعر برميل البيتومين البارد', group: 'materials', subgroup: 'plumbing', defaultValue: 1800, unit: 'ج.م' },
  { key: 'price_kemapoxy_can', label: 'سعر علبة كيمابوكسي 150', group: 'materials', subgroup: 'plumbing', defaultValue: 850, unit: 'ج.م' },
  { key: 'price_cement_insulation_bag', label: 'سعر شيكارة العزل الأسمنتي', group: 'materials', subgroup: 'plumbing', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_pvc_pipe_2', label: 'سعر ماسورة الشريف PVC (2 بوصة)', group: 'materials', subgroup: 'plumbing', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_pvc_pipe_3', label: 'سعر ماسورة الشريف PVC (3 بوصة)', group: 'materials', subgroup: 'plumbing', defaultValue: 350, unit: 'ج.م' },
  { key: 'price_pvc_pipe_4', label: 'سعر ماسورة الشريف PVC (4 بوصة)', group: 'materials', subgroup: 'plumbing', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_ppr_pipe_1_2', label: 'سعر ماسورة تغذية PPR (1/2 بوصة)', group: 'materials', subgroup: 'plumbing', defaultValue: 120, unit: 'ج.م' },
  { key: 'price_ppr_pipe_3_4', label: 'سعر ماسورة تغذية PPR (3/4 بوصة)', group: 'materials', subgroup: 'plumbing', defaultValue: 180, unit: 'ج.م' },
  { key: 'price_ppr_pipe_1', label: 'سعر ماسورة تغذية PPR (1 بوصة)', group: 'materials', subgroup: 'plumbing', defaultValue: 250, unit: 'ج.م' },

  // Electrical (الكهرباء)
  { key: 'price_wire_1_roll', label: 'سعر لفة سلك السويدي 1 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 900, unit: 'ج.م' },
  { key: 'price_wire_1_5_roll', label: 'سعر لفة سلك السويدي 1.5 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 1200, unit: 'ج.م' },
  { key: 'price_wire_2_5_roll', label: 'سعر لفة سلك السويدي 2.5 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 1800, unit: 'ج.م' },
  { key: 'price_wire_3_roll', label: 'سعر لفة سلك السويدي 3 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 2100, unit: 'ج.م' },
  { key: 'price_wire_4_roll', label: 'سعر لفة سلك السويدي 4 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 2800, unit: 'ج.م' },
  { key: 'price_wire_6_roll', label: 'سعر لفة سلك السويدي 6 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 4200, unit: 'ج.م' },
  { key: 'price_wire_10_roll', label: 'سعر لفة سلك السويدي 10 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 7000, unit: 'ج.م' },
  { key: 'price_wire_16_roll', label: 'سعر لفة سلك السويدي 16 مم (100م)', group: 'materials', subgroup: 'electrical', defaultValue: 11000, unit: 'ج.م' },
  { key: 'price_data_roll', label: 'سعر صندوق سلك داتا CAT6 (305م)', group: 'materials', subgroup: 'electrical', defaultValue: 3200, unit: 'ج.م' },
  { key: 'price_aladdin_hose_roll', label: 'سعر لفة خرطوم علاء الدين (50م)', group: 'materials', subgroup: 'electrical', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_flexible_hose_roll', label: 'سعر لفة خرطوم سوستة (فليكسيبل)', group: 'materials', subgroup: 'electrical', defaultValue: 150, unit: 'ج.م' },
  { key: 'price_magic_box', label: 'سعر العلبة الماجيك المعتمدة', group: 'materials', subgroup: 'electrical', defaultValue: 15, unit: 'ج.م' },
  { key: 'price_db_12_way', label: 'سعر لوحة توزيع فينوس 12 خط', group: 'materials', subgroup: 'electrical', defaultValue: 800, unit: 'ج.م' },

  // HVAC (التكييف)
  { key: 'price_copper_roll_1_4', label: 'سعر متر النحاس (1/4 بوصة)', group: 'materials', subgroup: 'hvac', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_copper_roll_3_8', label: 'سعر متر النحاس (3/8 بوصة)', group: 'materials', subgroup: 'hvac', defaultValue: 350, unit: 'ج.م' },
  { key: 'price_copper_roll_1_2', label: 'سعر متر النحاس (1/2 بوصة)', group: 'materials', subgroup: 'hvac', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_copper_roll_5_8', label: 'سعر متر النحاس (5/8 بوصة)', group: 'materials', subgroup: 'hvac', defaultValue: 550, unit: 'ج.م' },
  { key: 'price_armaflex_m', label: 'سعر متر عزل أرمافليكس', group: 'materials', subgroup: 'hvac', defaultValue: 35, unit: 'ج.م' },
  { key: 'price_ac_bracket', label: 'سعر كابولي تكييف (جوز)', group: 'materials', subgroup: 'hvac', defaultValue: 450, unit: 'ج.م' },

  // =====================
  // Consumption Rates (معدلات الاستهلاك ونسب الهدر)
  // =====================
  
  // Wastage Percentages (نسب الهدر العامة)
  { key: 'waste_steel_percent', label: 'نسبة هالك الحديد', group: 'rates', subgroup: 'general', defaultValue: 5, unit: '%' },
  { key: 'waste_concrete_percent', label: 'نسبة هالك الخرسانة', group: 'rates', subgroup: 'general', defaultValue: 3, unit: '%' },
  { key: 'waste_cement_percent', label: 'نسبة هالك الأسمنت', group: 'rates', subgroup: 'general', defaultValue: 5, unit: '%' },
  { key: 'waste_sand_gravel_percent', label: 'نسبة هالك الرمل والزلط', group: 'rates', subgroup: 'general', defaultValue: 10, unit: '%' },

  // Concrete & General Rates
  { key: 'rate_tie_wire_per_ton', label: 'معدل سلك الرباط لكل طن حديد', group: 'rates', subgroup: 'general', defaultValue: 10, unit: 'كجم' },
  
  // Masonry
  { key: 'rate_bricks_per_sqm_half', label: 'طوب لكل متر مربع (نص طوبة - 12سم)', group: 'rates', subgroup: 'masonry', defaultValue: 58, unit: 'طوبة' },
  { key: 'rate_bricks_per_sqm_full', label: 'طوب لكل متر مربع (طوبة كاملة - 25سم)', group: 'rates', subgroup: 'masonry', defaultValue: 115, unit: 'طوبة' },
  { key: 'rate_cement_kg_per_sqm_masonry', label: 'أسمنت مباني لكل متر مربع (12سم)', group: 'rates', subgroup: 'masonry', defaultValue: 15, unit: 'كجم' },
  { key: 'waste_bricks_percent', label: 'نسبة هالك الطوب', group: 'rates', subgroup: 'masonry', defaultValue: 5, unit: '%' },
  
  // Plastering
  { key: 'rate_cement_bags_per_sqm_plaster', label: 'أسمنت محارة لكل متر مربع', group: 'rates', subgroup: 'plastering', defaultValue: 0.25, unit: 'شكارة' },
  { key: 'rate_sand_m3_per_sqm_plaster', label: 'رمل محارة لكل متر مربع', group: 'rates', subgroup: 'plastering', defaultValue: 0.02, unit: 'م³' },

  // Finishes
  { key: 'rate_paint_sqm_per_liter', label: 'معدل فرد الدهان (متر مربع للتر للوجه الواحد)', group: 'rates', subgroup: 'plastering', defaultValue: 10, unit: 'م²' },
  { key: 'rate_putty_sqm_per_bag', label: 'معدل فرد المعجون (متر مربع للشيكارة سكينتين)', group: 'rates', subgroup: 'plastering', defaultValue: 20, unit: 'م²' },
  
  // Flooring
  { key: 'rate_adhesive_sqm_per_bag', label: 'معدل فرد غراء السيراميك (متر مربع للشيكارة)', group: 'rates', subgroup: 'flooring', defaultValue: 5, unit: 'م²' },
  { key: 'rate_grout_sqm_per_bag', label: 'معدل سقية الفواصل (متر مربع لكيس الترويبة)', group: 'rates', subgroup: 'flooring', defaultValue: 15, unit: 'م²' },
  { key: 'waste_tiles_percent', label: 'نسبة هالك السيراميك/البورسلين', group: 'rates', subgroup: 'flooring', defaultValue: 10, unit: '%' },
  { key: 'waste_marble_percent', label: 'نسبة هالك الرخام', group: 'rates', subgroup: 'flooring', defaultValue: 15, unit: '%' },

  // Plumbing
  { key: 'rate_membrane_net_sqm', label: 'الصافي الفعلي للفة الممبرين (بعد الركوب)', group: 'rates', subgroup: 'plumbing', defaultValue: 8.5, unit: 'م²' },
  { key: 'rate_cement_insulation_sqm_per_bag', label: 'فرد العزل الأسمنتي للوجهين (متر للشيكارة)', group: 'rates', subgroup: 'plumbing', defaultValue: 8, unit: 'م²' },
  { key: 'waste_plumbing_pipes_percent', label: 'نسبة هالك مواسير السباكة', group: 'rates', subgroup: 'plumbing', defaultValue: 5, unit: '%' },
  
  // Electrical
  { key: 'waste_electrical_wires_percent', label: 'نسبة هالك أسلاك الكهرباء', group: 'rates', subgroup: 'electrical', defaultValue: 5, unit: '%' },
  { key: 'waste_electrical_hoses_percent', label: 'نسبة هالك خراطيم الكهرباء', group: 'rates', subgroup: 'electrical', defaultValue: 5, unit: '%' }
];

export function getDefaultConstantsMap(): Record<string, number> {
  const map: Record<string, number> = {};
  DEFAULT_CONSTANTS.forEach(c => {
    map[c.key] = c.defaultValue;
  });
  return map;
}
