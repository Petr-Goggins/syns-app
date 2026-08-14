import React, { useState } from 'react';
import { Droplet, Moon, Dumbbell, Target, Flame } from 'lucide-react';
import CircularProgress from '../components/CircularProgress';

interface DashboardPageProps {
  user?: {
    email: string;
    name?: string;
    goal?: string;
  };
  stats?: {
    caloriesConsumed: number;
    caloriesGoal: number;
    proteinCurrent: number;
    proteinGoal: number;
    fatCurrent: number;
    fatGoal: number;
    carbsCurrent: number;
    carbsGoal: number;
    water: number;
    sleep: number;
    workouts: number;
    progress: number;
    streak: number;
  };
}

// Данные для разных периодов
const periodData = {
  today: {
    caloriesConsumed: 1800,
    caloriesGoal: 2500,
    proteinCurrent: 120,
    proteinGoal: 150,
    fatCurrent: 50,
    fatGoal: 70,
    carbsCurrent: 200,
    carbsGoal: 300,
    water: 1.2,
    sleep: 7,
    workouts: 0,
    progress: 65,
    streak: 5
  },
  yesterday: {
    caloriesConsumed: 2200,
    caloriesGoal: 2500,
    proteinCurrent: 140,
    proteinGoal: 150,
    fatCurrent: 65,
    fatGoal: 70,
    carbsCurrent: 280,
    carbsGoal: 300,
    water: 1.8,
    sleep: 8,
    workouts: 1,
    progress: 72,
    streak: 4
  },
  week: {
    caloriesConsumed: 15400,
    caloriesGoal: 17500,
    proteinCurrent: 980,
    proteinGoal: 1050,
    fatCurrent: 420,
    fatGoal: 490,
    carbsCurrent: 1890,
    carbsGoal: 2100,
    water: 10.5,
    sleep: 52,
    workouts: 4,
    progress: 68,
    streak: 5
  }
};

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  user = { email: 'guest@example.com', name: 'Гость', goal: 'не выбрана' },
  stats: initialStats
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'week'>('today');
  
  const stats = periodData[selectedPeriod];

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Гость';
  };

  const remainingCalories = stats.caloriesGoal - stats.caloriesConsumed;
  const isOver = remainingCalories < 0;

  // Периоды для переключателя
  const periods = [
    { key: 'today' as const, label: 'Сегодня' },
    { key: 'yesterday' as const, label: 'Вчера' },
    { key: 'week' as const, label: 'Неделя' }
  ];

  return (
    <div className="dashboard-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1.1 ШАПКА */}
      <header className="dashboard-header" style={{ marginBottom: '24px' }}>
        <p className="quote" style={{ 
          fontSize: '14px', 
          fontStyle: 'italic', 
          color: 'var(--text-secondary)',
          marginBottom: '12px'
        }}>
          «Маленькие шаги ведут к большим результатам!» — Мотивация дня
        </p>
        
        <h1 className="greeting" style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>
          Привет, {getUserName()}!
        </h1>
        
        <p className="goal" style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)'
        }}>
          Цель: {user?.goal || 'не выбрана'}
        </p>
      </header>

      {/* 1.2 ПЕРЕКЛЮЧАТЕЛЬ ДАТЫ */}
      <section className="date-switcher" style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {periods.map((period) => (
          <button
            key={period.key}
            onClick={() => setSelectedPeriod(period.key)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: selectedPeriod === period.key ? 'var(--accent-blue)' : 'var(--bg-card)',
              color: selectedPeriod === period.key ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {period.label}
          </button>
        ))}
      </section>

      {/* 1.3 КРУГЛЫЙ СЧЁТЧИК КАЛОРИЙ */}
      <section className="calories-section" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <p style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)',
          marginBottom: '8px'
        }}>Калории</p>
        
        <CircularProgress 
          current={stats.caloriesConsumed}
          goal={stats.caloriesGoal}
          size={140}
          strokeWidth={12}
          label="ккал"
        />
        
        <p style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          marginTop: '8px'
        }}>
          {isOver 
            ? `Перевыполнено на ${Math.abs(remainingCalories)} ккал`
            : `Осталось ${remainingCalories} ккал`
          }
        </p>
      </section>

      {/* 1.4 ТРИ ПРОГРЕСС-БАРА (ПОД КРУГОМ) — С ЦВЕТАМИ ИЗ ЗАДАНИЯ */}
      <section className="macros-section" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Белки - зелёные #22c55e */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '4px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              <span>Белки</span>
              <span>{stats.proteinCurrent} / {stats.proteinGoal} г</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: 'var(--border-color)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${Math.min((stats.proteinCurrent / stats.proteinGoal) * 100, 100)}%`,
                height: '100%',
                backgroundColor: '#22c55e',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Жиры - красные #ef4444 */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '4px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              <span>Жиры</span>
              <span>{stats.fatCurrent} / {stats.fatGoal} г</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: 'var(--border-color)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${Math.min((stats.fatCurrent / stats.fatGoal) * 100, 100)}%`,
                height: '100%',
                backgroundColor: '#ef4444',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Углеводы - жёлтые #eab308 */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '4px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              <span>Углеводы</span>
              <span>{stats.carbsCurrent} / {stats.carbsGoal} г</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: 'var(--border-color)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${Math.min((stats.carbsCurrent / stats.carbsGoal) * 100, 100)}%`,
                height: '100%',
                backgroundColor: '#eab308',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* 1.4 ЧЕТЫРЕ КАРТОЧКИ */}
      <section className="stats-cards" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Вода */}
        <div className="stat-card" style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Droplet size={24} color="#3b82f6" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Вода</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.water} л</span>
        </div>

        {/* Сон */}
        <div className="stat-card" style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Moon size={24} color="#6366f1" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Сон</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.sleep} ч</span>
        </div>

        {/* Тренировки */}
        <div className="stat-card" style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Dumbbell size={24} color="#22c55e" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Тренировки</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.workouts}</span>
        </div>

        {/* Прогресс */}
        <div className="stat-card" style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Target size={24} color="#a855f7" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Прогресс</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.progress}%</span>
        </div>
      </section>

      {/* 1.5 КАРТОЧКА СЕРИИ */}
      <section className="streak-card" style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '12px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Flame size={24} color="#ef4444" />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Серия тренировок</span>
        </div>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.streak} дней</span>
      </section>
    </div>
  );
};

export default DashboardPage;
