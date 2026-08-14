const VKUSVILL_MCP_URL = 'https://mcp001.vkusvill.ru/mcp';

interface VkusvillProduct {
  id: string;
  name: string;
  price?: number;
  weight?: string;
  rating?: number;
  image?: string;
  url?: string;
  nutritional_info?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  };
}

let mcpSessionId: string | null = null;

async function mcpRequest(tool: string, args: Record<string, unknown>) {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: tool,
      arguments: args,
    },
  };

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (mcpSessionId) {
    headers['mcp-session-id'] = mcpSessionId;
  }

  const response = await fetch(VKUSVILL_MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const sessionId = response.headers.get('mcp-session-id');
  if (sessionId) {
    mcpSessionId = sessionId;
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error?.message || 'Ошибка API ВкусВилл');
  }
  return data.data;
}

function parseMarkdownProducts(markdown: string) {
  const products: any[] = [];
  const lines = markdown.split('\n');
  let currentProduct: any = {};

  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (currentProduct.name) {
        products.push(currentProduct);
      }
      currentProduct = { name: line.replace('### ', '').trim() };
    } else if (line.includes('**Цена:**')) {
      const price = line.match(/\d+[\.,]?\d*/);
      if (price) currentProduct.price = parseFloat(price[0].replace(',', '.'));
    } else if (line.includes('**Вес:**')) {
      currentProduct.weight = line.replace('**Вес:**', '').trim();
    } else if (line.includes('**Рейтинг:**')) {
      const rating = line.match(/\d+[\.,]?\d*/);
      if (rating) currentProduct.rating = parseFloat(rating[0].replace(',', '.'));
    } else if (line.includes('**КБЖУ:**')) {
      const kcal = line.match(/(\d+)\s*ккал/);
      const protein = line.match(/(\d+[\.,]?\d*)\s*б/);
      const fat = line.match(/(\d+[\.,]?\d*)\s*ж/);
      const carbs = line.match(/(\d+[\.,]?\d*)\s*у/);
      currentProduct.nutritional_info = {
        calories: kcal ? parseFloat(kcal[1]) : undefined,
        protein: protein ? parseFloat(protein[1].replace(',', '.')) : undefined,
        fat: fat ? parseFloat(fat[1].replace(',', '.')) : undefined,
        carbs: carbs ? parseFloat(carbs[1].replace(',', '.')) : undefined,
      };
    }
  }

  if (currentProduct.name) {
    products.push(currentProduct);
  }

  return products;
}

export async function searchVkusvillProducts(query: string, page: number = 1) {
  try {
    const result = await mcpRequest('vkusvill_products_search', {
      q: query,
      page: page,
      sort: 'popularity',
    });

    let products = [];
    if (typeof result === 'string') {
      products = parseMarkdownProducts(result);
    } else if (Array.isArray(result)) {
      products = result;
    } else if (result?.products) {
      products = result.products;
    }

    return products.map((p: any) => ({
      id: p.id || p.xml_id || p.product_id,
      name: p.name || p.title,
      price: p.price,
      weight: p.weight,
      rating: p.rating,
      image: p.image_url || p.image,
      url: p.url,
      source: 'ВкусВилл',
      nutritional_info: {
        calories: p.calories || p.kcal || p.nutritional?.calories,
        protein: p.protein || p.nutritional?.protein,
        fat: p.fat || p.nutritional?.fat,
        carbs: p.carbs || p.nutritional?.carbs,
      },
    }));
  } catch (error) {
    console.error('Ошибка поиска во ВкусВилл:', error);
    return [];
  }
}
