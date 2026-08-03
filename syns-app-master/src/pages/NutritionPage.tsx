import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Plus, Sparkles, Search, Clock, Utensils, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function NutritionPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<string>('none');
  const [selectedType, setSelectedType] = useState<string>('balanced');
  const [selectedTime, setSelectedTime] = useState<string>('fast');
  const [showAIModal, setShowAIModal] = useState(false);
  const [budget, setBudget] = useState<number>(3000);
  const [favoriteFoods, setFavoriteFoods] = useState<string>('');
<<<<<<< HEAD
=======
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
  const [productName, setProductName] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [calories, setCalories] = useState('');
<<<<<<< HEAD
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
=======
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6

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

<<<<<<< HEAD
  const filteredPlans = mealPlans.filter(
    (plan) =>
      plan.diet === selectedDiet &&
      plan.type === selectedType &&
      plan.time === selectedTime
  );
=======
  // Поиск продуктов (заглушка)
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    // Имитация поиска
    const mockProducts = [
      { name: 'Гречка отварная', brand: 'Макфа', calories: 130, proteins: 5, fats: 1, carbs: 30 },
      { name: 'Куриная грудка вареная', brand: 'Петелинка', calories: 130, proteins: 25, fats: 2, carbs: 0 },
      { name: 'Рис отварной', brand: 'Мистраль', calories: 120, proteins: 2.5, fats: 0.5, carbs: 28 },
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase()));
    setSearchResults(mockProducts);
    setIsSearching(false);
  };
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6

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
    } else {
      toast.error('Ошибка: ' + error.message);
    }
  };

<<<<<<< HEAD
=======
  const filteredPlans = mealPlans.filter(p => p.diet === selectedDiet && p.type === selectedType && p.time === selectedTime);

>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
  return (
    <div className="p-4 max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-6">Питание</h1>

<<<<<<< HEAD
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="text-text-secondary text-sm flex items-center gap-2">
            <Filter size={18} /> Фильтры
          </span>
=======
      {/* Готовые рационы */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Filter size={18} />
            <span>Фильтры</span>
          </div>
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 bg-accent-green text-bg px-4 py-2 rounded-xl hover:opacity-90 transition shadow-lg shadow-accent-green/20"
          >
<<<<<<< HEAD
            <Sparkles size={18} /> Сгенерировать с ИИ
          </button>
        </div>

        {/* Фильтры — кастомные кнопки */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div>
            <span className="text-text-secondary text-xs block mb-1">Диета</span>
            <div className="flex gap-1.5 flex-wrap">
              {['none', 'vegetarian', 'vegan', 'halal', 'kosher'].map((value) => (
                <button
                  key={value}
                  onClick={() => setSelectedDiet(value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                    selectedDiet === value
                      ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                      : 'border-border text-text-secondary hover:border-text-tertiary'
                  }`}
                >
                  {value === 'none' && 'Без ограничений'}
                  {value === 'vegetarian' && 'Вегетарианский'}
                  {value === 'vegan' && 'Веганский'}
                  {value === 'halal' && 'Халяль'}
                  {value === 'kosher' && 'Кошер'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-text-secondary text-xs block mb-1">Тип</span>
            <div className="flex gap-1.5 flex-wrap">
              {['balanced', 'high-protein', 'low-carb', 'keto'].map((value) => (
                <button
                  key={value}
                  onClick={() => setSelectedType(value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                    selectedType === value
                      ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                      : 'border-border text-text-secondary hover:border-text-tertiary'
                  }`}
                >
                  {value === 'balanced' && 'Сбалансированный'}
                  {value === 'high-protein' && 'Высокобелковый'}
                  {value === 'low-carb' && 'Низкоуглеводный'}
                  {value === 'keto' && 'Кетогенный'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-text-secondary text-xs block mb-1">Время</span>
            <div className="flex gap-1.5 flex-wrap">
              {['fast', 'medium', 'long'].map((value) => (
                <button
                  key={value}
                  onClick={() => setSelectedTime(value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                    selectedTime === value
                      ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                      : 'border-border text-text-secondary hover:border-text-tertiary'
                  }`}
                >
                  {value === 'fast' && 'Быстрый (<20мин)'}
                  {value === 'medium' && 'Средний (20-40мин)'}
                  {value === 'long' && 'Долгий (>40мин)'}
                </button>
              ))}
            </div>
          </div>
=======
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
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
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
<<<<<<< HEAD
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    plan.time === 'fast' ? 'bg-accent-green/10 text-accent-green' :
                    plan.time === 'medium' ? 'bg-accent-gold/10 text-accent-gold' :
                    'bg-accent-red/10 text-accent-red'
                  }`}>
=======
                  <span className={`text-xs px-2 py-1 rounded-full ${plan.time === 'fast' ? 'bg-accent-green/10 text-accent-green' : plan.time === 'medium' ? 'bg-accent-gold/10 text-accent-gold' : 'bg-accent-red/10 text-accent-red'}`}>
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
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

<<<<<<< HEAD
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Добавить приём пищи</h2>
        <form onSubmit={handleAddMeal} className="card-modern space-y-4">
          <input
            type="text"
            placeholder="Название продукта"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="input-field w-full px-3 py-2.5 rounded-lg"
            required
          />
=======
      {/* Добавление приёма пищи */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Добавить приём пищи</h2>
        <form onSubmit={handleAddMeal} className="card-modern space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Название продукта"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="input-field w-full pl-10 pr-3 py-2.5 rounded-lg"
              required
            />
          </div>
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
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

<<<<<<< HEAD
=======
      {/* Модалка ИИ */}
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-bg-secondary p-6 rounded-2xl max-w-md w-full border border-border shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-text">Сгенерировать рацион с ИИ</h2>
              <button onClick={() => setShowAIModal(false)} className="text-text-secondary hover:text-text">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              toast.success('Рацион сгенерирован! (заглушка)');
              setShowAIModal(false);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Бюджет на неделю (руб)</label>
                <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="input-field w-full px-3 py-2 rounded-lg" min="1000" step="500" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Любимые продукты (через запятую)</label>
                <input type="text" value={favoriteFoods} onChange={(e) => setFavoriteFoods(e.target.value)} className="input-field w-full px-3 py-2 rounded-lg" placeholder="Курица, гречка, овощи" />
              </div>
              <button type="submit" className="btn-primary w-full py-2 rounded-lg flex items-center justify-center gap-2">
                <Sparkles size={18} /> Сгенерировать
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}