import React from 'react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * MobileOptimizedLayout component for mobile-friendly page layouts
 * 
 * @param {MobileOptimizedLayoutProps} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} [props.title] - Optional title for the layout
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} The MobileOptimizedLayout component
 */
export const MobileOptimizedLayout = ({ 
  children, 
  title, 
  className = "" 
}: MobileOptimizedLayoutProps) => {
  return (
    <div 
      id="mobile-optimized-layout-container" 
      className={`min-h-screen bg-gray-50 ${className}`}
    >
      {title && (
        <div id="mobile-layout-header" className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {title}
            </h1>
          </div>
        </div>
      )}
      
      <div id="mobile-layout-content" className="relative">
        {children}
      </div>
    </div>
  );
};