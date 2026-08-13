import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, ChevronRight, CalendarDays, Info, Activity } from 'lucide-react';
import { calculateCyclePhase, getPhaseRecommendation } from '@/lib/cycle';

export default function CyclePage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [lastPeriodDate, setLastPeriodDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<any>(null);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    const loadCycle = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('cycle_length, cycle_last_period')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setCycleLength(data.cycle_length || 28);
        setLastPeriodDate(data.cycle_last_period || '');
        if (data.cycle_last_period) {
          const phaseInfo = calculateCyclePhase(data.cycle_last_period, data.cycle_length || 28);
          setCurrentPhase(phaseInfo);
        }
      }
      setLoading(false);
    };
    loadCycle();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ cycle_length: cycleLength, cycle_last_period: lastPeriodDate })
      .eq('id', user.id);
    if (!error) {
      alert('Данные сохранены!');
      if (lastPeriodDate) {
        const phaseInfo = calculateCyclePhase(lastPeriodDate, cycleLength);
        setCurrentPhase(phaseInfo);
      }
    } else {
      alert('Ошибка: ' + error.message);
    }
    setSaving(false);
  };

  const getPhaseForDay = (day: Date): string => {
    if (!lastPeriodDate) return '';
    const start = new Date(lastPeriodDate);
    const diff = Math.floor((day.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '';
    const dayInCycle = diff % cycleLength;
    if (dayInCycle < 5) return 'Менструация';
    if (dayInCycle < 14) return 'Фолликулярная';
    if (dayInCycle < 17) return 'Овуляторная';
    return 'Лютеиновая';
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Менструация': return 'bg-accent-red text-white';
      case 'Фолликулярная': return 'bg-accent-orange text-white';
      case 'Овуляторная': return 'bg-accent-green text-white';
      case 'Лютеиновая': return 'bg-accent-purple text-white';
      default: return 'bg-bg-tertiary text-text-secondary';
    }
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const phase = getPhaseForDay(date);
      const colorClass = getPhaseColor(phase);
      days.push(
        <div key={d} className={`p-2 text-center rounded-lg text-sm font-medium transition-all ${colorClass}`}>
          {d}
        </div>
      );
    }
    return days;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div></div>;

  const phaseRec = currentPhase ? getPhaseRecommendation(currentPhase.phase) : null;

  return (
    <div className="p-4 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-text flex items-center gap-2 mb-6">
        <Activity size={28} className="text-accent-purple" />
        Биоритмы
      </h1>

      {phaseRec && (
        <div className="card-modern mb-4 border-accent-purple/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary">Текущая фаза</span>
            <span className="font-semibold text-text">{phaseRec.label}</span>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-text-secondary flex items-center gap-1">
              <Info size={16} /> Интенсивность: {phaseRec.intensity}
            </p>
            <p className="text-text-secondary flex items-center gap-1">
              <Info size={16} /> Питание: {phaseRec.nutrition}
            </p>
            <ul className="text-text-tertiary text-xs space-y-1 mt-2">
              {phaseRec.tips.slice(0, 3).map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card-modern">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-bg-tertiary transition">
            <ChevronLeft size={20} />
          </button>
          <span className="text-text font-semibold">
            {viewDate.toLocaleString('ru', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-bg-tertiary transition">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-text-secondary text-sm mb-2">
          <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>
        <div className="flex flex-wrap gap-2 mt-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-red rounded"></span> Менструация</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-orange rounded"></span> Фолликулярная</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-green rounded"></span> Овуляторная</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-purple rounded"></span> Лютеиновая</span>
        </div>
      </div>

      <div className="card-modern mt-6 space-y-4">
        <h2 className="text-lg font-semibold text-text">Настройки</h2>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Дата начала последних месячных</label>
          <input type="date" value={lastPeriodDate} onChange={(e) => setLastPeriodDate(e.target.value)} className="input-field w-full px-3 py-2 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Длительность цикла (дней)</label>
          <input type="number" min="20" max="45" value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))} className="input-field w-full px-3 py-2 rounded-lg" />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2 rounded-lg">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}