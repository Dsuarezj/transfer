import { fileService } from './dropbox/fileService';

type TransferIds = Record<string, string>;

const IDS_PATH = '/transfer-ids.json';

export function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function getNextAvailableId(ids: TransferIds, baseNumber: string): string {
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

export function checkDuplicateLocal(
  ids: TransferIds,
  transferNumber: string
): { isDuplicate: boolean; suggestedId: string } {
  const normalized = normalize(transferNumber);
  const isDuplicate = normalized in ids;
  const suggestedId = getNextAvailableId(ids, normalized);
  return { isDuplicate, suggestedId };
}

async function getAll(): Promise<TransferIds> {
  try {
    const content = await fileService.get(IDS_PATH);
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function save(ids: TransferIds): Promise<void> {
  const content = JSON.stringify(ids, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  await fileService.update(IDS_PATH, blob);
}

async function add(transferNumber: string, date: string): Promise<void> {
  const ids = await getAll();
  ids[normalize(transferNumber)] = date;
  await save(ids);
}

async function checkDuplicate(transferNumber: string): Promise<{
  isDuplicate: boolean;
  suggestedId: string;
  loadedIds: TransferIds;
}> {
  const ids = await getAll();
  const result = checkDuplicateLocal(ids, transferNumber);
  return { ...result, loadedIds: ids };
}

async function addWithIds(transferNumber: string, date: string, existingIds: TransferIds): Promise<void> {
  existingIds[normalize(transferNumber)] = date;
  await save(existingIds);
}

export const transferIdService = {
  getAll,
  checkDuplicate,
  add,
  addWithIds,
};

export type { TransferIds };
