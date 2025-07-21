
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AddPropertyButton = () => {
  const navigate = useNavigate();

  const handleAddProperty = () => {
    navigate('/add-property');
  };

  return (
    <div className="px-4 pb-4">
      <Button
        onClick={handleAddProperty}
        variant="outline"
        className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
        size="lg"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Property
      </Button>
    </div>
  );
};
