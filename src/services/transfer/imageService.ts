import { format } from 'date-fns';
import { fileService } from '../dropbox/fileService';

async function upload(blob: Blob, name: string): Promise<string> {
  const now = new Date();
  const yearMonth = format(now, 'yyyy-MM');
  const timestamp = format(now, 'yyyyMMdd_HHmmss');
  const fileName = `${name}_${timestamp}.jpg`;
  const path = `/capturas/${yearMonth}/${fileName}`;

  await fileService.save(path, blob);
  return fileService.getDropboxUrl(path);
}

function extractPathFromDropboxUrl(dropboxUrl: string): string {
  const pathMatch = dropboxUrl.match(/https:\/\/www\.dropbox\.com\/home(.+)/);
  if (!pathMatch) {
    throw new Error('Invalid Dropbox URL format');
  }
  const extractedPath = decodeURIComponent(pathMatch[1]);
  return extractedPath;
}

async function deleteImage(dropboxUrl: string): Promise<void> {
  const fullPath = extractPathFromDropboxUrl(dropboxUrl);
  await fileService.delete(fullPath);
}

export const imageService = {
  upload,
  delete: deleteImage,
};
