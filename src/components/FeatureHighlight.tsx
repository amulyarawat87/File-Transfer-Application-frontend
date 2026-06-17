import React from 'react';

const FeatureHighlight: React.FC = () => {
  return (
    <div className="bg-primary-container/10 border border-primary/20 rounded-xxl p-md relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="font-label-bold text-label-bold text-primary mb-xs">WHY SKYTRANSFER?</h3>
        <p className="font-headline-md text-[18px] text-on-surface mb-sm">End-to-End Encryption</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Your files are encrypted before they even leave your browser. Only the recipient has the key.
        </p>
      </div>
      <span 
        className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-primary/10 opacity-30 select-none"
      >
        security
      </span>
    </div>
  );
};

export default FeatureHighlight;
