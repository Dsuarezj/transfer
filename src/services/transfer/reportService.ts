import { format, parse, isAfter, isBefore, startOfDay } from 'date-fns';
import { fileService } from '../dropbox/fileService';

interface SaveData {
  invoiceNumber: string;
  transferNumber: string;
  imageUrl: string;
}

interface Invoice {
  date: string;
  time: string;
  invoiceNumber: string;
  transferNumber?: string;
  imageUrl: string;
}

const CSV_HEADER = 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Ruta_Imagen\n';

function getCsvPath(yearMonth: string): string {
  return `/reportes/transfers-${yearMonth}.csv`;
}

function getCurrentMonthPath(): string {
  const yearMonth = format(new Date(), 'yyyy-MM');
  return getCsvPath(yearMonth);
}

function getMonthsInRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push(format(current, 'yyyy-MM'));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function parseCsv(content: string): Invoice[] {
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

async function save(data: SaveData): Promise<void> {
  const now = new Date();
  const date = format(now, 'yyyy-MM-dd');
  const time = format(now, 'HH:mm:ss');
  const csvPath = getCurrentMonthPath();

  let existingContent = '';
  try {
    existingContent = await fileService.get(csvPath);
  } catch {
    existingContent = CSV_HEADER;
  }

  const newLine = `${date},${time},${data.invoiceNumber},${data.transferNumber},${data.imageUrl}\n`;
  const updatedContent = existingContent + newLine;
  const blob = new Blob([updatedContent], { type: 'text/csv' });
  await fileService.update(csvPath, blob);
}

async function getByMonth(yearMonth: string): Promise<Invoice[]> {
  try {
    const csvPath = getCsvPath(yearMonth);
    const content = await fileService.get(csvPath);
    return parseCsv(content);
  } catch {
    return [];
  }
}

async function getByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]> {
  const months = getMonthsInRange(startDate, endDate);
  const allInvoices: Invoice[] = [];

  for (const month of months) {
    const invoices = await getByMonth(month);
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

export const reportService = {
  save,
  getByMonth,
  getByDateRange,
};

export type { Invoice, SaveData };
