import React from 'react';

interface HeaderProps {
  onHelpClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHelpClick }) => {
  return (
    <header className="flex justify-between items-center w-full px-margin h-16 sticky top-0 z-50 bg-surface border-b border-outline-variant">
      <div className="flex items-center gap-sm">
        <span className="material-symbols-outlined text-primary text-headline-md" style={{ fontVariationSettings: "'FILL' 1" }}>
          cloud_upload
        </span>
        <span className="text-headline-md font-headline-md text-primary">SkyTransfer</span>
      </div>
      
      <nav className="flex items-center gap-lg">
        <a className="font-body-base text-body-base text-primary font-bold border-b-2 border-primary pb-1 hover:text-primary transition-colors duration-200" href="#transfer">
          Transfer
        </a>
      </nav>
      
      <div className="flex items-center gap-md">
        <button 
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all duration-200"
          onClick={onHelpClick}
          aria-label="Help"
        >
          help_outline
        </button>
      </div>
    </header>
  );
};

export default Header;
