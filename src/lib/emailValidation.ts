/** Strict RFC-5322-inspired local@domain.tld check (no spaces, consecutive dots, or missing TLD). */
export const STRICT_EMAIL_REGEX =
  /^(?=.{3,254}$)(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,63})+$/;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'discard.email',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'mailcatch.com',
  'mailinator.com',
  'mailinator.net',
  'mailnesia.com',
  'maildrop.cc',
  'mintemail.com',
  'mohmal.com',
  'sharklasers.com',
  'temp-mail.io',
  'temp-mail.org',
  'tempail.com',
  'tempmail.com',
  'tempmailo.com',
  'throwaway.email',
  'trashmail.com',
  'yopmail.com',
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return STRICT_EMAIL_REGEX.test(normalizeEmail(email));
}

export function emailDomain(email: string): string | null {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at === normalized.length - 1) return null;
  return normalized.slice(at + 1);
}

export function isDisposableEmailDomain(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function validateSignupEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'Enter a valid email address.';
  if (!isValidEmailFormat(normalized)) return 'Enter a valid email address.';
  if (isDisposableEmailDomain(normalized)) {
    return 'Temporary or disposable email addresses are not allowed.';
  }
  return null;
}
