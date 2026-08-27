import { useState } from 'react';
import { Check, Droplet, X } from 'lucide-react';

interface WaterSidebarProps {
  open: boolean;
  currentAmount: number;
  onClose: () => void;
  onAdd: (amount: number) => Promise<void>;
}

const QUICK_AMOUNTS = [200, 500, 1000];

export default function WaterSidebar({ open, currentAmount, onClose, onAdd }: WaterSidebarProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const add = async (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    await onAdd(amount);
    setSaving(false);
    setCustomAmount('');
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Добавить воду">
      <button type="button" className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Закрыть панель" />
      <aside className="glass absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-slate-950/90 p-5 shadow-2xl animate-slide-left">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300"><Droplet size={20} /></span>
            <div><h2 className="font-semibold text-text">Добавить воду</h2><p className="text-xs text-text-secondary">Сегодня: {Math.round(currentAmount)} мл</p></div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary flex h-9 w-9 items-center justify-center p-0" aria-label="Закрыть"><X size={18} /></button>
        </div>
        <div className="space-y-3 py-6">
          <p className="text-sm text-text-secondary">Выберите объём</p>
          {QUICK_AMOUNTS.map((amount) => (
            <button key={amount} type="button" disabled={saving} onClick={() => add(amount)} className="btn-secondary flex w-full items-center justify-between px-4 py-3 text-left">
              <span>{amount >= 1000 ? '1 л' : `${amount} мл`}</span><Droplet size={17} className="text-sky-300" />
            </button>
          ))}
          <div className="flex gap-2 pt-3">
            <input type="number" min="1" max="5000" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} className="input-field min-w-0 flex-1" placeholder="Свой объём, мл" />
            <button type="button" disabled={saving || !customAmount} onClick={() => add(Number(customAmount))} className="btn-primary flex items-center gap-2 px-4"><Check size={17} /> Добавить</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
