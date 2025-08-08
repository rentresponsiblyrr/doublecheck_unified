import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home } from "lucide-react";
import { debugLogger } from "@/lib/logger/debug-logger";

interface BreadcrumbItem {
  label: string;
  path?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = "",
}) => {
  const navigate = useNavigate();

  const handleNavigate = (path?: string) => {
    if (path) {
      try {
        navigate(path);
      } catch (error) {
        // Professional fallback without nuclear navigation
        debugLogger.warn(
          "Navigation error, attempting window.history fallback:",
          error,
        );
        try {
          window.history.pushState(null, "", path);
          window.dispatchEvent(new PopStateEvent("popstate"));
        } catch (historyError) {
          // Final fallback - use assign instead of href
          // Professional navigation using React Router
          navigate(path);
        }
      }
    }
  };

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleNavigate("/")}
        className="p-1 h-auto text-gray-500 hover:text-gray-700"
      >
        <Home className="h-4 w-4" />
      </Button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigate(item.path)}
            disabled={item.current || !item.path}
            className={`p-1 h-auto ${
              item.current
                ? "text-gray-900 font-medium cursor-default"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
};
