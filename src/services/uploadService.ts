const API_BASE = "http://localhost:8080/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type PresignedUrlResponse = {
  fileId: string;          // required — server must always return this
  presignedUrl: string;    // required
  expiresIn?: number;
  contentType?: string;
};

type UploadConfirmationResponse = {
  fileId: string;          // required — server must always return this
};

type UploadConfirmationRequest = {
  fileId: string;
  fileName: string;
  fileSize: number;
  encryptionKey: string;
};

export type UploadResult = {
  fileId: string;
};

// ─── Internal helpers ────────────────────────────────────────────────────────

async function getPresignedUploadUrl(): Promise<PresignedUrlResponse> {
  const response = await fetch(`${API_BASE}/upload/presigned-url`);

  if (!response.ok) {
    throw new Error(
      `Could not get upload URL: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as PresignedUrlResponse;

  if (!data.fileId || !data.presignedUrl) {
    throw new Error(
      "Server response was missing required fields (fileId or presignedUrl)"
    );
  }

  return data;
}

async function confirmUpload(
  request: UploadConfirmationRequest
): Promise<UploadConfirmationResponse> {
  const response = await fetch(`${API_BASE}/upload/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(
      `Upload confirmation failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as UploadConfirmationResponse;

  if (!data.fileId) {
    throw new Error("Server did not return a fileId after confirmation");
  }

  return data;
}

function uploadToPresignedUrl(
  url: string,
  blob: Blob,
  contentType: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Honour an AbortSignal if provided
    signal?.addEventListener("abort", () => {
      xhr.abort();
      reject(new DOMException("Upload aborted", "AbortError"));
    });

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Storage upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Upload failed: network error"))
    );

    xhr.addEventListener("abort", () =>
      reject(new DOMException("Upload aborted", "AbortError"))
    );

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(blob);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function uploadEncryptedFile(
  encryptedFile: Blob,
  originalFileName: string,
  encryptionKey: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<UploadResult> {
  // 1. Get a presigned URL + stable fileId from the backend
  const { fileId, presignedUrl, contentType } = await getPresignedUploadUrl();

  // 2. Stream the encrypted blob directly to storage
  await uploadToPresignedUrl(
    presignedUrl,
    encryptedFile,
    contentType ?? (encryptedFile.type || "application/octet-stream"),
    onProgress,
    signal
  );

  // 3. Tell the backend the upload is complete
  const confirmation = await confirmUpload({
    fileId,
    fileName: originalFileName,
    fileSize: encryptedFile.size,
    encryptionKey,
  });

  return { fileId: confirmation.fileId };
}