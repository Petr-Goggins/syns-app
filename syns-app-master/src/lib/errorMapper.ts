export function mapAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('load failed') || lower.includes('failed to fetch') || lower.includes('networkrequestfailed')) {
    return 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Пользователь с таким email уже зарегистрирован.';
  }
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Неверный email или пароль.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email не подтверждён. Обратитесь к администратору.';
  }
  if (lower.includes('missing supabase environment')) {
    return 'Не настроено подключение к базе данных. Обратитесь к администратору.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate')) {
    return 'Слишком много попыток. Попробуйте позже.';
  }
  if (lower.includes('password should be at least')) {
    return 'Пароль должен быть не менее 6 символов.';
  }

  return 'Произошла ошибка. Попробуйте ещё раз.';
}
