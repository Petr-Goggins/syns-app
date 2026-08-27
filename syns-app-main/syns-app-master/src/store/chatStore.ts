import { create } from 'zustand';
import type { ChatMessage, ChatRole, Profile } from '@/types';
import { supabase } from '@/lib/supabase';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  fetchMessages: (userId: string) => Promise<void>;
  sendMessage: (userId: string, profile: Profile | null, content: string) => Promise<void>;
  clearMessages: (userId: string) => Promise<void>;
  reset: () => void;
  setMessages: (messages: ChatMessage[]) => void;
}

const SUGGESTED_REPLIES: Record<string, string[]> = {
  workout: [
    'Для начала определите цель: сила или выносливость. Новичкам рекомендую 3 тренировки в неделю — понедельник, среда, пятница. Каждая сессия 45–60 минут. Начните с базовых движений: приседания, отжимания, подтягивания.',
    'Хороший план на неделю: 2 силовые + 1 кардио. Не забывайте про отдых — мышцы растут во время восстановления.',
  ],
  nutrition: [
    'Старайтесь сбалансировать тарелку: половина — овощи, четверть — белок, четверть — сложные углеводы. Пейте воду за 20 минут до еды.',
    'Ешьте каждые 3–4 часа, не пропускайте завтрак. Белок в каждом приёме пищи ускоряет метаболизм.',
  ],
  sleep: [
    'Старайтесь ложиться в одно и то же время, за час до сна уберите экраны. Темнота и прохлада (18–20°C) — идеальные условия.',
    'Если не удаётся уснуть 20 минут — встаньте, почитайте книгу при тусклом свете, потом вернитесь в кровать.',
  ],
  water: [
    'Норма воды — 30 мл на кг веса. Распределите на весь день, не пейте много за раз.',
    'Стакан воды утром натощак запускает обмен веществ. Держите бутылку рядом как напоминание.',
  ],
  motivation: [
    'Дисциплина важнее мотивации. Мотивация приходит и уходит, а привычка остаётся. Начните с малого — 10 минут в день.',
    'Каждая тренировка — вклад в ваше будущее «я». Через месяц вы скажете себе спасибо, что не сдались.',
  ],
  default: [
    'Я ваш ИИ-наставник Ascend. Расскажите подробнее о вашей цели — тренировки, питание, сон или мотивация?',
    'Отличный вопрос! Чтобы дать точный совет, мне нужно знать ваш уровень и оборудование. Заполните профиль, и я составлю персональный план.',
  ],
};

function pickReply(content: string): string {
  const lower = content.toLowerCase();
  if (/тренир|упражн|сил|кардио|зал|ганте/.test(lower)) {
    const r = SUGGESTED_REPLIES.workout;
    return r[Math.floor(Math.random() * r.length)];
  }
  if (/ед|питан|калор|белок|диет|обед|ужин/.test(lower)) {
    const r = SUGGESTED_REPLIES.nutrition;
    return r[Math.floor(Math.random() * r.length)];
  }
  if (/сон|спать|устал|бессонни/.test(lower)) {
    const r = SUGGESTED_REPLIES.sleep;
    return r[Math.floor(Math.random() * r.length)];
  }
  if (/вод|пить|жажда/.test(lower)) {
    const r = SUGGESTED_REPLIES.water;
    return r[Math.floor(Math.random() * r.length)];
  }
  if (/мотив|лень|не могу|брос|сда/.test(lower)) {
    const r = SUGGESTED_REPLIES.motivation;
    return r[Math.floor(Math.random() * r.length)];
  }
  const r = SUGGESTED_REPLIES.default;
  return r[Math.floor(Math.random() * r.length)];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  fetchMessages: async (userId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ messages: data ?? [] });
  },
  sendMessage: async (userId: string, profile: Profile | null, content: string) => {
    if (!content.trim()) return;

    // optimistic insert of user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      role: 'user' as ChatRole,
      content,
      created_at: new Date().toISOString(),
    };
    set({ messages: [...get().messages, tempUserMsg], loading: true, error: null });

    const { data: savedUser, error: insertErr } = await supabase
      .from('chat_messages')
      .insert({ user_id: userId, role: 'user', content })
      .select();
    if (insertErr) {
      console.warn('Не удалось сохранить сообщение пользователя, продолжаем без истории:', insertErr.message);
    } else {
      // replace temp message with persisted one
      set({
        messages: get().messages.map((m) => (m.id === tempUserMsg.id ? (savedUser as ChatMessage) : m)),
      });
    }

    // Вызов бэкенда для получения ответа ИИ
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl || typeof backendUrl !== 'string') {
        throw new Error('Backend URL not configured');
      }
      
      // Валидация content
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return;
      }
      
      const sanitizedContent = content.trim().slice(0, 2000); // Ограничение длины сообщения
      
      const userData = profile ? {
        gender: profile.gender,
        age: profile.age && profile.age > 0 && profile.age < 150 ? profile.age : undefined,
        weight: profile.weight && profile.weight > 0 && profile.weight < 500 ? profile.weight : undefined,
        height: profile.height && profile.height > 50 && profile.height < 300 ? profile.height : undefined,
        goal: profile.goal,
        activity: profile.activity_level,
      } : {};

      const response = await fetch(`${backendUrl}/ai/ask`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sanitizedContent,
          user_data: userData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Валидация ответа от AI
        if (!data || typeof data.reply !== 'string') {
          throw new Error('Invalid AI response format');
        }
        const { data: savedAi, error: saveAiError } = await supabase
          .from('chat_messages')
          .insert({ user_id: userId, role: 'assistant', content: data.reply.slice(0, 5000) })
          .select();
        if (saveAiError || !savedAi?.[0]) {
          set({
            messages: [...get().messages, {
              id: `local-${Date.now()}`,
              user_id: userId,
              role: 'assistant',
              content: data.reply.slice(0, 5000),
              created_at: new Date().toISOString(),
            }],
            loading: false,
            error: null,
          });
        } else {
          set({ messages: [...get().messages, savedAi[0] as ChatMessage], loading: false });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка ИИ: ${response.status}`);
      }
    } catch (err) {
      console.error('Ошибка подключения к ИИ:', err);
      // Fallback на локальный ответ
      const lower = content.toLowerCase();
      let reply: string;

      if (/убери|замени|убрать|заменить/.test(lower) && /жим|присед|тяга|отжиман|подтяг|упражнен/.test(lower)) {
        reply = `Понял, уберу/заменю это упражнение в вашем плане. В полном режиме ИИ автоматически обновит план. Сейчас вы можете сгенерировать новый план на странице «Мой план» — алгоритм учтёт ваши пожелания.`;
      } else if (/короче|короче тренировку|сократи/.test(lower)) {
        reply = `Хорошо, могу сократить тренировки. В анкете тренера выберите меньшую длительность (20-30 минут), и план перестроится с суперсетами и минимальным отдыхом.`;
      } else if (/больше углевод|добавь углевод|больше калорий/.test(lower)) {
        reply = `Понял, увеличу углеводы в рационе. Используйте кнопку «Готовый рацион» в дневнике питания — он генерируется с учётом вашей нормы. Для ручной корректировки добавьте крупы или фрукты в приёмы пищи.`;
      } else {
        reply = pickReply(content);
      }

      const { data: savedAi, error: aiErr } = await supabase
        .from('chat_messages')
        .insert({ user_id: userId, role: 'assistant', content: reply })
        .select();
      if (aiErr) {
        set({
          messages: [...get().messages, {
            id: `local-${Date.now()}`,
            user_id: userId,
            role: 'assistant',
            content: reply,
            created_at: new Date().toISOString(),
          }],
          loading: false,
          error: null,
        });
        return;
      }
      set({ messages: [...get().messages, savedAi as ChatMessage], loading: false });
    }
  },
  clearMessages: async (userId: string) => {
    await supabase.from('chat_messages').delete().eq('user_id', userId);
    set({ messages: [] });
  },
  reset: () => set({ messages: [], loading: false, error: null }),
  setMessages: (messages) => set({ messages }),
}));
