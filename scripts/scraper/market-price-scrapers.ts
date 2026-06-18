import * as cheerio from 'cheerio';

function normalizePriceText(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const cleaned = trimmed
    .replace(/\u00A0/g, ' ')
    .replace(/[\s\u202f]+/g, ' ')
    .replace(/[^0-9.,]/g, '')
    .trim();

  if (!cleaned) return null;
  let normalized = cleaned;

  const hasDot = normalized.includes('.');
  const hasComma = normalized.includes(',');

  if (hasDot && hasComma) {
    const lastDot = normalized.lastIndexOf('.');
    const lastComma = normalized.lastIndexOf(',');
    if (lastDot > lastComma) {
      normalized = normalized.replace(/,/g, '');
    } else {
      normalized = normalized.replace(/\./g, '').replace(/,/g, '.');
    }
  } else if (hasComma) {
    normalized = normalized.replace(/,/g, '.');
  }

  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

export function parsePriceFromMeta($: cheerio.CheerioAPI) {
  const selectors = [
    'meta[property="product:price:amount"]',
    'meta[itemprop="price"]',
    'meta[name="twitter:data1"]',
    'meta[property="og:price:amount"]',
    'meta[name="price"]',
    'meta[itemprop="priceCurrency"]'
  ];

  for (const selector of selectors) {
    const content = $(selector).attr('content') || $(selector).attr('value');
    const price = normalizePriceText(content);
    if (price !== null) return price;
  }

  return null;
}

export function parsePriceFromJsonLd($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]');
  const jsonObjects = scripts
    .map((_: any, el: any) => {
      try {
        return JSON.parse($(el).contents().text());
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean);

  for (const raw of jsonObjects) {
    const item = raw as any;
    const offers = item?.offers ? (Array.isArray(item.offers) ? item.offers : [item.offers]) : [];
    for (const offer of offers) {
      const price = normalizePriceText(offer?.price || offer?.priceSpecification?.price || offer?.priceSpecification?.priceAmount || offer?.priceCurrency);
      if (price !== null) return price;
    }

    const price = normalizePriceText(item?.price || item?.offers?.price || item?.offers?.priceSpecification?.priceAmount);
    if (price !== null) return price;
  }

  return null;
}

export function findTextPrice($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const candidate = $(selector).first();
    if (!candidate.length) continue;

    const text = candidate.text();
    const price = normalizePriceText(text);
    if (price !== null) return price;
  }
  return null;
}

export async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return cheerio.load(html);
}

async function scrapeSiteWithSelectors(url: string, selectors: string[]) {
  const $ = await fetchHtml(url);
  return parsePriceFromMeta($) ?? parsePriceFromJsonLd($) ?? findTextPrice($, selectors);
}

async function scrapeAmazonEg(url: string) {
  return scrapeSiteWithSelectors(url, [
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#priceblock_saleprice',
    '.a-price .a-offscreen',
    '.priceToPay .a-offscreen',
    '.apexPriceToPay .a-price .a-offscreen',
    '[data-asin-price]',
    '.a-size-medium.a-color-price.priceBlockBuyingPriceString'
  ]);
}

async function scrapeBtech(url: string) {
  return scrapeSiteWithSelectors(url, [
    '.product-price',
    '.product-price .price',
    '.price',
    '.price-new',
    '.price-box .price',
    '.special-price .price'
  ]);
}

async function scrapeFresh(url: string) {
  return scrapeSiteWithSelectors(url, [
    '.product-price',
    '.product-price-wrapper',
    '.price',
    '.offer-price',
    '.price-value',
    '.p-currency .p-price'
  ]);
}

async function scrapeDuravit(url: string) {
  return scrapeSiteWithSelectors(url, [
    '.product-price',
    '.price',
    '.price-value',
    '.price-box',
    '.product-price .price'
  ]);
}

async function scrapeJotun(url: string) {
  return scrapeSiteWithSelectors(url, [
    '.product-price',
    '.price',
    '.price-value',
    '.v-price',
    '.price-number',
    '.product-price .price'
  ]);
}

async function scrapeGlc(url: string) {
  return scrapeSiteWithSelectors(url, [
    '.product-details .price',
    '.product-price',
    '.price',
    '.product-price-wrapper',
    '.price-box',
    '.detail-price'
  ]);
}

async function scrapeGeneric(url: string) {
  return scrapeSiteWithSelectors(url, [
    '[id*="price"]',
    '[class*="price"]',
    '[class*="offer"]',
    '.product-price',
    '.price-tag',
    '.price_value',
    '.price-current',
    '.price-amount',
    '.product-view-price',
    '.b-price',
    '.price' 
  ]);
}

async function scrapeMahgoub(url: string) {
  return scrapeGeneric(url);
}

async function scrapeMashreqy(url: string) {
  return scrapeGeneric(url);
}

async function scrapeElAraby(url: string) {
  return scrapeGeneric(url);
}

async function scrapeRayaShop(url: string) {
  return scrapeGeneric(url);
}

async function scrapeHomzmart(url: string) {
  return scrapeGeneric(url);
}

async function scrapeIkea(url: string) {
  return scrapeGeneric(url);
}

async function scrapeAlumil(url: string) {
  return scrapeGeneric(url);
}

async function scrapePetraUpvc(url: string) {
  return scrapeGeneric(url);
}

async function scrapeSangeorge(url: string) {
  return scrapeGeneric(url);
}

async function scrapeElSherif(url: string) {
  return scrapeGeneric(url);
}

export async function scrapePriceFromSource(source: { storeName: string; url?: string; price?: number; isAvailable?: boolean; }) {
  const url = source.url?.startsWith('#') ? undefined : source.url;
  if (!url) {
    return null;
  }

  try {
    const normalizedUrl = url.toLowerCase();
    if (normalizedUrl.includes('amazon.eg')) {
      return await scrapeAmazonEg(url);
    }
    if (normalizedUrl.includes('btech.com')) {
      return await scrapeBtech(url);
    }
    if (normalizedUrl.includes('fresh.com.eg')) {
      return await scrapeFresh(url);
    }
    if (normalizedUrl.includes('duravit.com.eg')) {
      return await scrapeDuravit(url);
    }
    if (normalizedUrl.includes('jotun.com')) {
      return await scrapeJotun(url);
    }
    if (normalizedUrl.includes('glcpaints.com')) {
      return await scrapeGlc(url);
    }
    if (normalizedUrl.includes('ahmedelsallab.com') || normalizedUrl.includes('sangeorge.com.eg') || normalizedUrl.includes('stgeorge.com.eg') || normalizedUrl.includes('elsweefi.com') || normalizedUrl.includes('mahgoub.com') || normalizedUrl.includes('mashreqy.com') || normalizedUrl.includes('elarabygroup.com') || normalizedUrl.includes('rayashop.com') || normalizedUrl.includes('homzmart.com') || normalizedUrl.includes('ikea.com') || normalizedUrl.includes('alumil.com') || normalizedUrl.includes('petraupvc.com') || normalizedUrl.includes('goodwood-eg.com') || normalizedUrl.includes('windsor-eg.com') || normalizedUrl.includes('hubfurniture.com.eg') || normalizedUrl.includes('mawad.com.eg') || normalizedUrl.includes('scibpaints.com') || normalizedUrl.includes('smart-eg.com') || normalizedUrl.includes('smarthome-eg.com') || normalizedUrl.includes('airwe.com') || normalizedUrl.includes('rivercool.co') || normalizedUrl.includes('greeeg.com') || normalizedUrl.includes('vtac.com.eg') || normalizedUrl.includes('deceuninck.eg') || normalizedUrl.includes('sipes.net') || normalizedUrl.includes('elsherif.com')) {
      return await scrapeGeneric(url);
    }

    return await scrapeGeneric(url);
  } catch (error) {
    console.error(`Price scraper failed for ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export function buildMarketSource(source: { storeName: string; url?: string; price: number; isAvailable: boolean; lastUpdated?: number; }) {
  return {
    storeName: source.storeName,
    url: source.url ?? '#',
    price: source.price,
    isAvailable: source.isAvailable,
    lastUpdated: source.lastUpdated ?? Date.now()
  };
}
