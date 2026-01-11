import { reportService } from '../services/transfer/reportService';
import { idService, TransferIds } from '../services/transfer/idService';

interface UpdateParams {
  date: string;
  time: string;
  imageUrl: string;
  invoiceNumber: string;
  transferNumber: string;
  originalTransferNumber: string;
  loadedIds: TransferIds;
}

export function useTransferUpdate() {
  const update = async (params: UpdateParams): Promise<string> => {
    const finalInvoice = params.invoiceNumber.trim() || 'SIN-FACTURA';
    const newTransferNumber = params.transferNumber.trim();
    const originalNumber = params.originalTransferNumber.trim();

    const transferNumberChanged = newTransferNumber !== originalNumber;

    if (transferNumberChanged && originalNumber) {
      await idService.removeWithIds(originalNumber, params.loadedIds);
    }

    if (transferNumberChanged && newTransferNumber) {
      await idService.addWithIds(newTransferNumber, params.date, params.loadedIds);
    }

    await reportService.update({
      date: params.date,
      time: params.time,
      imageUrl: params.imageUrl,
      invoiceNumber: finalInvoice,
      transferNumber: newTransferNumber,
    });

    return newTransferNumber;
  };

  return { update };
}

