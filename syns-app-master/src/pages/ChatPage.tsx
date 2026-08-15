import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Trash2, Sparkles, Utensils, ShoppingBag, RotateCcw, X } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useChatStore } from '@/store/chatStore';
import { buildUserContext } from '@/services/userContextService';
import { generateMealPlan, saveMealPlan, type GeneratedMealPlan } from '@/services/mealPlanService';
import { searchVkusvillProducts } from '@/services/vkusvillService';
import { searchPyaterochkaProducts } from '@/services/pyaterochkaService';
import toast from 'react-hot-toast';

interface ChatLocationState {
  context?: {
    metrics?: {
      totalWorkouts: number;
      totalVolume: number;
      avgCalories: number;
      avgSleep: number;
    };
    weightChange?: number | null;
    period?: string;
    insights?: string[];
  };
}

export default function ChatPage({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const location = useLocation();
  const state = location.state as ChatLocationState | undefined;
  const user = useAuthStore((s) => s.user);
  const { profile } = useProfileStore();
  const { messages, loading, fetchMessages, sendMessage, clearMessages, setMessages } = useChatStore();
  const [input, setInput] = useState('');
  const [userContext, setUserContext] = useState<string>('');
  const [loadingContext, setLoadingContext] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] = useState<GeneratedMealPlan | null>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [replacingProduct, setReplacingProduct] = useState<{mealType: string, productName: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Обработка контекста из ProgressPage
  useEffect(() => {
    if (state?.context && (!messages.length || messages[0].role !== 'system')) {
      const ctx = state.context;
      const contextText = `
Контекст прогресса пользователя:
- Период: ${ctx.period || 'не указан'}
- Тренировок: ${ctx.metrics?.totalWorkouts || 0}
- Объём: ${ctx.metrics?.totalVolume || 0} кг
- Средняя калорийность: ${ctx.metrics?.avgCalories || 0} ккал
- Средний сон: ${ctx.metrics?.avgSleep || 0} ч
- Изменение веса: ${ctx.weightChange !== null && ctx.weightChange !== undefined ? `${ctx.weightChange.toFixed(1)} кг` : 'нет данных'}
- Инсайты: ${ctx.insights?.join('; ') || 'нет'}

Пользователь просит: "Проанализируй мой прогресс и дай рекомендации"
      `.trim();
      
      setMessages([{
        id: 'context-' + Date.now(),
        role: 'system',
        content: contextText,
        created_at: new Date().toISOString()
      }]);
      
      setTimeout(() => {
        sendMessage(contextText + '\n\nДай подробный анализ и рекомендации.');
      }, 500);
    }
  }, []);

  // Загрузка контекста пользователя при открытии чата
  useEffect(() => {
    if (!user) return;
    
    const loadContext = async () => {
      setLoadingContext(true);
      const context = await buildUserContext(user.id);
      setUserContext(context);
      setLoadingContext(false);
    };
    
    loadContext();
    fetchMessages(user.id);
  }, [user, fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  if (!user) return null;

  // Генерация рациона по запросу пользователя
  const handleGenerateMealPlan = async (duration: 'day' | 'week' = 'day') => {
    if (!userContext) {
      toast.error('Загрузка данных пользователя...');
      return;
    }
    
    setLoadingContext(true);
    const plan = await generateMealPlan(user.id, userContext, duration);
    setLoadingContext(false);
    
    if (plan) {
      setCurrentMealPlan(plan);
      // Добавляем сообщение в чат
      const summary = `🍽️ Рацион на ${duration === 'day' ? 'день' : 'неделю'}:\n\n` +
        `Калории: ${plan.totalCalories} ккал\n` +
        `Белки: ${plan.totalProtein.toFixed(1)}г | Жиры: ${plan.totalFat.toFixed(1)}г | Углеводы: ${plan.totalCarbs.toFixed(1)}г\n\n` +
        `${plan.meals.map(m => `**${m.type === 'breakfast' ? 'Завтрак' : m.type === 'lunch' ? 'Обед' : m.type === 'dinner' ? 'Ужин' : 'Перекус'}**\n` +
          `${m.foods.map(f => `• ${f.name} — ${f.weight}г (${f.calories} ккал)`).join('\n')}`).join('\n\n')}\n\n` +
        `📚 Источники:\n${plan.sources.join('\n')}`;
      
      await sendMessage(user.id, profile, `Сгенерируй рацион на ${duration === 'day' ? 'день' : 'неделю'}`);
      // Сохраняем ответ как системное сообщение с планом
      setMessages([...messages, { id: `plan-${Date.now()}`, user_id: user.id, role: 'assistant', content: summary, created_at: new Date().toISOString() }]);
    } else {
      toast.error('Не удалось сгенерировать рацион');
    }
  };

  // Поиск продуктов для замены
  const handleProductSearch = async (query: string) => {
    if (!query.trim()) return;
    setProductSearchQuery(query);
    
    try {
      const vkusvill = await searchVkusvillProducts(query);
      if (vkusvill.length > 0) {
        setProductSearchResults(vkusvill);
        return;
      }
      
      const pyaterochka = await searchPyaterochkaProducts(query);
      if (pyaterochka.length > 0) {
        setProductSearchResults(pyaterochka);
        return;
      }
      
      setProductSearchResults([]);
    } catch (error) {
      console.error('Ошибка поиска продукта:', error);
    }
  };

  // Замена продукта в рационе
  const handleReplaceProduct = (mealType: string, productName: string) => {
    setReplacingProduct({ mealType, productName });
    setShowProductSearch(true);
  };

  // Выбор продукта для замены
  const handleSelectReplacement = async (newProduct: any) => {
    if (!replacingProduct || !currentMealPlan) return;
    
    // Находим приём пищи и продукт
    const meal = currentMealPlan.meals.find(m => m.type === replacingProduct.mealType);
    const food = meal?.foods.find(f => f.name === replacingProduct.productName);
    
    if (food) {
      // Заменяем с сохранением веса
      const updatedFood = {
        ...food,
        name: newProduct.name,
        calories: newProduct.nutritional_info?.calories || food.calories,
        protein: newProduct.nutritional_info?.protein || food.protein,
        fat: newProduct.nutritional_info?.fat || food.fat,
        carbs: newProduct.nutritional_info?.carbs || food.carbs,
      };
      
      // Пересчитываем итоги
      if (meal) {
        meal.foods = meal.foods.map(f => 
          f.name === replacingProduct.productName ? updatedFood : f
        );
        meal.totalCalories = meal.foods.reduce((sum, f) => sum + f.calories, 0);
        meal.totalProtein = meal.foods.reduce((sum, f) => sum + f.protein, 0);
        meal.totalFat = meal.foods.reduce((sum, f) => sum + f.fat, 0);
        meal.totalCarbs = meal.foods.reduce((sum, f) => sum + f.carbs, 0);
      }
      
      // Обновляем общие итоги
      currentMealPlan.totalCalories = currentMealPlan.meals.reduce((sum, m) => sum + m.totalCalories, 0);
      currentMealPlan.totalProtein = currentMealPlan.meals.reduce((sum, m) => sum + m.totalProtein, 0);
      currentMealPlan.totalFat = currentMealPlan.meals.reduce((sum, m) => sum + m.totalFat, 0);
      currentMealPlan.totalCarbs = currentMealPlan.meals.reduce((sum, m) => sum + m.totalCarbs, 0);
      
      setCurrentMealPlan({ ...currentMealPlan });
      setShowProductSearch(false);
      setReplacingProduct(null);
      setProductSearchQuery('');
      setProductSearchResults([]);
      toast.success(`Продукт заменён на ${newProduct.name}`);
    }
  };

  // Сохранение рациона в дневник
  const handleSaveMealPlan = async () => {
    if (!currentMealPlan) return;
    
    const result = await saveMealPlan(currentMealPlan);
    if (result) {
      toast.success('Рацион сохранён в дневник питания!');
      setCurrentMealPlan({ ...currentMealPlan, isSaved: true });
    } else {
      toast.error('Ошибка сохранения');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await sendMessage(user.id, profile, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-screen lg:h-screen">
      <TopBar
        title="💬 Наставник Sync"
        onOpenSidebar={onOpenSidebar}
        right={
          messages.length > 0 ? (
            <button
              onClick={() => clearMessages(user.id)}
              className="p-2 rounded-lg text-text-secondary hover:bg-card-hover hover:text-accent-red transition-colors"
              title="Очистить чат"
            >
              <Trash2 size={18} />
            </button>
          ) : null
        }
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-accent-blue/15 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-accent-blue" />
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Спросите что угодно</h2>
              <p className="text-text-secondary text-sm max-w-md">
                Тренировки, питание, сон, мотивация — я подскажу с учётом вашего профиля
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-lg">
                {[
                  'Какие тренировки подходят новичку?',
                  'Сколько воды мне пить?',
                  'Помоги составить план питания',
                  'Как улучшить качество сна?',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="card px-4 py-3 text-left text-sm text-text-secondary hover:text-text hover:border-accent-blue/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent-blue text-white rounded-br-sm'
                    : 'bg-card border border-border text-text rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-card border border-border px-5 py-4 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce-dot"
                      style={{ animationDelay: `${i * 0.16}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-bg p-4 lg:p-6">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="input-field flex-1 px-4 py-3 text-sm resize-none max-h-32"
            style={{ minHeight: '48px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary px-5 py-3 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Отправить</span>
          </button>
          <button
            type="button"
            onClick={() => handleGenerateMealPlan('day')}
            disabled={loadingContext || !userContext}
            className="px-4 py-3 bg-accent-green text-bg rounded-xl hover:opacity-90 transition flex items-center gap-2 disabled:opacity-40"
            title="Сгенерировать рацион на день"
          >
            <Utensils size={18} />
          </button>
        </form>
      </div>

      {/* Карточка рациона */}
      {currentMealPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-bg-secondary p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-text">
                🍽️ Рацион на {currentMealPlan.duration === 'day' ? 'день' : 'неделю'}
              </h2>
              <button 
                onClick={() => setCurrentMealPlan(null)} 
                className="text-text-secondary hover:text-text"
              >
                <X size={24} />
              </button>
            </div>

            {/* Общие показатели */}
            <div className="card-modern mb-4 p-4 bg-card rounded-xl">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-text-secondary">Калории</p>
                  <p className="text-lg font-bold text-accent-blue">{currentMealPlan.totalCalories}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Белки</p>
                  <p className="text-lg font-bold text-accent-green">{currentMealPlan.totalProtein.toFixed(0)}г</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Жиры</p>
                  <p className="text-lg font-bold text-accent-gold">{currentMealPlan.totalFat.toFixed(0)}г</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Углеводы</p>
                  <p className="text-lg font-bold text-accent-red">{currentMealPlan.totalCarbs.toFixed(0)}г</p>
                </div>
              </div>
            </div>

            {/* Приёмы пищи */}
            <div className="space-y-4 mb-4">
              {currentMealPlan.meals.map((meal, idx) => (
                <div key={idx} className="card-modern p-4">
                  <h3 className="font-semibold text-text mb-2 capitalize">
                    {meal.type === 'breakfast' ? '🌅 Завтрак' : 
                     meal.type === 'lunch' ? '☀️ Обед' : 
                     meal.type === 'dinner' ? '🌙 Ужин' : '🍿 Перекус'}
                  </h3>
                  <ul className="space-y-2 mb-3">
                    {meal.foods.map((food, fIdx) => (
                      <li key={fIdx} className="flex justify-between items-center text-sm">
                        <span className="text-text">{food.name} — {food.weight}г</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-secondary">
                            {food.calories} ккал | Б:{food.protein.toFixed(1)} Ж:{food.fat.toFixed(1)} У:{food.carbs.toFixed(1)}
                          </span>
                          <button
                            onClick={() => handleReplaceProduct(meal.type, food.name)}
                            className="p-1 text-text-secondary hover:text-accent-blue transition"
                            title="Заменить продукт"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs text-text-secondary pt-2 border-t border-border">
                    Итого: {meal.totalCalories} ккал | Б:{meal.totalProtein.toFixed(1)}г Ж:{meal.totalFat.toFixed(1)}г У:{meal.totalCarbs.toFixed(1)}г
                  </div>
                </div>
              ))}
            </div>

            {/* Список покупок */}
            <div className="card-modern p-4 mb-4">
              <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                <ShoppingBag size={18} /> Список покупок
              </h3>
              <ul className="text-sm text-text-secondary space-y-1">
                {currentMealPlan.shoppingList.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>

            {/* Источники */}
            <div className="card-modern p-4 mb-4 bg-accent-blue/5">
              <h3 className="font-semibold text-text mb-2">📚 Научные источники</h3>
              <ul className="text-xs text-text-secondary space-y-1">
                {currentMealPlan.sources.map((source, idx) => (
                  <li key={idx}>• {source}</li>
                ))}
              </ul>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveMealPlan}
                disabled={currentMealPlan.isSaved}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
                  currentMealPlan.isSaved 
                    ? 'bg-accent-green/50 text-bg cursor-default' 
                    : 'bg-accent-green text-bg hover:opacity-90'
                }`}
              >
                {currentMealPlan.isSaved ? '✓ Сохранено' : '💾 Сохранить в дневник'}
              </button>
              <button
                onClick={() => handleGenerateMealPlan('week')}
                className="flex-1 py-3 bg-accent-blue text-bg rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
              >
                📅 На неделю
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно поиска продукта для замены */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-bg-secondary p-6 rounded-2xl max-w-md w-full border border-border shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-text">
                Заменить {replacingProduct?.productName}
              </h2>
              <button onClick={() => setShowProductSearch(false)} className="text-text-secondary hover:text-text">
                <X size={24} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Поиск продукта..."
              value={productSearchQuery}
              onChange={(e) => handleProductSearch(e.target.value)}
              className="input-field w-full mb-4"
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {productSearchResults.length > 0 ? (
                productSearchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border-b border-border"
                  >
                    <div>
                      <p className="font-medium text-text">{product.name}</p>
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
                      onClick={() => handleSelectReplacement(product)}
                    >
                      Выбрать
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-text-secondary text-center py-4 text-sm">
                  Введите название продукта для поиска
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
