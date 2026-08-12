import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Check, User, Ruler, Weight, Cake, Activity, Target, Church, Utensils } from 'lucide-react';

const RELIGION_OPTIONS = [
  { id: 'none', label: 'Нет', icon: '⛔' },
  { id: 'orthodox', label: 'Православие', icon: '✝️' },
  { id: 'islam', label: 'Ислам', icon: '☪️' },
  { id: 'judaism', label: 'Иудаизм', icon: '✡️' },
  { id: 'buddhism', label: 'Буддизм', icon: '☸️' },
];

const DIET_OPTIONS = [
  { id: 'none', label: 'Без ограничений', icon: '🍽️' },
  { id: 'vegetarian', label: 'Вегетарианство', icon: '🥦' },
  { id: 'vegan', label: 'Веганство', icon: '🌱' },
  { id: 'halal', label: 'Халяль', icon: '🕌' },
  { id: 'kosher', label: 'Кошер', icon: '✡️' },
];
import { User, Weight, Ruler, Calendar, Activity, Target, Dumbbell, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);
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
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      setProfile(data);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setForm({
          full_name: data.full_name || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          activity_level: data.activity_level || 'moderate',
          goal: data.goal || 'maintain',
          religion: data.religion || 'none',
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
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        weight: Number(form.weight),
        height: Number(form.height),
        age: Number(form.age),
        weight: Number(form.weight) || 0,
        height: Number(form.height) || 0,
        age: Number(form.age) || 0,
        gender: form.gender,
        activity_level: form.activity_level,
        goal: form.goal,
        religion: form.religion,
        diet: form.diet,
        equipment: form.equipment,
      })
      .eq('id', user.id);
    if (!error) {
      alert('Профиль обновлён');
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

  const SelectCard = ({ options, value, onChange, label }: any) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: any) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              value === opt.id
                ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-tertiary'
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
            {value === opt.id && <Check size={16} />}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Профиль</h1>
      <form onSubmit={handleSave} className="space-y-5 bg-bg-secondary p-6 rounded-2xl border border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Имя</label>
      toast.success('Профиль обновлён!');
    } else {
      toast.error('Ошибка сохранения: ' + error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-accent-blue" size={32} /></div>;

  return (
    <div className="p-4 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-text flex items-center gap-2 mb-6">
        <User className="text-accent-blue" size={28} />
        Профиль
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Основная информация */}
        <div className="card-modern space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <User size={16} /> Основное
          </h2>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Полное имя</label>
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
              className="input-field w-full px-4 py-2.5"
              placeholder="Введите имя"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Вес (кг)</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="input-field w-full px-4 py-2.5"
                placeholder="70"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Рост (см)</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="input-field w-full px-4 py-2.5"
                placeholder="175"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Возраст</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="input-field w-full px-4 py-2.5"
                placeholder="25"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Пол</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="input-field w-full px-4 py-2.5"
            >
              <option value="">Выберите пол</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>
        </div>

        {/* Параметры тренировок */}
        <div className="card-modern space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Dumbbell size={16} /> Тренировки
          </h2>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Уровень активности</label>
            <select
              value={form.activity_level}
              onChange={(e) => setForm({ ...form, activity_level: e.target.value })}
              className="input-field w-full px-4 py-2.5"
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
              className="input-field w-full px-4 py-2.5"
            >
              <option value="lose">Похудеть</option>
              <option value="maintain">Поддерживать</option>
              <option value="gain">Набрать массу</option>
            </select>
          </div>
        </div>

        <SelectCard
          label="Религия"
          options={RELIGION_OPTIONS}
          value={form.religion}
          onChange={(val: string) => setForm({ ...form, religion: val })}
        />

        <SelectCard
          label="Диета"
          options={DIET_OPTIONS}
          value={form.diet}
          onChange={(val: string) => setForm({ ...form, diet: val })}
        />

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
          <div>
            <label className="block text-sm text-text-secondary mb-1">Инвентарь (через запятую)</label>
            <input
              type="text"
              placeholder="гантели, коврик, турник"
              value={form.equipment.join(', ')}
              onChange={(e) => setForm({ ...form, equipment: e.target.value.split(',').map(s => s.trim()) })}
              className="input-field w-full px-4 py-2.5"
            />
          </div>
        </div>

        {/* Религия */}
        <div className="card-modern space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Target size={16} /> Религиозные предпочтения
          </h2>
          <select
            value={form.religion}
            onChange={(e) => setForm({ ...form, religion: e.target.value })}
            className="input-field w-full px-4 py-2.5"
          >
            <option value="none">Нет</option>
            <option value="halal">Халяль</option>
            <option value="kosher">Кошер</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Сохранение...' : 'Сохранить профиль'}
        </button>
      </form>
    </div>
  );
}
