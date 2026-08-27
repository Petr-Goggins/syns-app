import { Lock } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { ACHIEVEMENTS } from '@/data/achievements';

export default function AchievementsPage({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked);
  const locked = ACHIEVEMENTS.filter((a) => !a.unlocked);

  const Badge = ({ a }: { a: (typeof ACHIEVEMENTS)[number] }) => (
    <div
      className={`card p-5 flex flex-col items-center text-center transition-all ${
        a.unlocked ? 'hover:border-accent-gold/40' : 'opacity-60'
      }`}
    >
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 ${
          a.unlocked ? 'bg-accent-gold/15' : 'bg-bg-tertiary grayscale'
        }`}
      >
        {a.unlocked ? a.icon : <Lock size={24} className="text-text-tertiary" />}
      </div>
      <p className="font-bold text-text text-sm">{a.title}</p>
      <p className="text-xs text-text-secondary mt-1">{a.description}</p>
    </div>
  );

  return (
    <div>
      <TopBar title="Достижения" onOpenSidebar={onOpenSidebar} />
      <main className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">Бейджи</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {unlocked.length} из {ACHIEVEMENTS.length} получено
          </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-accent-gold">
              {Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%
            </p>
            <p className="text-xs text-text-tertiary">прогресс</p>
          </div>
        </div>

        <section>
          <h3 className="text-sm font-bold text-accent-green mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            Полученные ({unlocked.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {unlocked.map((a) => (
              <Badge key={a.id} a={a} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-text-secondary mb-4 flex items-center gap-2">
            <Lock size={16} />
            Заблокированные ({locked.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {locked.map((a) => (
              <Badge key={a.id} a={a} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
