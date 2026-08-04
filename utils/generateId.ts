import * as Crypto from 'expo-crypto';

export type IdPrefix = 'USR' | 'CAT' | 'ITM' | 'CSH' | 'TRX' | 'STM';

export function generateId(prefix: IdPrefix): string {
  const uuid = Crypto.randomUUID();
  return `${prefix}-${uuid}`;
}
