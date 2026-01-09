import { format } from 'date-fns';
import { fileService } from '../dropbox/fileService';

async function upload(blob: Blob, name: string): Promise<string> {
  const now = new Date();
  const timestamp = format(now, 'yyyyMMdd_HHmmss');
  const fileName = `${name}_${timestamp}.jpg`;
  const path = `/capturas/${fileName}`;

  await fileService.save(path, blob);
  return fileService.getFullPath(path);
}

export const imageService = {
  upload,
};
