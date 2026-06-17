// Encryption Service — AES-256-GCM via Web Crypto API

// ─── Constants ────────────────────────────────────────────────────────────────

const ALGORITHM = "AES-GCM" as const;
const KEY_LENGTH = 256 as const;
const IV_LENGTH = 12 as const;   // 96-bit IV — recommended for GCM
const TAG_LENGTH = 128 as const; // 128-bit auth tag — GCM maximum

// ─── Key management ───────────────────────────────────────────────────────────

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable — needed for exportKeyToJson
    ["encrypt", "decrypt"]
  );
}

export async function exportKeyToJson(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

export async function importKeyFromJson(jsonKey: string): Promise<CryptoKey> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonKey);
  } catch {
    throw new Error("Invalid encryption key: could not parse JSON");
  }

  // Minimal structural check before handing to the crypto API,
  // which would otherwise throw an opaque DataError.
  if (typeof parsed !== "object" || parsed === null || !("k" in parsed)) {
    throw new Error("Invalid encryption key: not a valid JWK object");
  }

  return crypto.subtle.importKey(
    "jwk",
    parsed as JsonWebKey,
    { name: ALGORITHM }, // length is not a valid field for importKey — omit it
    true,
    ["encrypt", "decrypt"]
  );
}

// ─── Encrypt / decrypt ────────────────────────────────────────────────────────

/**
 * Encrypts an ArrayBuffer with AES-256-GCM.
 *
 * Output layout: [ IV (12 bytes) | ciphertext + GCM tag (n + 16 bytes) ]
 */
export async function encryptFile(
  fileData: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    fileData
  );

  // `new Uint8Array(n)` always allocates its own buffer — no need for .slice(0).
  const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), IV_LENGTH);
  return result.buffer;
}

/**
 * Decrypts output produced by {@link encryptFile}.
 *
 * Expects layout: [ IV (12 bytes) | ciphertext + GCM tag ]
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  if (encryptedData.byteLength <= IV_LENGTH) {
    throw new Error(
      `Encrypted data is too short to be valid (${encryptedData.byteLength} bytes)`
    );
  }

  const bytes = new Uint8Array(encryptedData);
  const iv = bytes.slice(0, IV_LENGTH);
  const ciphertext = bytes.slice(IV_LENGTH);

  return crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext
  );
}

// ─── File / buffer utilities ──────────────────────────────────────────────────

/**
 * Reads a File into an ArrayBuffer using the modern file.arrayBuffer() API,
 * with a FileReader fallback for older browsers.
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result instanceof ArrayBuffer) resolve(result);
      else reject(new Error("FileReader did not return an ArrayBuffer"));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader encountered an unknown error"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Wraps an ArrayBuffer in a Blob for use with fetch/XHR.
 * Defaults to application/octet-stream since the content is always encrypted.
 */
export function arrayBufferToBlob(
  buffer: ArrayBuffer,
  type = "application/octet-stream"
): Blob {
  return new Blob([buffer], { type });
}