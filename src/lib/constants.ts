// Constants for Quantity Surveying and Material Pricing

export interface ConstantDefinition {
  key: string;
  label: string;
  group: 'materials' | 'rates';
  subgroup: 'general' | 'masonry' | 'plastering' | 'flooring' | 'electrical' | 'electrical_switches' | 'electrical_lighting' | 'electrical_boards' | 'plumbing' | 'sanitary' | 'hvac' | 'woodwork' | 'cladding' | 'kitchens' | 'aluminum';
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

  // Sanitary Fixtures (الأجهزة الصحية والخلطات)
  { key: 'price_toilet_duravit', label: 'طقم حمام ديورافيت (قاعدة وحوض)', group: 'materials', subgroup: 'sanitary', defaultValue: 6500, unit: 'ج.م' },
  { key: 'price_toilet_ideal', label: 'طقم حمام إيديال ستاندرد', group: 'materials', subgroup: 'sanitary', defaultValue: 5800, unit: 'ج.م' },
  { key: 'price_mixer_grohe', label: 'طقم خلاطات جروهي (حوض/دش/بيديه)', group: 'materials', subgroup: 'sanitary', defaultValue: 12000, unit: 'ج.م' },
  { key: 'price_mixer_ideal', label: 'طقم خلاطات إيديال ستاندرد', group: 'materials', subgroup: 'sanitary', defaultValue: 8500, unit: 'ج.م' },
  { key: 'price_mixer_sarrdesign', label: 'طقم خلاطات سارديزاين', group: 'materials', subgroup: 'sanitary', defaultValue: 4500, unit: 'ج.م' },
  { key: 'price_bathtub_acrylic', label: 'بانيو أكريليك (170x70) الطيب', group: 'materials', subgroup: 'sanitary', defaultValue: 4500, unit: 'ج.م' },
  { key: 'price_shower_cabin', label: 'كابينة شاور سيكوريت 10مم', group: 'materials', subgroup: 'sanitary', defaultValue: 8000, unit: 'ج.م' },
  { key: 'price_kitchen_sink_franke', label: 'حلة مطبخ فرانكي استانلس 2 عين', group: 'materials', subgroup: 'sanitary', defaultValue: 5500, unit: 'ج.م' },
  { key: 'price_kitchen_sink_korea', label: 'حلة مطبخ كوري 1 عين', group: 'materials', subgroup: 'sanitary', defaultValue: 2500, unit: 'ج.م' },

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
  { key: 'price_db_12_way_venus', label: 'لوحة توزيع فينوس 12 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 800, unit: 'ج.م' },
  { key: 'price_db_18_way_venus', label: 'لوحة توزيع فينوس 18 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 1100, unit: 'ج.م' },
  { key: 'price_db_24_way_venus', label: 'لوحة توزيع فينوس 24 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 1500, unit: 'ج.م' },
  { key: 'price_db_36_way_venus', label: 'لوحة توزيع فينوس 36 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 2100, unit: 'ج.م' },
  { key: 'price_db_12_way_schneider', label: 'لوحة توزيع شنايدر 12 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 1400, unit: 'ج.م' },
  { key: 'price_db_18_way_schneider', label: 'لوحة توزيع شنايدر 18 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 2000, unit: 'ج.م' },
  { key: 'price_db_24_way_schneider', label: 'لوحة توزيع شنايدر 24 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 2600, unit: 'ج.م' },
  { key: 'price_db_36_way_schneider', label: 'لوحة توزيع شنايدر 36 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 3800, unit: 'ج.م' },
  { key: 'price_db_12_way_hager', label: 'لوحة توزيع هاجر 12 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 1200, unit: 'ج.م' },
  { key: 'price_db_18_way_hager', label: 'لوحة توزيع هاجر 18 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 1800, unit: 'ج.م' },
  { key: 'price_db_24_way_hager', label: 'لوحة توزيع هاجر 24 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 2300, unit: 'ج.م' },
  { key: 'price_db_36_way_hager', label: 'لوحة توزيع هاجر 36 خط', group: 'materials', subgroup: 'electrical_boards', defaultValue: 3400, unit: 'ج.م' },
  { key: 'price_breaker_schneider_1p', label: 'قاطع شنايدر 1 فاز (10-32A)', group: 'materials', subgroup: 'electrical_boards', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_breaker_hager_1p', label: 'قاطع هاجر 1 فاز (10-32A)', group: 'materials', subgroup: 'electrical_boards', defaultValue: 220, unit: 'ج.م' },
  { key: 'price_breaker_legrand_1p', label: 'قاطع ليجراند 1 فاز (10-32A)', group: 'materials', subgroup: 'electrical_boards', defaultValue: 280, unit: 'ج.م' },

  // HVAC (التكييف)
  { key: 'price_copper_roll_1_4', label: 'سعر متر النحاس (1/4 بوصة)', group: 'materials', subgroup: 'hvac', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_copper_roll_3_8', label: 'سعر متر النحاس (3/8 بوصة)', group: 'materials', subgroup: 'hvac', defaultValue: 350, unit: 'ج.م' },
  { key: 'price_copper_roll_1_2', label: 'سعر متر النحاس (1/2 بوصة)', group: 'materials', subgroup: 'hvac', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_copper_roll_5_8', label: 'سعر متر النحاس (5/8 بوصة)', group: 'materials', subgroup: 'hvac', defaultValue: 550, unit: 'ج.م' },
  { key: 'price_armaflex_m', label: 'سعر متر عزل أرمافليكس', group: 'materials', subgroup: 'hvac', defaultValue: 35, unit: 'ج.م' },
  { key: 'price_ac_bracket', label: 'سعر كابولي تكييف (جوز)', group: 'materials', subgroup: 'hvac', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_control_wire_m', label: 'سعر متر سلك كنترول', group: 'materials', subgroup: 'hvac', defaultValue: 15, unit: 'ج.م' },
  { key: 'price_drain_pipe_m', label: 'سعر متر ماسورة صرف تكييف PVC', group: 'materials', subgroup: 'hvac', defaultValue: 25, unit: 'ج.م' },
  { key: 'price_isolator', label: 'مفتاح أيزوليتور (تكييف)', group: 'materials', subgroup: 'hvac', defaultValue: 150, unit: 'ج.م' },
  { key: 'price_fan_15', label: 'شفاط حمام 15 سم', group: 'materials', subgroup: 'hvac', defaultValue: 350, unit: 'ج.م' },
  { key: 'price_duct_pvc', label: 'دكت فليكسبل PVC (متر)', group: 'materials', subgroup: 'hvac', defaultValue: 120, unit: 'ج.م' },
  { key: 'price_grille_30x30', label: 'ديفيوزر/جريل 30x30 سم', group: 'materials', subgroup: 'hvac', defaultValue: 180, unit: 'ج.م' },
  { key: 'price_ac_split_2_25', label: 'تكييف سبليت 2.25 حصان', group: 'materials', subgroup: 'hvac', defaultValue: 22000, unit: 'ج.م' },
  { key: 'price_hood_90', label: 'شفاط مطبخ هرمي 90 سم', group: 'materials', subgroup: 'hvac', defaultValue: 4500, unit: 'ج.م' },
  // Woodwork & Doors (النجارة والأبواب)
  { key: 'price_wood_mosky_m3', label: 'سعر متر مكعب خشب موسكي', group: 'materials', subgroup: 'woodwork', defaultValue: 22000, unit: 'ج.م' },
  { key: 'price_wood_aziz_m3', label: 'سعر متر مكعب خشب عزيزي', group: 'materials', subgroup: 'woodwork', defaultValue: 45000, unit: 'ج.م' },
  { key: 'price_mdf_board', label: 'سعر لوح MDF عادي', group: 'materials', subgroup: 'woodwork', defaultValue: 1500, unit: 'ج.م' },
  { key: 'price_door_lock_kale', label: 'سعر كالون كالي تركي', group: 'materials', subgroup: 'woodwork', defaultValue: 650, unit: 'ج.م' },
  { key: 'price_door_lock_yale', label: 'سعر كالون ييل إيطالي', group: 'materials', subgroup: 'woodwork', defaultValue: 1200, unit: 'ج.م' },
  { key: 'price_door_handle', label: 'سعر طقم أكر مقابض أبواب', group: 'materials', subgroup: 'woodwork', defaultValue: 350, unit: 'ج.م' },

  // Kitchens & Marble (المطابخ ورخام المطبخ)
  { key: 'price_kitchen_marble_galala', label: 'سعر متر رخام جلالة مطابخ', group: 'materials', subgroup: 'kitchens', defaultValue: 1500, unit: 'ج.م' },
  { key: 'price_kitchen_granite_galaxy', label: 'سعر متر جرانيت جلاكسي', group: 'materials', subgroup: 'kitchens', defaultValue: 1800, unit: 'ج.م' },
  { key: 'price_kitchen_quartz', label: 'سعر متر كوارتز مستورد', group: 'materials', subgroup: 'kitchens', defaultValue: 4500, unit: 'ج.م' },
  { key: 'price_kitchen_corian', label: 'سعر متر كوريان', group: 'materials', subgroup: 'kitchens', defaultValue: 3800, unit: 'ج.م' },
  { key: 'price_kitchen_board_hpl', label: 'سعر لوح مطابخ HPL', group: 'materials', subgroup: 'kitchens', defaultValue: 2800, unit: 'ج.م' },
  { key: 'price_kitchen_board_acrylic', label: 'سعر لوح مطابخ أكريليك', group: 'materials', subgroup: 'kitchens', defaultValue: 3500, unit: 'ج.م' },
  { key: 'price_kitchen_hinge_blum', label: 'سعر مفصلة بلوم Blum', group: 'materials', subgroup: 'kitchens', defaultValue: 120, unit: 'ج.م' },
  { key: 'price_kitchen_hinge_normal', label: 'سعر مفصلة عادية/صيني', group: 'materials', subgroup: 'kitchens', defaultValue: 35, unit: 'ج.م' },

  // Aluminum (الألوميتال والزجاج)
  { key: 'price_alum_jumbo', label: 'سعر متر ألوميتال جامبو شريف علي حسن', group: 'materials', subgroup: 'aluminum', defaultValue: 3500, unit: 'ج.م' },
  { key: 'price_alum_tango', label: 'سعر متر ألوميتال تانجو', group: 'materials', subgroup: 'aluminum', defaultValue: 2800, unit: 'ج.م' },
  { key: 'price_alum_thermal_break', label: 'سعر متر ألوميتال قطاع حراري', group: 'materials', subgroup: 'aluminum', defaultValue: 5500, unit: 'ج.م' },

  // Cladding & Wall Decor (التجليدات وبديل الرخام والخشب)
  { key: 'price_wpc_panel', label: 'سعر شريحة بديل الخشب WPC', group: 'materials', subgroup: 'cladding', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_pvc_marble_panel', label: 'سعر لوح بديل الرخام PVC', group: 'materials', subgroup: 'cladding', defaultValue: 1200, unit: 'ج.م' },
  { key: 'price_mdf_veneer_panel', label: 'سعر لوح تجليد قشرة أرو', group: 'materials', subgroup: 'cladding', defaultValue: 1800, unit: 'ج.م' },
  { key: 'price_cladding_adhesive', label: 'سعر عبوة سيليكون عظم', group: 'materials', subgroup: 'cladding', defaultValue: 150, unit: 'ج.م' },

  // Electrical Switches & Plates (وشوش ومفاتيح وبرايز)
  { key: 'price_switch_legrand', label: 'لقمة مفتاح ليجراند ساسي', group: 'materials', subgroup: 'electrical_switches', defaultValue: 65, unit: 'ج.م' },
  { key: 'price_switch_schneider', label: 'لقمة مفتاح شنايدر ديسنت', group: 'materials', subgroup: 'electrical_switches', defaultValue: 55, unit: 'ج.م' },
  { key: 'price_switch_venus', label: 'لقمة مفتاح فينوس', group: 'materials', subgroup: 'electrical_switches', defaultValue: 30, unit: 'ج.م' },
  { key: 'price_socket_legrand', label: 'بريزة ليجراند ساسي', group: 'materials', subgroup: 'electrical_switches', defaultValue: 80, unit: 'ج.م' },
  { key: 'price_socket_schneider', label: 'بريزة شنايدر ديسنت', group: 'materials', subgroup: 'electrical_switches', defaultValue: 70, unit: 'ج.م' },
  { key: 'price_socket_venus', label: 'بريزة فينوس', group: 'materials', subgroup: 'electrical_switches', defaultValue: 25, unit: 'ج.م' },
  { key: 'price_plate_legrand', label: 'وش ليجراند ساسي', group: 'materials', subgroup: 'electrical_switches', defaultValue: 45, unit: 'ج.م' },
  { key: 'price_plate_schneider', label: 'وش شنايدر ديسنت', group: 'materials', subgroup: 'electrical_switches', defaultValue: 40, unit: 'ج.م' },
  { key: 'price_plate_venus', label: 'وش فينوس', group: 'materials', subgroup: 'electrical_switches', defaultValue: 15, unit: 'ج.م' },
  { key: 'price_chassis_plastic', label: 'شاسيه بلاستيك', group: 'materials', subgroup: 'electrical_switches', defaultValue: 20, unit: 'ج.م' },
  { key: 'price_chassis_metal', label: 'شاسيه معدني', group: 'materials', subgroup: 'electrical_switches', defaultValue: 30, unit: 'ج.م' },
  { key: 'price_keystone_rj45', label: 'لقمة RJ45 كيستون', group: 'materials', subgroup: 'electrical_switches', defaultValue: 80, unit: 'ج.م' },

  // Electrical Lighting (إنارة وسبوتات)
  { key: 'price_spot_led_7w', label: 'سبوت LED 7 وات عادي', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 120, unit: 'ج.م' },
  { key: 'price_spot_led_cob', label: 'سبوت غاطس COB عالي الجودة', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 250, unit: 'ج.م' },
  { key: 'price_spot_panel_18w', label: 'بانل لايت 18 وات سقفي', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 180, unit: 'ج.م' },
  { key: 'price_led_strip_m', label: 'شريط ليد COB بروفايل (متر)', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 45, unit: 'ج.م' },
  { key: 'price_led_strip_smd', label: 'شريط ليد SMD عادي (متر)', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 25, unit: 'ج.م' },
  { key: 'price_chandelier_modern', label: 'نجفة مودرن متوسطة', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 3500, unit: 'ج.م' },
  { key: 'price_chandelier_classic', label: 'نجفة كلاسيك كريستال', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 5000, unit: 'ج.م' },
  { key: 'price_applique', label: 'أبليك/أباجورة حائط', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 450, unit: 'ج.م' },
  { key: 'price_driver_meanwell', label: 'محول Mean Well أصلي', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 350, unit: 'ج.م' },
  { key: 'price_driver_chinese', label: 'محول صيني تجاري', group: 'materials', subgroup: 'electrical_lighting', defaultValue: 120, unit: 'ج.م' },

  // Plumbing Finishes (التشطيبات الصحية والخلاطات)
  { key: 'price_wc_duravit', label: 'سعر طقم حمام ديورافيت Duravit', group: 'materials', subgroup: 'plumbing', defaultValue: 6500, unit: 'ج.م' },
  { key: 'price_wc_ideal', label: 'سعر طقم حمام إيديال ستاندرد', group: 'materials', subgroup: 'plumbing', defaultValue: 7200, unit: 'ج.م' },
  { key: 'price_wc_geberit', label: 'سعر صندوق طرد مدفون (جروهي/جبريت)', group: 'materials', subgroup: 'plumbing', defaultValue: 4500, unit: 'ج.م' },
  { key: 'price_mixer_grohe', label: 'سعر طقم خلاطات جروهي Grohe (3 قطع)', group: 'materials', subgroup: 'plumbing', defaultValue: 12000, unit: 'ج.م' },
  { key: 'price_mixer_ideal', label: 'سعر طقم خلاطات إيديال (3 قطع)', group: 'materials', subgroup: 'plumbing', defaultValue: 8500, unit: 'ج.م' },
  { key: 'price_mixer_turk', label: 'سعر طقم خلاطات تركي (3 قطع)', group: 'materials', subgroup: 'plumbing', defaultValue: 3500, unit: 'ج.م' },
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
