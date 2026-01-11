import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dateRangeService } from './dateRangeService';

describe('dateRangeService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:30:45'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validateCustomDateRange', () => {
    it('returns null when dates are empty', () => {
      const result = dateRangeService.validateCustomDateRange('', '');
      expect(result).toBeNull();
    });

    it('returns null when start date is empty', () => {
      const result = dateRangeService.validateCustomDateRange('', '2026-01-15');
      expect(result).toBeNull();
    });

    it('returns null when end date is empty', () => {
      const result = dateRangeService.validateCustomDateRange('2026-01-01', '');
      expect(result).toBeNull();
    });

    it('returns error when start date is after end date', () => {
      const result = dateRangeService.validateCustomDateRange('2026-01-15', '2026-01-01');
      expect(result).toBe('La fecha de inicio debe ser anterior a la fecha de fin');
    });

    it('returns error when end date is in the future', () => {
      const result = dateRangeService.validateCustomDateRange('2026-01-10', '2026-01-20');
      expect(result).toBe('La fecha de fin no puede ser mayor a hoy');
    });

    it('returns error when range exceeds 3 months', () => {
      const result = dateRangeService.validateCustomDateRange('2025-09-01', '2026-01-15');
      expect(result).toBe('El rango no puede exceder 3 meses');
    });

    it('returns null when range is valid and within 3 months', () => {
      const result = dateRangeService.validateCustomDateRange('2025-12-01', '2026-01-15');
      expect(result).toBeNull();
    });

    it('returns null when range is exactly 3 months', () => {
      const result = dateRangeService.validateCustomDateRange('2025-10-15', '2026-01-15');
      expect(result).toBeNull();
    });
  });

  describe('getDateRangeFromStrings', () => {
    it('converts date strings to DateRangeParams', () => {
      const result = dateRangeService.getDateRangeFromStrings('2026-01-01', '2026-01-10');
      expect(result.start.getDate()).toBe(1);
      expect(result.start.getMonth()).toBe(0);
      expect(result.start.getFullYear()).toBe(2026);
      expect(result.end.getDate()).toBe(10);
      expect(result.end.getMonth()).toBe(0);
      expect(result.end.getFullYear()).toBe(2026);
    });

    it('sets time to start of day for both dates', () => {
      const result = dateRangeService.getDateRangeFromStrings('2026-01-15', '2026-01-15');
      expect(result.start.getHours()).toBe(0);
      expect(result.start.getMinutes()).toBe(0);
      expect(result.start.getSeconds()).toBe(0);
      expect(result.end.getHours()).toBe(0);
      expect(result.end.getMinutes()).toBe(0);
      expect(result.end.getSeconds()).toBe(0);
    });
  });

  describe('getMaxEndDateString', () => {
    it('returns today when start date is empty', () => {
      const result = dateRangeService.getMaxEndDateString('');
      expect(result).toBe('2026-01-15');
    });

    it('returns start date + 3 months when within today', () => {
      const result = dateRangeService.getMaxEndDateString('2025-10-14');
      expect(result).toBe('2026-01-14');
    });

    it('returns today when start date + 3 months exceeds today', () => {
      const result = dateRangeService.getMaxEndDateString('2025-11-15');
      expect(result).toBe('2026-01-15');
    });

    it('returns exactly 3 months from start when valid', () => {
      const result = dateRangeService.getMaxEndDateString('2025-10-15');
      expect(result).toBe('2026-01-15');
    });
  });

  describe('getMinStartDateString', () => {
    it('returns empty string when end date is empty', () => {
      const result = dateRangeService.getMinStartDateString('');
      expect(result).toBe('');
    });

    it('returns end date - 3 months', () => {
      const result = dateRangeService.getMinStartDateString('2026-01-15');
      expect(result).toBe('2025-10-15');
    });

    it('handles month boundaries correctly', () => {
      const result = dateRangeService.getMinStartDateString('2026-03-15');
      expect(result).toBe('2025-12-15');
    });
  });

  describe('adjustDateRangeOnStartChange', () => {
    it('returns no adjustment when range is valid', () => {
      const result = dateRangeService.adjustDateRangeOnStartChange('2025-12-15', '2026-01-15');
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedDate).toBeNull();
    });

    it('returns adjusted end date when end exceeds 3 months from start', () => {
      const result = dateRangeService.adjustDateRangeOnStartChange('2025-10-01', '2026-01-10');
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedDate).toBe('2026-01-01');
    });

    it('returns no adjustment when start date is empty', () => {
      const result = dateRangeService.adjustDateRangeOnStartChange('', '2026-01-15');
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedDate).toBeNull();
    });

    it('returns no adjustment when end date is empty', () => {
      const result = dateRangeService.adjustDateRangeOnStartChange('2025-12-15', '');
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedDate).toBeNull();
    });

    it('caps adjustment to today when 3 months exceeds today', () => {
      const result = dateRangeService.adjustDateRangeOnStartChange('2025-11-15', '2026-02-15');
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedDate).toBe('2026-01-15');
    });
  });

  describe('adjustDateRangeOnEndChange', () => {
    it('returns no adjustment when range is valid', () => {
      const result = dateRangeService.adjustDateRangeOnEndChange('2025-12-15', '2026-01-15');
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedDate).toBeNull();
    });

    it('returns adjusted start date when start is before 3 months from end', () => {
      const result = dateRangeService.adjustDateRangeOnEndChange('2025-09-15', '2026-01-15');
      expect(result.needsAdjustment).toBe(true);
      expect(result.adjustedDate).toBe('2025-10-15');
    });

    it('returns no adjustment when start date is empty', () => {
      const result = dateRangeService.adjustDateRangeOnEndChange('', '2026-01-15');
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedDate).toBeNull();
    });

    it('returns no adjustment when end date is empty', () => {
      const result = dateRangeService.adjustDateRangeOnEndChange('2025-12-15', '');
      expect(result.needsAdjustment).toBe(false);
      expect(result.adjustedDate).toBeNull();
    });
  });
});

