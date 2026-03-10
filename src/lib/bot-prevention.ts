/**
 * Bot prevention utilities
 * - Honeypot fields (invisible to users, filled by bots)
 * - Timestamp validation (forms submitted too quickly = bot)
 * - Simple client-side rate limiting
 */

const FORM_LOAD_TIMES = new Map<string, number>();
const SUBMISSION_COUNTS = new Map<string, { count: number; resetAt: number }>();

/**
 * Record when a form was loaded (call on mount)
 */
export function recordFormLoad(formId: string) {
  FORM_LOAD_TIMES.set(formId, Date.now());
}

/**
 * Validate that a form wasn't submitted too quickly (< 2 seconds = likely bot)
 */
export function validateSubmissionTiming(formId: string, minSeconds = 2): boolean {
  const loadTime = FORM_LOAD_TIMES.get(formId);
  if (!loadTime) return true; // No record, allow
  const elapsed = (Date.now() - loadTime) / 1000;
  return elapsed >= minSeconds;
}

/**
 * Check if honeypot field is filled (should be empty for real users)
 */
export function isHoneypotFilled(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Client-side rate limiting per action
 * Returns true if rate limit exceeded
 */
export function isRateLimited(action: string, maxPerMinute = 5): boolean {
  const now = Date.now();
  const entry = SUBMISSION_COUNTS.get(action);
  
  if (!entry || now > entry.resetAt) {
    SUBMISSION_COUNTS.set(action, { count: 1, resetAt: now + 60000 });
    return false;
  }
  
  entry.count++;
  return entry.count > maxPerMinute;
}

/**
 * Combined bot check - returns error message or null if valid
 */
export function validateNotBot(formId: string, honeypotValue: string): string | null {
  if (isHoneypotFilled(honeypotValue)) {
    // Don't reveal why it failed
    return 'An error occurred. Please try again.';
  }
  
  if (!validateSubmissionTiming(formId, 2)) {
    return 'Please wait a moment before submitting.';
  }
  
  if (isRateLimited(formId, 5)) {
    return 'Too many attempts. Please try again later.';
  }
  
  return null;
}
