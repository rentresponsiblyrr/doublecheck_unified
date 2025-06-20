
import { PropertyHeader } from "@/components/PropertyHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export const PropertySelectionLoading = () => {
  console.log('⏳ PropertySelection showing loading state');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="DoubleCheck" 
        subtitle="Loading your properties..." 
      />
      <div className="px-4 py-6">
        <LoadingSpinner message="Loading properties and inspections..." />
      </div>
    </div>
  );
};
