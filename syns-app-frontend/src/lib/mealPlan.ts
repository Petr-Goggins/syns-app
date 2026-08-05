import type { FoodProduct, MealPlan, MealPlanEntry, NutritionMealType, DailyMacros, Profile } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateDailyCalories } from '@/lib/health';
import type { CyclePhase } from '@/lib/cycle';

// Target macro distribution: 30% protein, 30% fat, 40% carbs
const PROTEIN_PCT = 0.30;
const FAT_PCT = 0.30;
const CARB_PCT = 0.40;

// Meal distribution percentages
const MEAL_DISTRIBUTION: Record<NutritionMealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.25,
  snack1: 0.075,
  snack2: 0.075,
};

const MEAL_ORDER: NutritionMealType[] = ['breakfast', 'lunch', 'snack1', 'dinner', 'snack2'];

// Category preferences by meal type
const MEAL_CATEGORIES: Record<NutritionMealType, string[]> = {
  breakfast: ['крупы', 'молочка', 'фрукты', 'яйца'],
  lunch: ['мясо', 'крупы', 'овощи', 'рыба'],
  dinner: ['рыба', 'мясо', 'овощи', 'молочка'],
  snack1: ['фрукты', 'молочка', 'орехи'],
  snack2: ['молочка', 'фрукты', 'орехи'],
};

function macroFromCalories(calories: number): DailyMacros {
  const proteinCal = calories * PROTEIN_PCT;
  const fatCal = calories * FAT_PCT;
  const carbCal = calories * CARB_PCT;
  return {
    proteins: Math.round(proteinCal / 4),
    fats: Math.round(fatCal / 9),
    carbs: Math.round(carbCal / 4),
    calories: Math.round(calories),
  };
}

export function calculateTargetMacros(profile: Profile, cyclePhase: CyclePhase): DailyMacros {
  const calc = calculateDailyCalories(profile);
  let calories = calc.calories ?? 2000;

  // Adjust for cycle phase
  if (cyclePhase === 'menstrual') {
    calories *= 1.07; // +5-10%
  } else if (cyclePhase === 'follicular') {
    calories *= 0.95; // slight deficit
  }

  return macroFromCalories(calories);
}

export async function generateMealPlan(
  supabase: SupabaseClient,
  profile: Profile,
  cyclePhase: CyclePhase = 'not_specified'
): Promise<MealPlan | null> {
  const { data: products, error } = await supabase
    .from('food_products')
    .select('*')
    .order('name');

  if (error || !products || products.length === 0) return null;

  const allProducts = products as FoodProduct[];
  const targetMacros = calculateTargetMacros(profile, cyclePhase);

  // Filter by diet preference
  let filtered = allProducts;
  if (profile.diet.includes('vegan')) {
    filtered = allProducts.filter((p) => !['мясо', 'рыба', 'молочка'].includes(p.category) || p.category === 'молочка' && p.name.includes('соев'));
  } else if (profile.diet.includes('vegetarian')) {
    filtered = allProducts.filter((p) => p.category !== 'мясо' && p.category !== 'рыба');
  }

  const entries: MealPlanEntry[] = [];
  const usedProductIds = new Set<number>();
  const totals: DailyMacros = { proteins: 0, fats: 0, carbs: 0, calories: 0 };

  for (const meal of MEAL_ORDER) {
    const mealCalories = targetMacros.calories * MEAL_DISTRIBUTION[meal];
    const mealProtein = targetMacros.proteins * MEAL_DISTRIBUTION[meal];
    const mealFats = targetMacros.fats * MEAL_DISTRIBUTION[meal];
    const mealCarbs = targetMacros.carbs * MEAL_DISTRIBUTION[meal];

    // Pick products from preferred categories for this meal
    const preferredCats = MEAL_CATEGORIES[meal];
    let candidates = filtered
      .filter((p) => preferredCats.includes(p.category) && !usedProductIds.has(p.id))
      .sort((a, b) => {
        // Prefer products with higher protein for main meals
        if (meal === 'lunch' || meal === 'dinner') {
          return Number(b.proteins) - Number(a.proteins);
        }
        return Number(b.calories) - Number(a.calories);
      });

    if (candidates.length === 0) {
      candidates = filtered.filter((p) => !usedProductIds.has(p.id));
    }

    // Pick 1-3 products per meal
    const numProducts = meal === 'breakfast' || meal === 'lunch' ? 2 : meal === 'dinner' ? 2 : 1;
    const mealProducts = candidates.slice(0, numProducts);

    for (const product of mealProducts) {
      usedProductIds.add(product.id);
      // Calculate grams to reach ~40% of meal calories from this product
      const targetCals = mealCalories / numProducts;
      const ratio = targetCals / Number(product.calories);
      const grams = Math.max(30, Math.min(400, Math.round(ratio * product.serving_size / 10) * 10));

      const actualRatio = grams / product.serving_size;
      const proteins = Math.round(Number(product.proteins) * actualRatio * 10) / 10;
      const fats = Math.round(Number(product.fats) * actualRatio * 10) / 10;
      const carbs = Math.round(Number(product.carbs) * actualRatio * 10) / 10;
      const calories = Math.round(Number(product.calories) * actualRatio);

      entries.push({
        product_id: product.id,
        product_name: product.name,
        meal_type: meal,
        grams,
        proteins,
        fats,
        carbs,
        calories,
      });

      totals.proteins += proteins;
      totals.fats += fats;
      totals.carbs += carbs;
      totals.calories += calories;
    }
  }

  return {
    entries,
    totals: {
      proteins: Math.round(totals.proteins),
      fats: Math.round(totals.fats),
      carbs: Math.round(totals.carbs),
      calories: Math.round(totals.calories),
    },
  };
}
