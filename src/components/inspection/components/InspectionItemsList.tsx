/**
 * INSPECTION ITEMS LIST COMPONENT
 *
 * Professional component for rendering inspection items with evidence display,
 * status indicators, and interactive functionality. Extracted from
 * OfflineInspectionWorkflow for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";

export interface InspectionEvidence {
  photos?: string[];
  notes?: string;
  video?: string;
}

export interface InspectionItemData {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  evidence?: InspectionEvidence;
}

export interface InspectionItemsListProps {
  items: InspectionItemData[];
  activeItemId: string | null;
  onItemClick: (itemId: string) => void;
  onActionClick?: (itemId: string, action: string) => void;
}

export const InspectionItemsList: React.FC<InspectionItemsListProps> = ({
  items,
  activeItemId,
  onItemClick,
  onActionClick,
}) => {
  const getStatusColor = (status: InspectionItemData["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <main id="inspection-items-main" className="flex-1 overflow-auto p-4">
      <div id="inspection-items-grid" className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            id={`inspection-item-${item.id}`}
            className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all ${
              item.priority === "critical"
                ? "border-red-300"
                : "border-gray-200"
            } ${activeItemId === item.id ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => onItemClick(item.id)}
          >
            <div
              id={`item-header-${item.id}`}
              className="flex items-center justify-between mb-2"
            >
              <div>
                <h3 className="font-medium text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.category}</p>
              </div>

              <div
                id={`item-status-${item.id}`}
                className="flex items-center space-x-2"
              >
                {item.priority === "critical" && (
                  <span className="text-red-500 text-sm">🔴</span>
                )}

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                >
                  {item.status.replace("_", " ")}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{item.description}</p>

            {/* Evidence Display */}
            {item.evidence && (
              <div id={`evidence-display-${item.id}`} className="mb-3">
                {item.evidence.photos && item.evidence.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.evidence.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center"
                      >
                        <span className="text-xs text-gray-500">📷</span>
                      </div>
                    ))}
                  </div>
                )}

                {item.evidence.notes && (
                  <div className="bg-gray-50 rounded p-2 mb-2">
                    <p className="text-sm text-gray-700">
                      {item.evidence.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Expanded Actions */}
            {activeItemId === item.id && (
              <div
                id={`item-actions-${item.id}`}
                className="border-t pt-3 mt-3 flex flex-wrap gap-2"
              >
                <button
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick?.(item.id, "capture_photo");
                  }}
                >
                  📷 Photo
                </button>

                <button
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick?.(item.id, "mark_complete");
                  }}
                >
                  ✓ Complete
                </button>

                <button
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick?.(item.id, "add_note");
                  }}
                >
                  📝 Note
                </button>

                {item.status !== "failed" && (
                  <button
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onActionClick?.(item.id, "mark_failed");
                    }}
                  >
                    ✗ Fail
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
};
