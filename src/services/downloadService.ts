import { API_BASE } from "./apiBase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PresignedDownloadResponse = {
  fileName: string;
  presignedGetUrl: string;
  contentType?: string;
  encryptionKey: string;
};

export type DownloadResult = PresignedDownloadResponse & {
  encryptedData: ArrayBuffer;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function downloadEncryptedFile(shortCode: string): Promise<DownloadResult> {
  const response = await fetch(`${API_BASE}/download/${encodeURIComponent(shortCode)}`);

  if (response.status === 404) {
    throw new Error("File not found or has expired. Check the code and try again.");
  }

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const downloadResponse = (await response.json()) as PresignedDownloadResponse;

  if (
    !downloadResponse.fileName ||
    !downloadResponse.presignedGetUrl ||
    !downloadResponse.encryptionKey
  ) {
    throw new Error("Download response was missing required file metadata");
  }

  const fileResponse = await fetch(downloadResponse.presignedGetUrl);
  if (!fileResponse.ok) {
    throw new Error(
      `Could not download encrypted file: ${fileResponse.status} ${fileResponse.statusText}`
    );
  }

  return {
    ...downloadResponse,
    encryptedData: await fileResponse.arrayBuffer(),
  };
}
