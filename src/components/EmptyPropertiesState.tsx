
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const EmptyPropertiesState = () => {
  return (
    <div className="text-center py-12">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Properties Available
        </h3>
        <p className="text-gray-600 mb-4">
          There are no properties available for inspection at this time.
        </p>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Contact Admin to Add Properties
        </Button>
      </div>
    </div>
  );
};
