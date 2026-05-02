import './App.css';
import FileUpload from "./components/FileUpload";
import UrlFetch from "./components/UrlFetch";

function App() {
  return (
    <div className="app-container">
      <FileUpload />
      <UrlFetch />
    </div>
  );
}

export default App;