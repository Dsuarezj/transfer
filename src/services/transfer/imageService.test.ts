import { describe, it, expect, vi, beforeEach } from 'vitest';
import { imageService } from './imageService';
import { fileService } from '../dropbox/fileService';

vi.mock('../dropbox/fileService');

describe('imageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:30:45'));
  });

  describe('upload', () => {
    it('saves image to /capturas/YYYY-MM/ with timestamp in filename', async () => {
      const mockBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      vi.mocked(fileService.save).mockResolvedValue(undefined);
      vi.mocked(fileService.getDropboxUrl).mockReturnValue('https://www.dropbox.com/home/path');

      await imageService.upload(mockBlob, 'FAC-001');

      expect(fileService.save).toHaveBeenCalledWith(
        expect.stringMatching(/\/capturas\/2026-01\/FAC-001_\d{8}_\d{6}\.jpg/),
        mockBlob
      );
    });

    it('returns the Dropbox URL of the uploaded image', async () => {
      const mockBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      const expectedUrl = 'https://www.dropbox.com/home/Apps/Transferido/capturas/2026-01/FAC-001_20260115_103045.jpg';
      vi.mocked(fileService.save).mockResolvedValue(undefined);
      vi.mocked(fileService.getDropboxUrl).mockReturnValue(expectedUrl);

      const result = await imageService.upload(mockBlob, 'FAC-001');

      expect(result).toBe(expectedUrl);
      expect(fileService.getDropboxUrl).toHaveBeenCalledWith('/capturas/2026-01/FAC-001_20260115_103045.jpg');
    });

    it('includes invoice number in the filename', async () => {
      const mockBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      vi.mocked(fileService.save).mockResolvedValue(undefined);
      vi.mocked(fileService.getDropboxUrl).mockReturnValue('https://www.dropbox.com/home/path');

      await imageService.upload(mockBlob, 'MI-FACTURA-123');

      expect(fileService.save).toHaveBeenCalledWith(
        expect.stringContaining('MI-FACTURA-123'),
        mockBlob
      );
    });

    it('organizes images by month in YYYY-MM format', async () => {
      const mockBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      vi.mocked(fileService.save).mockResolvedValue(undefined);
      vi.mocked(fileService.getDropboxUrl).mockReturnValue('https://www.dropbox.com/home/path');

      await imageService.upload(mockBlob, 'FAC-001');

      expect(fileService.save).toHaveBeenCalledWith(
        expect.stringMatching(/\/capturas\/2026-01\//),
        mockBlob
      );
    });
  });

  describe('delete', () => {
    it('extracts full path from Dropbox URL and deletes image', async () => {
      const dropboxUrl = 'https://www.dropbox.com/home/Apps/Transferido/workspace-company/capturas/2026-01/image.jpg';
      vi.mocked(fileService.delete).mockResolvedValue(undefined);

      await imageService.delete(dropboxUrl);

      expect(fileService.delete).toHaveBeenCalledWith('/Apps/Transferido/workspace-company/capturas/2026-01/image.jpg');
    });

    it('handles URL-encoded paths', async () => {
      const dropboxUrl = 'https://www.dropbox.com/home/Apps/Transferido/workspace-company/capturas/2026-01/FAC-001%20_20260115_103045.jpg';
      vi.mocked(fileService.delete).mockResolvedValue(undefined);

      await imageService.delete(dropboxUrl);

      expect(fileService.delete).toHaveBeenCalledWith('/Apps/Transferido/workspace-company/capturas/2026-01/FAC-001 _20260115_103045.jpg');
    });

    it('extracts path with workspace prefix', async () => {
      const dropboxUrl = 'https://www.dropbox.com/home/Apps/Transferido/transferencias-company/workspace-company/capturas/2026-01/image.jpg';
      vi.mocked(fileService.delete).mockResolvedValue(undefined);

      await imageService.delete(dropboxUrl);

      expect(fileService.delete).toHaveBeenCalledWith('/Apps/Transferido/transferencias-company/workspace-company/capturas/2026-01/image.jpg');
    });

    it('throws error for invalid URL format', async () => {
      const invalidUrl = 'https://example.com/path';

      await expect(imageService.delete(invalidUrl)).rejects.toThrow('Invalid Dropbox URL format');
    });
  });
});

