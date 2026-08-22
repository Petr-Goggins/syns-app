import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Plus, Sparkles, Search, Clock, Utensils, Filter, X, Repeat, Calendar, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchProducts } from '@/services/productService';
import { searchVkusvillProducts } from '@/services/vkusvillService';
import { searchPyaterochkaProducts } from '@/services/pyaterochkaService';
import { generateMealPlan, saveMealPlan, type GeneratedMealPlan } from '@/services/mealPlanService';

interface MealPlan {
  id: string;
  name: string;
  description: string;
  type: string;
  diet: string;
  time: string;
  meals: any[];
  is_system: boolean;
}

interface MealPlanContentProps {
  plan: GeneratedMealPlan;
  onReplaceProduct: (mealType: string, foodIndex: number) => void;
}

function MealPlanContent({ plan, onReplaceProduct }: MealPlanContentProps) {
  const mealTypeNames: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    snack: 'Перекус',
  };
  
  return (
    <div className="space-y-4">
      {plan.meals.map((meal, mealIdx) => (
        <div key={mealIdx} className="bg-bg-card p-4 rounded-xl">
          <h4 className="font-medium text-text mb-2">{mealTypeNames[meal.type]}</h4>
          <div className="space-y-2">
            {meal.foods.map((food, foodIdx) => (
              <div key={foodIdx} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-text">{food.name}</p>
                  <p className="text-text-secondary text-xs">{food.weight}г • {food.calories} ккал</p>
                </div>
                <button
                  onClick={() => onReplaceProduct(meal.type, foodIdx)}
                  className="p-2 text-text-secondary hover:text-accent-blue transition"
                  title="Заменить продукт"
                >
                  <Repeat size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border flex gap-4 text-xs text-text-secondary">
            <span>Б: {Math.round(meal.totalProtein)}г</span>
            <span>Ж: {Math.round(meal.totalFat)}г</span>
            <span>У: {Math.round(meal.totalCarbs)}г</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NutritionPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<string>('none');
  const [selectedType, setSelectedType] = useState<string>('balanced');
  const [selectedTime, setSelectedTime] = useState<string>('fast');
  const [showAIModal, setShowAIModal] = useState(false);
  const [budget, setBudget] = useState<number>(3000);
  const [favoriteFoods, setFavoriteFoods] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [productName, setProductName] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  // Новые состояния для длительности и разнообразия
  const [planDuration, setPlanDuration] = useState<'day' | 'week'>('day');
  const [varietyLevel, setVarietyLevel] = useState<'minimal' | 'medium' | 'maximal'>('medium');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [calories, setCalories] = useState('');
  const [productSearchModalOpen, setProductSearchModalOpen] = useState(false);
  const [replacingMealType, setReplacingMealType] = useState<string>('');
  const [replacingFoodIndex, setReplacingFoodIndex] = useState<number>(-1);

  useEffect(() => {
    const loadMealPlans = async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('is_system', true);
      if (!error && data) {
        setMealPlans(data);
      } else {
        const systemPlans: MealPlan[] = [
          { id: '1', name: 'Сбалансированный', description: 'Классическое соотношение БЖУ (30/30/40)', type: 'balanced', diet: 'none', time: 'fast', meals: [], is_system: true },
          { id: '2', name: 'Высокобелковый', description: 'Для активных людей и набора массы', type: 'high-protein', diet: 'none', time: 'medium', meals: [], is_system: true },
          { id: '3', name: 'Низкоуглеводный', description: 'Для похудения и снижения углеводов', type: 'low-carb', diet: 'none', time: 'fast', meals: [], is_system: true },
          { id: '4', name: 'Вегетарианский (быстрый)', description: 'Без мяса, но с яйцами и молочкой', type: 'balanced', diet: 'vegetarian', time: 'fast', meals: [], is_system: true },
          { id: '5', name: 'Халяль (средний)', description: 'Без свинины и алкоголя', type: 'high-protein', diet: 'halal', time: 'medium', meals: [], is_system: true },
        ];
        setMealPlans(systemPlans);
      }
    };
    loadMealPlans();
  }, []);

  const filteredPlans = mealPlans.filter(
    (plan) =>
      plan.diet === selectedDiet &&
      plan.type === selectedType &&
      plan.time === selectedTime
  );

  // Поиск продуктов через ВкусВилл, Пятёрочку и Open Food Facts API
  const searchFood = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchResults([]);

    console.log('Поиск продукта:', query);

    try {
      // 1. Поиск через бэкенд (основной метод)
      const backendResults = await searchProducts(query);
      if (backendResults && backendResults.length > 0) {
        setSearchResults(backendResults.map(p => ({ ...p, source: 'Бэкенд' })));
        setIsSearching(false);
        return;
      }

      // 2. Поиск во ВкусВилл (резервный метод)
      const vkusvillResults = await searchVkusvillProducts(query);
      if (vkusvillResults.length > 0) {
        setSearchResults(vkusvillResults.map(p => ({ ...p, source: 'ВкусВилл' })));
        setIsSearching(false);
        return;
      }

      // 3. Поиск в Пятёрочке (резервный метод)
      const pyaterochkaResults = await searchPyaterochkaProducts(query);
      if (pyaterochkaResults.length > 0) {
        setSearchResults(pyaterochkaResults.map(p => ({ ...p, source: 'Пятёрочка' })));
        setIsSearching(false);
        return;
      }

      // 4. Поиск в Open Food Facts (резервный метод)
      const openFoodResponse = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=true`
      );
      const openFoodData = await openFoodResponse.json();
      const openFoodResults = (openFoodData.products || []).map((p: any) => ({
        id: p.id || p.code,
        name: p.product_name || p.name,
        image: p.image_url,
        source: 'Open Food Facts',
        nutritional_info: {
          calories: p.nutriments?.['energy-kcal_100g'] || p.nutriments?.energy,
          protein: p.nutriments?.proteins_100g || p.nutriments?.proteins,
          fat: p.nutriments?.fat_100g || p.nutriments?.fat,
          carbs: p.nutriments?.carbohydrates_100g || p.nutriments?.carbohydrates,
        },
      }));

      if (openFoodResults.length > 0) {
        setSearchResults(openFoodResults);
        setIsSearching(false);
        return;
      }

      // 5. Ничего не найдено
      setSearchResults([]);
    } catch (err) {
      console.error('Ошибка соединения:', err);
      toast.error('Ошибка поиска продуктов');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('meals').insert({
      user_id: user.id,
      product_name: productName,
      proteins: Number(protein) || 0,
      fats: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      calories: Number(calories) || 0,
      weight_grams: 100,
      meal_type: mealType,
      date: new Date().toISOString().split('T')[0],
    });
    if (!error) {
      toast.success('Приём пищи добавлен!');
      setProductName('');
      setProtein('');
      setFat('');
      setCarbs('');
      setCalories('');
      setSearchQuery('');
      setSearchResults([]);
    } else {
      toast.error('Ошибка: ' + error.message);
    }
  };


  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const userContext = `Пользователь: бюджет ${budget}₽, любимые продукты: ${favoriteFoods}`;
      const plan = await generateMealPlan(user!.id, userContext, planDuration, varietyLevel, budget, favoriteFoods);
      if (plan) {
        setGeneratedPlan(plan);
        setShowAIModal(false);
        toast.success('План питания сгенерирован!');
      } else {
        toast.error('Не удалось сгенерировать план');
      }
    } catch (error) {
      console.error('Ошибка генерации плана:', error);
      toast.error('Ошибка при генерации плана');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    const saved = await saveMealPlan(generatedPlan);
    if (saved) {
      toast.success('План питания сохранён!');
    } else {
      toast.error('Не удалось сохранить план');
    }
  };

  const handleReplaceProduct = (mealType: string, foodIndex: number) => {
    setReplacingMealType(mealType);
    setReplacingFoodIndex(foodIndex);
    setProductSearchModalOpen(true);
  };

  const handleSelectReplacement = async (newProduct: any) => {
    if (!generatedPlan || replacingFoodIndex < 0) return;

    const meal = generatedPlan.meals.find(m => m.type === replacingMealType);
    if (!meal || !meal.foods[replacingFoodIndex]) return;

    const oldFood = meal.foods[replacingFoodIndex];
    const updatedFood = {
      ...oldFood,
      name: newProduct.name,
      calories: newProduct.nutritional_info?.calories || oldFood.calories,
      protein: newProduct.nutritional_info?.protein || oldFood.protein,
      fat: newProduct.nutritional_info?.fat || oldFood.fat,
      carbs: newProduct.nutritional_info?.carbs || oldFood.carbs,
    };

    meal.foods[replacingFoodIndex] = updatedFood;
    meal.totalCalories = meal.foods.reduce((sum, f) => sum + f.calories, 0);
    meal.totalProtein = meal.foods.reduce((sum, f) => sum + f.protein, 0);
    meal.totalFat = meal.foods.reduce((sum, f) => sum + f.fat, 0);
    meal.totalCarbs = meal.foods.reduce((sum, f) => sum + f.carbs, 0);

    generatedPlan.totalCalories = generatedPlan.meals.reduce((sum, m) => sum + m.totalCalories, 0);
    generatedPlan.totalProtein = generatedPlan.meals.reduce((sum, m) => sum + m.totalProtein, 0);
    generatedPlan.totalFat = generatedPlan.meals.reduce((sum, m) => sum + m.totalFat, 0);
    generatedPlan.totalCarbs = generatedPlan.meals.reduce((sum, m) => sum + m.totalCarbs, 0);

    setGeneratedPlan({ ...generatedPlan });
    setProductSearchModalOpen(false);
    setReplacingMealType('');
    setReplacingFoodIndex(-1);
    toast.success(`Продукт заменён на ${newProduct.name}`);
  };

  const handleProductSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchResults([]);

    console.log('Поиск продукта для замены:', query);

    try {
      const vkusvillResults = await searchVkusvillProducts(query);
      if (vkusvillResults.length > 0) {
        setSearchResults(vkusvillResults.map(p => ({ ...p, source: 'ВкусВилл' })));
        setIsSearching(false);
        return;
      }

      const pyaterochkaResults = await searchPyaterochkaProducts(query);
      if (pyaterochkaResults.length > 0) {
        setSearchResults(pyaterochkaResults.map(p => ({ ...p, source: 'Пятёрочка' })));
        setIsSearching(false);
        return;
      }

      const openFoodResponse = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=true`
      );
      const openFoodData = await openFoodResponse.json();
      const openFoodResults = (openFoodData.products || []).map((p: any) => ({
        id: p.id || p.code,
        name: p.product_name || p.name,
        image: p.image_url,
        source: 'Open Food Facts',
        nutritional_info: {
          calories: p.nutriments?.['energy-kcal_100g'] || p.nutriments?.energy,
          protein: p.nutriments?.proteins_100g || p.nutriments?.proteins,
          fat: p.nutriments?.fat_100g || p.nutriments?.fat,
          carbs: p.nutriments?.carbohydrates_100g || p.nutriments?.carbohydrates,
        },
      }));

      if (openFoodResults.length > 0) {
        setSearchResults(openFoodResults);
        setIsSearching(false);
        return;
      }

      setSearchResults([]);
    } catch (err) {
      console.error('Ошибка соединения:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    setProductName(product.name);
    setProtein(String(product.proteins || product.protein || product.nutritional_info?.protein || 0));
    setFat(String(product.fats || product.fat || product.nutritional_info?.fat || 0));
    setCarbs(String(product.carbs || product.carbohydrates || product.nutritional_info?.carbs || 0));
    setCalories(String(product.calories || product.energy_kcal || product.nutritional_info?.calories || 0));
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-6">Питание</h1>

      {/* Готовые рационы */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Filter size={18} />
            <span>Фильтры</span>
          </div>
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 bg-accent-green text-bg px-4 py-2 rounded-xl hover:opacity-90 transition shadow-lg shadow-accent-green/20"
          >
            <Sparkles size={18} />
            Сгенерировать с ИИ
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={selectedDiet}
            onChange={(e) => setSelectedDiet(e.target.value)}
            className="input-field px-3 py-2 rounded-lg text-sm"
          >
            <option value="none">Без ограничений</option>
            <option value="vegetarian">Вегетарианский</option>
            <option value="vegan">Веганский</option>
            <option value="halal">Халяль</option>
            <option value="kosher">Кошер</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-field px-3 py-2 rounded-lg text-sm"
          >
            <option value="balanced">Сбалансированный</option>
            <option value="high-protein">Высокобелковый</option>
            <option value="low-carb">Низкоуглеводный</option>
            <option value="keto">Кетогенный</option>
          </select>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="input-field px-3 py-2 rounded-lg text-sm"
          >
            <option value="fast">Быстрый (&lt;20 мин)</option>
            <option value="medium">Средний (20-40 мин)</option>
            <option value="long">Долгий (&gt;40 мин)</option>
          </select>
        </div>

        {filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlans.slice(0, 2).map((plan) => (
              <div key={plan.id} className="card-modern hover:border-accent-blue transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-text">{plan.name}</h3>
                    <p className="text-text-secondary text-sm">{plan.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    plan.time === 'fast' ? 'bg-accent-green/10 text-accent-green' :
                    plan.time === 'medium' ? 'bg-accent-gold/10 text-accent-gold' :
                    'bg-accent-red/10 text-accent-red'
                  }`}>
                    {plan.time === 'fast' ? '⚡' : plan.time === 'medium' ? '⏱️' : '🐢'}
                  </span>
                </div>
                <button className="mt-3 w-full bg-accent-blue text-bg py-2 rounded-lg hover:opacity-90 transition">
                  Выбрать
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-4">Нет рационов с такими параметрами</p>
        )}
      </div>

      <hr className="border-border my-6" />

      {/* Добавление приёма пищи с поиском */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Добавить приём пищи</h2>
        
        {/* Поиск продукта */}
        <div className="card-modern space-y-4 mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Найти продукт (например, молоко)"
              value={searchQuery}
              onChange={(e) => searchFood(e.target.value)}
              className="input-field w-full pl-10 pr-3 py-2.5 rounded-lg"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border-b border-border"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue">
                        {product.source}
                      </span>
                      {product.nutritional_info?.calories && (
                        <span className="text-xs text-text-secondary">
                          {product.nutritional_info.calories} ккал
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="px-3 py-1 text-sm bg-accent-blue text-white rounded-lg"
                    onClick={() => handleSelectProduct(product)}
                  >
                    Добавить
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Форма добавления */}
        <form onSubmit={handleAddMeal} className="card-modern space-y-4">
          <input
            type="text"
            placeholder="Название продукта"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="input-field w-full px-3 py-2.5 rounded-lg"
            required
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="Белки (г)"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="input-field px-3 py-2 rounded-lg"
            />
            <input
              type="number"
              placeholder="Жиры (г)"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="input-field px-3 py-2 rounded-lg"
            />
            <input
              type="number"
              placeholder="Углеводы (г)"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="input-field px-3 py-2 rounded-lg"
            />
            <input
              type="number"
              placeholder="Калории"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="input-field px-3 py-2 rounded-lg"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
              className="input-field px-3 py-2 rounded-lg flex-1"
            >
              <option value="breakfast">Завтрак</option>
              <option value="lunch">Обед</option>
              <option value="dinner">Ужин</option>
              <option value="snack">Перекус</option>
            </select>
            <button type="submit" className="btn-primary px-6 py-2 rounded-lg flex items-center gap-2">
              <Plus size={18} /> Добавить
            </button>
          </div>
        </form>
      </div>

      {/* Модалка ИИ */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-bg-secondary p-6 rounded-2xl max-w-2xl w-full border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-text">Сгенерировать рацион с ИИ</h2>
              <button onClick={() => setShowAIModal(false)} className="text-text-secondary hover:text-text">
                <X size={24} />
              </button>
            </div>
            
            {/* Переключатель длительности */}
            <div className="mb-4">
              <label className="text-text-secondary text-sm block mb-2">Длительность плана</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlanDuration('day')}
                  className={`flex-1 py-2 px-4 rounded-lg transition ${
                    planDuration === 'day'
                      ? 'bg-accent-blue text-white'
                      : 'bg-bg-card border border-border text-text-secondary hover:border-accent-blue'
                  }`}
                >
                  На день
                </button>
                <button
                  onClick={() => setPlanDuration('week')}
                  className={`flex-1 py-2 px-4 rounded-lg transition ${
                    planDuration === 'week'
                      ? 'bg-accent-blue text-white'
                      : 'bg-bg-card border border-border text-text-secondary hover:border-accent-blue'
                  }`}
                >
                  На неделю
                </button>
              </div>
            </div>

            {/* Уровень разнообразия */}
            <div className="mb-4">
              <label className="text-text-secondary text-sm block mb-2">Уровень разнообразия</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setVarietyLevel('minimal')}
                  className={`py-2 px-3 rounded-lg text-xs transition ${
                    varietyLevel === 'minimal'
                      ? 'bg-accent-blue text-white'
                      : 'bg-bg-card border border-border text-text-secondary hover:border-accent-blue'
                  }`}
                >
                  Минимальный
                </button>
                <button
                  onClick={() => setVarietyLevel('medium')}
                  className={`py-2 px-3 rounded-lg text-xs transition ${
                    varietyLevel === 'medium'
                      ? 'bg-accent-blue text-white'
                      : 'bg-bg-card border border-border text-text-secondary hover:border-accent-blue'
                  }`}
                >
                  Средний
                </button>
                <button
                  onClick={() => setVarietyLevel('maximal')}
                  className={`py-2 px-3 rounded-lg text-xs transition ${
                    varietyLevel === 'maximal'
                      ? 'bg-accent-blue text-white'
                      : 'bg-bg-card border border-border text-text-secondary hover:border-accent-blue'
                  }`}
                >
                  Максимальный
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm">Бюджет на день (₽)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="input-field w-full mt-1"
                />
              </div>
              <div>
                <label className="text-text-secondary text-sm">Любимые продукты</label>
                <textarea
                  value={favoriteFoods}
                  onChange={(e) => setFavoriteFoods(e.target.value)}
                  placeholder="Курица, гречка, овощи..."
                  className="input-field w-full mt-1"
                  rows={3}
                />
              </div>
              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Сгенерировать
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Отображение сгенерированного плана */}
      {generatedPlan && (
        <div className="mt-8 card-modern">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text">
              План питания на {generatedPlan.duration === 'day' ? 'день' : 'неделю'}
            </h2>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-accent-blue/10 text-accent-blue">
                {generatedPlan.varietyLevel === 'minimal' ? 'Мин. разнообразие' :
                 generatedPlan.varietyLevel === 'medium' ? 'Среднее разнообразие' : 'Макс. разнообразие'}
              </span>
            </div>
          </div>

          {generatedPlan.days ? (
            <div className="space-y-6">
              {generatedPlan.days.map((dayPlan, idx) => (
                <div key={idx} className="border-b border-border pb-4 last:border-0">
                  <h3 className="font-semibold text-text mb-2">День {idx + 1} ({dayPlan.date})</h3>
                  <MealPlanContent plan={dayPlan} onReplaceProduct={handleReplaceProduct} />
                </div>
              ))}
            </div>
          ) : (
            <MealPlanContent plan={generatedPlan} onReplaceProduct={handleReplaceProduct} />
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="font-semibold text-text mb-2">Итого за день:</h3>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center p-2 bg-bg-card rounded-lg">
                <p className="text-text-secondary">{generatedPlan.totalCalories} ккал</p>
              </div>
              <div className="text-center p-2 bg-bg-card rounded-lg">
                <p className="text-text-secondary">Б: {Math.round(generatedPlan.totalProtein)}г</p>
              </div>
              <div className="text-center p-2 bg-bg-card rounded-lg">
                <p className="text-text-secondary">Ж: {Math.round(generatedPlan.totalFat)}г</p>
              </div>
              <div className="text-center p-2 bg-bg-card rounded-lg">
                <p className="text-text-secondary">У: {Math.round(generatedPlan.totalCarbs)}г</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
              <Calendar size={18} />
              Список покупок
            </h3>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-text-secondary">
              {generatedPlan.shoppingList.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSavePlan}
              className="flex-1 btn-primary py-2 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Сохранить план
            </button>
            <button
              onClick={() => setGeneratedPlan(null)}
              className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-bg-card"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
