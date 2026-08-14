import { supabase } from '@/lib/supabase';
import type { NutritionLog, NutritionMealType } from '@/types';

export interface MealPlanFood {
  name: string;
  weight: number; // в граммах
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  source?: string;
}

export interface MealPlanMeal {
  type: NutritionMealType;
  foods: MealPlanFood[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

export interface GeneratedMealPlan {
  id?: string;
  userId: string;
  date: string;
  duration: 'day' | 'week';
  meals: MealPlanMeal[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  shoppingList: string[];
  sources: string[];
  isSaved: boolean;
}

/**
 * Системный промпт для генерации рациона
 */
export const MEAL_PLAN_SYSTEM_PROMPT = `Ты — персональный ИИ-наставник по питанию Sync. 
Твоя задача — генерировать персонализированные рационы питания на основе данных пользователя.

ПРАВИЛА ГЕНЕРАЦИИ:
1. Рассчитай суточную норму калорий по формуле Mifflin-St Jeor:
   - Для мужчин: BMR = (10 × вес в кг) + (6.25 × рост в см) − (5 × возраст) + 5
   - Для женщин: BMR = (10 × вес в кг) + (6.25 × рост в см) − (5 × возраст) − 161
   - Умножь на коэффициент активности:
     * Сидячий: 1.2
     * Лёгкий: 1.375
     * Средний: 1.55
     * Высокий: 1.725
     * Очень высокий: 1.9
   - Добавь/убавь калории в зависимости от цели:
     * Похудение: -500 ккал
     * Набор массы: +300 ккал
     * Поддержание: без изменений

2. Разбей на 3-5 приёмов пищи (завтрак, обед, ужин, 1-2 перекуса).

3. Для каждого приёма пищи укажи:
   - Тип приёма (breakfast/lunch/dinner/snack)
   - Конкретные продукты с весом в граммах
   - КБЖУ для каждого продукта и итого по приёму пищи

4. Учитывай:
   - Диетические ограничения (вегетарианство, халяль, аллергии)
   - Предпочтения пользователя (любимые/нелюбимые продукты)
   - Доступное оборудование для готовки
   - Бюджет (если указан)

5. Сформируй список покупок на день/неделю.

6. ВСЕГДА указывай научные источники для рекомендаций:
   - ACSM (American College of Sports Medicine)
   - WHO (World Health Organization)
   - USDA (United States Department of Agriculture)
   - EFSA (European Food Safety Authority)
   - Роспотребнадзор (для РФ)

ФОРМАТ ОТВЕТА (строго JSON):
{
  "total_calories": число,
  "total_protein": число,
  "total_fat": число,
  "total_carbs": число,
  "meals": [
    {
      "type": "breakfast",
      "foods": [
        {"name": "Овсянка", "weight": 50, "calories": 185, "protein": 6, "fat": 3, "carbs": 32}
      ],
      "total_calories": число,
      "total_protein": число,
      "total_fat": число,
      "total_carbs": число
    }
  ],
  "shopping_list": ["овсяные хлопья 500г", "молоко 1л", ...],
  "sources": ["ACSM: норма белка 1.6-2.2 г/кг для набора массы", "WHO: рекомендации по углеводам"]
}

Отвечай ТОЛЬКО JSON без дополнительного текста.`;

/**
 * Генерирует рацион на день или неделю
 */
export async function generateMealPlan(
  userId: string,
  userContext: string,
  duration: 'day' | 'week' = 'day',
  budget?: number,
  preferences?: string
): Promise<GeneratedMealPlan | null> {
  try {
    // Формируем запрос к ИИ
    const prompt = `
${userContext}

ЗАДАЧА: Сгенерируй рацион питания на ${duration === 'day' ? '1 день' : '7 дней'}.
${budget ? `Бюджет: ${budget} рублей в день.` : ''}
${preferences ? `Предпочтения: ${preferences}` : ''}

Верни ответ в формате JSON согласно системному промпту.`;

    // В MVP используем заглушку — в реальности здесь вызов API ИИ
    // const response = await fetch('/api/ai/generate-meal-plan', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ prompt, systemPrompt: MEAL_PLAN_SYSTEM_PROMPT }),
    // });
    // const data = await response.json();

    // Заглушка для демонстрации
    const mockPlan: GeneratedMealPlan = {
      userId,
      date: new Date().toISOString().split('T')[0],
      duration,
      meals: [
        {
          type: 'breakfast',
          foods: [
            { name: 'Овсянка на молоке', weight: 250, calories: 220, protein: 8, fat: 5, carbs: 35 },
            { name: 'Яйцо варёное', weight: 100, calories: 155, protein: 13, fat: 11, carbs: 1 },
            { name: 'Яблоко', weight: 150, calories: 78, protein: 0.4, fat: 0.3, carbs: 21 },
          ],
          totalCalories: 453,
          totalProtein: 21.4,
          totalFat: 16.3,
          totalCarbs: 57,
        },
        {
          type: 'lunch',
          foods: [
            { name: 'Куриная грудка гриль', weight: 150, calories: 248, protein: 47, fat: 5, carbs: 0 },
            { name: 'Гречка отварная', weight: 200, calories: 220, protein: 8, fat: 2, carbs: 42 },
            { name: 'Салат овощной', weight: 150, calories: 45, protein: 2, fat: 1, carbs: 9 },
          ],
          totalCalories: 513,
          totalProtein: 57,
          totalFat: 8,
          totalCarbs: 51,
        },
        {
          type: 'snack1',
          foods: [
            { name: 'Творог 5%', weight: 150, calories: 180, protein: 27, fat: 7.5, carbs: 4.5 },
            { name: 'Банан', weight: 120, calories: 107, protein: 1.3, fat: 0.4, carbs: 27 },
          ],
          totalCalories: 287,
          totalProtein: 28.3,
          totalFat: 7.9,
          totalCarbs: 31.5,
        },
        {
          type: 'dinner',
          foods: [
            { name: 'Лосось запечённый', weight: 150, calories: 312, protein: 34, fat: 18, carbs: 0 },
            { name: 'Брокколи на пару', weight: 200, calories: 68, protein: 6, fat: 1, carbs: 14 },
            { name: 'Рис бурый', weight: 150, calories: 165, protein: 4, fat: 1.5, carbs: 35 },
          ],
          totalCalories: 545,
          totalProtein: 44,
          totalFat: 20.5,
          totalCarbs: 49,
        },
      ],
      totalCalories: 1798,
      totalProtein: 150.7,
      totalFat: 52.7,
      totalCarbs: 188.5,
      shoppingList: [
        'Овсяные хлопья 500г',
        'Молоко 1л',
        'Яйца 10шт',
        'Яблоки 1кг',
        'Куриная грудка 500г',
        'Гречка 500г',
        'Овощи для салата',
        'Творог 5% 400г',
        'Бананы 5шт',
        'Лосось филе 300г',
        'Брокколи 400г',
        'Рис бурый 500г',
      ],
      sources: [
        'ACSM: норма белка 1.6-2.2 г/кг веса для набора мышечной массы',
        'WHO: рекомендуемое соотношение БЖУ 15/30/55',
        'USDA: суточная норма клетчатки 25-30г',
      ],
      isSaved: false,
    };

    return mockPlan;
  } catch (error) {
    console.error('Ошибка генерации рациона:', error);
    return null;
  }
}

/**
 * Сохраняет сгенерированный рацион в базу данных
 */
export async function saveMealPlan(plan: GeneratedMealPlan): Promise<string | null> {
  try {
    const entries = plan.meals.flatMap(meal =>
      meal.foods.map(food => ({
        user_id: plan.userId,
        log_date: plan.date,
        meal_type: meal.type,
        custom_name: food.name,
        grams: food.weight,
        proteins: food.protein,
        fats: food.fat,
        carbs: food.carbs,
        calories: food.calories,
        is_generated: true,
        plan_id: plan.id || null,
      }))
    );

    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert(entries)
      .select()
      .single();

    if (error) throw error;

    // Обновляем флаг сохранения
    plan.isSaved = true;

    return data?.id || null;
  } catch (error) {
    console.error('Ошибка сохранения рациона:', error);
    return null;
  }
}

/**
 * Заменяет продукт в рационе с пересчётом КБЖУ
 */
export async function replaceProductInPlan(
  planId: string,
  oldProductName: string,
  newProduct: {
    name: string;
    weight: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }
): Promise<boolean> {
  try {
    // Находим запись и обновляем
    const { error } = await supabase
      .from('nutrition_logs')
      .update({
        custom_name: newProduct.name,
        grams: newProduct.weight,
        proteins: newProduct.protein,
        fats: newProduct.fat,
        carbs: newProduct.carbs,
        calories: newProduct.calories,
      })
      .eq('id', planId)
      .like('custom_name', `%${oldProductName}%`);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Ошибка замены продукта:', error);
    return false;
  }
}

/**
 * Получает сохранённые рационы пользователя
 */
export async function getUserMealPlans(userId: string, dateFrom?: string): Promise<GeneratedMealPlan[]> {
  try {
    const query = supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_generated', true)
      .order('log_date', { ascending: false });

    if (dateFrom) {
      query.gte('log_date', dateFrom);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Группируем по дате и типу приёма пищи
    const plansMap = new Map<string, GeneratedMealPlan>();
    
    data?.forEach(log => {
      const date = log.log_date;
      if (!plansMap.has(date)) {
        plansMap.set(date, {
          userId,
          date,
          duration: 'day',
          meals: [],
          totalCalories: 0,
          totalProtein: 0,
          totalFat: 0,
          totalCarbs: 0,
          shoppingList: [],
          sources: ['Сгенерировано ИИ Sync'],
          isSaved: true,
        });
      }

      const plan = plansMap.get(date)!;
      let meal = plan.meals.find(m => m.type === log.meal_type);
      
      if (!meal) {
        meal = {
          type: log.meal_type,
          foods: [],
          totalCalories: 0,
          totalProtein: 0,
          totalFat: 0,
          totalCarbs: 0,
        };
        plan.meals.push(meal);
      }

      meal.foods.push({
        name: log.custom_name || 'Продукт',
        weight: log.grams,
        calories: log.calories,
        protein: log.proteins,
        fat: log.fats,
        carbs: log.carbs,
      });

      meal.totalCalories += log.calories;
      meal.totalProtein += log.proteins;
      meal.totalFat += log.fats;
      meal.totalCarbs += log.carbs;

      plan.totalCalories += log.calories;
      plan.totalProtein += log.proteins;
      plan.totalFat += log.fats;
      plan.totalCarbs += log.carbs;
    });

    return Array.from(plansMap.values());
  } catch (error) {
    console.error('Ошибка получения рационов:', error);
    return [];
  }
}
