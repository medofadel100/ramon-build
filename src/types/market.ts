export type MarketCategory = 
  | 'بناء' 
  | 'كهرباء' 
  | 'سباكة' 
  | 'تكييف' 
  | 'دهانات' 
  | 'أرضيات' 
  | 'نجارة' 
  | 'سمارت هوم' 
  | 'أخرى';

export type MarketSubCategory = 
  // بناء
  | 'أسمنت' | 'رمل ناعم' | 'رمل خشن' | 'جبس طبيعي' | 'شبك فيبر' | 'لاصق بلاط' | 'واتر بروف' | 'طوب أحمر' | 'بيتون'
  // أرضيات
  | 'سيراميك' | 'بورسلين' | 'رخام طبيعي' | 'SPC' | 'باركيه' | 'HDF/MDF'
  // دهانات
  | 'معجون' | 'بريمر' | 'سيلر' | 'بلاستيك' | 'أكريليك' | 'لاكيه' | 'خارجي'
  // كهرباء
  | 'لوحات توزيع' | 'قواطع' | 'RCCB' | 'حماية فولت' | 'أسلاك نحاس' | 'خراطيم' | 'علب تأسيس' | 'مفاتيح وفيش' | 'كشافات وإضاءة'
  // سباكة
  | 'مواسير سباكة' | 'صرف' | 'عزل حراري' | 'خلاطات وأحواض' | 'إكسسوارات حمام' | 'سخانات مياه'
  // تكييف وتهوية
  | 'تكييفات' | 'مواسير تأسيس' | 'شفاطات' | 'دكت' | 'جريلات تهوية'
  // نجارة
  | 'أبواب وحلوق' | 'أبواب مصفحة'
  // أخرى
  | 'جبسون بورد' | 'حجر صناعي' | 'ساوند سيستم' | 'عزل جدران' | 'تغليف حوائط';

export interface MarketSource {
  storeName: string;
  price: number;
  isAvailable: boolean;
  url: string;
  lastUpdated: number; // timestamp
}

export interface MarketMaterial {
  id: string;
  name: string;
  description?: string;
  category: MarketCategory;
  subCategory: MarketSubCategory;
  unit: string;
  imageUrl?: string;
  sources: MarketSource[];
  lowestPrice: number;
}
