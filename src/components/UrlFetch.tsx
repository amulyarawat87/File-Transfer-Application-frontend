import { useState } from "react";

function UrlFetch() {
  const [codeInput, setCodeInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const extractFilenameFromHeader = (contentDisposition: string): string => {
    if (!contentDisposition) return "download";
    
    // Try to extract filename from Content-Disposition header
    // Format: attachment; filename="filename.txt" or attachment; filename=filename.txt
    const filenameMatch = contentDisposition.match(/filename\*?=(?:"([^"]*)"|([^;\r\n]*))/);
    return filenameMatch ? (filenameMatch[1] || filenameMatch[2]) : "download";
  };

  const handleDownload = async () => {
    if (!codeInput) return;

    setIsLoading(true);
    console.log("⬇️ Starting download with code:", codeInput);

    try {
      const response = await fetch(`http://localhost:8080/api/download/${codeInput}`, {
        method: "GET",
      });

      console.log("📨 Download Response Entity:", {
        status: response.status,
        statusText: response.statusText,
        headers: {
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
          contentDisposition: response.headers.get("content-disposition"),
        },
        ok: response.ok,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        console.error("❌ Download failed with status:", response.status);
        return;
      }

      const blob = await response.blob();
      console.log("✅ Blob received:", {
        blobSize: blob.size,
        blobType: blob.type,
        timestamp: new Date().toISOString(),
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get("content-disposition") || "";
      const fileName = extractFilenameFromHeader(contentDisposition);
      
      console.log("📥 Downloading file:", {
        fileName,
        contentDisposition,
        timestamp: new Date().toISOString(),
      });

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log("✅ Download successful for:", fileName);
      setCodeInput("");
    } catch (error) {
      console.error("❌ Download error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lg:col-span-5 flex flex-col gap-md">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xxl p-md shadow-sm">
        <div className="flex items-center gap-sm mb-md">
          <div className="p-xs bg-secondary-container rounded text-on-secondary-container">
            <span className="material-symbols-outlined">download</span>
          </div>
          <h2 className="font-headline-md text-headline-md">Download Files</h2>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
          Enter a transfer code to retrieve shared data.
        </p>

        <div className="space-y-md">
          {/* Code Input */}
          <div className="relative">
            <label className="font-label-bold text-label-bold text-on-surface-variant mb-xs block">
              Transfer Code
            </label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
              }}
              placeholder="e.g., ABC123DEF456..."
              className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={!codeInput || isLoading}
            className="w-full py-md border border-primary text-primary font-headline-md text-body-base rounded-xxl hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UrlFetch;
