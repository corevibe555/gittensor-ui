import { format } from 'date-fns';
import { CREDIBILITY_COLORS } from '../theme';

/**
 * Format a token amount for display with specified decimal places.
 * Raw values are already in Alpha units - just round to specified decimals.
 *
 * @param value - The token amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "100.50"
 */
export const formatTokenAmount = (
  value: string | number | null | undefined,
  decimals: number = 2,
): string => {
  if (value === null || value === undefined) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format a USD estimate value for display.
 *
 * @param value - The USD value to format
 * @param options - Formatting options
 * @param options.includeApproxPrefix - Whether to include "~" prefix (default: false)
 * @param options.showZero - Whether to show "$0" for zero/negative values (default: false, returns null)
 * @returns Formatted string like "$5", "<$1", or null if value is invalid/zero
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'MMM d, yyyy');
};

export const formatUsdEstimate = (
  value: number | null | undefined,
  options?: { includeApproxPrefix?: boolean; showZero?: boolean },
): string | null => {
  const { includeApproxPrefix = false, showZero = false } = options ?? {};
  const prefix = includeApproxPrefix ? '~' : '';

  if (value === undefined || value === null) {
    return showZero ? `${prefix}$0` : null;
  }

  if (value >= 1) {
    return `${prefix}$${Math.round(value)}`;
  }

  if (value > 0) {
    return '<$1';
  }

  return showZero ? `${prefix}$0` : null;
};

// Precision-safe comparator for decimal strings (e.g. subnet weights stored as
// big-float strings). Avoids Number() coercion so values beyond float64
// precision sort correctly. Returns negative/zero/positive per Array.sort.
export const compareDecimalStrings = (
  a: string | null | undefined,
  b: string | null | undefined,
): number => {
  const parse = (raw: string | null | undefined) => {
    const s = (raw ?? '').trim();
    if (!s) return { neg: false, int: '0', frac: '' };
    const sign = s[0] === '-';
    const body = s[0] === '-' || s[0] === '+' ? s.slice(1) : s;
    const dot = body.indexOf('.');
    const intRaw = dot === -1 ? body : body.slice(0, dot);
    const fracRaw = dot === -1 ? '' : body.slice(dot + 1);
    const int = intRaw.replace(/^0+(?=\d)/, '') || '0';
    const frac = fracRaw.replace(/0+$/, '');
    return { neg: sign && !(int === '0' && frac === ''), int, frac };
  };

  const pa = parse(a);
  const pb = parse(b);

  if (pa.neg !== pb.neg) return pa.neg ? -1 : 1;
  const sign = pa.neg ? -1 : 1;

  if (pa.int.length !== pb.int.length) {
    return (pa.int.length - pb.int.length) * sign;
  }
  if (pa.int !== pb.int) {
    return (pa.int < pb.int ? -1 : 1) * sign;
  }

  const maxLen = Math.max(pa.frac.length, pb.frac.length);
  const fa = pa.frac.padEnd(maxLen, '0');
  const fb = pb.frac.padEnd(maxLen, '0');
  if (fa === fb) return 0;
  return (fa < fb ? -1 : 1) * sign;
};

export const credibilityColor = (cred: number): string => {
  if (cred >= 0.9) return CREDIBILITY_COLORS.excellent;
  if (cred >= 0.7) return CREDIBILITY_COLORS.good;
  if (cred >= 0.5) return CREDIBILITY_COLORS.moderate;
  if (cred >= 0.3) return CREDIBILITY_COLORS.low;
  return CREDIBILITY_COLORS.poor;
};
