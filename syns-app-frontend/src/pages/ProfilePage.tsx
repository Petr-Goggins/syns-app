import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export default function ProfilePage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: '',
    weight: '',
    height: '',
    age: '',
    gender: '',
    activity_level: 'moderate',
    goal: 'maintain',
    religion: 'none',
    diet: 'none',
    equipment: [] as string[],
  });

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setForm({
          full_name: data.full_name || '',
          weight: data.weight || '',
          height: data.height || '',
          age: data.age || '',
          gender: data.gender || '',
          activity_level: data.activity_level || 'moderate',
          goal: data.goal || 'maintain',
          religion: data.religion || 'none',
          diet: data.diet || 'none',
          equipment: data.equipment || [],
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        weight: Number(form.weight),
        height: Number(form.height),
        age: Number(form.age),
        gender: form.gender,
        activity_level: form.activity_level,
        goal: form.goal,
        religion: form.religion,
        diet: form.diet,
        equipment: form.equipment,
      })
      .eq('id', user.id);
    if (!error) {
      alert('Профиль обновлён!');
    } else {
      alert('Ошибка: ' + error.message);
    }
  };

  const toggleEquipment = (item: string) => {
    setForm(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter(e => e !== item)
        : [...prev.equipment, item]
    }));
  };

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Профиль</h1>
      <form onSubmit={handleSave} className="bg-bg-secondary p-6 rounded-xl border border-border space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Имя</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Пол</label>
            <div className="flex gap-2">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gender: g })}
                  className={`flex-1 py-2 rounded-lg border transition-all ${
                    form.gender === g ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue' : 'bg-bg-tertiary border-border text-text-secondary'
                  }`}
                >
                  {g === 'male' ? 'Мужской' : 'Женский'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Вес (кг)</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="70"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Рост (см)</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="175"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Возраст</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="25"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Активность</label>
            <select
              value={form.activity_level}
              onChange={(e) => setForm({ ...form, activity_level: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
            >
              <option value="sedentary">Сидячий</option>
              <option value="moderate">Средний</option>
              <option value="active">Активный</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Цель</label>
            <select
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
            >
              <option value="lose">Похудеть</option>
              <option value="maintain">Поддерживать</option>
              <option value="gain">Набрать массу</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Религия</label>
          <div className="flex flex-wrap gap-2">
            {['none', 'orthodox', 'islam', 'judaism', 'buddhism'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, religion: r })}
                className={`px-4 py-2 rounded-xl border transition-all ${
                  form.religion === r ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue' : 'bg-bg-tertiary border-border text-text-secondary'
                }`}
              >
                {r === 'none' ? 'Нет' : r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Диета</label>
          <div className="flex flex-wrap gap-2">
            {['none', 'vegetarian', 'vegan', 'halal', 'kosher'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, diet: d })}
                className={`px-4 py-2 rounded-xl border transition-all ${
                  form.diet === d ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue' : 'bg-bg-tertiary border-border text-text-secondary'
                }`}
              >
                {d === 'none' ? 'Нет' : d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Инвентарь</label>
          <div className="flex flex-wrap gap-2">
            {['гантели', 'коврик', 'турник', 'резинка', 'зал', 'без оборудования'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleEquipment(item)}
                className={`px-4 py-2 rounded-xl border transition-all ${
                  form.equipment.includes(item)
                    ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                    : 'bg-bg-tertiary border-border text-text-secondary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3 rounded-xl font-semibold">
          Сохранить
        </button>
      </form>
    </div>
  );
}