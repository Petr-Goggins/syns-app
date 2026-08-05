export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'not_specified';

export interface CycleInfo {
  phase: CyclePhase;
  dayOfCycle: number;
  daysUntilNextPhase: number;
  nextPhase: CyclePhase;
}

const PHASE_RANGES: { phase: CyclePhase; start: number; end: number }[] = [
  { phase: 'menstrual', start: 1, end: 5 },
  { phase: 'follicular', start: 6, end: 14 },
  { phase: 'ovulatory', start: 15, end: 17 },
  { phase: 'luteal', start: 18, end: 28 },
];

const PHASE_ORDER: CyclePhase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

export function calculateCyclePhase(
  lastPeriodDate: string | null,
  cycleLength: number = 28
): CycleInfo {
  if (!lastPeriodDate) {
    return { phase: 'not_specified', dayOfCycle: 0, daysUntilNextPhase: 0, nextPhase: 'not_specified' };
  }

  const lastPeriod = new Date(lastPeriodDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  lastPeriod.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - lastPeriod.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const dayOfCycle = (diffDays % cycleLength) + 1;

  // Find current phase based on day of cycle (adjusted for cycle length)
  // Scale phases proportionally if cycle length is not 28
  const scaledRanges = PHASE_RANGES.map((r) => ({
    phase: r.phase,
    start: Math.round((r.start / 28) * cycleLength),
    end: Math.round((r.end / 28) * cycleLength),
  }));

  let currentPhase: CyclePhase = 'menstrual';
  let nextPhase: CyclePhase = 'follicular';
  let daysUntilNextPhase = 0;

  for (let i = 0; i < scaledRanges.length; i++) {
    const r = scaledRanges[i];
    if (dayOfCycle >= r.start && dayOfCycle <= r.end) {
      currentPhase = r.phase;
      daysUntilNextPhase = r.end - dayOfCycle + 1;
      const nextIdx = (i + 1) % scaledRanges.length;
      nextPhase = scaledRanges[nextIdx].phase;
      break;
    }
  }

  return { phase: currentPhase, dayOfCycle, daysUntilNextPhase, nextPhase };
}

export interface PhaseRecommendation {
  phase: CyclePhase;
  label: string;
  intensity: string;
  nutrition: string;
  tips: string[];
  color: string;
}

const PHASE_RECOMMENDATIONS: Record<CyclePhase, PhaseRecommendation> = {
  menstrual: {
    phase: 'menstrual',
    label: 'Менструальная фаза',
    intensity: 'Сниженная — йога, стретчинг, прогулки',
    nutrition: '+5-10% калорий, продукты с железом и витамином С',
    color: 'var(--accent-red)',
    tips: [
      'Тёплые ванны для расслабления мышц',
      'Магний и витамин В6 помогают при спазмах',
      'Ограничьте кофеин',
      'Лёгкая растяжка и массаж поясницы',
      'Больше отдыхайте, снизьте веса',
    ],
  },
  follicular: {
    phase: 'follicular',
    label: 'Фолликулярная фаза',
    intensity: 'Повышенная — силовые тренировки, кардио',
    nutrition: 'Дефицит калорий, акцент на тонус',
    color: 'var(--accent-green)',
    tips: [
      'Активные прогулки на свежем воздухе',
      'Увеличьте потребление воды',
      'Включите продукты с витамином Е (орехи, авокадо)',
      'Лучшее время для силовых тренировок',
      'Можно увеличить объём тренировок',
    ],
  },
  ovulatory: {
    phase: 'ovulatory',
    label: 'Овуляторная фаза',
    intensity: 'Пик — сложные тренировки, большие веса',
    nutrition: 'Больше белка, поддержание калорийности',
    color: 'var(--accent-blue)',
    tips: [
      'Контролируйте уровень стресса',
      'Избегайте перегрева',
      'Полноценный сон особенно важен',
      'Витамин С для иммунитета',
      'Лучшее время для личных рекордов',
    ],
  },
  luteal: {
    phase: 'luteal',
    label: 'Лютеиновая фаза',
    intensity: 'Снижение — умеренные тренировки',
    nutrition: 'Сложные углеводы, магний, калий против отёков',
    color: 'var(--accent-gold)',
    tips: [
      'Ограничьте соль и сахар',
      'Бананы и зелень — источники калия и магния',
      'Дыхательные практики от стресса',
      'Снизьте потребление кофеина',
      'Увеличьте белок для поддержания мышц',
    ],
  },
  not_specified: {
    phase: 'not_specified',
    label: 'Не указано',
    intensity: 'Стандартные рекомендации',
    nutrition: 'Сбалансированное питание',
    color: 'var(--text-tertiary)',
    tips: ['Укажите дату начала цикла в профиле для персональных рекомендаций'],
  },
};

export function getPhaseRecommendation(phase: CyclePhase): PhaseRecommendation {
  return PHASE_RECOMMENDATIONS[phase];
}
