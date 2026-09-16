interface ReferralData {
  userId: string;
  referralCode: string;
  referredUsers: string[];
  bonusDays: number;
  totalReferrals: number;
}

interface PromoCode {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  validUntil: string | null;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
}

interface TrialStatus {
  userId: string;
  trialStarted: string;
  trialEnds: string;
  notificationsSent: number[];
  trialActive: boolean;
}

// Generate unique referral code for user
export function generateReferralCode(userId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ASCEND-${timestamp}-${random}`.toUpperCase();
}

// Generate referral link
export function generateReferralLink(referralCode: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?ref=${referralCode}`;
}

// Calculate bonus days for referral
export function calculateReferralBonus(referrerData: ReferralData): number {
  const BONUS_PER_REFERRAL = 3; // 3 days premium per referral
  return referrerData.totalReferrals * BONUS_PER_REFERRAL;
}

// Validate promo code
export function validatePromoCode(code: string, promoCodes: PromoCode[]): {
  valid: boolean;
  discount?: number;
  type?: string;
  error?: string;
} {
  const promo = promoCodes.find(p => p.code === code.toUpperCase());
  
  if (!promo) {
    return { valid: false, error: 'Промокод не найден' };
  }
  
  if (!promo.active) {
    return { valid: false, error: 'Промокод неактивен' };
  }
  
  if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
    return { valid: false, error: 'Промокод истёк' };
  }
  
  if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    return { valid: false, error: 'Лимит использований исчерпан' };
  }
  
  return {
    valid: true,
    discount: promo.discount,
    type: promo.type,
  };
}

// Check trial status and determine if notification needed
export function checkTrialNotification(trialStatus: TrialStatus): {
  shouldNotify: boolean;
  message?: string;
  dayNumber?: number;
} {
  if (!trialStatus.trialActive) {
    return { shouldNotify: false };
  }
  
  const now = new Date();
  const trialEnd = new Date(trialStatus.trialEnds);
  const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Notify on day 3
  if (daysRemaining === 5 && !trialStatus.notificationsSent.includes(3)) {
    return {
      shouldNotify: true,
      message: 'Пробный период заканчивается через 5 дней. Подключите премиум!',
      dayNumber: 3,
    };
  }
  
  // Notify on day 6
  if (daysRemaining === 2 && !trialStatus.notificationsSent.includes(6)) {
    return {
      shouldNotify: true,
      message: 'Пробный период заканчивается через 2 дня. Не упустите шанс!',
      dayNumber: 6,
    };
  }
  
  // Trial expired
  if (daysRemaining <= 0) {
    return {
      shouldNotify: true,
      message: 'Пробный период завершён. Подключите премиум для продолжения.',
      dayNumber: 7,
    };
  }
  
  return { shouldNotify: false };
}

// Create new referral record
export async function createReferralRecord(
  userId: string,
  referralCode: string
): Promise<ReferralData> {
  const referralData: ReferralData = {
    userId,
    referralCode,
    referredUsers: [],
    bonusDays: 0,
    totalReferrals: 0,
  };
  
  // In a real implementation, this would save to Supabase
  // await supabase.from('referrals').insert(referralData);
  
  return referralData;
}

// Process successful referral
export async function processReferral(
  referrerCode: string,
  newUserId: string
): Promise<{
  success: boolean;
  bonusDays?: number;
  error?: string;
}> {
  try {
    // In a real implementation:
    // 1. Validate referrer code exists
    // 2. Check if new user already used a referral
    // 3. Add new user to referrer's referred_users
    // 4. Calculate and apply bonus
    // 5. Record the referral
    
    const bonusDays = 3;
    
    return {
      success: true,
      bonusDays,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Ошибка при обработке реферала',
    };
  }
}

// Initialize trial for new user
export async function initializeTrial(userId: string): Promise<TrialStatus> {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const trialStatus: TrialStatus = {
    userId,
    trialStarted: now.toISOString(),
    trialEnds: trialEnd.toISOString(),
    notificationsSent: [],
    trialActive: true,
  };
  
  // In a real implementation, save to Supabase
  // await supabase.from('trials').insert(trialStatus);
  
  return trialStatus;
}

// Get available promo codes
export function getAvailablePromoCodes(): PromoCode[] {
  // In a real implementation, fetch from Supabase
  return [
    {
      code: 'WELCOME10',
      discount: 10,
      type: 'percentage',
      validUntil: null,
      maxUses: null,
      currentUses: 0,
      active: true,
    },
    {
      code: 'FITNESS2025',
      discount: 20,
      type: 'percentage',
      validUntil: '2025-12-31',
      maxUses: 1000,
      currentUses: 0,
      active: true,
    },
    {
      code: 'START50',
      discount: 50,
      type: 'fixed',
      validUntil: null,
      maxUses: 500,
      currentUses: 0,
      active: true,
    },
  ];
}

// Format referral link for sharing
export function formatReferralMessage(referralLink: string, bonusDays: number = 3): string {
  return `Присоединяйся к Ascend — персональному фитнес-коучу с ИИ! 🏋️‍♂️

По моей ссылке ты получишь бонус, а я — ${bonusDays} дня премиума бесплатно!

${referralLink}

Ascend — это:
- Персональные тренировки
- Умный план питания
- Анализ формы по фото
- ИИ-наставник 24/7`;}
