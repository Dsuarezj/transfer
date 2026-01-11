import { dropboxGateway } from '../../gateway/dropboxGateway';
import { getCompanyFolderPath, getWorkspaceFolderPath, sanitizeCompanyName, COMPANY_FOLDER_PREFIX, WORKSPACE_FOLDER_PREFIX } from '../../constants/dropbox';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { USER_ROLES, UserRole } from '../../constants/roles';
import { Company } from '../../types/company';

type GetRoleFn = (companyName: string, folderPath?: string) => Promise<UserRole | null>;

async function getAuthenticatedClient() {
  await dropboxGateway.refreshTokenIfNeeded();
  return dropboxGateway.getClient();
}

async function detectCompanies(getRole?: GetRoleFn): Promise<Company[]> {
  const dbx = await getAuthenticatedClient();

  try {
    const result = await dbx.filesListFolder({ path: '' });

    const companyFolders = result.result.entries.filter(
      (entry: any) =>
        (entry.name.startsWith(COMPANY_FOLDER_PREFIX) || entry.name.startsWith(WORKSPACE_FOLDER_PREFIX)) &&
        entry['.tag'] === 'folder'
    );

    const companies: Company[] = [];
    const processedCompanyIds = new Set<string>();

    for (const folder of companyFolders) {
      if (folder.name.startsWith(COMPANY_FOLDER_PREFIX)) {
        const company = await processCompanyFolder(folder, getRole);
        if (company && !processedCompanyIds.has(company.id)) {
          companies.push(company);
          processedCompanyIds.add(company.id);
        }
      } else if (folder.name.startsWith(WORKSPACE_FOLDER_PREFIX)) {
        const company = await processWorkspaceFolder(folder, getRole);
        if (company && !processedCompanyIds.has(company.id)) {
          companies.push(company);
          processedCompanyIds.add(company.id);
        }
      }
    }

    localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify(companies));
    return companies;
  } catch (error) {
    return [];
  }
}

async function processCompanyFolder(folder: any, getRole?: GetRoleFn): Promise<Company | null> {
  const companyName = folder.name.replace(COMPANY_FOLDER_PREFIX, '');
  const folderPath = folder.path_lower || `/${folder.name}`;

  try {
    const metadata = await getCompanyMetadata(folderPath);
    if (metadata) {
      if (!metadata.role && getRole) {
        const role = await getRole(metadata.name, metadata.folderPath);
        metadata.role = role || undefined;
      }
      return metadata;
    }
  } catch (error) {
  }

  const role = getRole ? await getRole(companyName, folderPath) : null;
  return {
    id: sanitizeCompanyName(companyName),
    name: companyName,
    folderPath: folderPath,
    folderId: folder.id || '',
    createdAt: new Date().toISOString(),
    role: role || undefined,
  };
}

async function processWorkspaceFolder(folder: any, getRole?: GetRoleFn): Promise<Company | null> {
  const companyName = folder.name.replace(WORKSPACE_FOLDER_PREFIX, '');
  const companyId = sanitizeCompanyName(companyName);
  const workspacePath = folder.path_lower || `/${folder.name}`;
  const role = getRole ? await getRole(companyName, workspacePath) : null;

  return {
    id: companyId,
    name: companyName,
    folderPath: workspacePath,
    folderId: folder.id || '',
    createdAt: new Date().toISOString(),
    role: role || undefined,
  };
}

async function createCompany(name: string): Promise<Company> {
  const dbx = await getAuthenticatedClient();
  const sanitizedName = sanitizeCompanyName(name);
  const folderPath = getCompanyFolderPath(name);

  try {
    const createResult = await dbx.filesCreateFolderV2({
      path: folderPath,
      autorename: false,
    });

    const folderId = (createResult.result as any).id || '';

    await createCompanySubfolders(dbx, folderPath, name);
    const ownerInfo = await getCurrentUserInfo(dbx);

    const company: Company = {
      id: sanitizedName,
      name: name,
      folderPath: folderPath,
      folderId: folderId,
      createdAt: new Date().toISOString(),
      ownerEmail: ownerInfo.email || undefined,
      ownerAccountId: ownerInfo.accountId || undefined,
      role: USER_ROLES.ADMIN,
    };

    await saveCompanyMetadata(dbx, folderPath, company);
    addCompanyToCache(company);
    setActiveCompany(company.id);

    return company;
  } catch (error: any) {
    if (error.status === 409) {
      throw new Error('Ya existe una empresa con ese nombre');
    }
    throw error;
  }
}

async function createCompanySubfolders(dbx: any, folderPath: string, companyName: string): Promise<void> {
  const workspacePath = getWorkspaceFolderPath(companyName);

  await dbx.filesCreateFolderV2({
    path: workspacePath,
    autorename: false,
  });

  await dbx.filesCreateFolderV2({
    path: `${workspacePath}/capturas`,
    autorename: false,
  });

  await dbx.filesCreateFolderV2({
    path: `${workspacePath}/reportes`,
    autorename: false,
  });

  await dbx.filesCreateFolderV2({
    path: `${folderPath}/config`,
    autorename: false,
  });
}

async function getCurrentUserInfo(dbx: any): Promise<{ email: string; accountId: string }> {
  try {
    const currentUser = await dbx.usersGetCurrentAccount();
    return {
      email: currentUser.result.email || '',
      accountId: currentUser.result.account_id || '',
    };
  } catch (error) {
    return { email: '', accountId: '' };
  }
}

async function saveCompanyMetadata(dbx: any, folderPath: string, company: Company): Promise<void> {
  const metadataJson = JSON.stringify(company, null, 2);
  await dbx.filesUpload({
    path: `${folderPath}/.empresa.json`,
    contents: metadataJson,
    mode: { '.tag': 'overwrite' },
  });
}

function getActiveCompany(): Company | null {
  const activeCompanyId = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY);
  if (!activeCompanyId) return null;

  const cachedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES_CACHE);
  if (cachedCompanies) {
    const companies: Company[] = JSON.parse(cachedCompanies);
    return companies.find(c => c.id === activeCompanyId) || null;
  }

  return null;
}

function setActiveCompany(companyId: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, companyId);
  window.dispatchEvent(new Event('company-change'));
}

function addCompanyToCache(company: Company): void {
  const cachedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES_CACHE);
  const companies: Company[] = cachedCompanies ? JSON.parse(cachedCompanies) : [];
  const existingIndex = companies.findIndex(c => c.id === company.id);
  if (existingIndex >= 0) {
    companies[existingIndex] = company;
  } else {
    companies.push(company);
  }
  localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify(companies));
}

async function getCompanyMetadata(folderPath: string): Promise<Company | null> {
  const dbx = await getAuthenticatedClient();

  try {
    const metadataPath = `${folderPath}/.empresa.json`;
    const response = await dbx.filesDownload({ path: metadataPath });
    const blob = (response.result as any).fileBlob;
    const text = await blob.text();
    return JSON.parse(text) as Company;
  } catch (error: any) {
    if (error.status === 409) {
      return null;
    }
    throw error;
  }
}

function clearActiveCompany(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);
  localStorage.removeItem(STORAGE_KEYS.COMPANIES_CACHE);
}

async function verifyActiveCompanyAccess(): Promise<boolean> {
  const activeCompany = getActiveCompany();
  if (!activeCompany) {
    return false;
  }

  const dbx = await getAuthenticatedClient();

  try {
    const metadataResponse = await dbx.filesGetMetadata({ path: activeCompany.folderPath });
    if (metadataResponse.result['.tag'] === 'folder') {
      return true;
    }
    if (activeCompany.folderPath.includes(`/${WORKSPACE_FOLDER_PREFIX}`)) {
      const workspaceRootPath = getWorkspaceFolderPath(activeCompany.name);
      const workspaceMetadataResponse = await dbx.filesGetMetadata({ path: workspaceRootPath });
      if (workspaceMetadataResponse.result['.tag'] === 'folder') {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function ensureActiveCompany(getRole?: GetRoleFn): Promise<{ action: 'redirect' | 'none', company?: Company }> {
  const activeCompany = getActiveCompany();

  if (activeCompany) {
    const hasAccess = await verifyActiveCompanyAccess();
    if (hasAccess) {
      return { action: 'none', company: activeCompany };
    }
    clearActiveCompany();
  }

  const companies = await detectCompanies(getRole);

  if (companies.length === 0) {
    return { action: 'redirect' };
  }

  setActiveCompany(companies[0].id);
  return { action: 'none', company: companies[0] };
}

async function switchActiveCompany(companyId: string, getRole?: GetRoleFn): Promise<Company> {
  const cachedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES_CACHE);
  let companies: Company[] = cachedCompanies ? JSON.parse(cachedCompanies) : [];

  let company = companies.find(c => c.id === companyId);

  if (!company) {
    companies = await detectCompanies(getRole);
    company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Empresa no encontrada');
    }
  }

  if (!company.role && getRole) {
    company.role = await getRole(company.name, company.folderPath) || undefined;
    addCompanyToCache(company);
  }

  setActiveCompany(companyId);
  return company;
}

export const companyService = {
  detectCompanies,
  createCompany,
  getActiveCompany,
  setActiveCompany,
  getCompanyMetadata,
  clearActiveCompany,
  verifyActiveCompanyAccess,
  ensureActiveCompany,
  switchActiveCompany,
};

