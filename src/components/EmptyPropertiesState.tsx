import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const EmptyPropertiesState: React.FC = () => {
  const navigate = useNavigate();

  const handleAddProperty = () => {
    // Navigate to property creation or trigger property add dialog
    // For now, we'll just log the action
    console.log("Add property clicked - implement property creation flow");
  };

  return (
    <Card id="empty-properties-state" className="bg-gray-50 border-gray-200">
      <CardContent className="p-8 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Properties Found
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          You don't have any properties yet. Add your first property to get
          started with inspections.
        </p>
        <Button onClick={handleAddProperty} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Your First Property
        </Button>
      </CardContent>
    </Card>
  );
};
