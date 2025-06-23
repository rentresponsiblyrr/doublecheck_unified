
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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="DoubleCheck Logo" 
          className={`${sizeClasses[size]} object-contain`}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-blue-600 rounded-lg flex items-center justify-center`}>
          <Building className="w-1/2 h-1/2 text-white" />
        </div>
      )}
      
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold text-blue-600 ${textSizeClasses[size]}`}>
            DoubleCheck
          </div>
          <div className="text-xs text-gray-500 leading-none">
            Powered by Rent Responsibly
          </div>
        </div>
      )}
    </div>
  );
};
