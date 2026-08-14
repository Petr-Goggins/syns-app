import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCoachStore } from '@/store/coachStore';
import { User, Dumbbell, Target, Save, Loader2, Check, Edit3, Bell, Moon, Sun, LogOut, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadNotificationSettings, saveNotificationSettings, requestNotificationPermission } from '@/lib/notifications';
import MuscleHeatmap from '@/components/MuscleHeatmap';

const RELIGION_OPTIONS = [
  { id: 'none', label: 'Нет', icon: '⛔' },
  { id: 'orthodox', label: 'Православие', icon: '✝️' },
  { id: 'islam', label: 'Ислам', icon: '🕌' },
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

const THEME_OPTIONS = [
  { id: 'dark-blue', label: 'Тёмно-синяя', icon: '🌙', class: 'theme-dark-blue' },
  { id: 'light', label: 'Светлая', icon: '☀️', class: 'theme-light' },
  { id: 'gray', label: 'Серая', icon: '🌫️', class: 'theme-gray' },
  { id: 'black', label: 'Чёрная', icon: '⚫', class: 'theme-black' },
];

export default function ProfilePage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('dark-blue');

  useEffect(() => {
    if (!user) return;
    loadProfile();
    fetchCoachData(user.id);
    const notifSettings = loadNotificationSettings();
    setNotificationsEnabled(notifSettings.enabled);
    const savedTheme = localStorage.getItem('sync_theme') || 'dark-blue';
    setCurrentTheme(savedTheme);
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

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('sync_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const handleNotificationsToggle = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    if (newValue) {
      const granted = await requestNotificationPermission();
      if (granted) {
        saveNotificationSettings({ ...loadNotificationSettings(), enabled: true });
      } else {
        setNotificationsEnabled(false);
      }
    } else {
      saveNotificationSettings({ ...loadNotificationSettings(), enabled: false });
    }
  };

  const handleSignOut = async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      await signOut();
      navigate('/auth');
    }
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

      {/* Тепловая карта мышц */}
      <div className="card-modern mb-6">
        <h3 className="font-bold text-text mb-4 flex items-center gap-2">
          <Dumbbell size={18} className="text-accent-blue" />
          Нагрузка за неделю
        </h3>
        <MuscleHeatmap
          intensities={{
            chest: { muscle: 'chest', intensity: 70, lastTrained: '2 дня назад' },
            biceps: { muscle: 'biceps', intensity: 45, lastTrained: '3 дня назад' },
            triceps: { muscle: 'triceps', intensity: 30, lastTrained: '4 дня назад' },
            abs: { muscle: 'abs', intensity: 20 },
            quads: { muscle: 'quads', intensity: 85, lastTrained: '1 день назад' },
            shoulders: { muscle: 'shoulders', intensity: 50, lastTrained: '2 дня назад' },
          }}
          size="md"
          showLabels={true}
        />
      </div>

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
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                  onClick={() => setFormData({ ...formData, gender: g })}
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
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="70"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Рост (см)</label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="175"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Возраст</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
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
          onChange={(val: string) => setFormData({ ...formData, religion: val })}
        />

        <SelectCard
          label="Диета"
          options={DIET_OPTIONS}
          value={formData.diet}
          onChange={(val: string) => setFormData({ ...formData, diet: val })}
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

        {/* Настройки */}
        <div className="card-modern space-y-4 mt-6">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Palette size={16} /> Настройки
          </h2>
          
          {/* Тема оформления */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Тема оформления</label>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    currentTheme === theme.id
                      ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-tertiary'
                  }`}
                >
                  <span className="text-xl">{theme.icon}</span>
                  <span className="text-sm font-medium">{theme.label}</span>
                  {currentTheme === theme.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* Уведомления */}
          <div className="flex items-center justify-between p-3 bg-bg-tertiary/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell size={20} className={notificationsEnabled ? 'text-accent-blue' : 'text-text-secondary'} />
              <div>
                <p className="text-sm font-medium text-text">Уведомления</p>
                <p className="text-xs text-text-secondary">Напоминания и мотивация</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNotificationsToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-accent-blue' : 'bg-bg-tertiary'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Кнопка выхода */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 flex items-center justify-center gap-2 text-base font-semibold text-red-500 hover:bg-red-500/10 rounded-xl border border-red-500/30 transition-all"
          >
            <LogOut size={20} />
            Выйти из аккаунта
          </button>
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
