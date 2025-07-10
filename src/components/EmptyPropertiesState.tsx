
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Home } from "lucide-react";

export const EmptyPropertiesState = () => {
  const navigate = useNavigate();

  const handleAddProperty = () => {
    navigate('/add-property');
  };

  return (
    <div className="text-center py-12">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="mb-4">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Properties in Your Portfolio
        </h3>
        <p className="text-gray-600 mb-6">
          You haven't added any properties yet. Add your first property to start conducting inspections.
        </p>
        <Button 
          onClick={handleAddProperty}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Your First Property
        </Button>
      </div>
    </div>
  );
};
