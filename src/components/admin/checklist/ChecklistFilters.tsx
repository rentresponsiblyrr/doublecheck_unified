/**
 * Checklist Filters Component
 * Handles search, category, evidence type, and status filtering
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  ChecklistFilters,
  CHECKLIST_CATEGORIES,
  EVIDENCE_TYPES,
} from "./types";

interface ChecklistFiltersProps {
  filters: ChecklistFilters;
  onFiltersChange: (filters: ChecklistFilters) => void;
  itemCounts: {
    total: number;
    active: number;
    deleted: number;
    byCategory: Record<string, number>;
    byEvidenceType: Record<string, number>;
  };
}

export const ChecklistFiltersComponent: React.FC<ChecklistFiltersProps> = ({
  filters,
  onFiltersChange,
  itemCounts,
}) => {
  const updateFilter = <K extends keyof ChecklistFilters>(
    key: K,
    value: ChecklistFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Items</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              placeholder="Search by label or notes..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              updateFilter("category", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All categories ({itemCounts.total})
              </SelectItem>
              {CHECKLIST_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category} ({itemCounts.byCategory[category] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Evidence Type Filter */}
        <div className="space-y-2">
          <Label>Evidence Type</Label>
          <Select
            value={filters.evidenceType || "all"}
            onValueChange={(value) =>
              updateFilter("evidenceType", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All types ({itemCounts.total})
              </SelectItem>
              {EVIDENCE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} (
                  {itemCounts.byEvidenceType[type] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              updateFilter("status", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All items ({itemCounts.total})
              </SelectItem>
              <SelectItem value="active">
                Active ({itemCounts.active})
              </SelectItem>
              <SelectItem value="deleted">
                Deleted ({itemCounts.deleted})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Summary */}
      {(filters.search ||
        filters.category ||
        filters.evidenceType ||
        filters.status) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Active filters:</span>

          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Search: "{filters.search}"
            </span>
          )}

          {filters.category && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              Category: {filters.category}
            </span>
          )}

          {filters.evidenceType && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
              Type: {filters.evidenceType}
            </span>
          )}

          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Status: {filters.status}
            </span>
          )}

          <button
            onClick={() =>
              onFiltersChange({
                search: "",
                category: "",
                evidenceType: "",
                status: "",
              })
            }
            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
