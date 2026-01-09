import { describe, it, expect } from 'vitest';
import {
  normalize,
  getNextAvailableId,
  checkDuplicateLocal,
  TransferIds,
} from './transferIdService';

describe('normalize', () => {
  it('converts to lowercase', () => {
    expect(normalize('ABC123')).toBe('abc123');
  });

  it('trims leading and trailing spaces', () => {
    expect(normalize('  abc123  ')).toBe('abc123');
  });

  it('handles combination of uppercase and spaces', () => {
    expect(normalize('  Transfer-001  ')).toBe('transfer-001');
  });

  it('preserves numbers and hyphens', () => {
    expect(normalize('12345-67')).toBe('12345-67');
  });
});

describe('getNextAvailableId', () => {
  it('returns original ID when it does not exist', () => {
    const ids: TransferIds = {};
    expect(getNextAvailableId(ids, 'transfer-001')).toBe('transfer-001');
  });

  it('returns ID-1 when original already exists', () => {
    const ids: TransferIds = { 'transfer-001': '2026-01-01' };
    expect(getNextAvailableId(ids, 'transfer-001')).toBe('transfer-001-1');
  });

  it('returns ID-2 when ID and ID-1 already exist', () => {
    const ids: TransferIds = {
      'transfer-001': '2026-01-01',
      'transfer-001-1': '2026-01-02',
    };
    expect(getNextAvailableId(ids, 'transfer-001')).toBe('transfer-001-2');
  });

  it('finds next available number in sequence', () => {
    const ids: TransferIds = {
      'abc': '2026-01-01',
      'abc-1': '2026-01-02',
      'abc-2': '2026-01-03',
      'abc-3': '2026-01-04',
    };
    expect(getNextAvailableId(ids, 'ABC')).toBe('abc-4');
  });

  it('normalizes input before searching', () => {
    const ids: TransferIds = { 'transfer-001': '2026-01-01' };
    expect(getNextAvailableId(ids, '  TRANSFER-001  ')).toBe('transfer-001-1');
  });
});

describe('checkDuplicateLocal', () => {
  it('detects NOT duplicate when ID does not exist', () => {
    const ids: TransferIds = {};
    const result = checkDuplicateLocal(ids, 'transfer-001');

    expect(result.isDuplicate).toBe(false);
    expect(result.suggestedId).toBe('transfer-001');
  });

  it('detects duplicate and suggests alternative ID', () => {
    const ids: TransferIds = { 'transfer-001': '2026-01-01' };
    const result = checkDuplicateLocal(ids, 'transfer-001');

    expect(result.isDuplicate).toBe(true);
    expect(result.suggestedId).toBe('transfer-001-1');
  });

  it('detects duplicate ignoring case sensitivity', () => {
    const ids: TransferIds = { 'transfer-001': '2026-01-01' };
    const result = checkDuplicateLocal(ids, 'TRANSFER-001');

    expect(result.isDuplicate).toBe(true);
    expect(result.suggestedId).toBe('transfer-001-1');
  });

  it('detects duplicate ignoring whitespace', () => {
    const ids: TransferIds = { 'transfer-001': '2026-01-01' };
    const result = checkDuplicateLocal(ids, '  transfer-001  ');

    expect(result.isDuplicate).toBe(true);
  });

  it('suggests next available ID in sequence', () => {
    const ids: TransferIds = {
      'abc': '2026-01-01',
      'abc-1': '2026-01-02',
      'abc-2': '2026-01-03',
    };
    const result = checkDuplicateLocal(ids, 'abc');

    expect(result.isDuplicate).toBe(true);
    expect(result.suggestedId).toBe('abc-3');
  });
});
