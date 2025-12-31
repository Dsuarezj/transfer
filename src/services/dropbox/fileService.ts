import { dropboxGateway } from '../../gateway/dropboxGateway';
import { DROPBOX_APP_FOLDER_PATH } from '../../constants/dropbox';

class FileService {
  private buildPath(relativePath: string): string {
    const cleanRel = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    if (cleanRel === DROPBOX_APP_FOLDER_PATH || cleanRel.startsWith(`${DROPBOX_APP_FOLDER_PATH}/`)) {
      return cleanRel;
    }
    return `${DROPBOX_APP_FOLDER_PATH}${cleanRel}`;
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

  async createSharedLink(path: string): Promise<string> {
    const dbx = await this.getClient();
    const response = await dbx.sharingCreateSharedLinkWithSettings({ path: this.buildPath(path) });
    return response.result.url.replace('?dl=0', '?raw=1');
  }
}

export const fileService = new FileService();

