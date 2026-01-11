import { Dropbox } from 'dropbox';
import type { files, sharing } from 'dropbox/types';
import { dropboxGateway } from '../../gateway/dropboxGateway';
import { getWorkspaceFolderPath } from '../../constants/dropbox';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { USER_ROLES, UserRole } from '../../constants/roles';
import { Company, CompanyMember } from '../../types/company';

async function getAuthenticatedClient(): Promise<Dropbox> {
  await dropboxGateway.refreshTokenIfNeeded();
  return dropboxGateway.getClient();
}

function isFolderMetadata(
  metadata: files.FileMetadataReference | files.FolderMetadataReference | files.DeletedMetadataReference
): metadata is files.FolderMetadataReference {
  return metadata['.tag'] === 'folder';
}

function isShareFolderComplete(
  result: sharing.ShareFolderLaunch
): result is sharing.ShareFolderLaunchComplete {
  return result['.tag'] === 'complete';
}

async function shareFolder(dbx: Dropbox, folderPath: string, email: string): Promise<string | null> {
  try {
    const shareResponse = await dbx.sharingShareFolder({
      path: folderPath,
      acl_update_policy: { '.tag': 'owner' },
    });

    let sharedFolderId: string | null = null;
    if (isShareFolderComplete(shareResponse.result)) {
      sharedFolderId = shareResponse.result.shared_folder_id;
    }

    if (sharedFolderId) {
      await dbx.sharingAddFolderMember({
        shared_folder_id: sharedFolderId,
        members: [
          {
            member: { '.tag': 'email', email },
            access_level: { '.tag': 'editor' },
          },
        ],
        quiet: false,
      });
    }

    return sharedFolderId;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
      const metadataResponse = await dbx.filesGetMetadata({
        path: folderPath,
      });

      if (isFolderMetadata(metadataResponse.result) && metadataResponse.result.shared_folder_id) {
        const sharedFolderId = metadataResponse.result.shared_folder_id;

        await dbx.sharingAddFolderMember({
          shared_folder_id: sharedFolderId,
          members: [
            {
              member: { '.tag': 'email', email },
              access_level: { '.tag': 'editor' },
            },
          ],
          quiet: false,
        });

        return sharedFolderId;
      }
      throw new Error('No se pudo obtener el ID de la carpeta compartida');
    }
    throw error;
  }
}

async function addMember(companyId: string, email: string, role: UserRole): Promise<CompanyMember> {
  const dbx = await getAuthenticatedClient();

  const cachedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES_CACHE);
  if (!cachedCompanies) {
    throw new Error('Empresa no encontrada');
  }

  const companies: Company[] = JSON.parse(cachedCompanies);
  const company = companies.find(c => c.id === companyId);

  if (!company) {
    throw new Error('Empresa no encontrada');
  }

  const folderPath = role === USER_ROLES.ADMIN
    ? company.folderPath
    : getWorkspaceFolderPath(company.name);

  const sharedFolderId = await shareFolder(dbx, folderPath, email);

  let accountId = '';
  if (sharedFolderId) {
    try {
      const membersResponse = await dbx.sharingListFolderMembers({
        shared_folder_id: sharedFolderId,
      });
      const members = membersResponse.result.users || [];
      const invitedMember = members.find((m) => {
        if (m.user && 'email' in m.user) {
          return m.user.email === email;
        }
        return false;
      });
      if (invitedMember && invitedMember.user && 'account_id' in invitedMember.user) {
        accountId = invitedMember.user.account_id;
      }
    } catch (error) {
    }
  }

  const member: CompanyMember = {
    email,
    accountId: accountId || `pending-${email}`,
    role,
    joinedAt: new Date().toISOString(),
  };

  return member;
}

export const memberService = {
  addMember,
};

