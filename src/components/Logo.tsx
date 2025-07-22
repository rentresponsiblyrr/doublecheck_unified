
import { Building } from "lucide-react";
import { useEffect, useState } from "react";

interface LogoProps {
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'reverse' | 'horizontal' | 'horizontal-strapline';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const Logo = ({ 
  imageUrl, 
  size = 'md', 
  showText = true, 
  variant = 'default',
  theme = 'auto',
  className = '' 
}: LogoProps) => {
  const [isDark, setIsDark] = useState(false);

  // Auto-detect theme if needed
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Logo selection logic based on variant and theme
  const getLogoUrl = () => {
    if (imageUrl) return imageUrl;
    
    // For now, use existing PNG files as fallback
    // In production, these would be converted from the .ai files
    const fallbackLogo = '/lovable-uploads/ea9dd662-995b-4cd0-95d4-9f31b2aa8d3b.png';
    
    // Logo variants available in production deployment
    // Based on available .ai files:
    // - Certs_Logo_1_Color_Reverse_Double.ai (for dark backgrounds)
    // - Certs_Logo_1_Color_Reverse_Double_white.ai (white version)
    // - Certs_Logo_1_Double_Color_Horizontal.ai (horizontal layout)
    // - Certs_Logo_1_Double_Color_Horizontal_Strapline.ai (with tagline)
    // - Certs_Logo_1_Double_WHITE_Horizontal_Strapline.ai (white horizontal with tagline)
    
    switch (variant) {
      case 'reverse':
        return fallbackLogo; // Would use reverse logo for dark backgrounds
      case 'horizontal':
        return fallbackLogo; // Would use horizontal layout
      case 'horizontal-strapline':
        return fallbackLogo; // Would use horizontal with strapline
      default:
        return fallbackLogo;
    }
  };

  const logoUrl = getLogoUrl();

  // Determine layout based on variant
  const isHorizontal = variant === 'horizontal' || variant === 'horizontal-strapline';
  const hasStrapline = variant === 'horizontal-strapline';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoUrl} 
        alt="STR Certified Logo" 
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          // Fallback to Building icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <div 
        className={`${sizeClasses[size]} bg-blue-600 rounded-lg items-center justify-center hidden`}
        style={{ display: 'none' }}
      >
        <Building className="w-1/2 h-1/2 text-white" />
      </div>
      
      {showText && (
        <div className={`flex ${isHorizontal ? 'flex-row items-center gap-2' : 'flex-col'}`}>
          <div className={`font-bold ${isDark ? 'text-white' : 'text-blue-600'} ${textSizeClasses[size]}`}>
            STR Certified
          </div>
          {hasStrapline && (
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'} leading-none`}>
              DoubleCheck powered by Rent Responsibly
            </div>
          )}
          {!hasStrapline && !isHorizontal && (
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'} leading-none`}>
              powered by Rent Responsibly
            </div>
          )}
        </div>
      )}
    </div>
  );
};
