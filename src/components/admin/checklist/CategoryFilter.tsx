/**
 * Category Filter Component
 * Extracted from FunctionalChecklistManagement.tsx
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  categories
}) => {
  return (
    <Card id="category-filter-card">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Label>Filter by Category:</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};