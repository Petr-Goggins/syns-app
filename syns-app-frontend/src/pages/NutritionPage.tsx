import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Plus, Sparkles, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NutritionPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<string>('none');
  const [selectedType, setSelectedType] = useState<string>('balanced');
  const [selectedTime, setSelectedTime] = useState<string>('fast');
  const [showAIModal, setShowAIModal] = useState(false);
  const [budget, setBudget] = useState<number>(3000);
  const [favoriteFoods, setFavoriteFoods] = useState<string>('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [manualProduct, setManualProduct] = useState({
    name: '',
    proteins: '',
    fats: '',
    carbs: '',
    calories: '',
    barcode: '',
  });

  useEffect(() => {
    const loadMealPlans = async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('is_system', true);
      if (!error && data) {
        setMealPlans(data);
      } else {
        setMealPlans([
          { id: '1', name: 'Сбалансированный', description: 'Классическое соотношение БЖУ', type: 'balanced', diet: 'none', time: 'fast', meals: [], is_system: true },
          { id: '2', name: 'Высокобелковый', description: 'Для активных людей', type: 'high-protein', diet: 'none', time: 'medium', meals: [], is_system: true },
        ]);
      }
    };
    loadMealPlans();
  }, []);

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!manualProduct.name.trim()) {
      toast.error('Введите название продукта');
      return;
    }
    const { error } = await supabase.from('meals').insert({
      user_id: user.id,
      product_name: manualProduct.name,
      proteins: Number(manualProduct.proteins) || 0,
      fats: Number(manualProduct.fats) || 0,
      carbs: Number(manualProduct.carbs) || 0,
      calories: Number(manualProduct.calories) || 0,
      weight_grams: 100,
      meal_type: mealType,
      date: new Date().toISOString().split('T')[0],
      barcode: manualProduct.barcode || null,
    });
    if (!error) {
      toast.success('Продукт добавлен!');
      setManualProduct({ name: '', proteins: '', fats: '', carbs: '', calories: '', barcode: '' });
    } else {
      toast.error('Ошибка: ' + error.message);
    }
  };

  const filteredPlans = mealPlans.filter(
    (p) => p.diet === selectedDiet && p.type === selectedType && p.time === selectedTime
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Питание</h1>

      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Filter size={18} />
            <span>Фильтры</span>
          </div>
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 bg-accent-green text-bg px-4 py-2 rounded-xl hover:opacity-90 transition"
          >
            <Sparkles size={18} />
            Сгенерировать с ИИ
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={selectedDiet}
            onChange={(e) => setSelectedDiet(e.target.value)}
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text"
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
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text"
          >
            <option value="balanced">Сбалансированный</option>
            <option value="high-protein">Высокобелковый</option>
            <option value="low-carb">Низкоуглеводный</option>
            <option value="keto">Кетогенный</option>
          </select>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text"
          >
            <option value="fast">Быстрый (&lt;20 мин)</option>
            <option value="medium">Средний (20-40 мин)</option>
            <option value="long">Долгий (&gt;40 мин)</option>
          </select>
        </div>

        {filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlans.slice(0, 2).map((plan) => (
              <div key={plan.id} className="bg-bg-secondary p-4 rounded-xl border border-border hover:border-accent-blue transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-text">{plan.name}</h3>
                    <p className="text-text-secondary text-sm">{plan.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${plan.time === 'fast' ? 'bg-green-500/20 text-green-500' : plan.time === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                    {plan.time === 'fast' ? '⚡' : plan.time === 'medium' ? '⏱️' : '🐢'}
                  </span>
                </div>
                <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg hover:opacity-90 transition">
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

      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Добавить приём пищи</h2>
        <form onSubmit={handleAddManual} className="bg-bg-secondary p-5 rounded-xl border border-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Название продукта"
              value={manualProduct.name}
              onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2.5 text-text w-full"
              required
            />
            <input
              type="text"
              placeholder="Штрихкод (опционально)"
              value={manualProduct.barcode}
              onChange={(e) => setManualProduct({ ...manualProduct, barcode: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2.5 text-text w-full"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="Белки (г)"
              value={manualProduct.proteins}
              onChange={(e) => setManualProduct({ ...manualProduct, proteins: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text w-full"
              step="0.1"
            />
            <input
              type="number"
              placeholder="Жиры (г)"
              value={manualProduct.fats}
              onChange={(e) => setManualProduct({ ...manualProduct, fats: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text w-full"
              step="0.1"
            />
            <input
              type="number"
              placeholder="Углеводы (г)"
              value={manualProduct.carbs}
              onChange={(e) => setManualProduct({ ...manualProduct, carbs: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text w-full"
              step="0.1"
            />
            <input
              type="number"
              placeholder="Калории"
              value={manualProduct.calories}
              onChange={(e) => setManualProduct({ ...manualProduct, calories: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text w-full"
              step="1"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text flex-1"
            >
              <option value="breakfast">Завтрак</option>
              <option value="lunch">Обед</option>
              <option value="dinner">Ужин</option>
              <option value="snack">Перекус</option>
            </select>
            <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition">
              <Plus size={18} /> Добавить
            </button>
          </div>
        </form>
      </div>

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
                <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="bg-bg border border-border rounded-lg px-3 py-2 w-full text-text" min="1000" step="500" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Любимые продукты (через запятую)</label>
                <input type="text" value={favoriteFoods} onChange={(e) => setFavoriteFoods(e.target.value)} className="bg-bg border border-border rounded-lg px-3 py-2 w-full text-text" placeholder="Курица, гречка, овощи" />
              </div>
              <button type="submit" className="bg-blue-500 text-white w-full py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition">
                <Sparkles size={18} /> Сгенерировать
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}