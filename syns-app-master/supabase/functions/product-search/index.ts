import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const offUrl = `https://ru.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=product_name,brands,proteins_100g,fat_100g,carbohydrates_100g,energy-kcal_100g,nutriments,categories,serving_size,serving_quantity,code`;

    const response = await fetch(offUrl, {
      headers: { "User-Agent": "SyncFitnessApp/1.0" },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ products: [], error: "OFF API error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawProducts: OFFProduct[] = data.products ?? [];

    const products = rawProducts
      .filter((p) => p.product_name)
      .map((p) => ({
        name: p.product_name!,
        brand: p.brands?.split(",")[0]?.trim() ?? "",
        proteins: Number(p.nutriments?.["proteins_100g"] ?? 0),
        fats: Number(p.nutriments?.["fat_100g"] ?? 0),
        carbs: Number(p.nutriments?.["carbohydrates_100g"] ?? 0),
        calories: Number(p.nutriments?.["energy-kcal_100g"] ?? 0),
        serving_size: Number(p.serving_quantity ?? 100),
        category: p.categories?.split(",")[0]?.trim() ?? "прочее",
        barcode: p.code ?? null,
        source: "api" as const,
      }))
      .filter((p) => p.calories > 0 || p.proteins > 0);

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ products: [], error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
