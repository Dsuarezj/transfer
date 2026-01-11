import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransferDelete } from './useTransferDelete';
import { reportService } from '../services/transfer/reportService';
import { idService } from '../services/transfer/idService';
import { imageService } from '../services/transfer/imageService';

vi.mock('../services/transfer/reportService', () => ({
  reportService: {
    remove: vi.fn(),
  },
}));

vi.mock('../services/transfer/idService', () => ({
  idService: {
    removeWithIds: vi.fn(),
  },
}));

vi.mock('../services/transfer/imageService', () => ({
  imageService: {
    delete: vi.fn(),
  },
}));

describe('useTransferDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes transfer from report, IDs and image', async () => {
    const { deleteTransfer } = useTransferDelete();
    const mockIds = { 'trf-001': '2026-01-10' };
    vi.mocked(reportService.remove).mockResolvedValue(undefined);
    vi.mocked(idService.removeWithIds).mockResolvedValue(undefined);
    vi.mocked(imageService.delete).mockResolvedValue(undefined);

    await deleteTransfer({
      date: '2026-01-10',
      time: '10:30:00',
      imageUrl: 'https://www.dropbox.com/home/path/image.jpg',
      transferNumber: 'TRF-001',
      loadedIds: mockIds,
    });

    expect(reportService.remove).toHaveBeenCalledWith({
      date: '2026-01-10',
      time: '10:30:00',
      imageUrl: 'https://www.dropbox.com/home/path/image.jpg',
    });
    expect(idService.removeWithIds).toHaveBeenCalledWith('TRF-001', mockIds);
    expect(imageService.delete).toHaveBeenCalledWith('https://www.dropbox.com/home/path/image.jpg');
  });

  it('skips ID removal when transferNumber is empty', async () => {
    const { deleteTransfer } = useTransferDelete();
    const mockIds = {};
    vi.mocked(reportService.remove).mockResolvedValue(undefined);
    vi.mocked(imageService.delete).mockResolvedValue(undefined);

    await deleteTransfer({
      date: '2026-01-10',
      time: '10:30:00',
      imageUrl: 'https://www.dropbox.com/home/path/image.jpg',
      transferNumber: '',
      loadedIds: mockIds,
    });

    expect(reportService.remove).toHaveBeenCalled();
    expect(idService.removeWithIds).not.toHaveBeenCalled();
    expect(imageService.delete).toHaveBeenCalled();
  });

  it('skips ID removal when transferNumber is undefined', async () => {
    const { deleteTransfer } = useTransferDelete();
    const mockIds = {};
    vi.mocked(reportService.remove).mockResolvedValue(undefined);
    vi.mocked(imageService.delete).mockResolvedValue(undefined);

    await deleteTransfer({
      date: '2026-01-10',
      time: '10:30:00',
      imageUrl: 'https://www.dropbox.com/home/path/image.jpg',
      transferNumber: undefined,
      loadedIds: mockIds,
    });

    expect(reportService.remove).toHaveBeenCalled();
    expect(idService.removeWithIds).not.toHaveBeenCalled();
    expect(imageService.delete).toHaveBeenCalled();
  });

  it('still deletes report and image even if ID removal fails', async () => {
    const { deleteTransfer } = useTransferDelete();
    const mockIds = { 'trf-001': '2026-01-10' };
    vi.mocked(reportService.remove).mockResolvedValue(undefined);
    vi.mocked(idService.removeWithIds).mockRejectedValue(new Error('ID not found'));
    vi.mocked(imageService.delete).mockResolvedValue(undefined);

    await deleteTransfer({
      date: '2026-01-10',
      time: '10:30:00',
      imageUrl: 'https://www.dropbox.com/home/path/image.jpg',
      transferNumber: 'TRF-001',
      loadedIds: mockIds,
    });

    expect(reportService.remove).toHaveBeenCalled();
    expect(imageService.delete).toHaveBeenCalled();
    expect(idService.removeWithIds).toHaveBeenCalled();
  });
});

