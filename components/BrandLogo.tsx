import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = 'md' }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Backbone of the 'E' */}
        <rect x="20" y="20" width="10" height="60" rx="2" fill="currentColor" />
        
        {/* Top Bar: Spoon (Points Right) */}
        <g>
          <rect x="30" y="22" width="35" height="6" rx="1" fill="currentColor" />
          <ellipse cx="75" cy="25" rx="12" ry="9" fill="currentColor" />
        </g>
        
        {/* Middle Bar: Fork (Updated to Point Right) */}
        <g>
          <rect x="30" y="47" width="35" height="6" rx="1" fill="currentColor" />
          {/* Vertical base of the fork head */}
          <rect x="65" y="42" width="4" height="16" rx="1" fill="currentColor" />
          {/* 3 horizontal tines sticking out to the right */}
          <rect x="69" y="42" width="18" height="2.5" rx="0.5" fill="currentColor" />
          <rect x="69" y="48.75" width="18" height="2.5" rx="0.5" fill="currentColor" />
          <rect x="69" y="55.5" width="18" height="2.5" rx="0.5" fill="currentColor" />
        </g>
        
        {/* Bottom Bar: Knife (Points Right) */}
        <g>
          <rect x="30" y="72" width="35" height="6" rx="1" fill="currentColor" />
          <path d="M65 72L85 72C85 72 85 82 65 82L65 72Z" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
};

export default BrandLogo;