import React, { useState } from 'react';
import { User, Calendar, Dumbbell } from 'lucide-react';
import MuscleHeatmap from '../components/MuscleHeatmap';

interface ProfilePageProps {
  user?: {
    email: string;
    name?: string;
    goal?: string;
  };
  stats?: {
    workouts: number;
    caloriesBurned: number;
    days: number;
  };
  nutritionCalendar?: Record<string, {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    status: 'good' | 'warning' | 'bad' | 'none';
  }>;
  workoutCalendar?: Record<string, {
    hasWorkout: boolean;
    details?: string;
  }>;
  muscleData?: Record<string, number>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user = { email: 'user@example.com', name: 'Пользователь', goal: 'Набор массы' },
  stats = {
    workouts: 45,
    caloriesBurned: 12000,
    days: 120
  },
  nutritionCalendar = {},
  workoutCalendar = {},
  muscleData = {
    chest: 75,
    biceps_left: 60,
    biceps_right: 65,
    triceps_left: 45,
    triceps_right: 50,
    abs: 80,
    legs: 90,
    shoulders_left: 55,
    shoulders_right: 58,
    neck: 30,
    back: 70,
    glutes: 65
  }
}) => {
  const [selectedDay, setSelectedDay] = useState<{ type: 'nutrition' | 'workout'; day: number; data: any } | null>(null);

  // Получение инициалов из email
  const getInitials = () => {
    const email = user?.email || 'user@example.com';
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  // Генерация дней для календаря (7x7 = 49 дней)
  const generateDays = () => {
    const days = [];
    for (let i = 0; i < 49; i++) {
      days.push(i);
    }
    return days;
  };

  const days = generateDays();

  // Цвет для дня питания
  const getNutritionColor = (status?: string) => {
    switch (status) {
      case 'good': return '#22c55e';
      case 'warning': return '#eab308';
      case 'bad': return '#ef4444';
      default: return '#d1d5db';
    }
  };

  // Цвет для дня тренировки
  const getWorkoutColor = (hasWorkout?: boolean) => {
    return hasWorkout ? '#22c55e' : '#d1d5db';
  };

  return (
    <div className="profile-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 2.1 ШАПКА ПРОФИЛЯ */}
      <header className="profile-header" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Аватарка */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ffffff'
          }}>
            {getInitials()}
          </span>
        </div>

        {/* Информация о пользователе */}
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '4px'
          }}>
            {user?.name || 'Пользователь'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '4px'
          }}>
            {user?.email}
          </p>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            Цель: {user?.goal || 'не выбрана'}
          </p>
        </div>
      </header>

      {/* 2.2 ТРИ КАРТОЧКИ СТАТИСТИКИ */}
      <section className="stats-cards" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Тренировок */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: 'var(--shadow)',
          textAlign: 'center'
        }}>
          <Dumbbell size={24} color="var(--accent-blue)" style={{ marginBottom: '8px', margin: '0 auto 8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {stats.workouts}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Тренировок
          </div>
        </div>

        {/* Сожжено */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: 'var(--shadow)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {stats.caloriesBurned}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Сожжено ккал
          </div>
        </div>

        {/* Дней */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: 'var(--shadow)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {stats.days}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Дней
          </div>
        </div>
      </section>

      {/* 2.3 и 2.4 КАЛЕНДАРИ (в ряд) */}
      <section className="calendars-section" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Календарь питания */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Calendar size={16} color="var(--text-primary)" />
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Питание
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {days.map((day) => {
              const dayKey = `day-${day}`;
              const data = nutritionCalendar[dayKey];
              const color = getNutritionColor(data?.status);
              return (
                <div
                  key={day}
                  onClick={() => data && setSelectedDay({ type: 'nutrition', day, data })}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: color,
                    borderRadius: '2px',
                    cursor: data ? 'pointer' : 'default',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={(e) => {
                    if (data) {
                      (e.target as HTMLElement).style.transform = 'scale(1.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Календарь тренировок */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Dumbbell size={16} color="var(--text-primary)" />
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Тренировки
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {days.map((day) => {
              const dayKey = `day-${day}`;
              const data = workoutCalendar[dayKey];
              const color = getWorkoutColor(data?.hasWorkout);
              return (
                <div
                  key={day}
                  onClick={() => data?.hasWorkout && setSelectedDay({ type: 'workout', day, data })}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: color,
                    borderRadius: '2px',
                    cursor: data?.hasWorkout ? 'pointer' : 'default',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={(e) => {
                    if (data?.hasWorkout) {
                      (e.target as HTMLElement).style.transform = 'scale(1.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 2.5 ТЕПЛОВАЯ КАРТА МЫШЦ */}
      <section className="heatmap-section" style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'var(--shadow)',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Тепловая карта мышц
        </h2>
        <MuscleHeatmap muscleData={muscleData} />
      </section>

      {/* Всплывающая подсказка для календаря */}
      {selectedDay && (
        <div
          onClick={() => setSelectedDay(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow)',
              maxWidth: '300px',
              width: '90%'
            }}
          >
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '12px'
            }}>
              День {selectedDay.day + 1}
            </h3>
            {selectedDay.type === 'nutrition' && (
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Калории: {selectedDay.data.calories}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Белки: {selectedDay.data.protein}г
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Жиры: {selectedDay.data.fat}г
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Углеводы: {selectedDay.data.carbs}г
                </p>
              </div>
            )}
            {selectedDay.type === 'workout' && (
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Тренировка: {selectedDay.data.details || 'Общая тренировка'}
                </p>
              </div>
            )}
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--accent-blue)',
                color: '#ffffff',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
