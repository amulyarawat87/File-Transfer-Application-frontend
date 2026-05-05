import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import FileUpload from './components/FileUpload';
import UrlFetch from './components/UrlFetch';
import FeatureHighlight from './components/FeatureHighlight';
import Footer from './components/Footer';

function App() {
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
