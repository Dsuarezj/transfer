import { fileService } from '../dropbox/fileService';

type TransferIds = Record<string, string>;

const IDS_PATH = '/transfer-ids.json';

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function getNextAvailableId(ids: TransferIds, baseNumber: string): string {
  const normalized = normalize(baseNumber);
  if (!(normalized in ids)) {
    return normalized;
  }

  let suffix = 1;
  while (`${normalized}-${suffix}` in ids) {
    suffix++;
  }
  return `${normalized}-${suffix}`;
}

async function getAll(): Promise<TransferIds> {
  try {
    const content = await fileService.get(IDS_PATH);
    return JSON.parse(content);
  } catch (error: any) {
    if (error.message === 'File not found') {
      return {};
    }
    throw error;
  }
}

async function save(ids: TransferIds): Promise<void> {
  const content = JSON.stringify(ids, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  
  try {
    await fileService.get(IDS_PATH);
    await fileService.update(IDS_PATH, blob);
  } catch (error: any) {
    if (error.message === 'File not found') {
      await fileService.save(IDS_PATH, blob);
    } else {
      throw error;
    }
  }
}

function checkDuplicate(ids: TransferIds, transferNumber: string): {
  isDuplicate: boolean;
  suggestedId: string;
} {
  const normalized = normalize(transferNumber);
  const isDuplicate = normalized in ids;
  const suggestedId = getNextAvailableId(ids, normalized);
  return { isDuplicate, suggestedId };
}

function prepare(ids: TransferIds, transferNumber: string): {
  isDuplicate: boolean;
  finalNumber: string;
} {
  const trimmed = transferNumber.trim();
  if (!trimmed) {
    return { isDuplicate: false, finalNumber: '' };
  }
  const check = checkDuplicate(ids, trimmed);
  return { isDuplicate: check.isDuplicate, finalNumber: check.suggestedId };
}

async function add(transferNumber: string, date: string): Promise<void> {
  const ids = await getAll();
  ids[normalize(transferNumber)] = date;
  await save(ids);
}

async function addWithIds(transferNumber: string, date: string, existingIds: TransferIds): Promise<void> {
  existingIds[normalize(transferNumber)] = date;
  await save(existingIds);
}

export const idService = {
  getAll,
  checkDuplicate,
  prepare,
  add,
  addWithIds,
};

export type { TransferIds };
