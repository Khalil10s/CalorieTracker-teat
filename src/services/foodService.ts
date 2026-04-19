import { FoodItem } from '../types';

const BASE_URL = 'https://world.openfoodfacts.org';

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  'energy-kcal'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OFFProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  nutriments?: OFFNutriments;
  serving_size?: string;
  quantity?: string;
  image_front_small_url?: string;
}

export const searchByName = async (query: string, page: number = 1): Promise<FoodItem[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const encoded = encodeURIComponent(trimmed);
  const url = `${BASE_URL}/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process&json=1&page=${page}&page_size=25`;

  const response = await fetch(url);

  if (!response.ok) throw new Error('Server is not responding. Please try again.');

  const data = await response.json();
  const products: OFFProduct[] = data.products || [];
  return products.map(mapToFoodItem).filter((f): f is FoodItem => f !== null);
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const lookupBarcode = async (barcode: string): Promise<FoodItem | null> => {
  const sanitized = barcode.replace(/[^0-9]/g, '').trim();
  if (!sanitized) return null;

  const url = `${BASE_URL}/api/v2/product/${sanitized}.json?fields=code,product_name,product_name_en,nutriments,serving_size,quantity,image_front_small_url`;

  // Retry up to 3 times with increasing delay for rate-limiting (429)
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await delay(1500 * attempt);

    const response = await fetch(url);

    if (response.status === 429) {
      // Rate limited — wait and retry
      continue;
    }

    if (!response.ok) throw new Error(`Server error (${response.status})`);

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    return mapToFoodItem(data.product);
  }

  throw new Error('Rate limited by food database. Wait a moment and try again.');
};

const mapToFoodItem = (product: OFFProduct): FoodItem | null => {
  const name = product.product_name || product.product_name_en || '';
  if (!name) return null;

  const n = product.nutriments;
  const calories = n?.['energy-kcal_100g'] ?? n?.['energy-kcal'] ?? 0;
  const protein = n?.proteins_100g ?? 0;
  const carbs = n?.carbohydrates_100g ?? 0;
  const fat = n?.fat_100g ?? 0;
  const isPartial = protein === 0 && carbs === 0 && fat === 0 && calories > 0;

  return {
    id: product.code || Math.random().toString(36).slice(2),
    name: name.charAt(0).toUpperCase() + name.slice(1),
    calories,
    protein,
    carbs,
    fat,
    servingSize: product.serving_size || product.quantity || '100g',
    barcode: product.code,
    imageURL: product.image_front_small_url,
    isPartialData: isPartial,
  };
};
