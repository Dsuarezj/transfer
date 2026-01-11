import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memberService } from './memberService';
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

describe('memberService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('addMember', () => {
    const company = {
      id: 'mi-empresa',
      name: 'Mi Empresa',
      folderPath: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
      folderId: 'folder-id-123',
      createdAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company]));
    });

    it('shares main folder when adding admin member', async () => {
      const mockDbx = {
        sharingShareFolder: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'complete',
            shared_folder_id: 'shared-folder-123',
          },
        }),
        sharingAddFolderMember: vi.fn().mockResolvedValue({}),
        sharingListFolderMembers: vi.fn().mockResolvedValue({
          result: {
            users: [
              {
                user: {
                  account_id: 'dbid:new-admin-123',
                  email: 'admin@test.com',
                },
              },
            ],
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await memberService.addMember('mi-empresa', 'admin@test.com', USER_ROLES.ADMIN);

      expect(mockDbx.sharingShareFolder).toHaveBeenCalledWith({
        path: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
        acl_update_policy: { '.tag': 'owner' },
      });
      expect(mockDbx.sharingAddFolderMember).toHaveBeenCalledWith({
        shared_folder_id: 'shared-folder-123',
        members: [
          {
            member: { '.tag': 'email', email: 'admin@test.com' },
            access_level: { '.tag': 'editor' },
          },
        ],
        quiet: false,
      });
      expect(result.email).toBe('admin@test.com');
      expect(result.accountId).toBe('dbid:new-admin-123');
      expect(result.role).toBe(USER_ROLES.ADMIN);
    });

    it('shares workspace folder when adding employee member', async () => {
      const mockDbx = {
        sharingShareFolder: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'complete',
            shared_folder_id: 'shared-folder-456',
          },
        }),
        sharingAddFolderMember: vi.fn().mockResolvedValue({}),
        sharingListFolderMembers: vi.fn().mockResolvedValue({
          result: {
            users: [
              {
                user: {
                  account_id: 'dbid:new-employee-456',
                  email: 'employee@test.com',
                },
              },
            ],
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await memberService.addMember('mi-empresa', 'employee@test.com', USER_ROLES.EMPLOYEE);

      expect(mockDbx.sharingShareFolder).toHaveBeenCalledWith({
        path: `/${COMPANY_FOLDER_PREFIX}mi-empresa/${WORKSPACE_FOLDER_PREFIX}mi-empresa`,
        acl_update_policy: { '.tag': 'owner' },
      });
      expect(result.email).toBe('employee@test.com');
      expect(result.accountId).toBe('dbid:new-employee-456');
      expect(result.role).toBe(USER_ROLES.EMPLOYEE);
    });

    it('throws error when company does not exist', async () => {
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([]));

      await expect(
            memberService.addMember('nonexistent', 'user@test.com', USER_ROLES.EMPLOYEE)
      ).rejects.toThrow('Empresa no encontrada');
    });

    it('uses sharingAddFolderMember if folder is already shared', async () => {
      const mockDbx = {
        sharingShareFolder: vi.fn().mockRejectedValue({ status: 409 }),
        filesGetMetadata: vi.fn().mockResolvedValue({
          result: {
            '.tag': 'folder',
            shared_folder_id: 'shared-folder-id-123',
          },
        }),
        sharingAddFolderMember: vi.fn().mockResolvedValue({}),
        sharingListFolderMembers: vi.fn().mockResolvedValue({
          result: {
            users: [
              {
                user: {
                  account_id: 'dbid:new-user-789',
                  email: 'user@test.com',
                },
              },
            ],
          },
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await memberService.addMember('mi-empresa', 'user@test.com', USER_ROLES.ADMIN);

      expect(mockDbx.sharingShareFolder).toHaveBeenCalled();
      expect(mockDbx.filesGetMetadata).toHaveBeenCalledWith({
        path: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
      });
      expect(mockDbx.sharingAddFolderMember).toHaveBeenCalledWith({
        shared_folder_id: 'shared-folder-id-123',
        members: [
          {
            member: { '.tag': 'email', email: 'user@test.com' },
            access_level: { '.tag': 'editor' },
          },
        ],
        quiet: false,
      });
      expect(result.email).toBe('user@test.com');
      expect(result.accountId).toBe('dbid:new-user-789');
    });
  });

  describe('getCompanyMembers', () => {
    const company = {
      id: 'mi-empresa',
      name: 'Mi Empresa',
      folderPath: `/${COMPANY_FOLDER_PREFIX}mi-empresa`,
      folderId: 'folder-id-123',
      createdAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([company]));
    });

    it('returns empty array when company does not exist', async () => {
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([]));

      await expect(
        memberService.getCompanyMembers({ companyId: 'nonexistent', mainFolderSharedId: null, workspaceFolderSharedId: null })
      ).rejects.toThrow('Empresa no encontrada');
    });

    it('returns members with admin role when they have access to main folder', async () => {
      const mainFolderSharedId = 'shared-main-123';
      const workspaceFolderSharedId = 'shared-workspace-456';
      const mockDbx = {
        sharingListFolderMembers: vi.fn((args: { shared_folder_id: string }) => {
          if (args.shared_folder_id === mainFolderSharedId) {
            return Promise.resolve({
              result: {
                users: [
                  {
                    user: {
                      account_id: 'dbid:admin-1',
                      email: 'admin1@test.com',
                    },
                  },
                  {
                    user: {
                      account_id: 'dbid:admin-2',
                      email: 'admin2@test.com',
                    },
                  },
                ],
              },
            });
          }
          if (args.shared_folder_id === workspaceFolderSharedId) {
            return Promise.resolve({
              result: {
                users: [
                  {
                    user: {
                      account_id: 'dbid:admin-1',
                      email: 'admin1@test.com',
                    },
                  },
                  {
                    user: {
                      account_id: 'dbid:employee-1',
                      email: 'employee1@test.com',
                    },
                  },
                ],
              },
            });
          }
          return Promise.reject(new Error('Not found'));
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await memberService.getCompanyMembers({
        companyId: 'mi-empresa',
        mainFolderSharedId,
        workspaceFolderSharedId,
      });

      expect(result).toHaveLength(3);
      const admin1 = result.find(m => m.accountId === 'dbid:admin-1');
      const admin2 = result.find(m => m.accountId === 'dbid:admin-2');
      const employee1 = result.find(m => m.accountId === 'dbid:employee-1');

      expect(admin1).toBeDefined();
      expect(admin1?.role).toBe(USER_ROLES.ADMIN);
      expect(admin1?.email).toBe('admin1@test.com');

      expect(admin2).toBeDefined();
      expect(admin2?.role).toBe(USER_ROLES.ADMIN);
      expect(admin2?.email).toBe('admin2@test.com');

      expect(employee1).toBeDefined();
      expect(employee1?.role).toBe(USER_ROLES.EMPLOYEE);
      expect(employee1?.email).toBe('employee1@test.com');
    });

    it('returns members with employee role when they only have access to workspace', async () => {
      const mainFolderSharedId = 'shared-main-123';
      const workspaceFolderSharedId = 'shared-workspace-456';
      const mockDbx = {
        sharingListFolderMembers: vi.fn((args: { shared_folder_id: string }) => {
          if (args.shared_folder_id === mainFolderSharedId) {
            return Promise.resolve({
              result: {
                users: [
                  {
                    user: {
                      account_id: 'dbid:admin-1',
                      email: 'admin1@test.com',
                    },
                  },
                ],
              },
            });
          }
          if (args.shared_folder_id === workspaceFolderSharedId) {
            return Promise.resolve({
              result: {
                users: [
                  {
                    user: {
                      account_id: 'dbid:admin-1',
                      email: 'admin1@test.com',
                    },
                  },
                  {
                    user: {
                      account_id: 'dbid:employee-only',
                      email: 'employee-only@test.com',
                    },
                  },
                ],
              },
            });
          }
          return Promise.reject(new Error('Not found'));
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await memberService.getCompanyMembers({
        companyId: 'mi-empresa',
        mainFolderSharedId,
        workspaceFolderSharedId,
      });

      expect(result).toHaveLength(2);
      const admin1 = result.find(m => m.accountId === 'dbid:admin-1');
      const employeeOnly = result.find(m => m.accountId === 'dbid:employee-only');

      expect(admin1?.role).toBe(USER_ROLES.ADMIN);
      expect(employeeOnly?.role).toBe(USER_ROLES.EMPLOYEE);
    });

    it('handles case when main folder is not shared', async () => {
      const workspaceFolderSharedId = 'shared-workspace-456';
      const mockDbx = {
        sharingListFolderMembers: vi.fn((args: { shared_folder_id: string }) => {
          if (args.shared_folder_id === workspaceFolderSharedId) {
            return Promise.resolve({
              result: {
                users: [
                  {
                    user: {
                      account_id: 'dbid:employee-1',
                      email: 'employee1@test.com',
                    },
                  },
                ],
              },
            });
          }
          return Promise.reject(new Error('Not found'));
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await memberService.getCompanyMembers({
        companyId: 'mi-empresa',
        mainFolderSharedId: null,
        workspaceFolderSharedId,
      });

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(USER_ROLES.EMPLOYEE);
      expect(result[0].email).toBe('employee1@test.com');
    });

    it('handles case when workspace folder is not shared', async () => {
      const mainFolderSharedId = 'shared-main-123';
      const mockDbx = {
        sharingListFolderMembers: vi.fn((args: { shared_folder_id: string }) => {
          if (args.shared_folder_id === mainFolderSharedId) {
            return Promise.resolve({
              result: {
                users: [
                  {
                    user: {
                      account_id: 'dbid:admin-1',
                      email: 'admin1@test.com',
                    },
                  },
                ],
              },
            });
          }
          return Promise.reject(new Error('Not found'));
        }),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await memberService.getCompanyMembers({
        companyId: 'mi-empresa',
        mainFolderSharedId,
        workspaceFolderSharedId: null,
      });

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(USER_ROLES.ADMIN);
      expect(result[0].email).toBe('admin1@test.com');
    });

    it('returns empty array when no folders are shared', async () => {
      const mockDbx = {
        sharingListFolderMembers: vi.fn(),
      };
      vi.mocked(dropboxGateway.getClient).mockReturnValue(mockDbx as any);

      const result = await memberService.getCompanyMembers({
        companyId: 'mi-empresa',
        mainFolderSharedId: null,
        workspaceFolderSharedId: null,
      });

      expect(result).toEqual([]);
      expect(mockDbx.sharingListFolderMembers).not.toHaveBeenCalled();
    });
  });
});

