import { describe, expect, it } from 'vitest';
import {
  isDisposableEmailDomain,
  isValidEmailFormat,
  validateSignupEmail,
} from './emailValidation';
import { isEmailConfirmed } from './authUser';
import type { User } from '@supabase/supabase-js';

describe('email validation', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmailFormat('you@domain.com')).toBe(true);
    expect(isValidEmailFormat('first.last+tag@company.co.uk')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidEmailFormat('not-an-email')).toBe(false);
    expect(isValidEmailFormat('user@')).toBe(false);
    expect(isValidEmailFormat('@domain.com')).toBe(false);
    expect(isValidEmailFormat('user@domain')).toBe(false);
    expect(isValidEmailFormat('user..name@domain.com')).toBe(false);
  });

  it('blocks disposable domains', () => {
    expect(isDisposableEmailDomain('spam@mailinator.com')).toBe(true);
    expect(isDisposableEmailDomain('spam@tempmail.com')).toBe(true);
    expect(isDisposableEmailDomain('spam@10minutemail.com')).toBe(true);
    expect(isDisposableEmailDomain('spam@alias.mailinator.com')).toBe(true);
    expect(isDisposableEmailDomain('real@gmail.com')).toBe(false);
  });

  it('returns a signup error for disposable or invalid email', () => {
    expect(validateSignupEmail('bad')).toMatch(/valid email/i);
    expect(validateSignupEmail('bot@mailinator.com')).toMatch(/disposable/i);
    expect(validateSignupEmail('you@domain.com')).toBeNull();
  });
});

describe('isEmailConfirmed', () => {
  it('rejects missing or unconfirmed email users', () => {
    expect(isEmailConfirmed(null)).toBe(false);
    expect(
      isEmailConfirmed({
        id: '1',
        app_metadata: { provider: 'email' },
      } as User),
    ).toBe(false);
  });

  it('accepts confirmed or OAuth users', () => {
    expect(
      isEmailConfirmed({
        id: '1',
        email_confirmed_at: '2026-01-01T00:00:00Z',
        app_metadata: { provider: 'email' },
      } as User),
    ).toBe(true);
    expect(
      isEmailConfirmed({
        id: '2',
        app_metadata: { provider: 'google' },
      } as User),
    ).toBe(true);
  });
});
