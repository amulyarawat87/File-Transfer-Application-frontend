import { useState, useRef } from "react";
import ShareModal from "./ShareModal";

function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://localhost:8080/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          console.error("Upload failed for file:", file.name);
          continue;
        }

        const result = await response.text();
        setShareLink(result);
        setShowModal(true);
        setFiles([]);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xxl p-md shadow-sm">
        <div className="flex items-center gap-sm mb-md">
          <div className="p-xs bg-primary-container rounded text-on-primary-container">
            <span className="material-symbols-outlined">upload_file</span>
          </div>
          <h2 className="font-headline-md text-headline-md">Upload Files</h2>
        </div>

        <div
          className={`border-2 border-dashed rounded-xxl p-xl flex flex-col items-center justify-center gap-md transition-all duration-300 ${
            isDragging
              ? "drag-zone-active border-primary bg-blue-50"
              : "border-outline-variant bg-surface-container-low hover:border-primary group"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 ${
            isDragging ? "bg-primary/20 scale-110" : "bg-surface-container-highest group-hover:scale-110"
          }`}>
            <span
              className={`material-symbols-outlined text-[40px] transition-colors ${
                isDragging ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
              }`}
            >
              add_circle
            </span>
          </div>
          <div className="text-center">
            <p className="font-headline-md text-body-base text-on-surface mb-xs">
              Drag and drop files here
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Up to 1GB per transfer
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
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
          />
        </div>

        {files.length > 0 && (
          <div className="mt-md">
            <h3 className="font-label-bold text-label-bold text-on-surface-variant mb-sm">
              Selected Files ({files.length})
            </h3>
            <div className="space-y-xs max-h-48 overflow-y-auto mb-md">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-sm bg-surface-container-low border border-outline-variant rounded-lg"
                >
                  <div className="flex items-center gap-sm min-w-0">
                    <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">
                      description
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">
                      {file.name}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex-shrink-0">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-error hover:text-error/80 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-md">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isLoading}
            className="w-full py-md bg-primary text-on-primary font-headline-md text-body-base rounded-xxl hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
          >
            {isLoading ? "Uploading..." : "Upload Now"}
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={showModal}
        shareLink={shareLink}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export default FileUpload;
