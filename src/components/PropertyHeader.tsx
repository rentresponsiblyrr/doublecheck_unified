import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <div id="property-header-container" className="bg-white border-b border-gray-200">
      <div id="property-header-content" className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-600 text-sm">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};