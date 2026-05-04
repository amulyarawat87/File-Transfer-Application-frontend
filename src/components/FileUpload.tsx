import { useState } from "react";

function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
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
    console.log(result);
  }
  return (
    <div className="card">
        <h2 className="card-title">File Upload</h2>
        <div className="input-row">
            <input className="file-input" type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
            <button className="btn" onClick={handleUpload}>Upload</button>
        </div>
    </div>
  );
}

export default FileUpload;