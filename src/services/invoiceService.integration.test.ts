import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';

const createMockImageBlob = () => new Blob(['fake-image-data'], { type: 'image/jpeg' });

let uploadedFiles: { path: string; size: number }[] = [];
let downloadResponses: Record<string, string> = {};

vi.mock('./dropbox/fileService', () => ({
  fileService: {
    save: vi.fn(async (path: string, content: Blob | string) => {
      const size = content instanceof Blob ? content.size : content.length;
      uploadedFiles.push({ path, size });
    }),
    update: vi.fn(async (path: string, content: Blob | string) => {
      const size = content instanceof Blob ? content.size : content.length;
      uploadedFiles.push({ path, size });
    }),
    get: vi.fn(async (path: string) => {
      const fullPath = `/Apps/Transferido${path}`;
      const content = downloadResponses[fullPath];
      if (!content) {
        throw new Error('File not found');
      }
      return content;
    }),
    getFullPath: vi.fn((path: string) => `/Apps/Transferido${path}`),
  },
}));

describe('invoiceService integration', () => {
  beforeEach(async () => {
    uploadedFiles = [];
    downloadResponses = {};
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:30:45'));
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveWithPhoto', () => {
    it('uploads image to correct path with timestamp', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/reportes/resumen.csv'] =
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';

      const photoBlob = createMockImageBlob();

      await invoiceService.saveWithPhoto(photoBlob, 'FAC-001');

      const imageUpload = uploadedFiles.find(f => f.path.includes('/capturas/'));
      expect(imageUpload).toBeDefined();
      expect(imageUpload?.path).toContain('FAC-001_20260115_103045.jpg');
    });

    it('uploads CSV file when saving', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/reportes/resumen.csv'] =
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';

      const photoBlob = createMockImageBlob();

      await invoiceService.saveWithPhoto(photoBlob, 'FAC-001', 'TRF-001');

      const csvUpload = uploadedFiles.find(f => f.path.includes('resumen.csv'));
      expect(csvUpload).toBeDefined();
    });

    it('creates CSV when file does not exist', async () => {
      const { invoiceService } = await import('./invoiceService');

      const photoBlob = createMockImageBlob();

      await invoiceService.saveWithPhoto(photoBlob, 'FAC-001');

      const csvUpload = uploadedFiles.find(f => f.path.includes('resumen.csv'));
      expect(csvUpload).toBeDefined();
    });

    it('uses suggested ID when preloadedCheck is provided', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/reportes/resumen.csv'] =
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';

      const photoBlob = createMockImageBlob();
      const preloadedCheck = {
        suggestedId: 'trf-001-2',
        loadedIds: { 'trf-001': '2026-01-01', 'trf-001-1': '2026-01-02' },
      };

      const result = await invoiceService.saveWithPhoto(
        photoBlob,
        'FAC-001',
        'TRF-001',
        preloadedCheck
      );

      expect(result).toBe('trf-001-2');
    });

    it('uploads transfer-ids.json when transfer number is provided with preloaded check', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/reportes/resumen.csv'] =
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';

      const photoBlob = createMockImageBlob();
      const preloadedCheck = {
        suggestedId: 'trf-new',
        loadedIds: { 'existing': '2026-01-01' },
      };

      await invoiceService.saveWithPhoto(photoBlob, 'FAC-001', 'TRF-NEW', preloadedCheck);

      const idsUpload = uploadedFiles.find(f => f.path.includes('transfer-ids.json'));
      expect(idsUpload).toBeDefined();
    });

    it('uploads at least image and CSV', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/reportes/resumen.csv'] =
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';

      const photoBlob = createMockImageBlob();

      await invoiceService.saveWithPhoto(photoBlob, 'FAC-001');

      expect(uploadedFiles.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty string when no transfer number provided', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/reportes/resumen.csv'] =
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';

      const photoBlob = createMockImageBlob();

      const result = await invoiceService.saveWithPhoto(photoBlob, 'FAC-001');

      expect(result).toBe('');
    });
  });

  describe('checkTransferDuplicate', () => {
    it('returns isDuplicate false when ID does not exist', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/transfer-ids.json'] = JSON.stringify({
        'other-id': '2026-01-01',
      });

      const result = await invoiceService.checkTransferDuplicate('NEW-ID');

      expect(result.isDuplicate).toBe(false);
      expect(result.suggestedId).toBe('new-id');
    });

    it('returns isDuplicate true with suggested ID when ID exists', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/transfer-ids.json'] = JSON.stringify({
        'existing-id': '2026-01-01',
      });

      const result = await invoiceService.checkTransferDuplicate('EXISTING-ID');

      expect(result.isDuplicate).toBe(true);
      expect(result.suggestedId).toBe('existing-id-1');
    });

    it('returns loadedIds for reuse in subsequent operations', async () => {
      const { invoiceService } = await import('./invoiceService');

      const existingIds = {
        'id-a': '2026-01-01',
        'id-b': '2026-01-02',
      };
      downloadResponses['/Apps/Transferido/transfer-ids.json'] = JSON.stringify(existingIds);

      const result = await invoiceService.checkTransferDuplicate('NEW-ID');

      expect(result.loadedIds).toEqual(existingIds);
    });

    it('handles empty transfer-ids.json gracefully', async () => {
      const { invoiceService } = await import('./invoiceService');

      const result = await invoiceService.checkTransferDuplicate('ANY-ID');

      expect(result.isDuplicate).toBe(false);
      expect(result.suggestedId).toBe('any-id');
      expect(result.loadedIds).toEqual({});
    });
  });

  describe('getAll', () => {
    it('returns invoices in reverse chronological order', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/reportes/resumen.csv'] =
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n' +
        '2026-01-01,09:00:00,FAC-001,TRF-001,/path/1.jpg\n' +
        '2026-01-02,10:00:00,FAC-002,TRF-002,/path/2.jpg\n' +
        '2026-01-03,11:00:00,FAC-003,TRF-003,/path/3.jpg\n';

      const invoices = await invoiceService.getAll();

      expect(invoices).toHaveLength(3);
      expect(invoices[0].invoiceNumber).toBe('FAC-003');
      expect(invoices[2].invoiceNumber).toBe('FAC-001');
    });

    it('returns empty array when CSV does not exist', async () => {
      const { invoiceService } = await import('./invoiceService');

      const invoices = await invoiceService.getAll();

      expect(invoices).toEqual([]);
    });

    it('parses transfer number correctly', async () => {
      const { invoiceService } = await import('./invoiceService');

      downloadResponses['/Apps/Transferido/reportes/resumen.csv'] =
        'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n' +
        '2026-01-01,09:00:00,FAC-001,TRF-123,/path/1.jpg\n';

      const invoices = await invoiceService.getAll();

      expect(invoices[0].transferNumber).toBe('TRF-123');
    });
  });
});
