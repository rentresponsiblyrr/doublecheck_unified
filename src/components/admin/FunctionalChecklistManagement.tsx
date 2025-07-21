/**
 * Functional Checklist Management - Surgically Refactored
 * Decomposed from 472→<300 lines using component composition
 * Business logic extracted to useFunctionalChecklistManagement hook
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useFunctionalChecklistManagement } from '@/hooks/useFunctionalChecklistManagement';
import { ChecklistHeader } from '@/components/admin/checklist/ChecklistHeader';
import { CategoryFilter } from '@/components/admin/checklist/CategoryFilter';
import { ErrorAlert } from '@/components/admin/checklist/ErrorAlert';
import { ChecklistItemCard } from '@/components/admin/checklist/ChecklistItemCard';
import { ChecklistItemDialog } from '@/components/admin/checklist/ChecklistItemDialog';
import { EmptyStateCard } from '@/components/admin/checklist/EmptyStateCard';

export const FunctionalChecklistManagement: React.FC = () => {
  const {
    filteredItems,
    loading,
    error,
    isDialogOpen,
    setIsDialogOpen,
    editingItem,
    formData,
    setFormData,
    submitLoading,
    selectedCategory,
    setSelectedCategory,
    loadSafetyItems,
    handleCreateItem,
    handleEditItem,
    handleSubmit,
    handleDeleteItem
  } = useFunctionalChecklistManagement();

  const categories = [
    'Safety',
    'Compliance',
    'Cleanliness',
    'Amenities',
    'Maintenance',
    'Accessibility',
    'Fire Safety',
    'Security',
    'Electrical',
    'Plumbing'
  ];

  if (loading) {
    return (
      <div id="checklist-loading" className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading checklist items...</span>
      </div>
    );
  }

  return (
    <div id="functional-checklist-management" className="space-y-6">
      <ChecklistHeader
        itemCount={filteredItems.length}
        loading={loading}
        onRefresh={loadSafetyItems}
        onCreateItem={handleCreateItem}
      />
      
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />
      
      {error && <ErrorAlert error={error} />}
      
      {filteredItems.length === 0 ? (
        <EmptyStateCard selectedCategory={selectedCategory} />
      ) : (
        <div id="checklist-items-grid" className="grid gap-4">
          {filteredItems.map((item) => (
            <ChecklistItemCard
              key={item.id}
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}
      
      <ChecklistItemDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        submitLoading={submitLoading}
        categories={categories}
      />
    </div>
  );
};