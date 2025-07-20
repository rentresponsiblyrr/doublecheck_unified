/**
 * PROFESSIONAL COMPONENT - SINGLE RESPONSIBILITY PRINCIPLE
 * Checklist Generation Step - Does ONE thing well
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChecklistGenerator } from '@/components/ai/ChecklistGenerator';

interface Property {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  listingUrl?: string;
  images?: string[];
}

interface ChecklistData {
  items: any[];
  estimatedTime: number;
  totalItems: number;
}

interface ChecklistGenerationStepProps {
  property: Property;
  onChecklistGenerated: (checklist: ChecklistData) => void;
  isLoading?: boolean;
  checklist?: ChecklistData | null;
}

export function ChecklistGenerationStep({
  property,
  onChecklistGenerated,
  isLoading = false,
  checklist
}: ChecklistGenerationStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Inspection Checklist</CardTitle>
        <CardDescription>
          Custom checklist based on property type and characteristics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChecklistGenerator
          property={property}
          onChecklistGenerated={onChecklistGenerated}
          isLoading={isLoading}
        />
        
        {checklist && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Generated Checklist</h4>
            <div className="text-sm text-green-700">
              <p><strong>Total Items:</strong> {checklist.totalItems}</p>
              <p><strong>Estimated Time:</strong> {checklist.estimatedTime} minutes</p>
              <p><strong>Property Type:</strong> {property.type}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}