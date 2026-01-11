import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memberService } from './memberService';
import { dropboxGateway } from '../../gateway/dropboxGateway';
import { COMPANY_FOLDER_PREFIX, WORKSPACE_FOLDER_PREFIX } from '../../constants/dropbox';
import { STORAGE_KEYS } from '../../constants/storageKeys';

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

      const result = await memberService.addMember('mi-empresa', 'admin@test.com', 'admin');

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
      expect(result.role).toBe('admin');
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

      const result = await memberService.addMember('mi-empresa', 'employee@test.com', 'employee');

      expect(mockDbx.sharingShareFolder).toHaveBeenCalledWith({
        path: `/${COMPANY_FOLDER_PREFIX}mi-empresa/${WORKSPACE_FOLDER_PREFIX}mi-empresa`,
        acl_update_policy: { '.tag': 'owner' },
      });
      expect(result.email).toBe('employee@test.com');
      expect(result.accountId).toBe('dbid:new-employee-456');
      expect(result.role).toBe('employee');
    });

    it('throws error when company does not exist', async () => {
      localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify([]));

      await expect(
        memberService.addMember('nonexistent', 'user@test.com', 'employee')
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

      const result = await memberService.addMember('mi-empresa', 'user@test.com', 'admin');

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
});

