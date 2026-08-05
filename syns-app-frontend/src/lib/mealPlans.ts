// Pre-built meal plans: 10 per category, 2000 kcal base, balanced macros
// Categories: regular, vegetarian, vegan, halal, kosher
// Each plan has 5 meals: breakfast, lunch, dinner, snack1, snack2

export type MealPlanCategory = 'regular' | 'vegetarian' | 'vegan' | 'halal' | 'kosher';
export type CookTime = 'fast' | 'medium' | 'slow';

export interface PlanFoodItem {
  name: string;
  grams: number;
  proteins: number;
  fats: number;
  carbs: number;
  calories: number;
}

export interface PlanMeal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';
  label: string;
  items: PlanFoodItem[];
}

export interface PrebuiltMealPlan {
  id: number;
  title: string;
  category: MealPlanCategory;
  cookTime: CookTime;
  cookTimeLabel: string;
  meals: PlanMeal[];
  totals: { proteins: number; fats: number; carbs: number; calories: number };
}

// Helper: calculate item macros per 100g -> grams given
function item(name: string, g: number, p: number, f: number, c: number, kcal: number): PlanFoodItem {
  const ratio = g / 100;
  return {
    name,
    grams: g,
    proteins: Math.round(p * ratio * 10) / 10,
    fats: Math.round(f * ratio * 10) / 10,
    carbs: Math.round(c * ratio * 10) / 10,
    calories: Math.round(kcal * ratio),
  };
}

// Product macros per 100g: [protein, fat, carb, kcal]
const P: Record<string, [number, number, number, number]> = {
  chicken: [31, 3.6, 0, 165],
  beef: [26, 15, 0, 250],
  pork: [27, 14, 0, 242],
  turkey: [29, 5, 0, 170],
  fish_cod: [18, 0.7, 0, 82],
  salmon: [20, 13, 0, 208],
  egg: [13, 11, 0.7, 155],
  cottage: [18, 5, 3, 121],
  milk: [3, 3.2, 4.8, 60],
  yogurt: [4.3, 3.3, 6.2, 87],
  cheese: [25, 30, 1.3, 350],
  buckwheat_dry: [12.6, 3.3, 62, 313],
  rice_dry: [7, 1, 73, 333],
  oat_dry: [13, 6.5, 51, 300],
  pasta_dry: [11, 1.5, 71, 344],
  potato: [2, 0.4, 16, 77],
  bread: [8, 3, 50, 265],
  banana: [1.5, 0.1, 21, 89],
  apple: [0.4, 0.4, 11, 52],
  tomato: [0.9, 0.2, 3.9, 18],
  cucumber: [0.8, 0.1, 2.9, 15],
  carrot: [0.9, 0.2, 7, 33],
  broccoli: [2.8, 0.4, 4, 33],
  nuts_almond: [21, 50, 22, 579],
  nuts_walnut: [15, 65, 14, 654],
  olive_oil: [0, 100, 0, 884],
  butter: [0.9, 81, 0.1, 717],
  tofu: [8, 4.8, 1.9, 76],
  lentils: [9, 0.4, 20, 116],
  chickpea: [8.9, 2.6, 27, 164],
  beans_red: [8.7, 0.5, 22.8, 127],
  quinoa_dry: [14, 6, 64, 368],
  soy_milk: [3.3, 1.8, 1.7, 54],
  avocado: [2, 15, 9, 160],
  spinach: [2.9, 0.4, 3.6, 23],
  pepper: [0.9, 0.2, 6, 31],
  onion: [1.4, 0.2, 9, 40],
  honey: [0.3, 0, 82, 304],
  dark_choc: [7, 43, 46, 546],
};

function meal(
  type: PlanMeal['type'],
  label: string,
  items: PlanFoodItem[]
): PlanMeal {
  return { type, label, items };
}

function totals(meals: PlanMeal[]) {
  const t = meals.reduce(
    (acc, m) => {
      m.items.forEach((i) => {
        acc.proteins += i.proteins;
        acc.fats += i.fats;
        acc.carbs += i.carbs;
        acc.calories += i.calories;
      });
      return acc;
    },
    { proteins: 0, fats: 0, carbs: 0, calories: 0 }
  );
  return {
    proteins: Math.round(t.proteins),
    fats: Math.round(t.fats),
    carbs: Math.round(t.carbs),
    calories: Math.round(t.calories),
  };
}

function plan(
  id: number,
  title: string,
  category: MealPlanCategory,
  cookTime: CookTime,
  cookTimeLabel: string,
  meals: PlanMeal[]
): PrebuiltMealPlan {
  return { id, title, category, cookTime, cookTimeLabel, meals, totals: totals(meals) };
}

// ── REGULAR (no restrictions) ───────────────────────────────
const regularPlans: PrebuiltMealPlan[] = [
  plan(1, 'Классика: курица с гречкой', 'regular', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Овощной салат', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог 5%', 200, ...P.cottage),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Грецкие орехи', 30, ...P.nuts_walnut)]),
    meal('snack2', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
  ]),
  plan(2, 'Говядина с рисом', 'regular', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Яичница (2 яйца)', 120, ...P.egg),
      item('Хлеб', 60, ...P.bread),
      item('Творог', 100, ...P.cottage),
    ]),
    meal('lunch', 'Обед', [
      item('Говядина', 180, ...P.beef),
      item('Рис', 80, ...P.rice_dry),
      item('Брокколи', 150, ...P.broccoli),
    ]),
    meal('dinner', 'Ужин', [
      item('Куриная грудка', 150, ...P.chicken),
      item('Картофель', 200, ...P.potato),
      item('Огурец', 100, ...P.cucumber),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana), item('Миндаль', 25, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Сыр', 40, ...P.cheese)]),
  ]),
  plan(3, 'Рыбный день', 'regular', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Йогурт', 150, ...P.yogurt),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Лосось', 180, ...P.salmon),
      item('Рис', 70, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Яблоко', 150, ...P.apple),
      item('Грецкие орехи', 20, ...P.nuts_walnut),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Молоко', 250, ...P.milk)]),
  ]),
  plan(4, 'Сытный день: паста с говядиной', 'regular', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Омлет (3 яйца)', 180, ...P.egg),
      item('Хлеб', 50, ...P.bread),
      item('Творог', 100, ...P.cottage),
    ]),
    meal('lunch', 'Обед', [
      item('Говядина', 150, ...P.beef),
      item('Паста', 100, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('dinner', 'Ужин', [
      item('Куриная грудка', 150, ...P.chicken),
      item('Гречка', 70, ...P.buckwheat_dry),
      item('Овощи', 120, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple), item('Орехи', 25, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
  ]),
  plan(5, 'Индейка с киноа', 'regular', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Индейка', 200, ...P.turkey),
      item('Рис', 80, ...P.rice_dry),
      item('Морковь', 100, ...P.carrot),
      item('Брокколи', 100, ...P.broccoli),
    ]),
    meal('dinner', 'Ужин', [
      item('Рыба треска', 200, ...P.fish_cod),
      item('Картофель', 200, ...P.potato),
      item('Огурец', 100, ...P.cucumber),
    ]),
    meal('snack1', 'Перекус', [item('Творог', 100, ...P.cottage)]),
    meal('snack2', 'Перекус', [item('Орехи', 30, ...P.nuts_walnut)]),
  ]),
  plan(6, 'Завтрак champion', 'regular', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Творог', 250, ...P.cottage),
      item('Банан', 150, ...P.banana),
      item('Мёд', 25, ...P.honey),
      item('Орехи', 25, ...P.nuts_almond),
    ]),
    meal('lunch', 'Обед', [
      item('Куриная грудка', 180, ...P.chicken),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Салат', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Говядина', 120, ...P.beef),
      item('Рис', 70, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
  ]),
  plan(7, 'Баланс: мясо + овощи', 'regular', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 70, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('lunch', 'Обед', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Паста', 80, ...P.pasta_dry),
      item('Брокколи', 150, ...P.broccoli),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Грецкие орехи', 25, ...P.nuts_walnut),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Сыр', 35, ...P.cheese)]),
  ]),
  plan(8, 'Лосось с булгуром', 'regular', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Яичница (2 яйца)', 120, ...P.egg),
      item('Хлеб', 50, ...P.bread),
      item('Творог', 100, ...P.cottage),
    ]),
    meal('lunch', 'Обед', [
      item('Лосось', 160, ...P.salmon),
      item('Рис', 80, ...P.rice_dry),
      item('Шпинат', 100, ...P.spinach),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Куриная грудка', 150, ...P.chicken),
      item('Картофель', 200, ...P.potato),
      item('Огурец', 100, ...P.cucumber),
    ]),
    meal('snack1', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
    meal('snack2', 'Перекус', [item('Орехи', 25, ...P.nuts_almond)]),
  ]),
  plan(9, 'Простой и быстрый', 'regular', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Йогурт', 200, ...P.yogurt),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Рис', 80, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 250, ...P.cottage),
      item('Банан', 120, ...P.banana),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Молоко', 200, ...P.milk), item('Орехи', 20, ...P.nuts_walnut)]),
  ]),
  plan(10, 'Праздник вкуса', 'regular', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Омлет (3 яйца)', 180, ...P.egg),
      item('Сыр', 40, ...P.cheese),
      item('Хлеб', 50, ...P.bread),
    ]),
    meal('lunch', 'Обед', [
      item('Говядина', 180, ...P.beef),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Брокколи', 150, ...P.broccoli),
      item('Сливочное масло', 10, ...P.butter),
    ]),
    meal('dinner', 'Ужин', [
      item('Индейка', 150, ...P.turkey),
      item('Картофель', 200, ...P.potato),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana), item('Тёмный шоколад', 20, ...P.dark_choc)]),
    meal('snack2', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
  ]),
];

// ── VEGETARIAN (no meat/fish, dairy+eggs allowed) ───────────
const vegetarianPlans: PrebuiltMealPlan[] = [
  plan(1, 'Творожный завтрак', 'vegetarian', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Творог', 250, ...P.cottage),
      item('Банан', 150, ...P.banana),
      item('Мёд', 20, ...P.honey),
      item('Орехи', 25, ...P.nuts_almond),
    ]),
    meal('lunch', 'Обед', [
      item('Яйца (3 шт)', 180, ...P.egg),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Сыр', 60, ...P.cheese),
      item('Паста', 80, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
  ]),
  plan(2, 'Чечевичный обед', 'vegetarian', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Чечевица', 120, ...P.lentils),
      item('Рис', 70, ...P.rice_dry),
      item('Морковь', 100, ...P.carrot),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Грецкие орехи', 30, ...P.nuts_walnut),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
    meal('snack2', 'Перекус', [item('Сыр', 35, ...P.cheese), item('Хлеб', 40, ...P.bread)]),
  ]),
  plan(3, 'Сырный день', 'vegetarian', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Омлет (2 яйца)', 120, ...P.egg),
      item('Сыр', 40, ...P.cheese),
      item('Хлеб', 50, ...P.bread),
    ]),
    meal('lunch', 'Обед', [
      item('Творог', 200, ...P.cottage),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Яйца (2 шт)', 120, ...P.egg),
      item('Паста', 80, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Молоко', 250, ...P.milk), item('Орехи', 20, ...P.nuts_almond)]),
  ]),
  plan(4, 'Нут и киноа', 'vegetarian', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Йогурт', 200, ...P.yogurt),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Нут', 120, ...P.chickpea),
      item('Киноа', 80, ...P.quinoa_dry),
      item('Овощи', 150, 3, 5, 8, 80),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Грецкие орехи', 25, ...P.nuts_walnut),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Сыр', 35, ...P.cheese)]),
  ]),
  plan(5, 'Овощное изобилие', 'vegetarian', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Яйца (3 шт)', 180, ...P.egg),
      item('Картофель', 250, ...P.potato),
      item('Брокколи', 150, ...P.broccoli),
      item('Сливочное масло', 10, ...P.butter),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Гречка', 60, ...P.buckwheat_dry),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
    meal('snack2', 'Перекус', [item('Орехи', 30, ...P.nuts_almond), item('Яблоко', 100, ...P.apple)]),
  ]),
  plan(6, 'Молочный рай', 'vegetarian', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Творог', 250, ...P.cottage),
      item('Молоко', 200, ...P.milk),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Сыр', 80, ...P.cheese),
      item('Паста', 100, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('dinner', 'Ужин', [
      item('Яйца (2 шт)', 120, ...P.egg),
      item('Рис', 70, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
  ]),
  plan(7, 'Фасолевый обед', 'vegetarian', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Йогурт', 200, ...P.yogurt),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Красная фасоль', 150, ...P.beans_red),
      item('Рис', 70, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Грецкие орехи', 25, ...P.nuts_walnut),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Сыр', 35, ...P.cheese)]),
    meal('snack2', 'Перекус', [item('Молоко', 200, ...P.milk)]),
  ]),
  plan(8, 'Омлетный день', 'vegetarian', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Омлет (3 яйца)', 180, ...P.egg),
      item('Хлеб', 60, ...P.bread),
      item('Творог', 100, ...P.cottage),
    ]),
    meal('lunch', 'Обед', [
      item('Чечевица', 120, ...P.lentils),
      item('Гречка', 70, ...P.buckwheat_dry),
      item('Морковь', 100, ...P.carrot),
    ]),
    meal('dinner', 'Ужин', [
      item('Сыр', 60, ...P.cheese),
      item('Паста', 80, ...P.pasta_dry),
      item('Шпинат', 100, ...P.spinach),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Йогурт', 150, ...P.yogurt), item('Орехи', 20, ...P.nuts_almond)]),
  ]),
  plan(9, 'Греческий обед', 'vegetarian', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Сыр', 80, ...P.cheese),
      item('Паста', 80, ...P.pasta_dry),
      item('Томат', 150, ...P.tomato),
      item('Огурец', 100, ...P.cucumber),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Грецкие орехи', 25, ...P.nuts_walnut),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
  ]),
  plan(10, 'Орехово-творожный', 'vegetarian', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Творог', 250, ...P.cottage),
      item('Орехи', 30, ...P.nuts_almond),
      item('Банан', 120, ...P.banana),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Яйца (3 шт)', 180, ...P.egg),
      item('Рис', 80, ...P.rice_dry),
      item('Брокколи', 150, ...P.broccoli),
    ]),
    meal('dinner', 'Ужин', [
      item('Сыр', 50, ...P.cheese),
      item('Хлеб', 60, ...P.bread),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
    meal('snack2', 'Перекус', [item('Яблоко', 150, ...P.apple), item('Орехи', 20, ...P.nuts_walnut)]),
  ]),
];

// ── VEGAN (no animal products) ──────────────────────────────
const veganPlans: PrebuiltMealPlan[] = [
  plan(1, 'Тофу и киноа', 'vegan', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Соевое молоко', 250, ...P.soy_milk),
      item('Банан', 150, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Тофу', 200, ...P.tofu),
      item('Киноа', 80, ...P.quinoa_dry),
      item('Брокколи', 150, ...P.broccoli),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Чечевица', 120, ...P.lentils),
      item('Рис', 70, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple), item('Миндаль', 25, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Авокадо', 100, ...P.avocado)]),
  ]),
  plan(2, 'Бобовый микс', 'vegan', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Соевое молоко', 200, ...P.soy_milk),
      item('Мёд заменитель', 20, 0, 0, 80, 300),
    ]),
    meal('lunch', 'Обед', [
      item('Нут', 150, ...P.chickpea),
      item('Рис', 80, ...P.rice_dry),
      item('Морковь', 100, ...P.carrot),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Тофу', 180, ...P.tofu),
      item('Гречка', 70, ...P.buckwheat_dry),
      item('Шпинат', 100, ...P.spinach),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Грецкие орехи', 35, ...P.nuts_walnut)]),
  ]),
  plan(3, 'Быстрый веган', 'vegan', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Соевое молоко', 250, ...P.soy_milk),
      item('Банан', 150, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Красная фасоль', 150, ...P.beans_red),
      item('Рис', 80, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Чечевица', 120, ...P.lentils),
      item('Паста', 70, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple), item('Миндаль', 20, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Авокадо', 80, ...P.avocado)]),
  ]),
  plan(4, 'Тофу-стир-фрай', 'vegan', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 70, ...P.oat_dry),
      item('Соевое молоко', 250, ...P.soy_milk),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('lunch', 'Обед', [
      item('Тофу', 220, ...P.tofu),
      item('Рис', 80, ...P.rice_dry),
      item('Брокколи', 150, ...P.broccoli),
      item('Перец', 100, ...P.pepper),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Нут', 120, ...P.chickpea),
      item('Киноа', 60, ...P.quinoa_dry),
      item('Шпинат', 100, ...P.spinach),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Грецкие орехи', 30, ...P.nuts_walnut)]),
  ]),
  plan(5, 'Киноа-боул', 'vegan', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Соевое молоко', 250, ...P.soy_milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Киноа', 100, ...P.quinoa_dry),
      item('Чечевица', 100, ...P.lentils),
      item('Авокадо', 80, ...P.avocado),
      item('Томат', 100, ...P.tomato),
      item('Огурец', 100, ...P.cucumber),
    ]),
    meal('dinner', 'Ужин', [
      item('Тофу', 180, ...P.tofu),
      item('Гречка', 70, ...P.buckwheat_dry),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Миндаль', 30, ...P.nuts_almond)]),
  ]),
  plan(6, 'Лён и бобы', 'vegan', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Соевое молоко', 200, ...P.soy_milk),
      item('Банан', 150, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Красная фасоль', 160, ...P.beans_red),
      item('Рис', 80, ...P.rice_dry),
      item('Морковь', 100, ...P.carrot),
      item('Лук', 50, ...P.onion),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Нут', 120, ...P.chickpea),
      item('Паста', 70, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Авокадо', 80, ...P.avocado), item('Орехи', 20, ...P.nuts_walnut)]),
  ]),
  plan(7, 'Семидневный веган', 'vegan', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Соевое молоко', 250, ...P.soy_milk),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('lunch', 'Обед', [
      item('Тофу', 200, ...P.tofu),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Чечевица', 130, ...P.lentils),
      item('Рис', 70, ...P.rice_dry),
      item('Брокколи', 100, ...P.broccoli),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Миндаль', 30, ...P.nuts_almond)]),
  ]),
  plan(8, 'Зелёный боул', 'vegan', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 70, ...P.oat_dry),
      item('Соевое молоко', 250, ...P.soy_milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Тофу', 180, ...P.tofu),
      item('Киноа', 80, ...P.quinoa_dry),
      item('Шпинат', 150, ...P.spinach),
      item('Авокадо', 60, ...P.avocado),
    ]),
    meal('dinner', 'Ужин', [
      item('Нут', 120, ...P.chickpea),
      item('Рис', 70, ...P.rice_dry),
      item('Перец', 100, ...P.pepper),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Грецкие орехи', 30, ...P.nuts_walnut)]),
  ]),
  plan(9, 'Чечевичный суп-день', 'vegan', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Соевое молоко', 250, ...P.soy_milk),
      item('Банан', 150, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Чечевица', 150, ...P.lentils),
      item('Картофель', 200, ...P.potato),
      item('Морковь', 100, ...P.carrot),
      item('Лук', 50, ...P.onion),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Тофу', 180, ...P.tofu),
      item('Гречка', 70, ...P.buckwheat_dry),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple), item('Миндаль', 20, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Авокадо', 70, ...P.avocado)]),
  ]),
  plan(10, 'Энергия дня', 'vegan', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Соевое молоко', 250, ...P.soy_milk),
      item('Банан', 150, ...P.banana),
      item('Миндаль', 20, ...P.nuts_almond),
    ]),
    meal('lunch', 'Обед', [
      item('Красная фасоль', 150, ...P.beans_red),
      item('Рис', 80, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Чечевица', 120, ...P.lentils),
      item('Паста', 60, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Авокадо', 80, ...P.avocado), item('Орехи', 15, ...P.nuts_walnut)]),
  ]),
];

// ── HALAL (no pork/alcohol, dairy+meat allowed together) ────
const halalPlans: PrebuiltMealPlan[] = [
  plan(1, 'Курица с булгуром', 'halal', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Говядина', 150, ...P.beef),
      item('Рис', 70, ...P.rice_dry),
      item('Брокколи', 150, ...P.broccoli),
    ]),
    meal('snack1', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
    meal('snack2', 'Перекус', [item('Яблоко', 150, ...P.apple), item('Орехи', 20, ...P.nuts_almond)]),
  ]),
  plan(2, 'Баранина с рисом', 'halal', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Омлет (2 яйца)', 120, ...P.egg),
      item('Хлеб', 50, ...P.bread),
      item('Творог', 100, ...P.cottage),
    ]),
    meal('lunch', 'Обед', [
      item('Говядина', 180, ...P.beef),
      item('Рис', 80, ...P.rice_dry),
      item('Морковь', 100, ...P.carrot),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Куриная грудка', 150, ...P.chicken),
      item('Картофель', 200, ...P.potato),
      item('Огурец', 100, ...P.cucumber),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Сыр', 35, ...P.cheese)]),
  ]),
  plan(3, 'Индейка на гриле', 'halal', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Индейка', 200, ...P.turkey),
      item('Рис', 80, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Гречка', 60, ...P.buckwheat_dry),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Йогурт', 150, ...P.yogurt), item('Орехи', 20, ...P.nuts_walnut)]),
  ]),
  plan(4, 'Рыба с овощами', 'halal', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Творог', 250, ...P.cottage),
      item('Банан', 120, ...P.banana),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Лосось', 180, ...P.salmon),
      item('Рис', 70, ...P.rice_dry),
      item('Брокколи', 150, ...P.broccoli),
    ]),
    meal('dinner', 'Ужин', [
      item('Куриная грудка', 150, ...P.chicken),
      item('Картофель', 200, ...P.potato),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Молоко', 200, ...P.milk)]),
  ]),
  plan(5, 'Быстрый халяль', 'halal', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Йогурт', 200, ...P.yogurt),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Паста', 80, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Гречка', 70, ...P.buckwheat_dry),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Орехи', 30, ...P.nuts_almond)]),
  ]),
  plan(6, 'Говядина с гречкой', 'halal', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Омлет (3 яйца)', 180, ...P.egg),
      item('Хлеб', 50, ...P.bread),
    ]),
    meal('lunch', 'Обед', [
      item('Говядина', 180, ...P.beef),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Индейка', 150, ...P.turkey),
      item('Рис', 70, ...P.rice_dry),
      item('Морковь', 100, ...P.carrot),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana), item('Орехи', 20, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
  ]),
  plan(7, 'Творожно-ореховый', 'halal', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак', [
      item('Творог', 250, ...P.cottage),
      item('Орехи', 30, ...P.nuts_almond),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Рис', 80, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин', [
      item('Говядина', 120, ...P.beef),
      item('Картофель', 200, ...P.potato),
      item('Огурец', 100, ...P.cucumber),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Молоко', 200, ...P.milk)]),
  ]),
  plan(8, 'Паста с курицей', 'halal', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед', [
      item('Куриная грудка', 180, ...P.chicken),
      item('Паста', 100, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Гречка', 60, ...P.buckwheat_dry),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('snack1', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
    meal('snack2', 'Перекус', [item('Орехи', 25, ...P.nuts_walnut)]),
  ]),
  plan(9, 'Рыбный плов', 'halal', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Яичница (2 яйца)', 120, ...P.egg),
      item('Хлеб', 50, ...P.bread),
      item('Творог', 100, ...P.cottage),
    ]),
    meal('lunch', 'Обед', [
      item('Лосось', 180, ...P.salmon),
      item('Рис', 100, ...P.rice_dry),
      item('Морковь', 100, ...P.carrot),
      item('Лук', 50, ...P.onion),
    ]),
    meal('dinner', 'Ужин', [
      item('Куриная грудка', 150, ...P.chicken),
      item('Гречка', 70, ...P.buckwheat_dry),
      item('Брокколи', 100, ...P.broccoli),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Йогурт', 150, ...P.yogurt), item('Яблоко', 100, ...P.apple)]),
  ]),
  plan(10, 'Сытный обед', 'halal', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 250, ...P.milk),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед', [
      item('Индейка', 200, ...P.turkey),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Овощи', 150, 3, 5, 8, 80),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин', [
      item('Творог', 200, ...P.cottage),
      item('Рис', 60, ...P.rice_dry),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Сыр', 35, ...P.cheese), item('Орехи', 15, ...P.nuts_almond)]),
  ]),
];

// ── KOSHER (no pork, no shellfish, no meat+dairy mixing) ────
// Rule: meals are either "meat" or "dairy" — never both in same meal
const kosherPlans: PrebuiltMealPlan[] = [
  plan(1, 'Молочный завтрак, мясной обед', 'kosher', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак (молочное)', [
      item('Творог', 250, ...P.cottage),
      item('Йогурт', 150, ...P.yogurt),
      item('Банан', 120, ...P.banana),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед (мясное)', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Рис', 80, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Сыр', 60, ...P.cheese),
      item('Паста', 80, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple), item('Миндаль', 25, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Молоко', 200, ...P.milk)]),
  ]),
  plan(2, 'Яичный завтрак, говяжий обед', 'kosher', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак (парве)', [
      item('Омлет (3 яйца)', 180, ...P.egg),
      item('Хлеб', 60, ...P.bread),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед (мясное)', [
      item('Говядина', 180, ...P.beef),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Брокколи', 150, ...P.broccoli),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Творог', 200, ...P.cottage),
      item('Грецкие орехи', 30, ...P.nuts_walnut),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Орехи', 30, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
  ]),
  plan(3, 'Молочный день', 'kosher', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак (молочное)', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 250, ...P.milk),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед (молочное)', [
      item('Сыр', 80, ...P.cheese),
      item('Паста', 100, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
      item('Огурец', 100, ...P.cucumber),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Творог', 200, ...P.cottage),
      item('Яблоко', 150, ...P.apple),
      item('Грецкие орехи', 25, ...P.nuts_walnut),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
  ]),
  plan(4, 'Рыбный день', 'kosher', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак (молочное)', [
      item('Творог', 250, ...P.cottage),
      item('Банан', 120, ...P.banana),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед (парве)', [
      item('Лосось', 180, ...P.salmon),
      item('Рис', 80, ...P.rice_dry),
      item('Брокколи', 150, ...P.broccoli),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Сыр', 60, ...P.cheese),
      item('Паста', 70, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple)]),
    meal('snack2', 'Перекус', [item('Молоко', 200, ...P.milk), item('Орехи', 20, ...P.nuts_almond)]),
  ]),
  plan(5, 'Индейка с овощами', 'kosher', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак (молочное)', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 200, ...P.milk),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед (мясное)', [
      item('Индейка', 200, ...P.turkey),
      item('Картофель', 250, ...P.potato),
      item('Морковь', 100, ...P.carrot),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Творог', 200, ...P.cottage),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
    meal('snack2', 'Перекус', [item('Орехи', 30, ...P.nuts_walnut)]),
  ]),
  plan(6, 'Быстрый кошер', 'kosher', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак (парве)', [
      item('Омлет (2 яйца)', 120, ...P.egg),
      item('Хлеб', 50, ...P.bread),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед (мясное)', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Гречка', 80, ...P.buckwheat_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Творог', 200, ...P.cottage),
      item('Гречка', 60, ...P.buckwheat_dry),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Орехи', 30, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
  ]),
  plan(7, 'Говядина с пастой (мясное)', 'kosher', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак (молочное)', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Йогурт', 200, ...P.yogurt),
      item('Мёд', 20, ...P.honey),
    ]),
    meal('lunch', 'Обед (мясное)', [
      item('Говядина', 180, ...P.beef),
      item('Паста', 80, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Сыр', 50, ...P.cheese),
      item('Хлеб', 60, ...P.bread),
      item('Творог', 100, ...P.cottage),
    ]),
    meal('snack1', 'Перекус', [item('Банан', 120, ...P.banana)]),
    meal('snack2', 'Перекус', [item('Молоко', 200, ...P.milk)]),
  ]),
  plan(8, 'Сырно-ореховый', 'kosher', 'fast', '<20 мин', [
    meal('breakfast', 'Завтрак (молочное)', [
      item('Творог', 250, ...P.cottage),
      item('Сыр', 40, ...P.cheese),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед (мясное)', [
      item('Куриная грудка', 200, ...P.chicken),
      item('Рис', 80, ...P.rice_dry),
      item('Овощи', 150, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Йогурт', 200, ...P.yogurt),
      item('Грецкие орехи', 25, ...P.nuts_walnut),
      item('Яблоко', 150, ...P.apple),
    ]),
    meal('snack1', 'Перекус', [item('Миндаль', 30, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Молоко', 200, ...P.milk)]),
  ]),
  plan(9, 'Лосось с картофелем', 'kosher', 'medium', '20-40 мин', [
    meal('breakfast', 'Завтрак (молочное)', [
      item('Овсянка', 80, ...P.oat_dry),
      item('Молоко', 250, ...P.milk),
      item('Банан', 150, ...P.banana),
    ]),
    meal('lunch', 'Обед (парве)', [
      item('Лосось', 180, ...P.salmon),
      item('Картофель', 250, ...P.potato),
      item('Брокколи', 150, ...P.broccoli),
      item('Оливковое масло', 10, ...P.olive_oil),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Творог', 200, ...P.cottage),
      item('Яблоко', 150, ...P.apple),
      item('Орехи', 20, ...P.nuts_almond),
    ]),
    meal('snack1', 'Перекус', [item('Йогурт', 150, ...P.yogurt)]),
    meal('snack2', 'Перекус', [item('Грецкие орехи', 20, ...P.nuts_walnut)]),
  ]),
  plan(10, 'Мясной обед, молочный ужин', 'kosher', 'slow', '>40 мин', [
    meal('breakfast', 'Завтрак (парве)', [
      item('Омлет (3 яйца)', 180, ...P.egg),
      item('Хлеб', 60, ...P.bread),
      item('Банан', 120, ...P.banana),
    ]),
    meal('lunch', 'Обед (мясное)', [
      item('Говядина', 180, ...P.beef),
      item('Рис', 80, ...P.rice_dry),
      item('Морковь', 100, ...P.carrot),
      item('Овощи', 100, 3, 5, 8, 80),
    ]),
    meal('dinner', 'Ужин (молочное)', [
      item('Сыр', 60, ...P.cheese),
      item('Паста', 80, ...P.pasta_dry),
      item('Томат', 100, ...P.tomato),
    ]),
    meal('snack1', 'Перекус', [item('Яблоко', 150, ...P.apple), item('Миндаль', 20, ...P.nuts_almond)]),
    meal('snack2', 'Перекус', [item('Йогурт', 200, ...P.yogurt)]),
  ]),
];

export const ALL_MEAL_PLANS: PrebuiltMealPlan[] = [
  ...regularPlans,
  ...vegetarianPlans,
  ...veganPlans,
  ...halalPlans,
  ...kosherPlans,
];

export const MEAL_PLAN_CATEGORIES: { id: MealPlanCategory; label: string }[] = [
  { id: 'regular', label: 'Обычный' },
  { id: 'vegetarian', label: 'Вегетарианский' },
  { id: 'vegan', label: 'Веганский' },
  { id: 'halal', label: 'Халяль' },
  { id: 'kosher', label: 'Кошер' },
];

export const COOK_TIME_FILTERS: { id: CookTime | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'fast', label: 'Быстрый (<20 мин)' },
  { id: 'medium', label: 'Средний (20-40 мин)' },
  { id: 'slow', label: 'Долгий (>40 мин)' },
];

export function getPlansByCategory(category: MealPlanCategory): PrebuiltMealPlan[] {
  return ALL_MEAL_PLANS.filter((p) => p.category === category);
}

export function scalePlanToCalories(plan: PrebuiltMealPlan, targetCalories: number): PrebuiltMealPlan {
  const baseCalories = plan.totals.calories;
  if (baseCalories === 0 || targetCalories === baseCalories) return plan;
  const factor = targetCalories / baseCalories;

  const scaledMeals = plan.meals.map((m) => ({
    ...m,
    items: m.items.map((i) => ({
      ...i,
      grams: Math.round(i.grams * factor),
      proteins: Math.round(i.proteins * factor * 10) / 10,
      fats: Math.round(i.fats * factor * 10) / 10,
      carbs: Math.round(i.carbs * factor * 10) / 10,
      calories: Math.round(i.calories * factor),
    })),
  }));

  return {
    ...plan,
    meals: scaledMeals,
    totals: {
      proteins: Math.round(plan.totals.proteins * factor),
      fats: Math.round(plan.totals.fats * factor),
      carbs: Math.round(plan.totals.carbs * factor),
      calories: Math.round(plan.totals.calories * factor),
    },
  };
}
