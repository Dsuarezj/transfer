import { format } from 'date-fns';
import { fileService } from '../dropbox/fileService';

async function upload(blob: Blob, name: string): Promise<string> {
  const now = new Date();
  const yearMonth = format(now, 'yyyy-MM');
  const timestamp = format(now, 'yyyyMMdd_HHmmss');
  const fileName = `${name}_${timestamp}.jpg`;
  const path = `/capturas/${yearMonth}/${fileName}`;

  await fileService.save(path, blob);
  return fileService.getFullPath(path);
}

export const imageService = {
  upload,
};
