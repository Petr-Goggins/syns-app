// Система уведомлений для Sync (веб-версия)
export interface NotificationConfig {
  enabled: boolean;
  remindBeforeWorkout: boolean;
  motivationalEnabled: boolean;
  forecastEnabled: boolean;
  workoutTime?: string;
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  remindBeforeWorkout: true,
  motivationalEnabled: true,
  forecastEnabled: true,
  workoutTime: '18:00',
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { icon: '/icon-192x192.png', ...options });
  }
}

export type NotificationType = 'workout_reminder' | 'motivational' | 'forecast' | 'streak_milestone' | 'level_up' | 'achievement_unlocked';

export const NOTIFICATION_MESSAGES: Record<NotificationType, (data?: any) => { title: string; body: string }> = {
  workout_reminder: () => ({ title: 'Время тренировки!', body: 'Пора на тренировку!' }),
  motivational: (d) => ({ title: 'Ты молодец!', body: d?.streak ? `Ты уже ${d.streak} дней подряд!` : 'Так держать!' }),
  forecast: (d) => ({ title: 'Прогноз', body: d?.prediction || 'Прогресс идёт по плану!' }),
  streak_milestone: (d) => ({ title: 'Серия!', body: `${d?.streak || 7} дней подряд!` }),
  level_up: (d) => ({ title: 'Новый уровень!', body: `Уровень ${d?.title || ''}` }),
  achievement_unlocked: (d) => ({ title: 'Достижение!', body: d?.achievement || 'Новое достижение!' }),
};

export function saveNotificationSettings(config: NotificationConfig) {
  try {
    // Валидация конфигурации перед сохранением
    const validatedConfig: NotificationConfig = {
      enabled: Boolean(config.enabled),
      remindBeforeWorkout: Boolean(config.remindBeforeWorkout),
      motivationalEnabled: Boolean(config.motivationalEnabled),
      forecastEnabled: Boolean(config.forecastEnabled),
      workoutTime: typeof config.workoutTime === 'string' 
        ? config.workoutTime.slice(0, 10) // Ограничение длины
        : '18:00',
    };
    localStorage.setItem('sync_notifications', JSON.stringify(validatedConfig));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  }
}

export function loadNotificationSettings(): NotificationConfig {
  try {
    const s = localStorage.getItem('sync_notifications');
    if (!s) return DEFAULT_CONFIG;
    
    const parsed = JSON.parse(s);
    // Валидация и санитайзинг данных
    return {
      enabled: Boolean(parsed.enabled),
      remindBeforeWorkout: Boolean(parsed.remindBeforeWorkout),
      motivationalEnabled: Boolean(parsed.motivationalEnabled),
      forecastEnabled: Boolean(parsed.forecastEnabled),
      workoutTime: typeof parsed.workoutTime === 'string' && /^\d{1,2}:\d{2}$/.test(parsed.workoutTime)
        ? parsed.workoutTime
        : DEFAULT_CONFIG.workoutTime,
    };
  } catch (error) {
    console.error('Failed to load notification settings:', error);
    return DEFAULT_CONFIG;
  }
}
