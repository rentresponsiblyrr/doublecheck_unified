import React from "react";
import { ChecklistDataManager } from "./ChecklistDataManager";
import { ChecklistActionsPanel } from "./ChecklistActionsPanel";
import { ChecklistStatsPanel } from "./ChecklistStatsPanel";
import { ChecklistSystemHealth } from "./ChecklistSystemHealth";
import { ChecklistTable } from "./ChecklistTable";

export const ChecklistContainer: React.FC = () => {
  return (
    <div id="checklist-container" className="container mx-auto py-6 space-y-6">
      <ChecklistDataManager>
        {({
          items,
          filteredItems,
          stats,
          systemHealth,
          isLoading,
          error,
          onRefresh,
          onItemCreate,
          onItemUpdate,
          onItemDelete,
          onFiltersChange,
        }) => (
          <>
            <ChecklistActionsPanel
              systemHealth={systemHealth}
              isLoading={isLoading}
              error={error}
              onRefresh={onRefresh}
              onItemCreate={onItemCreate}
              onFiltersChange={onFiltersChange}
            />

            <ChecklistStatsPanel
              stats={stats}
              systemHealth={systemHealth}
              isLoading={isLoading}
            />

            <ChecklistSystemHealth
              health={systemHealth}
              isLoading={isLoading}
            />

            <ChecklistTable
              items={filteredItems}
              isLoading={isLoading}
              onEdit={onItemUpdate}
              onDelete={onItemDelete}
            />
          </>
        )}
      </ChecklistDataManager>
    </div>
  );
};
