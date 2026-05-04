import { useState } from "react";
function UrlFetch() {
    const [id, setId] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    async function handleUrl(){
        if(!id) return;

        const response = await fetch(`http://localhost:8080/api/download/${id}`, {
        method: "GET"
        });

        if(!response.ok) {
        console.error("Download failed");
        return;
        }

        const blob = await response.blob();
        console.log("Blob created:", blob);

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href  = downloadUrl;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();

        console.log("Download successful");
    }
    return(
        <div className="card">
            <h2 className="card-title">File Download</h2>
            <div className="input-row">
                <input className="text-input" type="text" onChange={(e) =>{
                    setId(e.target.value)
                    const name = e.target.value.split("/").pop() || "";
                    setFileName(name);
                    }} placeholder="Enter ID to Download File" />
                <button className="btn" onClick={handleUrl}>Download</button>
            </div>
        </div>
    );
}

export default UrlFetch;