export const COMPANY_FOLDER_PREFIX = 'transferencias-';
export const WORKSPACE_FOLDER_PREFIX = 'workspace-';

export function sanitizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 30);
}

export function getCompanyFolderPath(companyName: string): string {
  const sanitizedName = sanitizeCompanyName(companyName);
  return `/${COMPANY_FOLDER_PREFIX}${sanitizedName}`;
}

export function getWorkspaceFolderPath(companyName: string): string {
  const sanitizedName = sanitizeCompanyName(companyName);
  const companyPath = getCompanyFolderPath(companyName);
  return `${companyPath}/${WORKSPACE_FOLDER_PREFIX}${sanitizedName}`;
}

