import { dropboxGateway } from '../../gateway/dropboxGateway';
import { getCompanyFolderPath, getWorkspaceFolderPath, sanitizeCompanyName, COMPANY_FOLDER_PREFIX } from '../../constants/dropbox';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { Company } from '../../types/company';

async function getAuthenticatedClient() {
  await dropboxGateway.refreshTokenIfNeeded();
  return dropboxGateway.getClient();
}

async function detectCompanies(): Promise<Company[]> {
  const dbx = await getAuthenticatedClient();

  try {
    const result = await dbx.filesListFolder({ path: '' });

    const companyFolders = result.result.entries.filter(
      (entry: any) =>
        entry.name.startsWith(COMPANY_FOLDER_PREFIX) &&
        entry['.tag'] === 'folder'
    );

    const companies: Company[] = [];

    for (const folder of companyFolders) {
      const company = await processCompanyFolder(folder);
      if (company) {
        companies.push(company);
      }
    }

    localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify(companies));
    return companies;
  } catch (error) {
    return [];
  }
}

async function processCompanyFolder(folder: any): Promise<Company | null> {
  try {
    const metadata = await getCompanyMetadata(folder.path_lower || `/${folder.name}`);
    if (metadata) {
      return metadata;
    }
  } catch (error) {
  }

  const companyName = folder.name.replace(COMPANY_FOLDER_PREFIX, '');
  return {
    id: sanitizeCompanyName(companyName),
    name: companyName,
    folderPath: folder.path_lower || `/${folder.name}`,
    folderId: folder.id || '',
    createdAt: new Date().toISOString(),
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

export const companyService = {
  detectCompanies,
  createCompany,
  getActiveCompany,
  setActiveCompany,
  getCompanyMetadata,
  clearActiveCompany,
};

