import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { MarketMaterial, MarketSource } from '@/types/market';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { url, storeName, type } = await req.json();

    if (!url || !storeName) {
      return NextResponse.json({ error: 'URL and StoreName are required' }, { status: 400 });
    }

    // This is a placeholder for the actual scraping logic
    // We will use standard fetch here. Note that some sites like Amazon may block this.
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
       throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let price = 0;
    let name = '';
    let isAvailable = true;

    // Simple scraper logic based on store
    if (storeName === 'Liper') {
      // Assuming Liper uses standard wooCommerce or shopify classes. This will need tweaking
      name = $('h1.product_title, .product-title').text().trim();
      const priceText = $('p.price .amount, .price .money').first().text().replace(/[^\d.]/g, '');
      price = parseFloat(priceText) || 0;
      isAvailable = !$('.out-of-stock').length;
    } else if (storeName === 'Amazon.eg') {
      name = $('#productTitle').text().trim();
      const priceText = $('.a-price-whole').first().text().replace(/[^\d.]/g, '');
      price = parseFloat(priceText) || 0;
      isAvailable = $('#availability span').text().includes('In Stock') || $('#availability span').text().includes('متوفر');
    } else {
      // Generic fallback
      name = $('h1').first().text().trim() || 'Unknown Product';
      const priceText = $('.price, [class*="price"]').first().text().replace(/[^\d.]/g, '');
      price = parseFloat(priceText) || 0;
    }

    const source: MarketSource = {
      storeName,
      price,
      isAvailable,
      url,
      lastUpdated: Date.now()
    };

    return NextResponse.json({ success: true, data: { name, source } });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
