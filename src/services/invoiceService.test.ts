import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoiceService } from './invoiceService';
import { fileService } from './dropbox/fileService';
import { transferIdService } from './transferIdService';
import { mockCsvContent, mockInvoice } from '../test/fixtures/invoices';

vi.mock('./dropbox/fileService');
vi.mock('./transferIdService');

describe('InvoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByMonth', () => {
    it('debe retornar lista de facturas cuando el archivo existe', async () => {
      vi.mocked(fileService.get).mockResolvedValue(mockCsvContent);

      const result = await invoiceService.getByMonth('2024-01');

      expect(result).toHaveLength(2);
      expect(result[0].invoiceNumber).toBe('FAC-001');
    });

    it('debe retornar array vacío cuando el archivo no existe', async () => {
      vi.mocked(fileService.get).mockRejectedValue(
        new Error('File not found')
      );

      const result = await invoiceService.getByMonth('2024-01');

      expect(result).toEqual([]);
    });
  });

  describe('uploadPhoto', () => {
    it('debe subir foto y retornar la URL completa', async () => {
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

