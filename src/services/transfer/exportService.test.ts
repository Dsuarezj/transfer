import { describe, it, expect } from 'vitest';
import { exportService } from './exportService';
import { Invoice } from '../../types/dropbox';

describe('exportService', () => {
  const mockTransfers: Invoice[] = [
    {
      date: '2026-01-10',
      time: '10:30:00',
      invoiceNumber: 'FAC-001',
      transferNumber: 'TRF-001',
      imageUrl: 'https://dropbox.com/file1.jpg',
    },
    {
      date: '2026-01-11',
      time: '14:20:00',
      invoiceNumber: 'SIN-FACTURA',
      transferNumber: '',
      imageUrl: 'https://dropbox.com/file2.jpg',
    },
  ];

  describe('generateCSV', () => {
    it('generates CSV with header row', () => {
      const result = exportService.generateCSV(mockTransfers);

      expect(result).toContain('Fecha,Hora,Numero_Comprobante,Numero_Transferencia');
    });

    it('includes all transfer data in CSV rows', () => {
      const result = exportService.generateCSV(mockTransfers);

      expect(result).toContain('2026-01-10,10:30:00,FAC-001,TRF-001');
      expect(result).toContain('2026-01-11,14:20:00,SIN-FACTURA,');
    });

    it('handles empty transfer number', () => {
      const transfers: Invoice[] = [
        {
          date: '2026-01-10',
          time: '10:30:00',
          invoiceNumber: 'FAC-001',
          transferNumber: undefined,
          imageUrl: 'https://dropbox.com/file1.jpg',
        },
      ];

      const result = exportService.generateCSV(transfers);

      expect(result).toContain('2026-01-10,10:30:00,FAC-001,');
    });

    it('generates correct number of lines', () => {
      const result = exportService.generateCSV(mockTransfers);
      const lines = result.split('\n').filter(line => line.trim());

      expect(lines.length).toBe(3);
    });

    it('handles empty array', () => {
      const result = exportService.generateCSV([]);
      const lines = result.split('\n').filter(line => line.trim());

      expect(lines.length).toBe(1);
      expect(result).toContain('Fecha,Hora,Numero_Comprobante,Numero_Transferencia');
    });
  });

  describe('generatePDFHTML', () => {
    it('includes title in HTML', () => {
      const result = exportService.generatePDFHTML(mockTransfers, '10 ene - 11 ene');

      expect(result).toContain('Reporte de Transferencias');
    });

    it('includes date range and count in info', () => {
      const result = exportService.generatePDFHTML(mockTransfers, '10 ene - 11 ene');

      expect(result).toContain('10 ene - 11 ene');
      expect(result).toContain('2 transferencias');
    });

    it('includes table headers', () => {
      const result = exportService.generatePDFHTML(mockTransfers, '10 ene - 11 ene');

      expect(result).toContain('<th>Fecha</th>');
      expect(result).toContain('<th>Hora</th>');
      expect(result).toContain('<th>Comprobante</th>');
      expect(result).toContain('<th>N° Transferencia</th>');
    });

    it('includes all transfer data in table rows', () => {
      const result = exportService.generatePDFHTML(mockTransfers, '10 ene - 11 ene');

      expect(result).toContain('2026-01-10');
      expect(result).toContain('10:30:00');
      expect(result).toContain('FAC-001');
      expect(result).toContain('TRF-001');
      expect(result).toContain('SIN-FACTURA');
    });

    it('handles empty transfer number with dash', () => {
      const transfers: Invoice[] = [
        {
          date: '2026-01-10',
          time: '10:30:00',
          invoiceNumber: 'FAC-001',
          transferNumber: undefined,
          imageUrl: 'https://dropbox.com/file1.jpg',
        },
      ];

      const result = exportService.generatePDFHTML(transfers, '10 ene');

      expect(result).toContain('-</td>');
    });

    it('includes generation timestamp', () => {
      const result = exportService.generatePDFHTML(mockTransfers, '10 ene - 11 ene');

      expect(result).toContain('Generado el');
    });

    it('handles empty array', () => {
      const result = exportService.generatePDFHTML([], '10 ene - 11 ene');

      expect(result).toContain('0 transferencias');
      expect(result).toContain('<tbody>');
      expect(result).toContain('</tbody>');
    });
  });
});

