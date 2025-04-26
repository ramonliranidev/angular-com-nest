import { env } from '@env';
import { AES } from 'crypto-js';

export function encryptPassword(password: string): string {
  const key = env.PRIVATE_KEY;
  return AES.encrypt(password, key).toString();
}
