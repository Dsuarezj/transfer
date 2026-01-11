import { describe, it, expect, vi, beforeEach } from 'vitest';
import { companyService } from './companyService';
import { dropboxGateway } from '../../gateway/dropboxGateway';
import { COMPANY_FOLDER_PREFIX, WORKSPACE_FOLDER_PREFIX } from '../../constants/dropbox';
import { STORAGE_KEYS } from '../../constants/storageKeys';

vi.mock('../../gateway/dropboxGateway', () => ({
  dropboxGateway: {
    getClient: vi.fn(),
    refreshTokenIfNeeded: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('companyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('detectCompanies', () => {
    it('returns empty array when no company folders exist', async () => {
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: { entries: [] },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await companyService.detectCompanies();

      expect(result).toEqual([]);
    });

    it('detects folders starting with company folder prefix', async () => {
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: {
            entries: [
              { name: `${COMPANY_FOLDER_PREFIX}mi-empresa`, '.tag': 'folder', path_lower: `/${COMPANY_FOLDER_PREFIX}mi-empresa`, id: 'id1' },
              { name: 'other-folder', '.tag': 'folder', path_lower: '/other-folder', id: 'id2' },
              { name: `${COMPANY_FOLDER_PREFIX}otra-empresa`, '.tag': 'folder', path_lower: `/${COMPANY_FOLDER_PREFIX}otra-empresa`, id: 'id3' },
            ],
          },
        }),
        filesDownload: vi.fn().mockRejectedValue({ status: 409 }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await companyService.detectCompanies();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('mi-empresa');
      expect(result[1].name).toBe('otra-empresa');
    });

    it('reads metadata from .empresa.json when available', async () => {
      const folderPath = `/${COMPANY_FOLDER_PREFIX}mi-empresa`;
      const mockMetadata = {
        id: 'mi-empresa',
        name: 'Mi Empresa',
        folderPath: folderPath,
        folderId: 'id1',
        createdAt: '2024-01-01T00:00:00Z',
      };
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: {
            entries: [
              { name: `${COMPANY_FOLDER_PREFIX}mi-empresa`, '.tag': 'folder', path_lower: folderPath, id: 'id1' },
            ],
          },
        }),
        filesDownload: vi.fn().mockResolvedValue({
          result: { fileBlob: new Blob([JSON.stringify(mockMetadata)]) },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await companyService.detectCompanies();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mi Empresa');
      expect(result[0].id).toBe('mi-empresa');
    });
  });

  describe('createCompany', () => {
    it('creates company folder and subfolders', async () => {
      const mockDbx = {
        filesCreateFolderV2: vi.fn().mockResolvedValue({ result: { id: 'new-folder-id' } }),
        filesUpload: vi.fn().mockResolvedValue({}),
        usersGetCurrentAccount: vi.fn().mockResolvedValue({
          result: { email: 'owner@test.com', account_id: 'dbid:123' },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await companyService.createCompany('Mi Empresa');

      const expectedFolderPath = `/${COMPANY_FOLDER_PREFIX}mi-empresa`;
      const expectedWorkspacePath = `${expectedFolderPath}/${WORKSPACE_FOLDER_PREFIX}mi-empresa`;
      expect(mockDbx.filesCreateFolderV2).toHaveBeenCalledTimes(5);
      expect(mockDbx.filesCreateFolderV2).toHaveBeenCalledWith({
        path: expectedFolderPath,
        autorename: false,
      });
      expect(mockDbx.filesCreateFolderV2).toHaveBeenCalledWith({
        path: expectedWorkspacePath,
        autorename: false,
      });
      expect(mockDbx.filesCreateFolderV2).toHaveBeenCalledWith({
        path: `${expectedWorkspacePath}/capturas`,
        autorename: false,
      });
      expect(mockDbx.filesCreateFolderV2).toHaveBeenCalledWith({
        path: `${expectedWorkspacePath}/reportes`,
        autorename: false,
      });
      expect(mockDbx.filesCreateFolderV2).toHaveBeenCalledWith({
        path: `${expectedFolderPath}/config`,
        autorename: false,
      });
      expect(result.name).toBe('Mi Empresa');
      expect(result.id).toBe('mi-empresa');
    });

    it('saves company metadata to .empresa.json', async () => {
      const mockDbx = {
        filesCreateFolderV2: vi.fn().mockResolvedValue({ result: { id: 'new-folder-id' } }),
        filesUpload: vi.fn().mockResolvedValue({}),
        usersGetCurrentAccount: vi.fn().mockResolvedValue({
          result: { email: 'owner@test.com', account_id: 'dbid:123' },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      await companyService.createCompany('Mi Empresa');

      const expectedFolderPath = `/${COMPANY_FOLDER_PREFIX}mi-empresa`;
      expect(mockDbx.filesUpload).toHaveBeenCalledWith({
        path: `${expectedFolderPath}/.empresa.json`,
        contents: expect.stringContaining('"name": "Mi Empresa"'),
        mode: { '.tag': 'overwrite' },
      });
    });

    it('throws error when company name already exists', async () => {
      const mockDbx = {
        filesCreateFolderV2: vi.fn().mockRejectedValue({ status: 409 }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      await expect(companyService.createCompany('Mi Empresa')).rejects.toThrow(
        'Ya existe una empresa con ese nombre'
      );
    });

    it('sets active company after creation', async () => {
      const mockDbx = {
        filesCreateFolderV2: vi.fn().mockResolvedValue({ result: { id: 'new-folder-id' } }),
        filesUpload: vi.fn().mockResolvedValue({}),
        usersGetCurrentAccount: vi.fn().mockResolvedValue({
          result: { email: 'owner@test.com', account_id: 'dbid:123' },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      await companyService.createCompany('Mi Empresa');

      const activeCompany = companyService.getActiveCompany();
      expect(activeCompany?.id).toBe('mi-empresa');
    });
  });

  describe('getActiveCompany', () => {
    it('returns null when no active company is set', () => {
      const result = companyService.getActiveCompany();
      expect(result).toBeNull();
    });

    it('returns active company from cache', () => {
      const company = {
        id: 'mi-empresa',
        name: 'Mi Empresa',
        folderPath: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
        folderId: 'id1',
        createdAt: '2024-01-01T00:00:00Z',
      };
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company]));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'mi-empresa');

      const result = companyService.getActiveCompany();

      expect(result).toEqual(company);
    });
  });

  describe('setActiveCompany', () => {
    it('saves active company id to localStorage', () => {
      companyService.setActiveCompany('mi-empresa');

      expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY)).toBe('mi-empresa');
    });
  });

  describe('getCompanyMetadata', () => {
    it('returns company metadata from .empresa.json', async () => {
      const folderPath = `/${COMPANY_FOLDER_PREFIX}mi-empresa`;
      const mockMetadata = {
        id: 'mi-empresa',
        name: 'Mi Empresa',
        folderPath: folderPath,
        folderId: 'id1',
        createdAt: '2024-01-01T00:00:00Z',
      };
      const mockDbx = {
        filesDownload: vi.fn().mockResolvedValue({
          result: { fileBlob: new Blob([JSON.stringify(mockMetadata)]) },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await companyService.getCompanyMetadata(folderPath);

      expect(result).toEqual(mockMetadata);
    });

    it('returns null when metadata file does not exist', async () => {
      const mockDbx = {
        filesDownload: vi.fn().mockRejectedValue({ status: 409 }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const folderPath = `/${COMPANY_FOLDER_PREFIX}mi-empresa`;
      const result = await companyService.getCompanyMetadata(folderPath);

      expect(result).toBeNull();
    });
  });

  describe('clearActiveCompany', () => {
    it('removes active company from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'mi-empresa');
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([]));

      companyService.clearActiveCompany();

      expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.COMPANIES_CACHE)).toBeNull();
    });
  });
});

