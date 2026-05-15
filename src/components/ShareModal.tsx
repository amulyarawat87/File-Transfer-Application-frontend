import React, { useState } from 'react';

type ShareMode = "code" | "link";

interface ShareModalProps {
  isOpen: boolean;
  shareLink: string;
  shareCode: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, shareLink, shareCode, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>("code");

  const shareContent = shareMode === "code" ? shareCode : shareLink;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-margin bg-on-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-xxl shadow-2xl w-full max-w-2xl border border-outline-variant p-md">
        <div className="flex justify-between items-center mb-md">
          <div className="flex items-center gap-sm">
            <span 
              className="material-symbols-outlined text-tertiary" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h3 className="font-headline-md text-headline-md">Ready to share!</h3>
          </div>
          <button 
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            close
          </button>
        </div>
        
        <p className="font-body-base text-body-base text-on-surface-variant mb-md">
          Upload complete. Anyone with this code or link can download your files for the next 7 days.
        </p>

        {/* Share Mode Toggle */}
        <div className="flex gap-sm mb-md border-b border-outline-variant">
          <button
            onClick={() => setShareMode("code")}
            className={`px-md py-sm font-label-bold text-label-bold transition-all border-b-2 ${
              shareMode === "code"
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setShareMode("link")}
            className={`px-md py-sm font-label-bold text-label-bold transition-all border-b-2 ${
              shareMode === "link"
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            Link
          </button>
        </div>
        
        <div className="bg-surface-container-low p-sm rounded-lg flex items-center justify-between border border-outline-variant mb-md gap-sm">
          <span className="font-body-sm text-body-sm text-primary truncate">
            {shareContent}
          </span>
          <button 
            className="flex items-center gap-xs text-primary font-label-bold text-label-bold hover:underline px-xs whitespace-nowrap"
            onClick={handleCopyLink}
          >
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="flex gap-sm">
          <button 
            className="flex-1 py-sm bg-primary text-on-primary rounded-lg font-label-bold text-label-bold hover:brightness-90 transition-all"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
