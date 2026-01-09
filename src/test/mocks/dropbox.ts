import { vi } from 'vitest';

export const mockDropboxAuth = {
  getAuthenticationUrl: vi.fn(),
  getAccessTokenFromCode: vi.fn(),
  isAuthenticated: vi.fn(),
  logout: vi.fn(),
};

export const mockFileService = {
  save: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  getFullPath: vi.fn(),
  delete: vi.fn(),
};

export const mockTransferIdService = {
  checkDuplicateWithSuggestion: vi.fn(),
  addWithIds: vi.fn(),
};

