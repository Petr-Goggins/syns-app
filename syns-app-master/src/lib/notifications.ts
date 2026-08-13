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
  localStorage.setItem('sync_notifications', JSON.stringify(config));
}

export function loadNotificationSettings(): NotificationConfig {
  const s = localStorage.getItem('sync_notifications');
  return s ? { ...DEFAULT_CONFIG, ...JSON.parse(s) } : DEFAULT_CONFIG;
}
