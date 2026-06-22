import './App.css';
import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PresignedUpload from './components/PresignedUpload';
import PresignedDownload from './components/PresignedDownload';
import FeatureHighlight from './components/FeatureHighlight';
import Footer from './components/Footer';


const API_BASE = import.meta.env.VITE_API_BASE;
console.log(import.meta.env.VITE_API_BASE);

function App() {
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadStartedRef = useRef(false);

  const extractFilenameFromHeader = (contentDisposition: string): string => {
    if (!contentDisposition) return "download";
    
    const filenameMatch = contentDisposition.match(/filename\*?=(?:"([^"]*)"|([^;\r\n]*))/);
    return filenameMatch ? (filenameMatch[1] || filenameMatch[2]) : "download";
  };

  useEffect(() => {
    if (downloadStartedRef.current) return;

    const pathname = window.location.pathname;
    const match = pathname.match(/^\/(download|s)\/([^/]+)$/);
    
    if (match) {
      const code = match[2];
      downloadStartedRef.current = true;
     
      
      const downloadFile = async () => {
        setIsDownloading(true);
        try {
          console.log("⬇️ Starting direct URL download with code:", code);

          const response = await fetch(`${API_BASE}/download/${code}`, {
            method: "GET",
          });

          console.log("📨 Direct Download Response Entity:", {
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
            console.error("❌ Direct download failed with status:", response.status);
            setIsDownloading(false);
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
          
          console.log("✅ Direct download successful for:", fileName);
          setIsDownloading(false);
        } catch (error) {
          console.error("❌ Direct download error:", error);
          setIsDownloading(false);
        }
      };

      downloadFile();
    }
  }, []);

  if (isDownloading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center m-sm">
        <div className="text-center">
          <div className="mb-md">
            <span className="material-symbols-outlined text-[64px] text-primary animate-spin">
              downloading
            </span>
          </div>
          <p className="font-headline-md text-headline-md">Downloading your file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col m-sm">
      <Header />
      
      <main className="max-w-300 mx-auto px-margin py-xl flex-1 w-full">
        <Hero />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          <PresignedUpload />
          <div className="lg:col-span-5 flex flex-col gap-md">
            <PresignedDownload />
            <FeatureHighlight />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
