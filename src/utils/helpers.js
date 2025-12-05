import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Format date to display string
 */
export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Get start of current month
 */
export const getCurrentMonthStart = () => {
  return startOfMonth(new Date());
};

/**
 * Get end of current month
 */
export const getCurrentMonthEnd = () => {
  return endOfMonth(new Date());
};

/**
 * Get date range for last N months
 */
export const getLastMonthsRange = (months = 1) => {
  const end = new Date();
  const start = subMonths(end, months);
  return { start, end };
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};
