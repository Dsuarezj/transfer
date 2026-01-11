import { dropboxGateway } from '../../gateway/dropboxGateway';
import { getWorkspaceFolderPath } from '../../constants/dropbox';
import { companyService } from '../company/companyService';

class FileService {
  private buildPath(relativePath: string): string {
    const activeCompany = companyService.getActiveCompany();
    
    if (!activeCompany) {
      throw new Error('No hay empresa activa. Por favor crea una empresa primero.');
    }

    const cleanRel = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    
    if (cleanRel.startsWith('/capturas') || cleanRel.startsWith('/reportes')) {
      const workspacePath = getWorkspaceFolderPath(activeCompany.name);
      return `${workspacePath}${cleanRel}`;
    }

    const basePath = activeCompany.folderPath;
    if (cleanRel === basePath || cleanRel.startsWith(`${basePath}/`)) {
      return cleanRel;
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
}

export const fileService = new FileService();
