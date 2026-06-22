import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

// ─── Types ────────────────────────────────────────────────────────────────────

type DownloadStatus = "idle" | "fetching" | "done" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFileName(contentDisposition: string, fallbackId: string): string {
  const rfc5987Match = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;\r\n]+)/i);
  if (rfc5987Match) return decodeURIComponent(rfc5987Match[1].trim());

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
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── Component ────────────────────────────────────────────────────────────────

function PresignedDownload() {
  const [shortCode, setShortCode] = useState("");   // was fileId
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "fetching";
  const statusLabel = status === "fetching" ? "Downloading…" : "Download File";

  const handleDownload = async () => {
    const trimmedCode = shortCode.trim();           // was fileId.trim()
    if (!trimmedCode) {
      setError("Please enter a Share Code.");       // was "File ID"
      return;
    }

    setError(null);
    setStatus("fetching");

    try {
      const response = await fetch(`${API_BASE}/download/${trimmedCode}`);

      if (response.status === 404) {
        throw new Error("File not found or has expired. Check the code and try again.");
      }
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      const contentDisposition = response.headers.get("content-disposition") ?? "";
      const fileName = parseFileName(contentDisposition, trimmedCode);

      triggerBrowserDownload(blob, fileName);

      setStatus("done");

    } catch (err) {
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
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-px">error</span>
          <span>{error}</span>
          <button
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            className="ml-auto shrink-0 hover:opacity-70"
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

        {/* Share Code input */}
        <div>
          <label
            htmlFor="share-code-input"
            className="block text-sm font-label-bold text-on-surface-variant mb-xs"
          >
            Share Code
          </label>
          <input
            id="share-code-input"
            type="text"
            placeholder="Paste the short code from your share link"
            value={shortCode}
            onChange={(e) => {
              setShortCode(e.target.value);
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
            <span className="inline-block w-4 h-4 border-2 border-on-surface-variant/30 border-t-on-surface-variant rounded-full animate-spin shrink-0" />
            {statusLabel}
          </div>
        )}

        {/* Download button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!shortCode.trim() || isLoading}
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