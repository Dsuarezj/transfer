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
    it('saves image to /capturas/ with timestamp in filename', async () => {
      const mockBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      vi.mocked(fileService.save).mockResolvedValue(undefined);
      vi.mocked(fileService.getFullPath).mockReturnValue('/Apps/Transferido/capturas/FAC-001_20260115_103045.jpg');

      await imageService.upload(mockBlob, 'FAC-001');

      expect(fileService.save).toHaveBeenCalledWith(
        expect.stringMatching(/\/capturas\/FAC-001_\d{8}_\d{6}\.jpg/),
        mockBlob
      );
    });

    it('returns the full path URL of the uploaded image', async () => {
      const mockBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      const expectedUrl = '/Apps/Transferido/capturas/FAC-001_20260115_103045.jpg';
      vi.mocked(fileService.save).mockResolvedValue(undefined);
      vi.mocked(fileService.getFullPath).mockReturnValue(expectedUrl);

      const result = await imageService.upload(mockBlob, 'FAC-001');

      expect(result).toBe(expectedUrl);
    });

    it('includes invoice number in the filename', async () => {
      const mockBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      vi.mocked(fileService.save).mockResolvedValue(undefined);
      vi.mocked(fileService.getFullPath).mockReturnValue('/path');

      await imageService.upload(mockBlob, 'MI-FACTURA-123');

      expect(fileService.save).toHaveBeenCalledWith(
        expect.stringContaining('MI-FACTURA-123'),
        mockBlob
      );
    });
  });
});

