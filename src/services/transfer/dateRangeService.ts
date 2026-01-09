import { parse, startOfDay, differenceInMonths, addMonths, subMonths, format } from 'date-fns';

interface DateRangeParams {
  start: Date;
  end: Date;
}

interface DateAdjustment {
  adjustedDate: string | null;
  needsAdjustment: boolean;
}

function validateCustomDateRange(startDateStr: string, endDateStr: string): string | null {
  if (!startDateStr || !endDateStr) {
    return null;
  }

  const start = parse(startDateStr, 'yyyy-MM-dd', new Date());
  const end = parse(endDateStr, 'yyyy-MM-dd', new Date());
  const today = startOfDay(new Date());

  if (start > end) {
    return 'La fecha de inicio debe ser anterior a la fecha de fin';
  }

  if (end > today) {
    return 'La fecha de fin no puede ser mayor a hoy';
  }

  const monthsDiff = differenceInMonths(end, start);
  if (monthsDiff > 3) {
    return 'El rango no puede exceder 3 meses';
  }

  return null;
}

function getDateRangeFromStrings(startDateStr: string, endDateStr: string): DateRangeParams {
  const start = startOfDay(parse(startDateStr, 'yyyy-MM-dd', new Date()));
  const end = startOfDay(parse(endDateStr, 'yyyy-MM-dd', new Date()));
  return { start, end };
}

function getMaxEndDateString(startDateStr: string): string {
  const today = format(new Date(), 'yyyy-MM-dd');
  if (!startDateStr) return today;
  const startDate = parse(startDateStr, 'yyyy-MM-dd', new Date());
  const maxEnd = addMonths(startDate, 3);
  const todayDate = new Date();
  return format(maxEnd < todayDate ? maxEnd : todayDate, 'yyyy-MM-dd');
}

function getMinStartDateString(endDateStr: string): string {
  if (!endDateStr) return '';
  const endDate = parse(endDateStr, 'yyyy-MM-dd', new Date());
  const minStart = subMonths(endDate, 3);
  return format(minStart, 'yyyy-MM-dd');
}

function adjustDateRangeOnStartChange(startDateStr: string, endDateStr: string): DateAdjustment {
  if (!startDateStr || !endDateStr) {
    return { adjustedDate: null, needsAdjustment: false };
  }

  const maxEnd = getMaxEndDateString(startDateStr);
  const endDateParsed = parse(endDateStr, 'yyyy-MM-dd', new Date());
  const maxEndParsed = parse(maxEnd, 'yyyy-MM-dd', new Date());

  if (endDateParsed > maxEndParsed) {
    return { adjustedDate: maxEnd, needsAdjustment: true };
  }

  return { adjustedDate: null, needsAdjustment: false };
}

function adjustDateRangeOnEndChange(startDateStr: string, endDateStr: string): DateAdjustment {
  if (!startDateStr || !endDateStr) {
    return { adjustedDate: null, needsAdjustment: false };
  }

  const minStart = getMinStartDateString(endDateStr);
  const startDateParsed = parse(startDateStr, 'yyyy-MM-dd', new Date());
  const minStartParsed = parse(minStart, 'yyyy-MM-dd', new Date());

  if (startDateParsed < minStartParsed) {
    return { adjustedDate: minStart, needsAdjustment: true };
  }

  return { adjustedDate: null, needsAdjustment: false };
}

export const dateRangeService = {
  validateCustomDateRange,
  getDateRangeFromStrings,
  getMaxEndDateString,
  getMinStartDateString,
  adjustDateRangeOnStartChange,
  adjustDateRangeOnEndChange,
};

export type { DateRangeParams, DateAdjustment };

