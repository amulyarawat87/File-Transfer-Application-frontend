import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="flex flex-col md:flex-row justify-between items-center px-margin py-md w-full gap-sm bg-surface-container-lowest border-t border-outline-variant mt-xl">
      <div className="flex items-center gap-sm">
        <span className="font-label-bold text-label-bold text-on-surface">SkyTransfer</span>
        <span className="text-on-surface-variant text-[12px] opacity-40">|</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          © 2024 SkyTransfer. All rights reserved. Secure & Encrypted.
        </p>
      </div>
      <div className="flex gap-md items-center flex-wrap justify-center md:justify-end">
        <a
          className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors hover:underline"
          href="#terms"
        >
          Terms of Service
        </a>
        <a
          className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors hover:underline"
          href="#privacy"
        >
          Privacy Policy
        </a>
        <a
          className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors hover:underline"
          href="#contact"
        >
          Contact Support
        </a>
      </div>
    </footer>
  );
};

export default Footer;
