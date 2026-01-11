import { dropboxGateway } from '../../gateway/dropboxGateway';
import { getWorkspaceFolderPath, WORKSPACE_FOLDER_PREFIX } from '../../constants/dropbox';
import { companyService } from '../company/companyService';

class FileService {
  private buildPath(relativePath: string): string {
    const activeCompany = companyService.getActiveCompany();
    
    if (!activeCompany) {
      throw new Error('No hay empresa activa. Por favor crea una empresa primero.');
    }

    const cleanRel = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    const basePath = activeCompany.folderPath;
    const isWorkspacePath = basePath.includes(`/${WORKSPACE_FOLDER_PREFIX}`);
    
    if (cleanRel.startsWith('/capturas') || cleanRel.startsWith('/reportes')) {
      if (isWorkspacePath) {
        return `${basePath}${cleanRel}`;
      }
      const workspacePath = getWorkspaceFolderPath(activeCompany.name);
      return `${workspacePath}${cleanRel}`;
    }

    return `${basePath}${cleanRel}`;
  }

  private async getClient() {
    await dropboxGateway.refreshTokenIfNeeded();
    return dropboxGateway.getClient();
  }

  async save(path: string, content: Blob | string): Promise<void> {
    const dbx = await this.getClient();
    const fileContent = content instanceof Blob ? content : new Blob([content]);

    await dbx.filesUpload({
      path: this.buildPath(path),
      contents: fileContent,
      mode: { '.tag': 'add' },
      autorename: true,
    });
  }

  async update(path: string, content: Blob | string): Promise<void> {
    const dbx = await this.getClient();
    const fileContent = content instanceof Blob ? content : new Blob([content]);

    await dbx.filesUpload({
      path: this.buildPath(path),
      contents: fileContent,
      mode: { '.tag': 'overwrite' },
      autorename: false,
    });
  }

  async delete(path: string): Promise<void> {
    const dbx = await this.getClient();
    await dbx.filesDeleteV2({ path: this.buildPath(path) });
  }

  async get(path: string): Promise<string> {
    const dbx = await this.getClient();

    try {
      const response = await dbx.filesDownload({ path: this.buildPath(path) });
      const blob = (response.result as any).fileBlob;
      return await blob.text();
    } catch (error: any) {
      if (error.status === 409) throw new Error('File not found');
      throw error;
    }
  }

  getFullPath(path: string): string {
    return this.buildPath(path);
  }

  getDropboxUrl(path: string): string {
    const fullPath = this.getFullPath(path);
    return `https://www.dropbox.com/home${fullPath}`;
  }

  async getTemporaryLink(dropboxHomeUrl: string): Promise<string> {
    const dbx = await this.getClient();

    const pathMatch = dropboxHomeUrl.match(/https:\/\/www\.dropbox\.com\/home(.+)/);
    if (!pathMatch) {
      throw new Error('Invalid Dropbox URL format');
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const response = await dbx.filesGetTemporaryLink({ path: filePath });
    return response.result.link;
  }
}

export const fileService = new FileService();
