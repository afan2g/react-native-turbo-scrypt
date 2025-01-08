// Type definitions
export type BytesLike = string | Uint8Array | number[] | ArrayBuffer;
export type ProgressCallback = (progress: number) => void;

import { TurboModule, TurboModuleRegistry } from 'react-native';

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

// Helper function to convert BytesLike to string
function bytesToString(bytes: BytesLike): string {
  if (typeof bytes === 'string') {
    return bytes;
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
  
  // Convert to base64
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

  // Convert inputs to strings
  const passwdStr = bytesToString(passwd);
  const saltStr = bytesToString(salt);

  // Call native module
  return await NativeScrypt.scrypt(
    passwdStr,
    saltStr,
    N,
    r,
    p,
    dkLen,
    progress || null
  );
}

export default {
  scrypt
};