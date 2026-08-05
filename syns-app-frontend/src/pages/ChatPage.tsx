import { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Sparkles } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useChatStore } from '@/store/chatStore';

export default function ChatPage({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { profile } = useProfileStore();
  const { messages, loading, fetchMessages, sendMessage, clearMessages } = useChatStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchMessages(user.id);
  }, [user, fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  if (!user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await sendMessage(user.id, profile, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-screen lg:h-screen">
      <TopBar
        title="💬 Наставник Sync"
        onOpenSidebar={onOpenSidebar}
        right={
          messages.length > 0 ? (
            <button
              onClick={() => clearMessages(user.id)}
              className="p-2 rounded-lg text-text-secondary hover:bg-card-hover hover:text-accent-red transition-colors"
              title="Очистить чат"
            >
              <Trash2 size={18} />
            </button>
          ) : null
        }
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-accent-blue/15 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-accent-blue" />
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Спросите что угодно</h2>
              <p className="text-text-secondary text-sm max-w-md">
                Тренировки, питание, сон, мотивация — я подскажу с учётом вашего профиля
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-lg">
                {[
                  'Какие тренировки подходят новичку?',
                  'Сколько воды мне пить?',
                  'Помоги составить план питания',
                  'Как улучшить качество сна?',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="card px-4 py-3 text-left text-sm text-text-secondary hover:text-text hover:border-accent-blue/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent-blue text-white rounded-br-sm'
                    : 'bg-card border border-border text-text rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-card border border-border px-5 py-4 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce-dot"
                      style={{ animationDelay: `${i * 0.16}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-bg p-4 lg:p-6">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="input-field flex-1 px-4 py-3 text-sm resize-none max-h-32"
            style={{ minHeight: '48px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary px-5 py-3 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </form>
      </div>
    </div>
  );
}
