import { useState } from "react";

function UrlFetch() {
  const [id, setId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUrl = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/download/${id}`, {
        method: "GET",
      });

      if (!response.ok) {
        console.error("Download failed");
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName || "download");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log("Download successful");
      setId("");
      setFileName("");
    } catch (error) {
      console.error("Download error:", error);
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
          Enter a link or code to retrieve shared data.
        </p>

        <div className="space-y-md">
          <div className="relative">
            <label className="font-label-bold text-label-bold text-on-surface-variant mb-xs block">
              Transfer URL or Code
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                const name = e.target.value.split("/").pop() || "";
                setFileName(name);
              }}
              placeholder="skytransfer.io/s/..."
              className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleUrl}
            disabled={!id || isLoading}
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
