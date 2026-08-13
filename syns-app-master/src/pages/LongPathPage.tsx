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
              className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{goal.icon}</span>
                <div className="text-left">
                  <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{goal.title}</h3>
                  <p className="text-sm text-gray-500">Нажмите для старта</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-sm text-gray-500 uppercase tracking-wide">Текущий уровень</span>
            <h3 className="text-2xl font-bold">{currentLevel.name}</h3>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">До следующего: {nextLevel ? nextLevel.name : 'Финиш!'}</span>
            <div className="text-xl font-bold text-blue-600">{Math.round(progressToNextLevel)}%</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
        
        <div className="mt-4 flex justify-between text-xs text-gray-400">
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
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : isCurrent 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/20' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
              >
                {isCompleted && <Award className="w-6 h-6 text-green-600 mb-2" />}
                {isCurrent && <Target className="w-6 h-6 text-blue-600 mb-2 animate-pulse" />}
                {!isCompleted && !isCurrent && <div className="w-6 h-6 mb-2 rounded-full border-2 border-gray-300" />}
                
                <span className="font-bold text-sm">{level.name}</span>
                <span className="text-xs text-gray-500 mt-1">{level.targetValue} {userGoal.unit}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* График прогноза */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" /> Прогноз прогресса
          </h3>
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {(['week', 'month', '3months'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedPeriod === p 
                    ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' 
                    : 'text-gray-500 hover:text-gray-700'
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                tickFormatter={(val) => val.split('.').slice(0,2).join('.')}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value} ${userGoal.unit}`, 'Прогноз']}
              />
              <ReferenceDot x={chartData.find(d => !d.isPrediction)?.name} y={chartData.find(d => !d.isPrediction)?.value} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
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
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          * Прогноз основан на вашей текущей частоте тренировок и прогрессе
        </p>
      </div>

      {/* Календарь активности (мини) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-500" /> Активность (последние 28 дней)
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
                    ? 'bg-green-500 text-white shadow-md scale-105' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}
                title={dateStr}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Меньше</span>
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Больше</span>
        </div>
      </div>
    </div>
  );
};

export default LongPathPage;
