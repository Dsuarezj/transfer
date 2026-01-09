import { Invoice } from '../../types/dropbox';

export const mockInvoice: Invoice = {
  date: '2024-01-15',
  time: '10:30:00',
  invoiceNumber: 'FAC-001',
  transferNumber: 'TRF-001',
  imageUrl: 'https://example.com/image.jpg',
};

export const mockInvoices: Invoice[] = [
  mockInvoice,
  {
    date: '2024-01-16',
    time: '11:00:00',
    invoiceNumber: 'FAC-002',
    transferNumber: 'TRF-002',
    imageUrl: 'https://example.com/image2.jpg',
  },
];

export const mockCsvContent = `Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen
2024-01-15,10:30:00,FAC-001,TRF-001,https://example.com/image.jpg
2024-01-16,11:00:00,FAC-002,TRF-002,https://example.com/image2.jpg`;

