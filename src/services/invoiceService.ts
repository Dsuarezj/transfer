import { format, subDays, parse, isAfter, isBefore, startOfDay } from 'date-fns';
import { fileService } from './dropbox/fileService';
import { transferIdService } from './transferIdService';
import { Invoice } from '../types/dropbox';

class InvoiceService {
  private getCsvPath(yearMonth: string): string {
    return `/reportes/transfers-${yearMonth}.csv`;
  }

  private getCurrentMonthPath(): string {
    const yearMonth = format(new Date(), 'yyyy-MM');
    return this.getCsvPath(yearMonth);
  }

  async uploadPhoto(photoBlob: Blob, invoiceNumber: string): Promise<string> {
    const now = new Date();
    const timestamp = format(now, 'yyyyMMdd_HHmmss');
    const fileName = `${invoiceNumber}_${timestamp}.jpg`;
    const path = `/capturas/${fileName}`;

    await fileService.save(path, photoBlob);
    return fileService.getFullPath(path);
  }

  async add(invoiceNumber: string, imageUrl: string, transferNumber?: string): Promise<string> {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = format(now, 'HH:mm:ss');
    
    let finalTransferNumber = transferNumber || '';
    
    if (finalTransferNumber) {
      const { suggestedId } = await transferIdService.checkDuplicateWithSuggestion(finalTransferNumber);
      finalTransferNumber = suggestedId;
      await transferIdService.add(finalTransferNumber, date);
    }

    const newLine = `${date},${time},${invoiceNumber},${finalTransferNumber},${imageUrl}\n`;
    const csvPath = this.getCurrentMonthPath();

    let existingContent = '';
    try {
      existingContent = await fileService.get(csvPath);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        existingContent = 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';
      } else {
        throw error;
      }
    }

    const updatedContent = existingContent + newLine;
    const blob = new Blob([updatedContent], { type: 'text/csv' });
    await fileService.update(csvPath, blob);
    
    return finalTransferNumber;
  }

  async getByMonth(yearMonth: string): Promise<Invoice[]> {
    try {
      const csvPath = this.getCsvPath(yearMonth);
      const content = await fileService.get(csvPath);
      return this.parseCsv(content);
    } catch {
      return [];
    }
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]> {
    const months = this.getMonthsInRange(startDate, endDate);
    const allInvoices: Invoice[] = [];

    for (const month of months) {
      const invoices = await this.getByMonth(month);
      allInvoices.push(...invoices);
    }

    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    return allInvoices
      .filter(inv => {
        const invDate = startOfDay(parse(inv.date, 'yyyy-MM-dd', new Date()));
        return !isBefore(invDate, start) && !isAfter(invDate, end);
      })
      .sort((a, b) => {
        const dateA = parse(`${a.date} ${a.time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
        const dateB = parse(`${b.date} ${b.time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getLast7Days(): Promise<Invoice[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, 7);
    return this.getByDateRange(startDate, endDate);
  }

  async checkDuplicate(transferNumber: string): Promise<{
    isDuplicate: boolean;
    suggestedId: string;
  }> {
    return transferIdService.checkDuplicateWithSuggestion(transferNumber);
  }

  private parseCsv(content: string): Invoice[] {
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

    return invoices;
  }

  private getMonthsInRange(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      months.push(format(current, 'yyyy-MM'));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }
}

export const invoiceService = new InvoiceService();
