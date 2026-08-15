import React, { useEffect, useState } from 'react';
import { useLongPathStore, UserGoalType } from '../store/longPathStore';
import { useWorkoutLogStore } from '../store/workoutLogStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Trophy, Target, TrendingUp, Calendar, Award, ArrowRight } from 'lucide-react';

const LongPathPage: React.FC = () => {
  const { 
    userGoal, 
    levels, 
    currentLevelIndex, 
    progressToNextLevel, 
    forecast, 
    createUserGoal,
    streak 
  } = useLongPathStore();
  
  const { workouts } = useWorkoutLogStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months'>('month');

  // Если цель еще не выбрана, показываем экран выбора
  if (!userGoal) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center">Выберите свою большую цель</h2>
        <div className="grid gap-4">
          {[
            { id: 'squat_150', title: 'Присед 150 кг', icon: '🏋️', type: 'strength' as UserGoalType },
            { id: 'bench_100', title: 'Жим 100 кг', icon: '💪', type: 'strength' as UserGoalType },
            { id: 'deadlift_200', title: 'Становая 200 кг', icon: '🔥', type: 'strength' as UserGoalType },
            { id: 'run_10km', title: '10 км бег', icon: '🏃', type: 'cardio' as UserGoalType },
            { id: 'lose_10kg', title: 'Похудеть на 10 кг', icon: '⚖️', type: 'weight_loss' as UserGoalType },
            { id: 'gain_5kg', title: 'Набрать 5 кг массы', icon: '📈', type: 'muscle_gain' as UserGoalType },
          ].map((goal) => (
            <button
              key={goal.id}
              onClick={() => createUserGoal(goal.type, goal.title)}
              className="p-6 rounded-2xl border border-border bg-bg-secondary hover:shadow-lg transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{goal.icon}</span>
                <div className="text-left">
                  <h3 className="font-bold text-lg group-hover:text-accent-blue transition-colors">{goal.title}</h3>
                  <p className="text-sm text-text-secondary">Нажмите для старта</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-text-secondary group-hover:text-accent-blue" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Подготовка данных для графика прогноза
  const chartData = forecast[selectedPeriod].map(point => ({
    name: point.date,
    value: point.value,
    isPrediction: point.isPrediction,
    currentValue: point.isPrediction ? null : point.value
  }));

  const currentLevel = levels[currentLevelIndex];
  const nextLevel = levels[currentLevelIndex + 1];

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24 animate-fade-in space-y-8">
      {/* Заголовок и Стрик */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            {userGoal.title}
          </h2>
          <p className="text-gray-500 mt-1">Ваш путь к вершине</p>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full font-bold flex items-center gap-2">
          🔥 {streak} дней подряд
        </div>
      </div>

      {/* Прогресс уровня */}
      <div className="bg-bg-secondary p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-sm text-text-secondary uppercase tracking-wide">Текущий уровень</span>
            <h3 className="text-2xl font-bold">{currentLevel.name}</h3>
          </div>
          <div className="text-right">
            <span className="text-sm text-text-secondary">До следующего: {nextLevel ? nextLevel.name : 'Финиш!'}</span>
            <div className="text-xl font-bold text-accent-blue">{Math.round(progressToNextLevel)}%</div>
          </div>
        </div>
        
        <div className="w-full bg-bg-tertiary rounded-full h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-accent-blue to-accent-purple h-4 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
        
        <div className="mt-4 flex justify-between text-xs text-text-secondary">
          <span>Начало уровня</span>
          <span>Цель: {currentLevel.targetValue} {userGoal.unit}</span>
        </div>
      </div>

      {/* Уровни (Steps) */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" /> Этапы пути
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {levels.map((level, idx) => {
            const isCompleted = idx < currentLevelIndex;
            const isCurrent = idx === currentLevelIndex;
            
            return (
              <div 
                key={level.id}
                className={`relative p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all
                  ${isCompleted 
                    ? 'bg-accent-green/10 border-accent-green/30' 
                    : isCurrent 
                      ? 'bg-accent-blue/10 border-accent-blue ring-2 ring-accent-blue/20' 
                      : 'bg-bg-secondary border-border opacity-60'
                  }`}
              >
                {isCompleted && <Award className="w-6 h-6 text-accent-green mb-2" />}
                {isCurrent && <Target className="w-6 h-6 text-accent-blue mb-2 animate-pulse" />}
                {!isCompleted && !isCurrent && <div className="w-6 h-6 mb-2 rounded-full border-2 border-border" />}
                
                <span className="font-bold text-sm">{level.name}</span>
                <span className="text-xs text-text-secondary mt-1">{level.targetValue} {userGoal.unit}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* График прогноза */}
      <div className="bg-bg-secondary p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-purple" /> Прогноз прогресса
          </h3>
          <div className="flex gap-2 bg-bg-tertiary p-1 rounded-lg">
            {(['week', 'month', '3months'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedPeriod === p 
                    ? 'bg-bg-secondary shadow text-accent-blue' 
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : '3 мес'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                tickFormatter={(val) => val.split('.').slice(0,2).join('.')}
                axisLine={false}
                tickLine={false}
                stroke="var(--text-secondary)"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 5', 'dataMax + 5']}
                stroke="var(--text-secondary)"
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
                formatter={(value: number) => [`${value} ${userGoal.unit}`, 'Прогноз']}
              />
              <ReferenceDot x={chartData.find(d => !d.isPrediction)?.name} y={chartData.find(d => !d.isPrediction)?.value} r={4} fill="#4F46E5" stroke="var(--bg)" strokeWidth={2} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                dot={false}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="currentValue" 
                stroke="#4F46E5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: 'var(--bg)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-text-secondary mt-4">
          * Прогноз основан на вашей текущей частоте тренировок и прогрессе
        </p>
      </div>

      {/* Календарь активности (мини) */}
      <div className="bg-bg-secondary p-6 rounded-2xl shadow-sm border border-border">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent-green" /> Активность (последние 28 дней)
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (27 - i));
            const dateStr = date.toISOString().split('T')[0];
            const hasWorkout = workouts.some(w => w.date.startsWith(dateStr));
            
            return (
              <div 
                key={i}
                className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all
                  ${hasWorkout 
                    ? 'bg-accent-green text-bg shadow-md scale-105' 
                    : 'bg-bg-tertiary text-text-secondary'
                  }`}
                title={dateStr}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end items-center gap-2 mt-4 text-xs text-text-secondary">
          <span>Меньше</span>
          <div className="w-3 h-3 bg-bg-tertiary rounded"></div>
          <div className="w-3 h-3 bg-accent-green rounded"></div>
          <span>Больше</span>
        </div>
      </div>
    </div>
  );
};

export default LongPathPage;
