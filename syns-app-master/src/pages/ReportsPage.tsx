import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, TrendingUp, Dumbbell, Plus, X, Save, Loader2, AlertCircle } from 'lucide-react';
import Modal from '@/components/Modal';

type Period = 'week' | 'month' | '3months';
type Tab = 'weight' | 'strength' | 'history';

interface WeeklyReport {
  id: string;
  week_start: string;
  weight: number;
  feeling: string;
  notes: string;
  created_at: string;
}

interface BodyMeasurement {
  id: string;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  created_at: string;
}

export default function ReportsPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<Tab>('weight');
  const [loading, setLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [weightData, setWeightData] = useState<{ date: string; weight: number }[]>([]);
  const [strengthData, setStrengthData] = useState<{ date: string; squat: number; bench: number; deadlift: number }[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newHips, setNewHips] = useState('');
  const [reportWeight, setReportWeight] = useState('');
  const [reportFeeling, setReportFeeling] = useState('good');
  const [reportNotes, setReportNotes] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    day: 0,
    time: '20:00',
    enabled: true,
  });
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
    loadNotificationSettings();
  }, [user, period]);

  const loadNotificationSettings = async () => {
    const { data } = await supabase
      .from('notification_settings')
      .select('weekly_report_day, weekly_report_time, weekly_report_enabled')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    if (data) {
      setNotificationSettings({
        day: data.weekly_report_day ?? 0,
        time: data.weekly_report_time?.substring(0, 5) ?? '20:00',
        enabled: data.weekly_report_enabled ?? true,
      });
    }
  };

  const saveNotificationSettings = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        weekly_report_day: notificationSettings.day,
        weekly_report_time: `${notificationSettings.time}:00`,
        weekly_report_enabled: notificationSettings.enabled,
      });
    
    if (error) {
      alert('Ошибка сохранения настроек: ' + error.message);
    } else {
      alert('Настройки уведомлений сохранены');
      setShowNotificationSettings(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      if (period === 'week') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      else if (period === '3months') startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = now.toISOString().split('T')[0];

      // Загружаем замеры веса из body_measurements
      const { data: measurements } = await supabase
        .from('body_measurements')
        .select('weight, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .order('created_at', { ascending: true });

      const weightChartData = measurements?.map(m => ({
        date: new Date(m.created_at).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' }),
        weight: m.weight,
      })) || [];
      setWeightData(weightChartData);

      // Текущий вес (последний замер)
      const { data: lastMeasurement } = await supabase
        .from('body_measurements')
        .select('weight')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setCurrentWeight(lastMeasurement?.weight ?? null);

      // Загружаем силовые показатели из workout_logs
      const { data: workouts } = await supabase
        .from('workout_logs')
        .select('exercise_name, weight, log_date')
        .eq('user_id', user.id)
        .in('exercise_name', ['Приседания со штангой', 'Жим лёжа', 'Становая тяга'])
        .gte('log_date', startStr)
        .lte('log_date', endStr)
        .order('log_date', { ascending: true });

      // Агрегируем по датам
      const strengthMap: Record<string, { squat?: number; bench?: number; deadlift?: number }> = {};
      workouts?.forEach(w => {
        const d = new Date(w.log_date).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
        if (!strengthMap[d]) strengthMap[d] = {};
        
        if (w.exercise_name.includes('Присед')) strengthMap[d].squat = Math.max(strengthMap[d].squat || 0, w.weight || 0);
        if (w.exercise_name.includes('Жим')) strengthMap[d].bench = Math.max(strengthMap[d].bench || 0, w.weight || 0);
        if (w.exercise_name.includes('Становая')) strengthMap[d].deadlift = Math.max(strengthMap[d].deadlift || 0, w.weight || 0);
      });

      const strengthChartData = Object.entries(strengthMap).map(([date, data]) => ({
        date,
        squat: data.squat || 0,
        bench: data.bench || 0,
        deadlift: data.deadlift || 0,
      }));
      setStrengthData(strengthChartData);

      // Загружаем еженедельные отчёты
      const { data: reports } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(10);
      
      setWeeklyReports(reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async () => {
    if (!user || !newWeight) return;
    
    const { error } = await supabase
      .from('body_measurements')
      .insert({
        user_id: user.id,
        weight: parseFloat(newWeight),
        chest: newChest ? parseFloat(newChest) : null,
        waist: newWaist ? parseFloat(newWaist) : null,
        hips: newHips ? parseFloat(newHips) : null,
      });
    
    if (error) {
      alert('Ошибка сохранения замера: ' + error.message);
    } else {
      alert('Замер сохранён');
      setShowWeightModal(false);
      setNewWeight('');
      setNewChest('');
      setNewWaist('');
      setNewHips('');
      loadData();
    }
  };

  const handleSaveWeeklyReport = async () => {
    if (!user || !reportWeight) return;
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    const weekStart = new Date(today.setDate(diff)).toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('weekly_reports')
      .insert({
        user_id: user.id,
        week_start: weekStart,
        weight: parseFloat(reportWeight),
        feeling: reportFeeling,
        notes: reportNotes,
      });
    
    if (error) {
      alert('Ошибка сохранения отчёта: ' + error.message);
    } else {
      alert('Еженедельный отчёт сохранён');
      setShowReportModal(false);
      setReportWeight('');
      setReportFeeling('good');
      setReportNotes('');
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  return (
    <div className="p-4 max-w-6xl mx-auto animate-fade-in">
      {/* Заголовок и вкладки */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text">Отчёты</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('weight')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'weight' ? 'bg-accent-blue text-bg shadow' : 'bg-bg-secondary text-text-secondary hover:text-text'
            }`}
          >
            Вес
          </button>
          <button
            onClick={() => setActiveTab('strength')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'strength' ? 'bg-accent-blue text-bg shadow' : 'bg-bg-secondary text-text-secondary hover:text-text'
            }`}
          >
            Сила
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'history' ? 'bg-accent-blue text-bg shadow' : 'bg-bg-secondary text-text-secondary hover:text-text'
            }`}
          >
            История
          </button>
        </div>
      </div>

      {/* Вкладка: Вес */}
      {activeTab === 'weight' && (
        <>
          {/* Карточка текущего веса */}
          <div className="card-modern mb-6 bg-gradient-to-r from-accent-blue/10 to-transparent border-accent-blue/20 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Текущий вес</p>
                <p className="text-3xl font-bold text-text">{currentWeight ?? '—'} кг</p>
              </div>
              <button
                onClick={() => setShowWeightModal(true)}
                className="btn-primary px-4 py-2 flex items-center gap-2"
              >
                <Plus size={18} /> Добавить замер
              </button>
            </div>
          </div>

          {/* График веса */}
          <div className="card-modern mb-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-accent-blue" />
              Динамика веса
            </h2>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weightData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="date" stroke="#8B949E" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8B949E" domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#E6EDF3' }} />
                  <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-secondary text-center py-8">Нет данных о замерах веса</p>
            )}
          </div>

          {/* Настройки еженедельных уведомлений */}
          <div className="card-modern mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                <Calendar size={20} className="text-accent-purple" />
                Еженедельный отчёт
              </h2>
              <button
                onClick={() => setShowNotificationSettings(true)}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                Настроить
              </button>
            </div>
            <p className="text-sm text-text-secondary">
              {notificationSettings.enabled 
                ? `Уведомления включены: ${dayNames[notificationSettings.day]}, ${notificationSettings.time}`
                : 'Уведомления отключены'}
            </p>
          </div>

          {/* Кнопка заполнения недельного отчёта */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full card-modern bg-gradient-to-r from-accent-purple/10 to-transparent border-accent-purple/20 p-4 flex items-center justify-center gap-2 hover:from-accent-purple/20 transition-all"
          >
            <Save size={20} className="text-accent-purple" />
            <span className="font-medium text-text">Заполнить отчёт за неделю</span>
          </button>
        </>
      )}

      {/* Вкладка: Сила */}
      {activeTab === 'strength' && (
        <div className="space-y-6">
          {/* Карточки силовых показателей */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-modern p-5 text-center bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl">
              <p className="text-sm text-text-secondary mb-2">Приседания</p>
              <p className="text-2xl font-bold text-text">
                {strengthData.length > 0 ? Math.max(...strengthData.map(d => d.squat)) : 0} кг
              </p>
            </div>
            <div className="card-modern p-5 text-center bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl">
              <p className="text-sm text-text-secondary mb-2">Жим лёжа</p>
              <p className="text-2xl font-bold text-text">
                {strengthData.length > 0 ? Math.max(...strengthData.map(d => d.bench)) : 0} кг
              </p>
            </div>
            <div className="card-modern p-5 text-center bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl">
              <p className="text-sm text-text-secondary mb-2">Становая тяга</p>
              <p className="text-2xl font-bold text-text">
                {strengthData.length > 0 ? Math.max(...strengthData.map(d => d.deadlift)) : 0} кг
              </p>
            </div>
          </div>

          {/* График силы */}
          <div className="card-modern">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <Dumbbell size={20} className="text-accent-green" />
              Прогресс в упражнениях
            </h2>
            {strengthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strengthData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="date" stroke="#8B949E" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8B949E" />
                  <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#E6EDF3' }} />
                  <Legend />
                  <Bar dataKey="squat" fill="#ef4444" radius={[4, 4, 0, 0]} name="Присед" />
                  <Bar dataKey="bench" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Жим" />
                  <Bar dataKey="deadlift" fill="#22c55e" radius={[4, 4, 0, 0]} name="Тяга" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-secondary text-center py-8">Нет данных о тренировках</p>
            )}
          </div>
        </div>
      )}

      {/* Вкладка: История */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text mb-4">История еженедельных отчётов</h2>
          {weeklyReports.length > 0 ? (
            weeklyReports.map((report) => (
              <div key={report.id} className="card-modern p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-text-secondary">
                    Неделя от {new Date(report.week_start).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-text font-medium mt-1">
                    Вес: {report.weight} кг | Самочувствие: {report.feeling === 'excellent' ? 'Отлично' : report.feeling === 'good' ? 'Хорошо' : report.feeling === 'normal' ? 'Нормально' : 'Плохо'}
                  </p>
                  {report.notes && <p className="text-xs text-text-secondary mt-1">{report.notes}</p>}
                </div>
                <span className="text-xs text-text-secondary">
                  {new Date(report.created_at).toLocaleDateString('ru')}
                </span>
              </div>
            ))
          ) : (
            <p className="text-text-secondary text-center py-8">Нет сохранённых отчётов</p>
          )}
        </div>
      )}

      {/* Модалка добавления замера веса */}
      <Modal isOpen={showWeightModal} onClose={() => setShowWeightModal(false)} title="Добавить замер">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Вес (кг)</label>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="70.5"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Грудь (см)</label>
              <input
                type="number"
                step="0.5"
                value={newChest}
                onChange={(e) => setNewChest(e.target.value)}
                className="input-field w-full px-3 py-2 rounded-lg text-sm"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Талия (см)</label>
              <input
                type="number"
                step="0.5"
                value={newWaist}
                onChange={(e) => setNewWaist(e.target.value)}
                className="input-field w-full px-3 py-2 rounded-lg text-sm"
                placeholder="80"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Бёдра (см)</label>
              <input
                type="number"
                step="0.5"
                value={newHips}
                onChange={(e) => setNewHips(e.target.value)}
                className="input-field w-full px-3 py-2 rounded-lg text-sm"
                placeholder="95"
              />
            </div>
          </div>
          <button onClick={handleAddWeight} className="btn-primary w-full">
            Сохранить
          </button>
        </div>
      </Modal>

      {/* Модалка еженедельного отчёта */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Еженедельный отчёт">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Текущий вес (кг)</label>
            <input
              type="number"
              step="0.1"
              value={reportWeight}
              onChange={(e) => setReportWeight(e.target.value)}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              placeholder="70.5"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Самочувствие</label>
            <select
              value={reportFeeling}
              onChange={(e) => setReportFeeling(e.target.value)}
              className="input-field w-full px-4 py-2.5 rounded-lg"
            >
              <option value="excellent">Отлично</option>
              <option value="good">Хорошо</option>
              <option value="normal">Нормально</option>
              <option value="bad">Плохо</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Заметки (опционально)</label>
            <textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              className="input-field w-full px-4 py-2.5 rounded-lg"
              rows={3}
              placeholder="Как прошла неделя?"
            />
          </div>
          <button onClick={handleSaveWeeklyReport} className="btn-primary w-full">
            Сохранить отчёт
          </button>
        </div>
      </Modal>

      {/* Модалка настроек уведомлений */}
      <Modal isOpen={showNotificationSettings} onClose={() => setShowNotificationSettings(false)} title="Настройки уведомлений">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">День недели</label>
            <select
              value={notificationSettings.day}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, day: parseInt(e.target.value) })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
            >
              {dayNames.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Время</label>
            <input
              type="time"
              value={notificationSettings.time}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, time: e.target.value })}
              className="input-field w-full px-4 py-2.5 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notif-enabled"
              checked={notificationSettings.enabled}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, enabled: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <label htmlFor="notif-enabled" className="text-sm text-text">Включить уведомления</label>
          </div>
          <button onClick={saveNotificationSettings} className="btn-primary w-full">
            Сохранить настройки
          </button>
        </div>
      </Modal>
    </div>
  );
}
