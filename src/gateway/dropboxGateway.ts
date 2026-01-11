import { Dropbox } from 'dropbox';
import { TokenData } from '../types/dropbox';
import { STORAGE_KEYS } from '../constants/storageKeys';

const CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID || 'YOUR_DROPBOX_CLIENT_ID';
const REDIRECT_URI = window.location.origin + '/callback';

class DropboxGateway {
  private dbx: Dropbox | null = null;
  private tokenData: TokenData | null = null;

  constructor() {
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    const accessToken = localStorage.getItem(STORAGE_KEYS.DROPBOX_ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.DROPBOX_REFRESH_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.DROPBOX_EXPIRES_AT);
    
    if (accessToken && expiresAt) {
      this.tokenData = {
        access_token: accessToken,
        refresh_token: refreshToken || undefined,
        expires_at: parseInt(expiresAt)
      };
      this.dbx = new Dropbox({ accessToken });
    }
  }

  saveToken(tokenData: TokenData) {
    this.tokenData = tokenData;
    localStorage.setItem(STORAGE_KEYS.DROPBOX_ACCESS_TOKEN, tokenData.access_token);
    localStorage.setItem(STORAGE_KEYS.DROPBOX_EXPIRES_AT, tokenData.expires_at.toString());
    if (tokenData.refresh_token) {
      localStorage.setItem(STORAGE_KEYS.DROPBOX_REFRESH_TOKEN, tokenData.refresh_token);
    }
    this.dbx = new Dropbox({ accessToken: tokenData.access_token });
  }

  clearToken() {
    this.tokenData = null;
    this.dbx = null;
    localStorage.clear();
  }

  getTokenData(): TokenData | null {
    return this.tokenData;
  }

  async refreshTokenIfNeeded(): Promise<void> {
    if (!this.tokenData) throw new Error('Not authenticated');

    const bufferTime = 5 * 60 * 1000;
    const isExpiring = Date.now() >= (this.tokenData.expires_at - bufferTime);

    if (isExpiring && this.tokenData.refresh_token) {
      const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokenData.refresh_token,
          client_id: CLIENT_ID,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.saveToken({
          access_token: data.access_token,
          refresh_token: data.refresh_token || this.tokenData.refresh_token,
          expires_at: Date.now() + (data.expires_in * 1000)
        });
      }
    }
  }

  getClient(): Dropbox {
    if (!this.dbx) throw new Error('Not authenticated');
    return this.dbx;
  }

  getClientId(): string {
    return CLIENT_ID;
  }

  getRedirectUri(): string {
    return REDIRECT_URI;
  }

  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenData | null> {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000)
    };
  }

}

export const dropboxGateway = new DropboxGateway();
