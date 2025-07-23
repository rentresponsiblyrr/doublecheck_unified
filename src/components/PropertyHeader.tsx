import { Card, CardContent } from "@/components/ui/card";
import { AdminAccessButton } from "@/components/AdminAccessButton";
import { useAuth } from "@/hooks/useAuth";

interface PropertyHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * PropertyHeader component for displaying page headers in property-related pages
 *
 * @param {PropertyHeaderProps} props - Component props
 * @param {string} props.title - Main title text
 * @param {string} [props.subtitle] - Optional subtitle text
 * @returns {JSX.Element} The PropertyHeader component
 */
export const PropertyHeader = ({ title, subtitle }: PropertyHeaderProps) => {
  const { user } = useAuth();

  return (
    <div
      id="property-header-container"
      className="bg-white border-b border-gray-200"
    >
      <div
        id="property-header-content"
        className="px-4 py-6 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
        </div>

        {/* Admin Access Button - Top Right */}
        {user && (
          <div className="flex items-center space-x-4">
            <AdminAccessButton className="ml-auto" />
          </div>
        )}
      </div>
    </div>
  );
};
