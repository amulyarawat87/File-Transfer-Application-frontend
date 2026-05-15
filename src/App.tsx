import './App.css';
import { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import FileUpload from './components/FileUpload';
import UrlFetch from './components/UrlFetch';
import FeatureHighlight from './components/FeatureHighlight';
import Footer from './components/Footer';

function App() {
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadStartedRef = useRef(false);

  const extractFilenameFromHeader = (contentDisposition: string): string => {
    if (!contentDisposition) return "download";
    
    // Try to extract filename from Content-Disposition header
    // Format: attachment; filename="filename.txt" or attachment; filename=filename.txt
    const filenameMatch = contentDisposition.match(/filename\*?=(?:"([^"]*)"|([^;\r\n]*))/);
    return filenameMatch ? (filenameMatch[1] || filenameMatch[2]) : "download";
  };

  useEffect(() => {
    // Prevent running twice due to React Strict Mode
    if (downloadStartedRef.current) return;

    // Handle direct download from URL like /download/CODE or /s/CODE
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/(download|s)\/([^/]+)$/);
    
    if (match) {
      const code = match[2];
      downloadStartedRef.current = true;
      setIsDownloading(true);
      
      const downloadFile = async () => {
        try {
          console.log("⬇️ Starting direct URL download with code:", code);

          const response = await fetch(`http://localhost:8080/api/download/${code}`, {
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

  // Show loading state while downloading
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
      
      <main className="max-w-[1200px] mx-auto px-margin py-xl flex-1 w-full">
        <Hero />
        
        {/* Main Interaction Cards (Bento Grid Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          <FileUpload />
          
          {/* Right Column: Download & Utility */}
          <div className="lg:col-span-5 flex flex-col gap-md">
            <UrlFetch />
            <FeatureHighlight />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
