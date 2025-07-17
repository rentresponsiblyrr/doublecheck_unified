
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { Logo } from "@/components/Logo";
import { AdminAccessButton } from "@/components/AdminAccessButton";

interface PropertyHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export const PropertyHeader = ({ 
  title, 
  subtitle, 
  showBackButton = false 
}: PropertyHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Logo 
            size="sm" 
            showText={false}
            variant="default"
            theme="light"
            className="hidden sm:flex"
          />
          <div className="text-right hidden lg:block">
            <div className="text-sm font-medium text-blue-600">STR Certified</div>
            <div className="text-xs text-gray-500">DoubleCheck powered by Rent Responsibly</div>
          </div>
          <AdminAccessButton className="hidden sm:flex" />
          <UserMenu />
        </div>
      </div>
    </div>
  );
};
