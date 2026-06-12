import { useState } from "react";

const API_BASE = "http://localhost:8080/api";

// ─── Types ────────────────────────────────────────────────────────────────────

// Backend endpoint: GET /api/download/{id}  (also reachable via /s/{id})
// Returns: the decrypted file as a binary stream with Content-Disposition header.
// Decryption is handled server-side using the stored encryption key.

type DownloadStatus = "idle" | "fetching" | "done" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parses the filename from a Content-Disposition header.
 * Handles both:
 *   filename="report.pdf"
 *   filename*=UTF-8''report%20final.pdf
 */
function parseFileName(contentDisposition: string, fallbackId: string): string {
  // Prefer filename* (RFC 5987, supports unicode/encoded names)
  const rfc5987Match = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;\r\n]+)/i);
  if (rfc5987Match) return decodeURIComponent(rfc5987Match[1].trim());

  // Fall back to plain filename="..."
  const plainMatch = contentDisposition.match(/filename="?([^";\r\n]+)"?/i);
  if (plainMatch) return plainMatch[1].trim();

  return `file-${fallbackId}`;
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke to give the browser time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── Component ────────────────────────────────────────────────────────────────

function PresignedDownload() {
  const [fileId, setFileId] = useState("");
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "fetching";

  const statusLabel = status === "fetching" ? "Downloading…" : "Download File";

  const handleDownload = async () => {
    const trimmedId = fileId.trim();
    if (!trimmedId) {
      setError("Please enter a File ID.");
      return;
    }

    setError(null);
    setStatus("fetching");

    try {
      // Hits: GET /api/download/{id}  (mapped from /s/{id} too)
      // Backend fetches from S3, decrypts with stored key, streams back the file.
      const response = await fetch(`${API_BASE}/download/${trimmedId}`);

      if (response.status === 404) {
        throw new Error("File not found or has expired. Check the ID and try again.");
      }
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Read the full response body as a Blob
      const blob = await response.blob();
      console.log("📦 File received:", blob.size, "bytes");

      // Parse the original filename from the response header
      const contentDisposition = response.headers.get("content-disposition") ?? "";
      const fileName = parseFileName(contentDisposition, trimmedId);
      console.log("📄 Filename:", fileName);

      // Trigger the browser Save dialog
      triggerBrowserDownload(blob, fileName);

      setStatus("done");
      console.log("✅ Download complete:", fileName);

    } catch (err) {
      console.error("❌ Download error:", err);
      setError(err instanceof Error ? err.message : "Download failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xxl p-md shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-sm mb-md">
        <div className="p-xs bg-primary-container rounded text-on-primary-container">
          <span className="material-symbols-outlined">download_file</span>
        </div>
        <h2 className="font-headline-md text-headline-md">Secure Download</h2>
        <span className="ml-auto inline-flex items-center gap-xs px-sm py-xs bg-surface-container-high rounded-full text-xs text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
          Encrypted transfer
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-md p-sm flex items-start gap-sm bg-error/10 border border-error text-error rounded-lg text-sm"
        >
          <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-[1px]">error</span>
          <span>{error}</span>
          <button
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            className="ml-auto flex-shrink-0 hover:opacity-70"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Success banner */}
      {status === "done" && (
        <div className="mb-md p-sm flex items-center gap-sm bg-primary/10 border border-primary text-primary rounded-lg text-sm">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          File decrypted and saved successfully.
        </div>
      )}

      <div className="space-y-md">

        {/* File ID input */}
        <div>
          <label
            htmlFor="file-id-input"
            className="block text-sm font-label-bold text-on-surface-variant mb-xs"
          >
            File ID
          </label>
          <input
            id="file-id-input"
            type="text"
            placeholder="Paste the file ID from your share link"
            value={fileId}
            onChange={(e) => {
              setFileId(e.target.value);
              if (error) setError(null);
              if (status === "done" || status === "error") setStatus("idle");
            }}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleDownload()}
            disabled={isLoading}
            className="w-full px-md py-sm border border-outline-variant rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary disabled:opacity-50 transition-colors"
          />
        </div>

        {/* Status indicator */}
        {isLoading && (
          <div
            aria-live="polite"
            className="flex items-center gap-sm text-sm text-on-surface-variant"
          >
            <span className="inline-block w-4 h-4 border-2 border-on-surface-variant/30 border-t-on-surface-variant rounded-full animate-spin flex-shrink-0" />
            {statusLabel}
          </div>
        )}

        {/* Download button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!fileId.trim() || isLoading}
          className="w-full py-md bg-primary text-on-primary font-headline-md text-body-base rounded-xxl hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
        >
          {isLoading && (
            <span className="inline-block w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin mr-sm align-[-3px]" />
          )}
          {statusLabel}
        </button>
      </div>

      {/* Footer note */}
      <p className="mt-md px-md py-sm bg-surface-container-high rounded-lg text-xs text-on-surface-variant">
        🔒 Files are stored encrypted and decrypted server-side on download. Your file is transferred over HTTPS.
      </p>
    </div>
  );
}

export default PresignedDownload;
