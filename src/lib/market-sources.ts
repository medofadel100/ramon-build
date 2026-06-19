export interface MarketSourceDefinition {
  key: string;
  storeName: string;
  domain: string;
  url: string;
  searchUrlTemplate?: string;
  categoryTags?: string[];
  enabled?: boolean;
}

export const MARKET_SOURCE_REGISTRY: MarketSourceDefinition[] = [
  { key: 'sangeorge', storeName: 'St. George', domain: 'sangeorge.com.eg', url: 'https://sangeorge.com.eg', searchUrlTemplate: 'https://sangeorge.com.eg/?s={query}', categoryTags: ['ceramics', 'sanitary'] },
  { key: 'stgeorge', storeName: 'St. George (alternate)', domain: 'stgeorge.com.eg', url: 'https://stgeorge.com.eg', searchUrlTemplate: 'https://stgeorge.com.eg/?s={query}', categoryTags: ['ceramics', 'sanitary'] },
  { key: 'ahmedelsallab', storeName: 'Ahmed El Sallab', domain: 'ahmedelsallab.com', url: 'https://ahmedelsallab.com', searchUrlTemplate: 'https://ahmedelsallab.com/?s={query}', categoryTags: ['plumbing', 'finishing'] },
  { key: 'elsweefi', storeName: 'El Sweefi', domain: 'elsweefi.com', url: 'https://elsweefi.com', searchUrlTemplate: 'https://elsweefi.com/?s={query}', categoryTags: ['building', 'finishing'] },
  { key: 'mahgoub', storeName: 'Mahgoub Ceramica', domain: 'mahgoub.com', url: 'https://mahgoub.com', searchUrlTemplate: 'https://mahgoub.com/?s={query}', categoryTags: ['ceramics', 'finishing'] },
  { key: 'mashreqy', storeName: 'Mashreqy', domain: 'mashreqy.com', url: 'https://mashreqy.com', searchUrlTemplate: 'https://mashreqy.com/?s={query}', categoryTags: ['tools', 'materials'] },
  { key: 'cemex', storeName: 'Cemex Egypt', domain: 'cemex.com.eg', url: 'https://www.cemex.com.eg', searchUrlTemplate: 'https://www.cemex.com.eg/search?text={query}', categoryTags: ['building'] },
  { key: 'lafarge', storeName: 'Lafarge', domain: 'lafarge.com.eg', url: 'https://www.lafarge.com.eg', searchUrlTemplate: 'https://www.lafarge.com.eg/search?query={query}', categoryTags: ['building'] },
  { key: 'knauf', storeName: 'Knauf Official', domain: 'knauf.com.eg', url: 'https://www.knauf.com.eg', searchUrlTemplate: 'https://www.knauf.com.eg/?s={query}', categoryTags: ['gypsum', 'drywall'] },
  { key: 'stiebel', storeName: 'Stiebel Eltron Egypt', domain: 'stiebel-eltron.com', url: 'https://www.stiebel-eltron.com', searchUrlTemplate: 'https://www.stiebel-eltron.com/search?query={query}', categoryTags: ['plumbing', 'heating'] },
  { key: 'btech', storeName: 'B.TECH', domain: 'btech.com', url: 'https://btech.com', searchUrlTemplate: 'https://www.btech.com/search?q={query}', categoryTags: ['appliances', 'electronics'] },
  { key: 'elarabygroup', storeName: 'El-Araby', domain: 'elarabygroup.com', url: 'https://elarabygroup.com', searchUrlTemplate: 'https://elarabygroup.com/?s={query}', categoryTags: ['appliances', 'hvac'] },
  { key: 'cairosales', storeName: 'Cairo Sales', domain: 'cairosales.com', url: 'https://cairosales.com', searchUrlTemplate: 'https://cairosales.com/?s={query}', categoryTags: ['appliances'] },
  { key: 'rayashop', storeName: 'Raya Shop', domain: 'rayashop.com', url: 'https://rayashop.com', searchUrlTemplate: 'https://rayashop.com/?s={query}', categoryTags: ['electronics', 'furniture'] },
  { key: 'amazon', storeName: 'Amazon Egypt', domain: 'amazon.eg', url: 'https://amazon.eg', searchUrlTemplate: 'https://amazon.eg/s?k={query}', categoryTags: ['general'] },
  { key: 'airwe', storeName: 'Airwe', domain: 'airwe.com', url: 'https://airwe.com', searchUrlTemplate: 'https://airwe.com/?s={query}', categoryTags: ['hvac'] },
  { key: 'rivercool', storeName: 'RiverCool', domain: 'rivercool.co', url: 'https://rivercool.co', searchUrlTemplate: 'https://rivercool.co/?s={query}', categoryTags: ['hvac'] },
  { key: 'greeeg', storeName: 'GREE Egypt', domain: 'greeeg.com', url: 'https://greeeg.com', searchUrlTemplate: 'https://greeeg.com/?s={query}', categoryTags: ['hvac'] },
  { key: 'smart-eg', storeName: 'Smart Egypt', domain: 'smart-eg.com', url: 'https://smart-eg.com', searchUrlTemplate: 'https://smart-eg.com/?s={query}', categoryTags: ['electronics', 'smart home'] },
  { key: 'vtac', storeName: 'VTAC Egypt', domain: 'vtac.com.eg', url: 'https://vtac.com.eg', searchUrlTemplate: 'https://vtac.com.eg/?s={query}', categoryTags: ['hvac'] },
  { key: 'mazloumceramica', storeName: 'Mazloum Ceramica', domain: 'mazloumceramica.com', url: 'https://mazloumceramica.com', searchUrlTemplate: 'https://mazloumceramica.com/?s={query}', categoryTags: ['ceramics'] },
  { key: 'duravit', storeName: 'Duravit Egypt', domain: 'duravit.com.eg', url: 'https://duravit.com.eg', searchUrlTemplate: 'https://duravit.com.eg/?s={query}', categoryTags: ['sanitary'] },
  { key: 'idealstandard', storeName: 'Ideal Standard', domain: 'idealstandard.com', url: 'https://idealstandard.com', searchUrlTemplate: 'https://idealstandard.com/search?query={query}', categoryTags: ['sanitary'] },
  { key: 'fresh', storeName: 'Fresh Egypt', domain: 'fresh.com.eg', url: 'https://fresh.com.eg', searchUrlTemplate: 'https://www.fresh.com.eg/search/?q={query}', categoryTags: ['appliances'] },
  { key: 'smarthome', storeName: 'SmartHome Egypt', domain: 'smarthome-eg.com', url: 'https://smarthome-eg.com', searchUrlTemplate: 'https://smarthome-eg.com/?s={query}', categoryTags: ['smart home'] },
  { key: 'el-sherif', storeName: 'El-Sherif', domain: 'elsherif.com', url: 'https://elsherif.com', searchUrlTemplate: 'https://elsherif.com/?s={query}', categoryTags: ['furniture', 'finishing'] },
  { key: 'glcpaints', storeName: 'GLC Paints', domain: 'glcpaints.com', url: 'https://glcpaints.com', searchUrlTemplate: 'https://glcpaints.com/?s={query}', categoryTags: ['paints'] },
  { key: 'jotun', storeName: 'Jotun Egypt', domain: 'jotun.com', url: 'https://jotun.com', searchUrlTemplate: 'https://www.jotun.com/eg/en/search?query={query}', categoryTags: ['paints'] },
  { key: 'sipes', storeName: 'Sipes', domain: 'sipes.net', url: 'https://sipes.net', searchUrlTemplate: 'https://sipes.net/?s={query}', categoryTags: ['chemicals'] },
  { key: 'mawad', storeName: 'Mawad', domain: 'mawad.com.eg', url: 'https://mawad.com.eg', searchUrlTemplate: 'https://mawad.com.eg/?s={query}', categoryTags: ['industrial'] },
  { key: 'scibpaints', storeName: 'SCIB Paints', domain: 'scibpaints.com', url: 'https://scibpaints.com', searchUrlTemplate: 'https://scibpaints.com/?s={query}', categoryTags: ['paints'] },
  { key: 'homzmart', storeName: 'Homzmart', domain: 'homzmart.com', url: 'https://homzmart.com', searchUrlTemplate: 'https://www.homzmart.com/search/?q={query}', categoryTags: ['furniture'] },
  { key: 'ikea-eg', storeName: 'IKEA Egypt', domain: 'ikea.com', url: 'https://ikea.com/eg', searchUrlTemplate: 'https://www.ikea.com/eg/en/search/?q={query}', categoryTags: ['furniture'] },
  { key: 'kabbanifurniture', storeName: 'Kabbanifurniture', domain: 'kabbanifurniture.com', url: 'https://kabbanifurniture.com', searchUrlTemplate: 'https://kabbanifurniture.com/?s={query}', categoryTags: ['furniture'] },
  { key: 'hubfurniture', storeName: 'Hub Furniture', domain: 'hubfurniture.com.eg', url: 'https://hubfurniture.com.eg', searchUrlTemplate: 'https://hubfurniture.com.eg/?s={query}', categoryTags: ['furniture'] },
  { key: 'goodwood-eg', storeName: 'Good Wood Egypt', domain: 'goodwood-eg.com', url: 'https://goodwood-eg.com', searchUrlTemplate: 'https://goodwood-eg.com/?s={query}', categoryTags: ['furniture'] },
  { key: 'windsor-eg', storeName: 'Windsor Egypt', domain: 'windsor-eg.com', url: 'https://windsor-eg.com', searchUrlTemplate: 'https://windsor-eg.com/?s={query}', categoryTags: ['furniture'] },
  { key: 'deceuninck', storeName: 'Deceuninck Egypt', domain: 'deceuninck.eg', url: 'https://deceuninck.eg', searchUrlTemplate: 'https://deceuninck.eg/?s={query}', categoryTags: ['aluminum'] },
  { key: 'alumil', storeName: 'Alumil Egypt', domain: 'alumil.com', url: 'https://alumil.com/egypt', searchUrlTemplate: 'https://alumil.com/egypt/?s={query}', categoryTags: ['aluminum'] },
  { key: 'petraupvc', storeName: 'Petra uPVC', domain: 'petraupvc.com', url: 'https://petraupvc.com', searchUrlTemplate: 'https://petraupvc.com/?s={query}', categoryTags: ['upvc'] },
  { key: 'kemetupvc', storeName: 'Kemet uPVC', domain: 'kemetupvc.com', url: 'https://kemetupvc.com', searchUrlTemplate: 'https://kemetupvc.com/?s={query}', categoryTags: ['upvc'] }
];

export function findSourceDefinitionByDomain(domain: string) {
  const normalized = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  return MARKET_SOURCE_REGISTRY.find((source) => normalized.includes(source.domain));
}

export function findSourceDefinitionByStoreName(storeName: string) {
  const normalized = storeName.trim().toLowerCase();
  return MARKET_SOURCE_REGISTRY.find(
    (source) =>
      source.storeName.toLowerCase().includes(normalized) ||
      normalized.includes(source.key) ||
      source.domain.includes(normalized) ||
      normalized.includes(source.domain)
  );
}

export function buildSearchUrl(def: MarketSourceDefinition, query: string) {
  if (def.searchUrlTemplate) {
    return def.searchUrlTemplate.replace('{query}', encodeURIComponent(query));
  }
  return def.url;
}

export function resolveSourceUrl(source: { storeName: string; url?: string }, query: string) {
  if (source.url && source.url !== '#') {
    return source.url;
  }

  const def = findSourceDefinitionByStoreName(source.storeName) || (source.url ? findSourceDefinitionByDomain(source.url) : undefined);
  if (!def) {
    return source.url && source.url !== '#' ? source.url : '#';
  }

  return buildSearchUrl(def, query);
}

export function normalizeMarketMaterialSources<T extends { sources?: { storeName: string; url?: string; price: number; isAvailable: boolean; lastUpdated?: number; }[]; name: string; }>(material: T): T {
  const normalizedSources = (material.sources || []).map((source) => ({
    ...source,
    url: resolveSourceUrl(source, material.name)
  }));
  return { ...material, sources: normalizedSources };
}

export function buildMarketSource(source: { storeName: string; url?: string; price: number; isAvailable: boolean; lastUpdated?: number; }, query?: string) {
  const def = findSourceDefinitionByStoreName(source.storeName) || (source.url ? findSourceDefinitionByDomain(source.url) : undefined);
  const resolvedUrl = source.url && source.url !== '#'
    ? source.url
    : query && def?.searchUrlTemplate
      ? buildSearchUrl(def, query)
      : def?.url ?? '#';

  return {
    storeName: def?.storeName ?? source.storeName,
    url: resolvedUrl,
    price: source.price,
    isAvailable: source.isAvailable,
    lastUpdated: source.lastUpdated ?? Date.now()
  };
}
