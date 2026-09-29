import './App.css';
import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PresignedUpload from './components/PresignedUpload';
import PresignedDownload from './components/PresignedDownload';
import FeatureHighlight from './components/FeatureHighlight';
import Footer from './components/Footer';
import * as encryptionService from './services/encryptionService';
import * as downloadService from './services/downloadService';

function App() {
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadStartedRef = useRef(false);

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

          const downloadResponse = await downloadService.downloadEncryptedFile(code);
          const key = await encryptionService.importKeyFromJson(
            downloadResponse.encryptionKey
          );
          const decryptedData = await encryptionService.decryptFile(
            downloadResponse.encryptedData,
            key
          );
          const blob = encryptionService.arrayBufferToBlob(
            decryptedData,
            downloadResponse.contentType || "application/octet-stream"
          );

          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.setAttribute("download", downloadResponse.fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 10_000);
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
