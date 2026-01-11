import { Dropbox } from 'dropbox';
import { dropboxGateway } from '../../gateway/dropboxGateway';
import { getCompanyFolderPath, getWorkspaceFolderPath, WORKSPACE_FOLDER_PREFIX, sanitizeCompanyName } from '../../constants/dropbox';
import { USER_ROLES, UserRole } from '../../constants/roles';
import type { files } from 'dropbox/types';

async function getAuthenticatedClient(): Promise<Dropbox> {
  await dropboxGateway.refreshTokenIfNeeded();
  return dropboxGateway.getClient();
}

function isFolderMetadata(
  metadata: files.FileMetadataReference | files.FolderMetadataReference | files.DeletedMetadataReference
): metadata is files.FolderMetadataReference {
  return metadata['.tag'] === 'folder';
}

async function getUserRole(companyName: string, currentFolderPath?: string): Promise<UserRole | null> {
  const dbx = await getAuthenticatedClient();
  const companyPath = getCompanyFolderPath(companyName);
  const workspacePath = getWorkspaceFolderPath(companyName);
  const workspaceRootPath = `/${WORKSPACE_FOLDER_PREFIX}${sanitizeCompanyName(companyName)}`;

  try {
    const companyResult = await dbx.filesGetMetadata({ path: companyPath });
    if (isFolderMetadata(companyResult.result)) {
      return USER_ROLES.ADMIN;
    }
  } catch (error) {
  }

  try {
    const workspacePathToCheck = currentFolderPath && currentFolderPath.includes(`/${WORKSPACE_FOLDER_PREFIX}`)
      ? workspaceRootPath
      : workspacePath;
    const workspaceResult = await dbx.filesGetMetadata({ path: workspacePathToCheck });
    if (isFolderMetadata(workspaceResult.result)) {
      return USER_ROLES.EMPLOYEE;
    }
  } catch (error) {
  }

  return null;
}

async function requireAdmin(companyName: string): Promise<void> {
  const role = await getUserRole(companyName);
  if (role !== USER_ROLES.ADMIN) {
    throw new Error('No tienes permisos de administrador');
  }
}

export const roleService = {
  getUserRole,
  requireAdmin,
};

