import { dropboxGateway } from '../../gateway/dropboxGateway';
import { STORAGE_KEYS } from '../../constants/storageKeys';

class AuthService {
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async getAuthUrl(): Promise<string> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    localStorage.setItem(STORAGE_KEYS.DROPBOX_CODE_VERIFIER, codeVerifier);
    
    const params = new URLSearchParams({
      client_id: dropboxGateway.getClientId(),
      response_type: 'code',
      redirect_uri: dropboxGateway.getRedirectUri(),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      token_access_type: 'offline'
    });

    return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  }

  async handleRedirect(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      const tokenData = dropboxGateway.getTokenData();
      return !!(tokenData && tokenData.access_token);
    }

    const codeVerifier = localStorage.getItem(STORAGE_KEYS.DROPBOX_CODE_VERIFIER);
    if (!codeVerifier) {
      return false;
    }

    const tokenData = await dropboxGateway.exchangeCodeForToken(code, codeVerifier);
    if (!tokenData) {
      localStorage.removeItem(STORAGE_KEYS.DROPBOX_CODE_VERIFIER);
      return false;
    }

    dropboxGateway.saveToken(tokenData);
    await dropboxGateway.ensureAppFolders(tokenData.access_token);
    localStorage.removeItem(STORAGE_KEYS.DROPBOX_CODE_VERIFIER);

    window.dispatchEvent(new Event('dropbox-auth-change'));

    return true;
  }

  isAuthenticated(): boolean {
    return !!dropboxGateway.getTokenData();
  }

  logout(): void {
    dropboxGateway.clearToken();
    window.dispatchEvent(new Event('dropbox-auth-change'));
    window.location.href = '/';
  }
}

export const authService = new AuthService();
