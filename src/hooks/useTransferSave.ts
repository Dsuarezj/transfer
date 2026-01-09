import { format } from 'date-fns';
import { imageService, reportService, idService, TransferIds } from '../services/transfer';

interface SaveParams {
  photoBlob: Blob;
  invoiceNumber: string;
  transferNumber: string;
  loadedIds: TransferIds;
}

export function useTransferSave() {
  const save = async (params: SaveParams): Promise<string> => {
    const finalInvoice = params.invoiceNumber.trim() || 'SIN-FACTURA';

    const imageUrl = await imageService.upload(params.photoBlob, finalInvoice);

    await reportService.save({
      invoiceNumber: finalInvoice,
      transferNumber: params.transferNumber,
      imageUrl,
    });

    if (params.transferNumber) {
      await idService.addWithIds(
        params.transferNumber,
        format(new Date(), 'yyyy-MM-dd'),
        params.loadedIds
      );
    }

    return params.transferNumber;
  };

  return { save };
}

