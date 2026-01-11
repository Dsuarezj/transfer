import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roleService } from './roleService';
import { dropboxGateway } from '../../gateway/dropboxGateway';
import { getCompanyFolderPath, getWorkspaceFolderPath, WORKSPACE_FOLDER_PREFIX, sanitizeCompanyName } from '../../constants/dropbox';
import { USER_ROLES } from '../../constants/roles';

vi.mock('../../gateway/dropboxGateway', () => ({
  dropboxGateway: {
    getClient: vi.fn(),
    refreshTokenIfNeeded: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserRole', () => {
    it('returns admin when user has access to company folder', async () => {
      const companyName = 'test-company';
      const companyPath = getCompanyFolderPath(companyName);
      const mockDbx = {
        filesGetMetadata: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'folder',
            name: 'transferencias-test-company',
            path_lower: companyPath,
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await roleService.getUserRole(companyName);

      expect(result).toBe(USER_ROLES.ADMIN);
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({ path: companyPath });
    });

    it('returns employee when user only has access to workspace folder (nested)', async () => {
      const companyName = 'test-company';
      const companyPath = getCompanyFolderPath(companyName);
      const workspacePath = getWorkspaceFolderPath(companyName);
      const mockDbx = {
        filesGetMetadata: vi.fn(({ path }: { path: string }) => {
          if (path === companyPath) {
            return Promise.reject(new Error('Not found'));
          }
          if (path === workspacePath) {
            return Promise.resolve({
              result: {
                '.tag': 'folder',
                name: 'workspace-test-company',
                path_lower: workspacePath,
              },
            });
          }
          return Promise.reject(new Error('Unknown path'));
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await roleService.getUserRole(companyName);

      expect(result).toBe(USER_ROLES.EMPLOYEE);
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({ path: companyPath });
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({ path: workspacePath });
    });

    it('returns employee when user has access to workspace folder shared directly', async () => {
      const companyName = 'test-company';
      const companyPath = getCompanyFolderPath(companyName);
      const workspaceRootPath = `/${WORKSPACE_FOLDER_PREFIX}${sanitizeCompanyName(companyName)}`;
      const currentFolderPath = workspaceRootPath;
      const mockDbx = {
        filesGetMetadata: vi.fn(({ path }: { path: string }) => {
          if (path === companyPath) {
            return Promise.reject(new Error('Not found'));
          }
          if (path === workspaceRootPath) {
            return Promise.resolve({
              result: {
                '.tag': 'folder',
                name: `${WORKSPACE_FOLDER_PREFIX}test-company`,
                path_lower: workspaceRootPath,
              },
            });
          }
          return Promise.reject(new Error('Unknown path'));
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await roleService.getUserRole(companyName, currentFolderPath);

      expect(result).toBe(USER_ROLES.EMPLOYEE);
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({ path: companyPath });
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({ path: workspaceRootPath });
    });

    it('returns null when user has no access to any folder', async () => {
      const companyName = 'test-company';
      const companyPath = getCompanyFolderPath(companyName);
      const workspacePath = getWorkspaceFolderPath(companyName);
      const mockDbx = {
        filesGetMetadata: vi.fn(() => Promise.reject(new Error('Not found'))),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await roleService.getUserRole(companyName);

      expect(result).toBeNull();
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({ path: companyPath });
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({ path: workspacePath });
    });

    it('prioritizes admin over employee when user has access to both', async () => {
      const companyName = 'test-company';
      const companyPath = getCompanyFolderPath(companyName);
      const mockDbx = {
        filesGetMetadata: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'folder',
            name: 'transferencias-test-company',
            path_lower: companyPath,
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await roleService.getUserRole(companyName);

      expect(result).toBe(USER_ROLES.ADMIN);
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledTimes(1);
    });

    it('handles errors gracefully and returns null', async () => {
      const companyName = 'test-company';
      const mockDbx = {
        filesGetMetadata: vi.fn().mockRejectedValue(new Error('API Error')),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await roleService.getUserRole(companyName);

      expect(result).toBeNull();
    });
  });

  describe('requireAdmin', () => {
    it('does not throw when user is admin', async () => {
      const companyName = 'test-company';
      const companyPath = getCompanyFolderPath(companyName);
      const mockDbx = {
        filesGetMetadata: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'folder',
            name: 'transferencias-test-company',
            path_lower: companyPath,
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      await expect(roleService.requireAdmin(companyName)).resolves.not.toThrow();
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledTimes(1);
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({ path: companyPath });
    });

    it('throws error when user is employee', async () => {
      const companyName = 'test-company';
      const companyPath = getCompanyFolderPath(companyName);
      const workspacePath = getWorkspaceFolderPath(companyName);
      const mockDbx = {
        filesGetMetadata: vi.fn(({ path }: { path: string }) => {
          if (path === companyPath) {
            return Promise.reject(new Error('Not found'));
          }
          if (path === workspacePath) {
            return Promise.resolve({
              result: {
                '.tag': 'folder',
                name: 'workspace-test-company',
                path_lower: workspacePath,
                shared_folder_id: 'shared-workspace-456',
              },
            });
          }
          return Promise.reject(new Error('Unknown path'));
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      await expect(roleService.requireAdmin(companyName)).rejects.toThrow(
        'No tienes permisos de administrador'
      );
    });

    it('throws error when user has no access', async () => {
      const companyName = 'test-company';
      const mockDbx = {
        filesGetMetadata: vi.fn(() => Promise.reject(new Error('Not found'))),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      await expect(roleService.requireAdmin(companyName)).rejects.toThrow(
        'No tienes permisos de administrador'
      );
    });
  });
});

