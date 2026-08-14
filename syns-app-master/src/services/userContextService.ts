import { supabase } from '@/lib/supabase';
import type { Profile, CoachData, WorkoutLog, NutritionLog, SleepLog } from '@/types';

/**
 * Собирает полный контекст о пользователе для передачи в ИИ
 * Включает профиль, историю тренировок, питания, сна и предпочтения
 */
export async function buildUserContext(userId: string): Promise<string> {
  const parts: string[] = [];

  // 1. Профиль пользователя
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileData) {
    const p = profileData as Profile;
    const profileParts: string[] = [];
    
    if (p.gender && p.gender !== 'not_specified') profileParts.push(`Пол: ${p.gender}`);
    if (p.age) profileParts.push(`Возраст: ${p.age} лет`);
    if (p.height) profileParts.push(`Рост: ${p.height} см`);
    if (p.weight) profileParts.push(`Вес: ${p.weight} кг`);
    if (p.target_weight) profileParts.push(`Целевой вес: ${p.target_weight} кг`);
    if (p.goal) {
      const goalMap: Record<string, string> = {
        lose: 'похудение',
        gain: 'набор мышечной массы',
        maintain: 'поддержание формы',
      };
      profileParts.push(`Цель: ${goalMap[p.goal] || p.goal}`);
    }
    if (p.activity_level) {
      const activityMap: Record<string, string> = {
        sedentary: 'сидячий образ жизни',
        light: 'лёгкая активность (1-2 дня в неделю)',
        moderate: 'средняя активность (3-4 дня в неделю)',
        active: 'высокая активность (5-6 дней в неделю)',
        very_active: 'очень высокая активность (7 дней в неделю)',
      };
      profileParts.push(`Уровень активности: ${activityMap[p.activity_level] || p.activity_level}`);
    }
    if (p.training_level) profileParts.push(`Уровень тренировок: ${p.training_level}`);
    if (p.days_per_week) profileParts.push(`Дней тренировок в неделю: ${p.days_per_week}`);
    if (p.equipment?.length) profileParts.push(`Оборудование: ${p.equipment.join(', ')}`);
    if (p.weak_muscles?.length) profileParts.push(`Отстающие группы мышц: ${p.weak_muscles.join(', ')}`);
    if (p.diet?.length) profileParts.push(`Диетические ограничения: ${p.diet.join(', ')}`);
    if (p.fasting?.length) profileParts.push(`Интервальное голодание: ${p.fasting.join(', ')}`);
    if (p.religion) profileParts.push(`Религиозные ограничения: ${p.religion}`);
    
    parts.push(`📋 ПРОФИЛЬ:\n${profileParts.join('; ') || 'Профиль не заполнен'}`);
  }

  // 2. Данные тренера (Coach)
  const { data: coachData } = await supabase
    .from('coach_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (coachData) {
    const c = coachData as CoachData;
    const coachParts: string[] = [];
    
    if (c.main_goal) coachParts.push(`Главная цель: ${c.main_goal}`);
    if (c.experience_duration) coachParts.push(`Опыт: ${c.experience_duration}`);
    if (c.injuries?.length) coachParts.push(`Травмы/ограничения: ${c.injuries.join(', ')}`);
    if (c.health_restrictions) coachParts.push(`Ограничения по здоровью: ${c.health_restrictions}`);
    if (c.preferred_time) coachParts.push(`Предпочтительное время тренировок: ${c.preferred_time}`);
    if (c.workout_duration) coachParts.push(`Длительность тренировки: ${c.workout_duration}`);
    if (c.priority) coachParts.push(`Приоритет: ${c.priority}`);
    if (c.sleep_hours) coachParts.push(`Сон: ${c.sleep_hours} часов`);
    if (c.stress_level) coachParts.push(`Уровень стресса: ${c.stress_level}`);
    if (c.exercise_likes) coachParts.push(`Любимые упражнения: ${c.exercise_likes}`);
    if (c.exercise_dislikes) coachParts.push(`Нелюбимые упражнения: ${c.exercise_dislikes}`);
    if (c.focus_muscle) coachParts.push(`Фокус на группе мышц: ${c.focus_muscle}`);
    
    if (coachParts.length) {
      parts.push(`🏋️ ДАННЫЕ ТРЕНЕРА:\n${coachParts.join('; ')}`);
    }
  }

  // 3. История тренировок (последние 7 дней)
  const { data: workoutLogs } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('log_date', { ascending: false })
    .limit(20);

  if (workoutLogs && workoutLogs.length > 0) {
    const workoutSummary = workoutLogs.map(w => 
      `${w.exercise_name}: ${w.sets}x${w.reps} @ ${w.weight}кг (интенсивность: ${w.intensity}%)`
    ).join('; ');
    parts.push(`💪 ПОСЛЕДНИЕ ТРЕНИРОВКИ (7 дней):\n${workoutSummary}`);
  } else {
    parts.push(`💪 ПОСЛЕДНИЕ ТРЕНИРОВКИ: Нет записей`);
  }

  // 4. История питания (последние 7 дней, средние показатели)
  const { data: nutritionLogs } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('log_date', { ascending: false });

  if (nutritionLogs && nutritionLogs.length > 0) {
    const avgCalories = Math.round(nutritionLogs.reduce((sum, n) => sum + n.calories, 0) / nutritionLogs.length);
    const avgProtein = Math.round(nutritionLogs.reduce((sum, n) => sum + n.proteins, 0) / nutritionLogs.length);
    const avgFat = Math.round(nutritionLogs.reduce((sum, n) => sum + n.fats, 0) / nutritionLogs.length);
    const avgCarbs = Math.round(nutritionLogs.reduce((sum, n) => sum + n.carbs, 0) / nutritionLogs.length);
    parts.push(`🍎 СРЕДНЕЕ ПИТАНИЕ (7 дней):\n${avgCalories} ккал | Б: ${avgProtein}г | Ж: ${avgFat}г | У: ${avgCarbs}г`);
  } else {
    parts.push(`🍎 ПИТАНИЕ: Нет записей`);
  }

  // 5. История сна (последние 7 дней)
  const { data: sleepLogs } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('log_date', { ascending: false });

  if (sleepLogs && sleepLogs.length > 0) {
    const avgHours = (sleepLogs.reduce((sum, s) => sum + s.hours, 0) / sleepLogs.length).toFixed(1);
    const avgQuality = Math.round(sleepLogs.reduce((sum, s) => sum + s.quality, 0) / sleepLogs.length);
    parts.push(`😴 СОН (7 дней):\nВ среднем ${avgHours} часов, качество: ${avgQuality}/10`);
  } else {
    parts.push(`😴 СОН: Нет записей`);
  }

  // 6. История чатов (последние 5 сообщений для контекста диалога)
  const { data: chatHistory } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (chatHistory && chatHistory.length > 0) {
    const recentChat = chatHistory.map(m => 
      `[${m.role === 'user' ? 'Вы' : 'ИИ'}]: ${m.content.substring(0, 100)}...`
    ).reverse().join('\n');
    parts.push(`💬 ПОСЛЕДНИЕ СООБЩЕНИЯ:\n${recentChat}`);
  }

  return parts.join('\n\n---\n\n');
}

/**
 * Сохраняет факт о пользователе в память (для будущих улучшений RAG)
 */
export async function saveUserMemory(
  userId: string,
  fact: string,
  category: 'preference' | 'feedback' | 'goal' | 'health' | 'other'
): Promise<void> {
  try {
    await supabase.from('user_memories').insert({
      user_id: userId,
      fact,
      category,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ошибка сохранения памяти:', error);
  }
}

/**
 * Извлекает релевантные факты из памяти пользователя
 */
export async function retrieveUserMemories(
  userId: string,
  query: string,
  limit: number = 5
): Promise<string[]> {
  try {
    // Простой текстовый поиск (в будущем заменить на векторный)
    const { data } = await supabase
      .from('user_memories')
      .select('fact')
      .eq('user_id', userId)
      .ilike('fact', `%${query}%`)
      .limit(limit);
    
    return data?.map(d => d.fact) || [];
  } catch (error) {
    console.error('Ошибка извлечения памяти:', error);
    return [];
  }
}
