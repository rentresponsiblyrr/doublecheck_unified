/**
 * Empty State Card Component
 * Extracted from FunctionalChecklistManagement.tsx
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateCardProps {
  selectedCategory: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  selectedCategory,
}) => {
  return (
    <Card id="checklist-empty-state">
      <CardContent className="p-8 text-center text-gray-500">
        {selectedCategory === "all"
          ? "No checklist items found. Click 'Add Item' to create the first item."
          : `No items found in the "${selectedCategory}" category.`}
      </CardContent>
    </Card>
  );
};
