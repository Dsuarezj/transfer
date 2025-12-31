import { Dropbox, DropboxAuth } from 'dropbox';
import { format } from 'date-fns';

const CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID || 'YOUR_DROPBOX_CLIENT_ID';
const REDIRECT_URI = window.location.origin + '/login';

export class DropboxService {
  private dbx: Dropbox | null = null;
  private dbxAuth: DropboxAuth;

  constructor() {
    this.dbxAuth = new DropboxAuth({
      clientId: CLIENT_ID,
    });
  }

  async getAuthUrl(): Promise<string> {
    const url = await this.dbxAuth.getAuthenticationUrl(
      REDIRECT_URI,
      undefined,
      'code',
      'offline',
      undefined,
      undefined,
      true
    );
    return String(url);
  }

  async handleRedirect(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      const accessToken = localStorage.getItem('dropbox_access_token');
      if (accessToken) {
        this.dbxAuth.setAccessToken(accessToken);
        this.dbx = new Dropbox({ auth: this.dbxAuth });
        return true;
      }
      return false;
    }

    try {
      this.dbxAuth.setCodeVerifier(window.sessionStorage.getItem('codeVerifier') || '');
      const response = await this.dbxAuth.getAccessTokenFromCode(REDIRECT_URI, code);

      const accessToken = (response.result as any).access_token;
      localStorage.setItem('dropbox_access_token', accessToken);
      this.dbxAuth.setAccessToken(accessToken);
      this.dbx = new Dropbox({ auth: this.dbxAuth });

      window.history.replaceState({}, document.title, '/');
      return true;
    } catch (error) {
      console.error('Error getting access token:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('dropbox_access_token');
  }

  logout() {
    localStorage.removeItem('dropbox_access_token');
    this.dbx = null;
  }

  async uploadPhoto(photoBlob: Blob, invoiceNumber: string): Promise<string> {
    if (!this.dbx) throw new Error('Not authenticated');

    const fileName = `transferencia_${invoiceNumber}_${Date.now()}.jpg`;
    const path = `/transferencias/${fileName}`;

    try {
      const response = await this.dbx.filesUpload({
        path,
        contents: photoBlob,
        mode: { '.tag': 'add' },
        autorename: true,
      });

      const sharedLink = await this.dbx.sharingCreateSharedLinkWithSettings({
        path: response.result.path_display || path,
      });

      return sharedLink.result.url.replace('?dl=0', '?raw=1');
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  async updateCSV(invoiceNumber: string, imageUrl: string, transferNumber?: string) {
    if (!this.dbx) throw new Error('Not authenticated');

    const csvPath = '/transferencias/facturas.csv';
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = format(now, 'HH:mm:ss');

    const newLine = `${date},${time},${invoiceNumber},${transferNumber || ''},${imageUrl}\n`;

    try {
      let existingContent = '';
      try {
        const response = await this.dbx.filesDownload({ path: csvPath });
        const blob = (response.result as any).fileBlob;
        existingContent = await blob.text();
      } catch (error: any) {
        if (error.status === 409) {
          existingContent = 'Fecha,Hora,Numero_Factura,Numero_Transferencia,Link_Imagen\n';
        } else {
          throw error;
        }
      }

      const updatedContent = existingContent + newLine;
      const blob = new Blob([updatedContent], { type: 'text/csv' });

      await this.dbx.filesUpload({
        path: csvPath,
        contents: blob,
        mode: { '.tag': 'overwrite' },
      });
    } catch (error) {
      console.error('Error updating CSV:', error);
      throw error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    if (!this.dbx) throw new Error('Not authenticated');

    const csvPath = '/transferencias/facturas.csv';

    try {
      const response = await this.dbx.filesDownload({ path: csvPath });
      const blob = (response.result as any).fileBlob;
      const content = await blob.text();

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
      if (error.status === 409) {
        return [];
      }
      throw error;
    }
  }

  async checkDuplicateTransfer(transferNumber: string): Promise<boolean> {
    if (!transferNumber) return false;

    try {
      const invoices = await this.getInvoices();
      return invoices.some(inv => inv.transferNumber === transferNumber);
    } catch {
      return false;
    }
  }
}

export interface Invoice {
  date: string;
  time: string;
  invoiceNumber: string;
  transferNumber?: string;
  imageUrl: string;
}

export const dropboxService = new DropboxService();
