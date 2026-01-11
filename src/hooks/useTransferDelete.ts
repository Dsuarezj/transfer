import { reportService } from '../services/transfer/reportService';
import { idService, TransferIds } from '../services/transfer/idService';
import { imageService } from '../services/transfer/imageService';

interface DeleteParams {
  date: string;
  time: string;
  imageUrl: string;
  transferNumber?: string;
  loadedIds: TransferIds;
}

export function useTransferDelete() {
  const deleteTransfer = async (params: DeleteParams): Promise<void> => {
    try {
      await imageService.delete(params.imageUrl);
    } catch (error) {
      throw new Error(`No se pudo eliminar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    try {
      await reportService.remove({
        date: params.date,
        time: params.time,
        imageUrl: params.imageUrl,
      });
    } catch (error) {
      throw new Error(`No se pudo eliminar el registro: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    if (params.transferNumber && params.transferNumber.trim()) {
      try {
        await idService.removeWithIds(params.transferNumber, params.loadedIds);
      } catch (error) {
        console.warn('No se pudo eliminar el ID de transferencia:', error);
      }
    }
  };

  return { deleteTransfer };
}

