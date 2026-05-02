import { useState } from "react";
function UrlFetch() {
    const [url, setUrl] = useState<string>("");
    async function handleUrl(){
        if(!url) return;

        const response = await fetch(`http://localhost:8080/api/download/${url}`, {
        method: "GET"
        });

        if(!response.ok) {
        console.error("Download failed");
        return;
        }

        console.log("Download successful");
    }
    return(
        <div className="card">
            <h2 className="card-title">File Download</h2>
            <div className="input-row">
                <input className="text-input" type="text" onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to Download File" />
                <button className="btn" onClick={handleUrl}>Download</button>
            </div>
        </div>
    );
}

export default UrlFetch;