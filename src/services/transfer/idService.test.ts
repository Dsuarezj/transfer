import { describe, it, expect, vi, beforeEach } from 'vitest';
import { idService } from './idService';
import { fileService } from '../dropbox/fileService';

vi.mock('../dropbox/fileService');

describe('idService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDuplicate', () => {
    it('returns isDuplicate false when ID does not exist', () => {
      const ids = { 'other-id': '2026-01-01' };

      const result = idService.checkDuplicate(ids, 'new-id');

      expect(result.isDuplicate).toBe(false);
    });

    it('returns isDuplicate true when ID exists', () => {
      const ids = { 'existing-id': '2026-01-01' };

      const result = idService.checkDuplicate(ids, 'existing-id');

      expect(result.isDuplicate).toBe(true);
    });

    it('returns suggestedId with suffix when duplicate exists', () => {
      const ids = { 'my-id': '2026-01-01' };

      const result = idService.checkDuplicate(ids, 'my-id');

      expect(result.suggestedId).toBe('my-id-1');
    });

    it('increments suffix until finding available ID', () => {
      const ids = {
        'my-id': '2026-01-01',
        'my-id-1': '2026-01-02',
        'my-id-2': '2026-01-03',
      };

      const result = idService.checkDuplicate(ids, 'my-id');

      expect(result.suggestedId).toBe('my-id-3');
    });

    it('normalizes input to lowercase', () => {
      const ids = { 'my-id': '2026-01-01' };

      const result = idService.checkDuplicate(ids, 'MY-ID');

      expect(result.isDuplicate).toBe(true);
      expect(result.suggestedId).toBe('my-id-1');
    });
  });

  describe('getAll', () => {
    it('returns empty object when file does not exist', async () => {
      vi.mocked(fileService.get).mockRejectedValue(new Error('not found'));

      const result = await idService.getAll();

      expect(result).toEqual({});
    });

    it('returns parsed IDs from file', async () => {
      const existingIds = { 'id-a': '2026-01-01', 'id-b': '2026-01-02' };
      vi.mocked(fileService.get).mockResolvedValue(JSON.stringify(existingIds));

      const result = await idService.getAll();

      expect(result).toEqual(existingIds);
    });
  });

  describe('add', () => {
    it('saves ID to transfer-ids.json', async () => {
      vi.mocked(fileService.get).mockResolvedValue(JSON.stringify({}));
      vi.mocked(fileService.update).mockResolvedValue(undefined);

      await idService.add('new-id', '2026-01-15');

      expect(fileService.update).toHaveBeenCalledWith(
        '/transfer-ids.json',
        expect.any(Blob)
      );
    });

    it('normalizes ID to lowercase before saving', async () => {
      vi.mocked(fileService.get).mockResolvedValue(JSON.stringify({}));
      vi.mocked(fileService.update).mockResolvedValue(undefined);

      await idService.add('MY-NEW-ID', '2026-01-15');

      expect(fileService.update).toHaveBeenCalled();
      vi.mocked(fileService.get).mockResolvedValue(JSON.stringify({ 'my-new-id': '2026-01-15' }));
      const ids = await idService.getAll();
      expect(ids['my-new-id']).toBe('2026-01-15');
    });

    it('preserves existing IDs when adding new one', async () => {
      vi.mocked(fileService.get).mockResolvedValue(JSON.stringify({
        'existing': '2026-01-01',
      }));
      vi.mocked(fileService.update).mockResolvedValue(undefined);

      await idService.add('new-id', '2026-01-15');

      expect(fileService.update).toHaveBeenCalledWith(
        '/transfer-ids.json',
        expect.any(Blob)
      );
    });
  });

  describe('addWithIds', () => {
    it('saves using provided IDs object without fetching', async () => {
      vi.mocked(fileService.update).mockResolvedValue(undefined);
      const existingIds = { 'old-id': '2026-01-01' };

      await idService.addWithIds('new-id', '2026-01-15', existingIds);

      expect(fileService.get).not.toHaveBeenCalled();
      expect(fileService.update).toHaveBeenCalled();
    });

    it('adds new ID to provided IDs object', async () => {
      vi.mocked(fileService.update).mockResolvedValue(undefined);
      const existingIds: Record<string, string> = { 'old-id': '2026-01-01' };

      await idService.addWithIds('new-id', '2026-01-15', existingIds);

      expect(existingIds['new-id']).toBe('2026-01-15');
      expect(fileService.update).toHaveBeenCalled();
    });
  });

  describe('prepare', () => {
    it('returns empty finalNumber for empty input', () => {
      const result = idService.prepare({}, '');

      expect(result.isDuplicate).toBe(false);
      expect(result.finalNumber).toBe('');
    });

    it('returns empty finalNumber for whitespace-only input', () => {
      const result = idService.prepare({}, '   ');

      expect(result.isDuplicate).toBe(false);
      expect(result.finalNumber).toBe('');
    });

    it('returns normalized number when not duplicate', () => {
      const result = idService.prepare({ 'other': '2026-01-01' }, 'NEW-ID');

      expect(result.isDuplicate).toBe(false);
      expect(result.finalNumber).toBe('new-id');
    });

    it('returns suggested ID when duplicate', () => {
      const result = idService.prepare({ 'existing-id': '2026-01-01' }, 'existing-id');

      expect(result.isDuplicate).toBe(true);
      expect(result.finalNumber).toBe('existing-id-1');
    });

    it('trims input before checking', () => {
      const result = idService.prepare({ 'my-id': '2026-01-01' }, '  my-id  ');

      expect(result.isDuplicate).toBe(true);
      expect(result.finalNumber).toBe('my-id-1');
    });
  });
});
