export interface DropboxConfig {
  clientId: string;
  redirectUri: string;
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface Invoice {
  date: string;
  time: string;
  invoiceNumber: string;
  transferNumber?: string;
  imageUrl: string;
}

export type TransferIds = Record<string, string>;

