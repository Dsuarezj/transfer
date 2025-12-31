import { format } from 'date-fns';
import { fileService } from './dropbox/fileService';
import { Invoice } from '../types/dropbox';

class InvoiceService {
  private readonly csvPath = '/facturas.csv';

  async uploadPhoto(photoBlob: Blob, invoiceNumber: string): Promise<string> {
    const fileName = `transferencia_${invoiceNumber}_${Date.now()}.jpg`;
    const path = `/${fileName}`;

    await fileService.save(path, photoBlob);
    return await fileService.createSharedLink(path);
  }

  async add(invoiceNumber: string, imageUrl: string, transferNumber?: string): Promise<void> {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = format(now, 'HH:mm:ss');
    const newLine = `${date},${time},${invoiceNumber},${transferNumber || ''},${imageUrl}\n`;

    let existingContent = '';
    try {
      existingContent = await fileService.get(this.csvPath);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        existingContent = 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Link_Imagen\n';
      } else {
        throw error;
      }
    }

    const updatedContent = existingContent + newLine;
    const blob = new Blob([updatedContent], { type: 'text/csv' });
    await fileService.update(this.csvPath, blob);
  }

  async getAll(): Promise<Invoice[]> {
    try {
      const content = await fileService.get(this.csvPath);
      const lines = content.split('\n').filter((line: string) => line.trim());
      const invoices: Invoice[] = [];

      for (let i = 1; i < lines.length; i++) {
        const [date, time, invoiceNumber, transferNumber, imageUrl] = lines[i].split(',');
        if (date && invoiceNumber) {
          invoices.push({
            date,
            time,
            invoiceNumber,
            transferNumber: transferNumber || undefined,
            imageUrl,
          });
        }
      }

      return invoices.reverse();
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return [];
      }
      throw error;
    }
  }

  async checkDuplicate(transferNumber: string): Promise<boolean> {
    if (!transferNumber) return false;

    try {
      const invoices = await this.getAll();
      return invoices.some(inv => inv.transferNumber === transferNumber);
    } catch {
      return false;
    }
  }
}

export const invoiceService = new InvoiceService();

