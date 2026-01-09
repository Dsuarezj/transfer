import { format } from 'date-fns';
import { fileService } from './dropbox/fileService';
import { transferIdService, TransferIds } from './transferIdService';
import { Invoice } from '../types/dropbox';

interface PreloadedCheck {
  suggestedId: string;
  loadedIds: TransferIds;
}

class InvoiceService {
  private readonly csvPath = '/reportes/resumen.csv';

  async checkTransferDuplicate(transferNumber: string) {
    return transferIdService.checkDuplicate(transferNumber);
  }

  async uploadPhoto(photoBlob: Blob, invoiceNumber: string): Promise<string> {
    const now = new Date();
    const timestamp = format(now, 'yyyyMMdd_HHmmss');
    const fileName = `${invoiceNumber}_${timestamp}.jpg`;
    const path = `/capturas/${fileName}`;

    await fileService.save(path, photoBlob);
    return fileService.getFullPath(path);
  }

  async saveWithPhoto(
    photoBlob: Blob,
    invoiceNumber: string,
    transferNumber?: string,
    preloadedCheck?: PreloadedCheck
  ): Promise<string> {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = format(now, 'HH:mm:ss');
    const timestamp = format(now, 'yyyyMMdd_HHmmss');
    const fileName = `${invoiceNumber}_${timestamp}.jpg`;
    const imagePath = `/capturas/${fileName}`;
    const imageUrl = fileService.getFullPath(imagePath);

    let finalTransferNumber = transferNumber || '';

    const parallelOps: Promise<any>[] = [];

    parallelOps.push(fileService.save(imagePath, photoBlob));

    const csvPromise = fileService.get(this.csvPath).catch((error: any) => {
      if (error.message?.includes('not found')) {
        return 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';
      }
      throw error;
    });
    parallelOps.push(csvPromise);

    if (finalTransferNumber && preloadedCheck) {
      finalTransferNumber = preloadedCheck.suggestedId;
      parallelOps.push(transferIdService.addWithIds(finalTransferNumber, date, preloadedCheck.loadedIds));
    }

    const results = await Promise.all(parallelOps);
    const existingContent = results[1] as string;

    const newLine = `${date},${time},${invoiceNumber},${finalTransferNumber},${imageUrl}\n`;
    const updatedContent = existingContent + newLine;
    const blob = new Blob([updatedContent], { type: 'text/csv' });

    await fileService.update(this.csvPath, blob);

    return finalTransferNumber;
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
        existingContent = 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';
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
