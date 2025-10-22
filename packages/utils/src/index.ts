// Basic utilities
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function calculateDateDifference(startDate: Date, endDate: Date) {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    startDate,
    endDate,
    days: diffDays
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}