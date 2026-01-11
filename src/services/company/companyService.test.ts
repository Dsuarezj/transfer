import { describe, it, expect, vi, beforeEach } from 'vitest';
import { companyService } from './companyService';
import { dropboxGateway } from '../../gateway/dropboxGateway';
import { COMPANY_FOLDER_PREFIX, WORKSPACE_FOLDER_PREFIX } from '../../constants/dropbox';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { USER_ROLES } from '../../constants/roles';

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
      const mockGetRole = vi.fn();

      const result = await companyService.detectCompanies(mockGetRole);

      expect(result).toEqual([]);
      expect(mockGetRole).not.toHaveBeenCalled();
    });

    it('detects folders starting with company folder prefix (admin)', async () => {
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
      const mockGetRole = vi.fn().mockResolvedValue(USER_ROLES.ADMIN);

      const result = await companyService.detectCompanies(mockGetRole);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('mi-empresa');
      expect(result[0].folderPath).toBe(`/${COMPANY_FOLDER_PREFIX}mi-empresa`);
      expect(result[0].folderId).toBe('id1');
      expect(result[0].role).toBe(USER_ROLES.ADMIN);
      expect(result[1].name).toBe('otra-empresa');
      expect(result[1].folderPath).toBe(`/${COMPANY_FOLDER_PREFIX}otra-empresa`);
      expect(result[1].folderId).toBe('id3');
      expect(result[1].role).toBe(USER_ROLES.ADMIN);
      expect(mockGetRole).toHaveBeenCalledTimes(2);
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
      const mockGetRole = vi.fn().mockResolvedValue(USER_ROLES.ADMIN);

      const result = await companyService.detectCompanies(mockGetRole);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mi Empresa');
      expect(result[0].id).toBe('mi-empresa');
      expect(result[0].role).toBe(USER_ROLES.ADMIN);
      expect(mockGetRole).toHaveBeenCalledTimes(1);
    });

    it('detects workspace folders and uses workspace path directly (employee)', async () => {
      const workspaceFolderName = `${WORKSPACE_FOLDER_PREFIX}test`;
      const workspacePath = `/${workspaceFolderName}`;
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: {
            entries: [
              { name: workspaceFolderName, '.tag': 'folder', path_lower: workspacePath, id: 'id-workspace' },
            ],
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn().mockResolvedValue(USER_ROLES.EMPLOYEE);

      const result = await companyService.detectCompanies(mockGetRole);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test');
      expect(result[0].id).toBe('test');
      expect(result[0].folderPath).toBe(workspacePath);
      expect(result[0].folderId).toBe('id-workspace');
      expect(result[0].role).toBe(USER_ROLES.EMPLOYEE);
      expect(mockGetRole).toHaveBeenCalledTimes(1);
    });

    it('detects both company and workspace folders without duplicates (admin has both)', async () => {
      const companyPath = `/${COMPANY_FOLDER_PREFIX}test`;
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: {
            entries: [
              { name: `${COMPANY_FOLDER_PREFIX}test`, '.tag': 'folder', path_lower: companyPath, id: 'id-company' },
              { name: `${WORKSPACE_FOLDER_PREFIX}test`, '.tag': 'folder', path_lower: `/${WORKSPACE_FOLDER_PREFIX}test`, id: 'id-workspace' },
            ],
          },
        }),
        filesDownload: vi.fn().mockRejectedValue({ status: 409 }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn().mockResolvedValue(USER_ROLES.ADMIN);

      const result = await companyService.detectCompanies(mockGetRole);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test');
      expect(result[0].id).toBe('test');
      expect(result[0].folderPath).toBe(companyPath);
      expect(result[0].folderId).toBe('id-company');
      expect(result[0].role).toBe(USER_ROLES.ADMIN);
      expect(mockGetRole).toHaveBeenCalledTimes(2);
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
      expect(result.role).toBe(USER_ROLES.ADMIN);
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

  describe('verifyActiveCompanyAccess', () => {
    const company = {
      id: 'mi-empresa',
      name: 'Mi Empresa',
      folderPath: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
      folderId: 'folder-id-123',
      createdAt: '2024-01-01T00:00:00Z',
      role: USER_ROLES.ADMIN,
    };

    beforeEach(() => {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'mi-empresa');
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company]));
    });

    it('returns true when user has access to company folder (admin)', async () => {
      const mockDbx = {
        filesGetMetadata: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'folder',
            name: `${COMPANY_FOLDER_PREFIX}mi-empresa`,
            path_lower: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await companyService.verifyActiveCompanyAccess();

      expect(result).toBe(true);
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({
        path: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
      });
    });

    it('returns true when user has access to workspace folder (employee)', async () => {
      const employeeCompany = {
        ...company,
        folderPath: `/${COMPANY_FOLDER_PREFIX}mi-empresa/${WORKSPACE_FOLDER_PREFIX}mi-empresa`,
        role: USER_ROLES.EMPLOYEE,
      };
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([employeeCompany]));

      const workspacePath = `/${COMPANY_FOLDER_PREFIX}mi-empresa/${WORKSPACE_FOLDER_PREFIX}mi-empresa`;
      const mockDbx = {
        filesGetMetadata: vi.fn((args: { path: string }) => {
          if (args.path === `/${COMPANY_FOLDER_PREFIX}mi-empresa`) {
            return Promise.reject(new Error('Not found'));
          }
          if (args.path === workspacePath) {
            return Promise.resolve({
              result: {
                '.tag': 'folder',
                name: `${WORKSPACE_FOLDER_PREFIX}mi-empresa`,
                path_lower: workspacePath,
              },
            });
          }
          return Promise.reject(new Error('Not found'));
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await companyService.verifyActiveCompanyAccess();

      expect(result).toBe(true);
    });

    it('returns false when user has no access to any folder', async () => {
      const mockDbx = {
        filesGetMetadata: vi.fn().mockRejectedValue(new Error('Not found')),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await companyService.verifyActiveCompanyAccess();

      expect(result).toBe(false);
    });

    it('returns false when no active company is set', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);

      const result = await companyService.verifyActiveCompanyAccess();

      expect(result).toBe(false);
    });

    it('returns false when active company is not in cache', async () => {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'nonexistent');
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([]));

      const result = await companyService.verifyActiveCompanyAccess();

      expect(result).toBe(false);
    });
  });

  describe('ensureActiveCompany', () => {
    it('returns action none with company when active company has valid access', async () => {
      const company = {
        id: 'mi-empresa',
        name: 'Mi Empresa',
        folderPath: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
        folderId: 'folder-id-123',
        createdAt: '2024-01-01T00:00:00Z',
        role: USER_ROLES.ADMIN,
      };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'mi-empresa');
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company]));

      const mockDbx = {
        filesGetMetadata: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'folder',
            name: `${COMPANY_FOLDER_PREFIX}mi-empresa`,
            path_lower: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn();

      const result = await companyService.ensureActiveCompany(mockGetRole);

      expect(result.action).toBe('none');
      expect(result.company).toEqual(company);
      expect(mockGetRole).not.toHaveBeenCalled();
    });

    it('returns action redirect when no companies are detected', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: { entries: [] },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn();

      const result = await companyService.ensureActiveCompany(mockGetRole);

      expect(result.action).toBe('redirect');
      expect(result.company).toBeUndefined();
    });

    it('sets first company as active when companies exist but no active company', async () => {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: {
            entries: [
              { name: `${COMPANY_FOLDER_PREFIX}empresa-1`, '.tag': 'folder', path_lower: `/${COMPANY_FOLDER_PREFIX}empresa-1`, id: 'id1' },
              { name: `${COMPANY_FOLDER_PREFIX}empresa-2`, '.tag': 'folder', path_lower: `/${COMPANY_FOLDER_PREFIX}empresa-2`, id: 'id2' },
            ],
          },
        }),
        filesDownload: vi.fn().mockRejectedValue({ status: 409 }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn().mockResolvedValue(USER_ROLES.ADMIN);

      const result = await companyService.ensureActiveCompany(mockGetRole);

      expect(result.action).toBe('none');
      expect(result.company).toBeDefined();
      expect(result.company?.id).toBe('empresa-1');
      expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY)).toBe('empresa-1');
    });

    it('clears active company if no access and sets first available', async () => {
      const company = {
        id: 'mi-empresa',
        name: 'Mi Empresa',
        folderPath: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
        folderId: 'folder-id-123',
        createdAt: '2024-01-01T00:00:00Z',
        role: USER_ROLES.ADMIN,
      };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'mi-empresa');
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company]));

      const mockDbx = {
        filesGetMetadata: vi.fn().mockRejectedValue(new Error('No access')), // verifyActiveCompanyAccess fails
        filesListFolder: vi.fn().mockResolvedValue({
          result: {
            entries: [
              { name: `${COMPANY_FOLDER_PREFIX}otra-empresa`, '.tag': 'folder', path_lower: `/${COMPANY_FOLDER_PREFIX}otra-empresa`, id: 'id2' },
            ],
          },
        }),
        filesDownload: vi.fn().mockRejectedValue({ status: 409 }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn().mockResolvedValue(USER_ROLES.ADMIN);

      const result = await companyService.ensureActiveCompany(mockGetRole);

      expect(result.action).toBe('none');
      expect(result.company).toBeDefined();
      expect(result.company?.id).toBe('otra-empresa');
      expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY)).toBe('otra-empresa');
    });

    it('returns action none when active company has valid access without calling detectCompanies', async () => {
      const company = {
        id: 'mi-empresa',
        name: 'Mi Empresa',
        folderPath: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
        folderId: 'folder-id-123',
        createdAt: '2024-01-01T00:00:00Z',
        role: USER_ROLES.ADMIN,
      };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'mi-empresa');
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company]));

      const mockDbx = {
        filesGetMetadata: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'folder',
            name: `${COMPANY_FOLDER_PREFIX}mi-empresa`,
            path_lower: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
          },
        }),
        filesListFolder: vi.fn(), // Should not be called
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn();

      const result = await companyService.ensureActiveCompany(mockGetRole);

      expect(result.action).toBe('none');
      expect(result.company).toEqual(company);
      expect(mockDbx.filesListFolder).not.toHaveBeenCalled();
    });
  });

  describe('switchActiveCompany', () => {
    it('switches active company when it exists in cache', async () => {
      const company1 = {
        id: 'empresa-1',
        name: 'Empresa 1',
        folderPath: `/${COMPANY_FOLDER_PREFIX}empresa-1`,
        folderId: 'id1',
        createdAt: '2024-01-01T00:00:00Z',
        role: USER_ROLES.ADMIN,
      };
      const company2 = {
        id: 'empresa-2',
        name: 'Empresa 2',
        folderPath: `/${COMPANY_FOLDER_PREFIX}empresa-2`,
        folderId: 'id2',
        createdAt: '2024-01-02T00:00:00Z',
        role: USER_ROLES.EMPLOYEE,
      };
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company1, company2]));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'empresa-1');

      const result = await companyService.switchActiveCompany('empresa-2');

      expect(result).toEqual(company2);
      expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY)).toBe('empresa-2');
    });

    it('detects companies if not in cache', async () => {
      localStorage.removeItem(STORAGE_KEYS.COMPANIES_CACHE);
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: {
            entries: [
              { name: `${COMPANY_FOLDER_PREFIX}empresa-1`, '.tag': 'folder', path_lower: `/${COMPANY_FOLDER_PREFIX}empresa-1`, id: 'id1' },
              { name: `${COMPANY_FOLDER_PREFIX}empresa-2`, '.tag': 'folder', path_lower: `/${COMPANY_FOLDER_PREFIX}empresa-2`, id: 'id2' },
            ],
          },
        }),
        filesDownload: vi.fn().mockRejectedValue({ status: 409 }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn().mockResolvedValue(USER_ROLES.ADMIN);

      const result = await companyService.switchActiveCompany('empresa-2', mockGetRole);

      expect(result.id).toBe('empresa-2');
      expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY)).toBe('empresa-2');
    });

    it('verifies and caches role of new active company if missing', async () => {
      const company1 = {
        id: 'empresa-1',
        name: 'Empresa 1',
        folderPath: `/${COMPANY_FOLDER_PREFIX}empresa-1`,
        folderId: 'id1',
        createdAt: '2024-01-01T00:00:00Z',
        role: USER_ROLES.ADMIN,
      };
      const company2 = {
        id: 'empresa-2',
        name: 'Empresa 2',
        folderPath: `/${COMPANY_FOLDER_PREFIX}empresa-2`,
        folderId: 'id2',
        createdAt: '2024-01-02T00:00:00Z',
        role: undefined,
      };
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company1, company2]));

      const mockDbx = {
        filesGetMetadata: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'folder',
            name: `${COMPANY_FOLDER_PREFIX}empresa-2`,
            path_lower: `/${COMPANY_FOLDER_PREFIX}empresa-2`,
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn().mockResolvedValue(USER_ROLES.EMPLOYEE);

      const result = await companyService.switchActiveCompany('empresa-2', mockGetRole);

      expect(result.role).toBe(USER_ROLES.EMPLOYEE);
      expect(mockGetRole).toHaveBeenCalledWith('Empresa 2', `/${COMPANY_FOLDER_PREFIX}empresa-2`);
      const cachedCompanies = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES_CACHE) || '[]');
      const cachedCompany2 = cachedCompanies.find((c: any) => c.id === 'empresa-2');
      expect(cachedCompany2.role).toBe(USER_ROLES.EMPLOYEE);
    });

    it('throws error if company does not exist', async () => {
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([]));
      const mockDbx = {
        filesListFolder: vi.fn().mockResolvedValue({
          result: { entries: [] },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);
      const mockGetRole = vi.fn();

      await expect(
        companyService.switchActiveCompany('nonexistent', mockGetRole)
      ).rejects.toThrow('Empresa no encontrada');
    });
  });
});

