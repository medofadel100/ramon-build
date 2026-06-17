import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Initialize Firebase with the project config
const firebaseConfig = {
  apiKey: "AIzaSyCaAKLGHq-kbPbxjgCG_mBaBmshTsIHH3Y",
  authDomain: "ramon-build.firebaseapp.com",
  projectId: "ramon-build",
  storageBucket: "ramon-build.firebasestorage.app",
  messagingSenderId: "598966235253",
  appId: "1:598966235253:web:a9f709fbef7ab13da0883c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dummyMaterials = [
  // بناء
  { id: 'bld_cement_suez', name: 'أسمنت السويس بورتلاندي 50 كجم', category: 'بناء', subCategory: 'أسمنت', unit: 'طن', lowestPrice: 2150, sources: [{ storeName: 'عبدو ماركت', price: 2150, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'السويفي', price: 2200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_cement_white', name: 'أسمنت أبيض سيناء 50 كجم', category: 'بناء', subCategory: 'أسمنت', unit: 'طن', lowestPrice: 3800, sources: [{ storeName: 'السويفي', price: 3800, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_sand_fine', name: 'رمل ناعم مباني', category: 'بناء', subCategory: 'رمل ناعم', unit: 'متر مكعب', lowestPrice: 150, sources: [{ storeName: 'موردين محليين', price: 150, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_brick_red', name: 'طوب أحمر طفلي مفرغ مقاس 24×11×6', category: 'بناء', subCategory: 'طوب أحمر', unit: 'ألف طوبة', lowestPrice: 1300, sources: [{ storeName: 'عبدو ماركت', price: 1300, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'bld_gypsum', name: 'جبس سيناء البلاح', category: 'بناء', subCategory: 'جبس طبيعي', unit: 'شكارة', lowestPrice: 65, sources: [{ storeName: 'السويفي', price: 65, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  
  // كهرباء
  { id: 'elec_wire_1.5', name: 'لفة سلك نحاس 1.5 مم السويدي', category: 'كهرباء', subCategory: 'أسلاك نحاس', unit: 'لفة (100م)', lowestPrice: 850, sources: [{ storeName: 'Amazon.eg', price: 850, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'السويفي', price: 870, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_wire_2', name: 'لفة سلك نحاس 2 مم السويدي', category: 'كهرباء', subCategory: 'أسلاك نحاس', unit: 'لفة (100م)', lowestPrice: 1100, sources: [{ storeName: 'Amazon.eg', price: 1100, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_wire_3', name: 'لفة سلك نحاس 3 مم السويدي', category: 'كهرباء', subCategory: 'أسلاك نحاس', unit: 'لفة (100م)', lowestPrice: 1550, sources: [{ storeName: 'Amazon.eg', price: 1550, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_wire_4', name: 'لفة سلك نحاس 4 مم السويدي', category: 'كهرباء', subCategory: 'أسلاك نحاس', unit: 'لفة (100م)', lowestPrice: 2050, sources: [{ storeName: 'Amazon.eg', price: 2050, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'ليبر', price: 2100, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_panel_12', name: 'لوحة توزيع فينوس 12 خط داخل الحائط', category: 'كهرباء', subCategory: 'لوحات توزيع', unit: 'قطعة', lowestPrice: 450, sources: [{ storeName: 'Amazon.eg', price: 450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_breaker_16', name: 'قاطع تيار شنايدر 16 أمبير مفرد', category: 'كهرباء', subCategory: 'قواطع', unit: 'قطعة', lowestPrice: 120, sources: [{ storeName: 'Amazon.eg', price: 120, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'السويفي', price: 125, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_breaker_32', name: 'قاطع تيار شنايدر 32 أمبير مفرد', category: 'كهرباء', subCategory: 'قواطع', unit: 'قطعة', lowestPrice: 140, sources: [{ storeName: 'Amazon.eg', price: 140, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_rccb_63', name: 'قاطع حماية أرضي RCCB 63A 30mA', category: 'كهرباء', subCategory: 'RCCB', unit: 'قطعة', lowestPrice: 1850, sources: [{ storeName: 'Amazon.eg', price: 1850, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_pipe_16', name: 'خرطوم كهرباء 16 مم سويدي', category: 'كهرباء', subCategory: 'خراطيم', unit: 'لفة', lowestPrice: 280, sources: [{ storeName: 'السويفي', price: 280, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_pipe_20', name: 'خرطوم كهرباء 20 مم سويدي', category: 'كهرباء', subCategory: 'خراطيم', unit: 'لفة', lowestPrice: 350, sources: [{ storeName: 'السويفي', price: 350, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_box_magic', name: 'علبة ماجيك بتشينو', category: 'كهرباء', subCategory: 'علب تأسيس', unit: 'قطعة', lowestPrice: 12, sources: [{ storeName: 'السويفي', price: 12, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'Amazon.eg', price: 15, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_switch_1', name: 'مفتاح إنارة مفرد سانشي', category: 'كهرباء', subCategory: 'مفاتيح وفيش', unit: 'قطعة', lowestPrice: 35, sources: [{ storeName: 'Amazon.eg', price: 35, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_socket', name: 'بريزة كهرباء 16 أمبير فينوس', category: 'كهرباء', subCategory: 'مفاتيح وفيش', unit: 'قطعة', lowestPrice: 42, sources: [{ storeName: 'Amazon.eg', price: 42, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_spot_7w', name: 'سبوت ليد 7 وات إضاءة وورم', category: 'كهرباء', subCategory: 'كشافات وإضاءة', unit: 'قطعة', lowestPrice: 65, sources: [{ storeName: 'Liper', price: 65, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'Amazon.eg', price: 70, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_panel_18w', name: 'بانل ليد غاطس 18 وات مربع', category: 'كهرباء', subCategory: 'كشافات وإضاءة', unit: 'قطعة', lowestPrice: 120, sources: [{ storeName: 'Liper', price: 120, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_led_strip', name: 'شريط ليد بروفايل 120 لمبة/متر', category: 'كهرباء', subCategory: 'كشافات وإضاءة', unit: 'متر', lowestPrice: 45, sources: [{ storeName: 'Liper', price: 45, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'elec_power_supply_10', name: 'باور سبلاي 10 أمبير', category: 'كهرباء', subCategory: 'كشافات وإضاءة', unit: 'قطعة', lowestPrice: 180, sources: [{ storeName: 'Liper', price: 180, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // سباكة
  { id: 'plm_pipe_3_4', name: 'ماسورة تغذية 3/4 بوصة بي آر (BR)', category: 'سباكة', subCategory: 'مواسير سباكة', unit: 'قطعة', lowestPrice: 155, sources: [{ storeName: 'أحمد السلاب', price: 155, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'عبدو ماركت', price: 160, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_pipe_1', name: 'ماسورة تغذية 1 بوصة بي آر (BR)', category: 'سباكة', subCategory: 'مواسير سباكة', unit: 'قطعة', lowestPrice: 210, sources: [{ storeName: 'أحمد السلاب', price: 210, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_drain_2', name: 'ماسورة صرف 2 بوصة كاسل', category: 'سباكة', subCategory: 'صرف', unit: 'قطعة', lowestPrice: 180, sources: [{ storeName: 'أحمد السلاب', price: 180, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_drain_3', name: 'ماسورة صرف 3 بوصة كاسل', category: 'سباكة', subCategory: 'صرف', unit: 'قطعة', lowestPrice: 260, sources: [{ storeName: 'أحمد السلاب', price: 260, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_drain_4', name: 'ماسورة صرف 4 بوصة كاسل', category: 'سباكة', subCategory: 'صرف', unit: 'قطعة', lowestPrice: 340, sources: [{ storeName: 'أحمد السلاب', price: 340, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_insulation_1', name: 'عزل حراري للمواسير 1 بوصة ارم فليكس', category: 'سباكة', subCategory: 'عزل حراري', unit: 'متر', lowestPrice: 25, sources: [{ storeName: 'أحمد السلاب', price: 25, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_mixer_grohe', name: 'خلاط حوض جروهي بوفا', category: 'سباكة', subCategory: 'خلاطات وأحواض', unit: 'قطعة', lowestPrice: 3500, sources: [{ storeName: 'أحمد السلاب', price: 3500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_mixer_ideal', name: 'خلاط دفن إيديال ستاندرد', category: 'سباكة', subCategory: 'خلاطات وأحواض', unit: 'قطعة', lowestPrice: 4200, sources: [{ storeName: 'أحمد السلاب', price: 4200, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_sink_dura', name: 'حوض ديورافيت دي كود 60سم', category: 'سباكة', subCategory: 'خلاطات وأحواض', unit: 'قطعة', lowestPrice: 1250, sources: [{ storeName: 'أحمد السلاب', price: 1250, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_heater_elec', name: 'سخان كهرباء أريستون 50 لتر', category: 'سباكة', subCategory: 'سخانات مياه', unit: 'قطعة', lowestPrice: 4800, sources: [{ storeName: 'Amazon.eg', price: 4800, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'أحمد السلاب', price: 4950, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'plm_heater_gas', name: 'سخان غاز تورنيدو 10 لتر', category: 'سباكة', subCategory: 'سخانات مياه', unit: 'قطعة', lowestPrice: 3900, sources: [{ storeName: 'Amazon.eg', price: 3900, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // أرضيات
  { id: 'flr_cer_cleo', name: 'سيراميك كليوباترا أرضيات 60x60 فرز أول', category: 'أرضيات', subCategory: 'سيراميك', unit: 'متر مربع', lowestPrice: 185, sources: [{ storeName: 'أحمد السلاب', price: 185, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'flr_porc_gloria', name: 'بورسلين جلوريا 60x120 هندي', category: 'أرضيات', subCategory: 'بورسلين', unit: 'متر مربع', lowestPrice: 550, sources: [{ storeName: 'أحمد السلاب', price: 550, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'flr_hdf_kronotex', name: 'باركيه HDF كرونوتكس 8 مم ألماني', category: 'أرضيات', subCategory: 'HDF/MDF', unit: 'متر مربع', lowestPrice: 480, sources: [{ storeName: 'السويفي', price: 480, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'flr_adhesive_setox', name: 'مادة لاصقة سيتوكس U', category: 'بناء', subCategory: 'لاصق بلاط', unit: 'شكارة', lowestPrice: 125, sources: [{ storeName: 'أحمد السلاب', price: 125, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'flr_waterproof', name: 'عزل كيميائي سيكا 107', category: 'بناء', subCategory: 'واتر بروف', unit: 'مجموعة', lowestPrice: 650, sources: [{ storeName: 'أحمد السلاب', price: 650, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // دهانات
  { id: 'pnt_putty_glc', name: 'معجون أكريليك GLC دايتون', category: 'دهانات', subCategory: 'معجون', unit: 'بستلة 15 كجم', lowestPrice: 320, sources: [{ storeName: 'عبدو ماركت', price: 320, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'pnt_sealer_glc', name: 'سيلر مائي GLC', category: 'دهانات', subCategory: 'سيلر', unit: 'بستلة', lowestPrice: 450, sources: [{ storeName: 'عبدو ماركت', price: 450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'pnt_plastic_jotun', name: 'بلاستيك جوتن فينوماستيك مط', category: 'دهانات', subCategory: 'بلاستيك', unit: 'بستلة', lowestPrice: 1650, sources: [{ storeName: 'عبدو ماركت', price: 1650, isAvailable: true, url: '#', lastUpdated: Date.now() }, { storeName: 'أحمد السلاب', price: 1700, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'pnt_enamel_glc', name: 'لاكيه GLC لامع', category: 'دهانات', subCategory: 'لاكيه', unit: 'جالون', lowestPrice: 280, sources: [{ storeName: 'عبدو ماركت', price: 280, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // تكييف
  { id: 'ac_carrier_1.5', name: 'تكييف كاريير 1.5 حصان بارد فقط', category: 'تكييف', subCategory: 'تكييفات', unit: 'جهاز', lowestPrice: 21500, sources: [{ storeName: 'Amazon.eg', price: 21500, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'ac_pipe_copper', name: 'مواسير نحاس جنوب إفريقي 5/8 و 1/4', category: 'تكييف', subCategory: 'مواسير تأسيس', unit: 'متر', lowestPrice: 850, sources: [{ storeName: 'موردين تكييف', price: 850, isAvailable: true, url: '#', lastUpdated: Date.now() }] },

  // سمارت هوم وغيرها
  { id: 'smart_switch_wifi', name: 'مفتاح إضاءة ذكي واي فاي (Sonoff)', category: 'سمارت هوم', subCategory: 'سمارت هوم', unit: 'قطعة', lowestPrice: 450, sources: [{ storeName: 'Amazon.eg', price: 450, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'gypsum_board_knauf', name: 'لوح جبسون بورد كناوف أبيض', category: 'أخرى', subCategory: 'جبسون بورد', unit: 'لوح', lowestPrice: 185, sources: [{ storeName: 'السويفي', price: 185, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
  { id: 'gypsum_board_green', name: 'لوح جبسون بورد كناوف أخضر (مقاوم للرطوبة)', category: 'أخرى', subCategory: 'جبسون بورد', unit: 'لوح', lowestPrice: 245, sources: [{ storeName: 'السويفي', price: 245, isAvailable: true, url: '#', lastUpdated: Date.now() }] },
];

async function seed() {
  console.log("Starting to seed database...");
  let count = 0;
  for (const material of dummyMaterials) {
    const docRef = doc(db, 'market_materials', material.id);
    await setDoc(docRef, material);
    console.log(`Added: ${material.name}`);
    count++;
  }
  console.log(`\nSuccessfully seeded ${count} products to the marketplace!`);
  process.exit(0);
}

seed().catch(console.error);
