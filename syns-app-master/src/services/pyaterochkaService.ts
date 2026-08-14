const PYATEROCHKA_API_URL = 'https://5d.5ka.ru/api';

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
    const categoriesResponse = await fetch(
      `${PYATEROCHKA_API_URL}/catalog/v2/stores/3CRL/categories`
    );
    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.categories?.slice(0, 5) || [];

    let allProducts: any[] = [];

    for (const category of categories) {
      const productsResponse = await fetch(
        `${PYATEROCHKA_API_URL}/catalog/v2/stores/3CRL/categories/${category.id}/products`
      );
      const productsData = await productsResponse.json();
      const filtered = productsData.products?.filter((p: any) =>
        p.name?.toLowerCase().includes(query.toLowerCase())
      ) || [];
      allProducts = [...allProducts, ...filtered];
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
    console.error('Ошибка поиска в Пятёрочке:', error);
    return [];
  }
}
