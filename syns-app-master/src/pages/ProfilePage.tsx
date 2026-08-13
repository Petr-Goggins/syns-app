import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCoachStore } from '@/store/coachStore';
import { User, Dumbbell, Target, Save, Loader2, Check, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function ProfilePage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { coachData, fetchCoachData } = useCoachStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormDataData] = useState({
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
    fetchCoachData(user.id);
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single();
    if (!error && data) {
      setFormDataData({
        full_name: data.full_name || '',
        weight: data.weight?.toString() || '',
        height: data.height?.toString() || '',
        age: data.age?.toString() || '',
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
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        weight: Number(formData.weight) || 0,
        height: Number(formData.height) || 0,
        age: Number(formData.age) || 0,
        gender: formData.gender,
        activity_level: formData.activity_level,
        goal: formData.goal,
        religion: formData.religion,
        diet: formData.diet,
        equipment: formData.equipment,
      })
      .eq('id', user.id);
    if (!error) {
      alert('Профиль обновлён');
    } else {
      alert('Ошибка: ' + error.message);
    }
    setSaving(false);
  };

  const toggleEquipment = (item: string) => {
    setFormData(prev => ({
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

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-accent-blue" size={32} /></div>;

  return (
    <div className="p-4 max-w-2xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <User className="text-accent-blue" size={28} />
          Профиль
        </h1>
        <button
          onClick={() => navigate('/coach')}
          className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
        >
          <Edit3 size={16} /> Редактировать анкету
        </button>
      </div>

      {/* Блок с данными из анкеты тренера */}
      {coachData && (
        <div className="card-modern mb-6 bg-gradient-to-r from-accent-blue/5 to-transparent border-accent-blue/20">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Target size={18} className="text-accent-blue" />
            Данные из анкеты
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Главная цель</p>
              <p className="text-text font-medium">{coachData.main_goal || 'Не указана'}</p>
            </div>
            <div>
              <p className="text-text-secondary">Уровень</p>
              <p className="text-text font-medium">{coachData.training_level || 'Не указан'}</p>
            </div>
            <div>
              <p className="text-text-secondary">Дней в неделю</p>
              <p className="text-text font-medium">{coachData.days_per_week || '-'}</p>
            </div>
            <div>
              <p className="text-text-secondary">Глобальная цель</p>
              <p className="text-text font-medium">{coachData.goal_type ? `${coachData.goal_type} (${coachData.goal_amount} ${coachData.goal_unit})` : 'Не выбрана'}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card-modern space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <User size={16} /> Основное
          </h2>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Полное имя</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...form, full_name: e.target.value })}
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
                  onClick={() => setFormData({ ...form, gender: g })}
                  className={`flex-1 py-2 rounded-lg border transition-all ${
                    formData.gender === g ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue' : 'bg-bg-tertiary border-border text-text-secondary'
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
              value={formData.weight}
              onChange={(e) => setFormData({ ...form, weight: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="70"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Рост (см)</label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...form, height: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="175"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Возраст</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...form, age: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="25"
            />
          </div>
        </div>

        <div className="card-modern space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Dumbbell size={16} /> Тренировки
          </h2>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Уровень активности</label>
            <select
              value={formData.activity_level}
              onChange={(e) => setFormData({ ...form, activity_level: e.target.value })}
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
              value={formData.goal}
              onChange={(e) => setFormData({ ...form, goal: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
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
          value={formData.religion}
          onChange={(val: string) => setFormData({ ...form, religion: val })}
        />

        <SelectCard
          label="Диета"
          options={DIET_OPTIONS}
          value={formData.diet}
          onChange={(val: string) => setFormData({ ...form, diet: val })}
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
                  formData.equipment.includes(item)
                    ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                    : 'bg-bg-tertiary border-border text-text-secondary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
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
