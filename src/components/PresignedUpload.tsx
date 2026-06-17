import { useState, useRef, useCallback } from "react";
import ShareModal from "./ShareModal";
import * as encryptionService from "../services/encryptionService";
import * as uploadService from "../services/uploadService";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = "idle" | "encrypting" | "uploading" | "done" | "error";

interface FileEntry {
  file: File;
  id: string; // stable key, avoids index-as-key issues
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

let _idCounter = 0;
function nextId() {
  return `file-${++_idCounter}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

function PresignedUpload() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File management ─────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: File[]) => {
    const newEntries = incoming.map((file) => ({ file, id: nextId() }));
    setEntries((prev) => [...prev, ...newEntries]);
    setError(null);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      // Reset input so the same file can be re-added after removal
      e.target.value = "";
    }
  };

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (entries.length === 0) return;

    setError(null);
    setUploadProgress(0);
    setStatus("encrypting");

    try {
      let encryptionKey: CryptoKey;
      let exportedKey: string;

      try {
        const key = await encryptionService.generateEncryptionKey();
        exportedKey = await encryptionService.exportKeyToJson(key);
        encryptionKey = key;
        console.log("✅ Encryption key generated");
      } catch (err) {
        console.error("❌ Failed to generate encryption key:", err);
        throw new Error("Failed to initialize encryption. Please try again.", { cause: err });
      }

      for (const { file } of entries) {
        console.log("📤 Starting encrypted upload for:", file.name);

        setStatus("encrypting");

        // Step 1: Read file into memory
        const fileData = await encryptionService.fileToArrayBuffer(file);
        console.log("✅ File read into memory");

        // Step 2: Encrypt client-side
        const encryptedData = await encryptionService.encryptFile(fileData, encryptionKey);
        const encryptedBlob = encryptionService.arrayBufferToBlob(encryptedData);
        console.log("🔒 File encrypted");

        // Step 3: Upload via backend
        setStatus("uploading");
        const uploadResponse = await uploadService.uploadEncryptedFile(
          encryptedBlob,
          file.name,
          exportedKey,
          (progress) => setUploadProgress(Math.round(progress))
        );

        
        console.log("✅ File uploaded:", uploadResponse.shortCode);
        setShareLink(`${window.location.origin}/s/${uploadResponse.shortCode}`);
        setShareCode(uploadResponse.shortCode);
        setEntries([]);
        setStatus("done");
        setShowModal(true);
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setStatus("error");
    } finally {
      if (status !== "done") setStatus("idle");
      setUploadProgress(0);
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────────

  const isLoading = status === "encrypting" || status === "uploading";

  const statusLabel =
    status === "encrypting"
      ? "Encrypting..."
      : status === "uploading"
      ? `Uploading… ${uploadProgress}%`
      : "Upload Securely";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xxl p-md shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-sm mb-md">
          <div className="p-xs bg-primary-container rounded text-on-primary-container">
            <span className="material-symbols-outlined">upload_file</span>
          </div>
          <h2 className="font-headline-md text-headline-md">Secure Upload</h2>
          <span className="ml-auto inline-flex items-center gap-xs px-sm py-xs bg-surface-container-high rounded-full text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
            End-to-end encrypted
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

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop zone — drag files here or press Enter to select"
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xxl p-xl flex flex-col items-center justify-center gap-md transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-outline-variant bg-surface-container-low hover:border-primary group"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 ${
              isDragging ? "bg-primary/20 scale-110" : "bg-surface-container-highest group-hover:scale-110"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[40px] transition-colors ${
                isDragging ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
              }`}
            >
              {isDragging ? "download" : "add_circle"}
            </span>
          </div>
          <div className="text-center pointer-events-none">
            <p className="font-headline-md text-body-base text-on-surface mb-xs">
              {isDragging ? "Drop to add files" : "Drag files here"}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Encrypted in your browser — never sent in plain text
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // prevent double-trigger from parent onClick
              fileInputRef.current?.click();
            }}
            className="px-md py-sm border border-outline text-on-surface font-label-bold text-label-bold rounded-lg hover:bg-surface-container-highest transition-colors"
          >
            Select Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {/* File list */}
        {entries.length > 0 && (
          <div className="mt-md">
            <h3 className="font-label-bold text-label-bold text-on-surface-variant mb-sm">
              {entries.length} file{entries.length !== 1 ? "s" : ""} selected
            </h3>
            <ul className="space-y-xs max-h-48 overflow-y-auto mb-md" aria-label="Selected files">
              {entries.map(({ file, id }) => (
                <li
                  key={id}
                  className="flex items-center justify-between p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                >
                  <div className="flex items-center gap-sm min-w-0">
                    <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-[20px]">
                      description
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">
                      {file.name}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex-shrink-0">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(id)}
                    aria-label={`Remove ${file.name}`}
                    disabled={isLoading}
                    className="text-error hover:text-error/70 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress bar */}
        {isLoading && (
          <div className="mt-md" aria-live="polite" aria-label={`Upload progress: ${uploadProgress}%`}>
            <div className="flex items-center justify-between mb-xs">
              <span className="text-sm text-on-surface-variant">
                {status === "encrypting" ? "Encrypting…" : "Uploading…"}
              </span>
              <span className="text-sm font-bold text-primary tabular-nums">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload button */}
        <div className="mt-md">
          <button
            type="button"
            onClick={handleUpload}
            disabled={entries.length === 0 || isLoading}
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
          🔑 Your file is encrypted with a unique key before leaving your device. The key travels with the
          file ID — share both to let recipients decrypt it.
        </p>
      </div>

      <ShareModal
        isOpen={showModal}
        shareLink={shareLink}
        shareCode={shareCode}
        onClose={() => {
          setShowModal(false);
          setStatus("idle");
        }}
      />
    </>
  );
}

export default PresignedUpload;
