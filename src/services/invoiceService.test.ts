import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoiceService } from './invoiceService';
import { fileService } from './dropbox/fileService';
import { mockCsvContent } from '../test/fixtures/invoices';

vi.mock('./dropbox/fileService');
vi.mock('./transferIdService');

describe('InvoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns invoices in reverse order (most recent first)', async () => {
      vi.mocked(fileService.get).mockResolvedValue(mockCsvContent);

      const result = await invoiceService.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].invoiceNumber).toBe('FAC-002');
      expect(result[1].invoiceNumber).toBe('FAC-001');
    });

    it('returns empty array when file does not exist', async () => {
      vi.mocked(fileService.get).mockRejectedValue(
        new Error('File not found')
      );

      const result = await invoiceService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('uploadPhoto', () => {
    it('uploads photo and returns full URL', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      const mockUrl = 'https://dropbox.com/capturas/FAC-001_20240115_103000.jpg';

      vi.mocked(fileService.save).mockResolvedValue(undefined);
      vi.mocked(fileService.getFullPath).mockReturnValue(mockUrl);

      const result = await invoiceService.uploadPhoto(mockBlob, 'FAC-001');

      expect(fileService.save).toHaveBeenCalledWith(
        expect.stringContaining('FAC-001'),
        mockBlob
      );
      expect(result).toBe(mockUrl);
    });
  });
});

