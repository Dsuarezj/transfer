import { fileService } from './dropbox/fileService';
import { TransferIds } from '../types/dropbox';

class TransferIdService {
  private readonly idsPath = '/transfer-ids.json';

  async getAll(): Promise<TransferIds> {
    try {
      const content = await fileService.get(this.idsPath);
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  async save(ids: TransferIds): Promise<void> {
    const content = JSON.stringify(ids, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    await fileService.update(this.idsPath, blob);
  }

  async exists(transferNumber: string): Promise<boolean> {
    const ids = await this.getAll();
    return transferNumber in ids;
  }

  async add(transferNumber: string, date: string): Promise<void> {
    const ids = await this.getAll();
    ids[transferNumber] = date;
    await this.save(ids);
  }

  getNextAvailableId(ids: TransferIds, baseNumber: string): string {
    if (!(baseNumber in ids)) {
      return baseNumber;
    }
    
    let suffix = 1;
    while (`${baseNumber}-${suffix}` in ids) {
      suffix++;
    }
    return `${baseNumber}-${suffix}`;
  }

  async checkDuplicateWithSuggestion(transferNumber: string): Promise<{
    isDuplicate: boolean;
    suggestedId: string;
  }> {
    const ids = await this.getAll();
    const isDuplicate = transferNumber in ids;
    const suggestedId = this.getNextAvailableId(ids, transferNumber);
    
    return { isDuplicate, suggestedId };
  }
}

export const transferIdService = new TransferIdService();

