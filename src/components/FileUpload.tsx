import { useState } from "react";

function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  async function handleUpload() {
    if(!file) return;
    
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:8080/api/upload", {
      method: "POST",
      body: formData
    });

    if(!response.ok) {
      console.error("Upload failed");
      return;
    }

    const result = await response.text();
    setPopupMessage(result);
    setShowPopup(true);
  }

  function handleCopy() {
    navigator.clipboard.writeText(popupMessage);
  }

  return (
    <>
      <div className="card">
          <h2 className="card-title">File Upload</h2>
          <div className="input-row">
              <input className="file-input" type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
              <button className="btn" onClick={handleUpload}>Upload</button>
          </div>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
            <div className="popup-content">
              <p>{popupMessage}</p>
            </div>
            <div className="popup-actions">
              <button className="btn btn-copy" onClick={handleCopy}>Copy</button>
              <button className="btn btn-close" onClick={() => setShowPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FileUpload;