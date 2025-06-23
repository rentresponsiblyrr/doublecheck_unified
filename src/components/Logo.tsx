
import { Building } from "lucide-react";

interface LogoProps {
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo = ({ 
  imageUrl, 
  size = 'md', 
  showText = true, 
  className = '' 
}: LogoProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Use the new DoubleCheck logo by default
  const logoUrl = imageUrl || '/lovable-uploads/ea9dd662-995b-4cd0-95d4-9f31b2aa8d3b.png';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoUrl} 
        alt="DoubleCheck Logo" 
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
        <div className="flex flex-col">
          <div className={`font-bold text-blue-600 ${textSizeClasses[size]}`}>
            DoubleCheck
          </div>
          <div className="text-xs text-gray-500 leading-none">
            powered by Rent Responsibly
          </div>
        </div>
      )}
    </div>
  );
};
