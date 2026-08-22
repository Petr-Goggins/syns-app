import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SECURITY FIX: Restrict CORS to specific domains instead of wildcard
const ALLOWED_ORIGINS = [
  "https://yourdomain.com",
  "https://www.yourdomain.com",
  "https://app.yourdomain.com",
];

const corsHeaders = (origin: string) => {
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".yourdomain.com");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Vary": "Origin",
  };
};

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

interface OFFProduct {
  product_name?: string;
  brands?: string;
  proteins_100g?: string;
  fat_100g?: string;
  carbohydrates_100g?: string;
  energy_100g?: string;
  nutriments?: {
    "proteins_100g"?: number;
    "fat_100g"?: number;
    "carbohydrates_100g"?: number;
    "energy-kcal_100g"?: number;
  };
  categories?: string;
  serving_size?: string;
  serving_quantity?: string;
  code?: string;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders(origin) });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

    // Input validation with sanitization
    if (!query || typeof query !== 'string' || query.trim().length < 2 || query.trim().length > 100) {
      return new Response(JSON.stringify({ products: [], error: "Invalid query parameter" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const sanitizedQuery = query.trim().slice(0, 100);
    const safeLimit = Math.min(Math.max(limit, 1), 50); // Limit between 1-50

    const offUrl = `https://ru.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(sanitizedQuery)}&search_simple=1&action=process&json=1&page_size=${safeLimit}&fields=product_name,brands,proteins_100g,fat_100g,carbohydrates_100g,energy-kcal_100g,nutriments,categories,serving_size,serving_quantity,code`;

    const response = await fetch(offUrl, {
      headers: { "User-Agent": "SyncFitnessApp/1.0" },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ products: [], error: "OFF API error" }), {
        status: 502,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawProducts: OFFProduct[] = data.products ?? [];

    // Sanitize and validate product data
    const products = rawProducts
      .filter((p): p is OFFProduct & { product_name: string } => !!p.product_name && typeof p.product_name === 'string')
      .map((p) => ({
        name: p.product_name.slice(0, 200), // Limit name length
        brand: p.brands?.split(",")[0]?.trim()?.slice(0, 100) ?? "",
        proteins: Number(p.nutriments?.["proteins_100g"] ?? 0),
        fats: Number(p.nutriments?.["fat_100g"] ?? 0),
        carbs: Number(p.nutriments?.["carbohydrates_100g"] ?? 0),
        calories: Number(p.nutriments?.["energy-kcal_100g"] ?? 0),
        serving_size: Number(p.serving_quantity ?? 100),
        category: p.categories?.split(",")[0]?.trim()?.slice(0, 100) ?? "прочее",
        barcode: p.code ?? null,
        source: "api" as const,
      }))
      .filter((p) => (p.calories > 0 || p.proteins > 0) && p.name.length > 0);

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (err) {
    const origin = req.headers.get("Origin") || "";
    return new Response(
      JSON.stringify({ products: [], error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    );
  }
});
