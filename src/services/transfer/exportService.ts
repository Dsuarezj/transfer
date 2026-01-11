import { format } from 'date-fns';
import { Invoice } from '../../types/dropbox';

function generateCSV(transfers: Invoice[]): string {
  const header = 'Fecha,Hora,Numero_Comprobante,Numero_Transferencia\n';
  const rows = transfers.map(t =>
    `${t.date},${t.time},${t.invoiceNumber},${t.transferNumber || ''}`
  ).join('\n');

  return header + rows;
}

function generatePDFHTML(transfers: Invoice[], dateRangeLabel: string): string {
  const tableRows = transfers.map(t => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.date}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.time}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.invoiceNumber}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.transferNumber || '-'}</td>
      </tr>
    `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Reporte de Transferencias</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #1a365d; font-size: 24px; }
    .info { color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #1a365d; color: white; padding: 10px; text-align: left; }
    tr:nth-child(even) { background: #f9f9f9; }
    .footer { margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Reporte de Transferencias</h1>
  <p class="info">Periodo: ${dateRangeLabel} | Total: ${transfers.length} transferencias</p>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Hora</th>
        <th>Comprobante</th>
        <th>N° Transferencia</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  <p class="footer">Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm")}</p>
</body>
</html>`;
}

export const exportService = {
  generateCSV,
  generatePDFHTML,
};

