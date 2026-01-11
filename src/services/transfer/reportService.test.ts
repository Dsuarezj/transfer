import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportService } from './reportService';
import { fileService } from '../dropbox/fileService';

vi.mock('../dropbox/fileService', () => ({
  fileService: {
    get: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  },
}));

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:30:45'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('save', () => {
    it('saves to monthly CSV file based on current date', async () => {
      vi.mocked(fileService.get).mockRejectedValue(new Error('File not found'));
      vi.mocked(fileService.save).mockResolvedValue(undefined);

      await reportService.save({
        invoiceNumber: 'FAC-001',
        transferNumber: 'TRF-001',
        imageUrl: '/path/image.jpg',
      });

      expect(fileService.save).toHaveBeenCalledWith(
        '/reportes/transfers-2026-01.csv',
        expect.any(Blob)
      );
    });

    it('creates file using save when file does not exist', async () => {
      vi.mocked(fileService.get).mockRejectedValue(new Error('File not found'));
      vi.mocked(fileService.save).mockResolvedValue(undefined);

      await reportService.save({
        invoiceNumber: 'FAC-001',
        transferNumber: 'TRF-001',
        imageUrl: '/path/image.jpg',
      });

      expect(fileService.get).toHaveBeenCalledWith('/reportes/transfers-2026-01.csv');
      expect(fileService.save).toHaveBeenCalledWith(
        '/reportes/transfers-2026-01.csv',
        expect.any(Blob)
      );
      expect(fileService.update).not.toHaveBeenCalled();
    });

    it('appends to existing CSV content', async () => {
      const existingCsv = 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n' +
        '2026-01-10,09:00:00,FAC-OLD,TRF-OLD,/old.jpg\n';
      vi.mocked(fileService.get).mockResolvedValue(existingCsv);
      vi.mocked(fileService.update).mockResolvedValue(undefined);

      await reportService.save({
        invoiceNumber: 'FAC-NEW',
        transferNumber: 'TRF-NEW',
        imageUrl: '/new.jpg',
      });

      expect(fileService.update).toHaveBeenCalledWith(
        '/reportes/transfers-2026-01.csv',
        expect.any(Blob)
      );
    });

    it('creates CSV with headers when file does not exist', async () => {
      vi.mocked(fileService.get).mockRejectedValue(new Error('File not found'));
      vi.mocked(fileService.save).mockResolvedValue(undefined);

      await reportService.save({
        invoiceNumber: 'FAC-001',
        transferNumber: 'TRF-001',
        imageUrl: '/path.jpg',
      });

      expect(fileService.save).toHaveBeenCalledWith(
        '/reportes/transfers-2026-01.csv',
        expect.any(Blob)
      );
    });

    it('includes date and time in saved record', async () => {
      vi.mocked(fileService.get).mockRejectedValue(new Error('File not found'));
      vi.mocked(fileService.save).mockResolvedValue(undefined);

      await reportService.save({
        invoiceNumber: 'FAC-001',
        transferNumber: 'TRF-001',
        imageUrl: '/path.jpg',
      });

      expect(fileService.save).toHaveBeenCalled();
    });
  });

  describe('getByMonth', () => {
    it('returns parsed invoices for specified month', async () => {
      const csvContent = 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n' +
        '2026-01-05,09:00:00,FAC-001,TRF-001,/path/1.jpg\n' +
        '2026-01-10,14:00:00,FAC-002,TRF-002,/path/2.jpg\n';
      vi.mocked(fileService.get).mockResolvedValue(csvContent);

      const result = await reportService.getByMonth('2026-01');

      expect(result).toHaveLength(2);
      expect(result[0].invoiceNumber).toBe('FAC-001');
      expect(result[1].invoiceNumber).toBe('FAC-002');
    });

    it('returns empty array when month file does not exist', async () => {
      vi.mocked(fileService.get).mockRejectedValue(new Error('File not found'));

      const result = await reportService.getByMonth('2026-02');

      expect(result).toEqual([]);
    });

    it('reads from correct monthly file path', async () => {
      vi.mocked(fileService.get).mockResolvedValue('Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n');

      await reportService.getByMonth('2025-12');

      expect(fileService.get).toHaveBeenCalledWith('/reportes/transfers-2025-12.csv');
    });
  });

  describe('getByDateRange', () => {
    it('combines data from multiple months', async () => {
      vi.mocked(fileService.get).mockImplementation(async (path: string) => {
        if (path.includes('2025-12')) {
          return 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n' +
            '2025-12-20,10:00:00,FAC-DEC,TRF-DEC,/dec.jpg\n';
        }
        if (path.includes('2026-01')) {
          return 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n' +
            '2026-01-05,10:00:00,FAC-JAN,TRF-JAN,/jan.jpg\n';
        }
        throw new Error('File not found');
      });

      const result = await reportService.getByDateRange(
        new Date('2025-12-01'),
        new Date('2026-01-31')
      );

      expect(result).toHaveLength(2);
      const numbers = result.map(r => r.invoiceNumber);
      expect(numbers).toContain('FAC-DEC');
      expect(numbers).toContain('FAC-JAN');
    });

    it('filters records outside the date range', async () => {
      vi.mocked(fileService.get).mockResolvedValue(
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n' +
        '2026-01-05,10:00:00,FAC-EARLY,TRF-1,/1.jpg\n' +
        '2026-01-15,10:00:00,FAC-IN-RANGE,TRF-2,/2.jpg\n' +
        '2026-01-25,10:00:00,FAC-LATE,TRF-3,/3.jpg\n'
      );

      const result = await reportService.getByDateRange(
        new Date('2026-01-10'),
        new Date('2026-01-20')
      );

      expect(result).toHaveLength(1);
      expect(result[0].invoiceNumber).toBe('FAC-IN-RANGE');
    });

    it('returns records sorted by date descending', async () => {
      vi.mocked(fileService.get).mockImplementation(async (path: string) => {
        if (path.includes('2026-01')) {
          return 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n' +
            '2026-01-01,10:00:00,FAC-JAN-01,TRF-1,/1.jpg\n' +
            '2026-01-15,10:00:00,FAC-JAN-15,TRF-2,/2.jpg\n' +
            '2026-01-10,10:00:00,FAC-JAN-10,TRF-3,/3.jpg\n';
        }
        throw new Error('File not found');
      });

      const result = await reportService.getByDateRange(
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      expect(result).toHaveLength(3);
      expect(result[0].invoiceNumber).toBe('FAC-JAN-15');
      expect(result[1].invoiceNumber).toBe('FAC-JAN-10');
      expect(result[2].invoiceNumber).toBe('FAC-JAN-01');
    });
  });
});

