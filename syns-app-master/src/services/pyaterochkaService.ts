const PYATEROCHKA_API_URL = 'https://5d.5ka.ru/api';

// SECURITY FIX: Validate external API URL - must use HTTPS in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  if (!PYATEROCHKA_API_URL.startsWith('https://')) {
    console.error('SECURITY WARNING: Pyaterochka API must use HTTPS in production');
  }
}

interface PyaterochkaProduct {
  id: string;
  name: string;
  price?: number;
  weight?: string;
  image?: string;
  nutritional_info?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  };
}

export async function searchPyaterochkaProducts(query: string) {
  try {
    // SECURITY FIX: Validate input query to prevent injection attacks
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      console.warn('Invalid search query for Pyaterochka');
      return [];
    }

    const sanitizedQuery = query.trim().slice(0, 100); // Limit query length

    const categoriesResponse = await fetch(
      `${PYATEROCHKA_API_URL}/catalog/v2/stores/3CRL/categories`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    // SECURITY FIX: Validate response status
    if (!categoriesResponse.ok) {
      console.error(`Pyaterochka categories API error: ${categoriesResponse.status}`);
      return [];
    }

    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.categories?.slice(0, 5) || [];

    let allProducts: any[] = [];

    for (const category of categories) {
      try {
        const productsResponse = await fetch(
          `${PYATEROCHKA_API_URL}/catalog/v2/stores/3CRL/categories/${category.id}/products`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!productsResponse.ok) {
          continue; // Skip failed category requests
        }

        const productsData = await productsResponse.json();
        const filtered = productsData.products?.filter((p: any) =>
          p.name?.toLowerCase().includes(sanitizedQuery.toLowerCase())
        ) || [];
        allProducts = [...allProducts, ...filtered];
      } catch (categoryError) {
        console.error(`Error fetching category ${category.id}:`, categoryError);
        continue; // Continue with next category
      }
    }

    return allProducts.map((p: any) => ({
      id: p.id || p.xml_id,
      name: p.name || p.title,
      price: p.price,
      weight: p.weight,
      image: p.image_url || p.image,
      source: 'Пятёрочка',
      nutritional_info: {
        calories: p.calories || p.kcal || p.nutritional?.calories,
        protein: p.protein || p.nutritional?.protein,
        fat: p.fat || p.nutritional?.fat,
        carbs: p.carbs || p.nutritional?.carbs,
      },
    }));
  } catch (error) {
    // SECURITY FIX: Proper error handling for external API calls
    console.error('Ошибка поиска в Пятёрочке:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Pyaterochka API');
    }
    return [];
  }
}
