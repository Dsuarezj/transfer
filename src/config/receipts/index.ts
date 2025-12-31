import { ReceiptConfig } from '../../types/receipt';
import bancoLoja from './banco-loja.json';
import bancoPichincha from './banco-pichincha.json';
import deuna from './deuna.json';
import defaultConfig from './default.json';

export const receiptConfigs: ReceiptConfig[] = [
  bancoLoja as ReceiptConfig,
  bancoPichincha as ReceiptConfig,
  deuna as ReceiptConfig,
  defaultConfig as ReceiptConfig
];

export function getConfigForReceipt(text: string): ReceiptConfig {
  const textLower = text.toLowerCase();

  for (const config of receiptConfigs) {
    if (config.id === 'default') continue;

    for (const keyword of config.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        return config;
      }
    }
  }

  return receiptConfigs.find(c => c.id === 'default')!;
}
