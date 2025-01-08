// Modified index.ts to match ethers scrypt exactly
import { TurboModule, TurboModuleRegistry } from 'react-native';

export type BytesLike = string | Uint8Array | number[] | ArrayBuffer;
export type ProgressCallback = (progress: number) => void;

export interface Spec extends TurboModule {
  scrypt(
    passwd: string,
    salt: string,
    N: number,
    r: number,
    p: number,
    dkLen: number,
    onProgress: ((progress: number) => void) | null
  ): Promise<string>;
}

const NativeScrypt = TurboModuleRegistry.get<Spec>('NativeScrypt');

function bytesToBase64(bytes: BytesLike): string {
  if (typeof bytes === 'string') {
    return btoa(bytes);
  }
  
  let uint8Array: Uint8Array;
  
  if (bytes instanceof Uint8Array) {
    uint8Array = bytes;
  } else if (Array.isArray(bytes)) {
    uint8Array = new Uint8Array(bytes);
  } else if (bytes instanceof ArrayBuffer) {
    uint8Array = new Uint8Array(bytes);
  } else {
    throw new Error('Invalid BytesLike input');
  }
  
  let binary = '';
  uint8Array.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export async function scrypt(
  passwd: BytesLike,
  salt: BytesLike,
  N: number,
  r: number,
  p: number,
  dkLen: number,
  progress?: ProgressCallback
): Promise<string> {
  if (!NativeScrypt) {
    throw new Error('NativeScrypt module not found');
  }

  // Convert inputs to base64
  const passwdBase64 = bytesToBase64(passwd);
  const saltBase64 = bytesToBase64(salt);

  // Call native module
  const hexResult = await NativeScrypt.scrypt(
    passwdBase64,
    saltBase64,
    N,
    r,
    p,
    dkLen,
    progress || null
  );

  // Return hex string with 0x prefix
  return `0x${hexResult}`;
}

export default {
  scrypt
};