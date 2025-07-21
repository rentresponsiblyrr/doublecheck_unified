/**
 * Property Manager Information Form Component
 * Extracted from PropertyManagerDelivery.tsx
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyManagerInfo } from '@/hooks/usePropertyManagerDelivery';

interface PropertyManagerInfoFormProps {
  managerInfo: PropertyManagerInfo;
  onUpdateManagerInfo: (field: keyof PropertyManagerInfo, value: string) => void;
}

export const PropertyManagerInfoForm: React.FC<PropertyManagerInfoFormProps> = ({
  managerInfo,
  onUpdateManagerInfo
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Property Manager Information</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name *</label>
          <Input
            value={managerInfo.name}
            onChange={(e) => onUpdateManagerInfo('name', e.target.value)}
            placeholder="Property manager name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Input
            value={managerInfo.company}
            onChange={(e) => onUpdateManagerInfo('company', e.target.value)}
            placeholder="Management company"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email *</label>
          <Input
            type="email"
            value={managerInfo.email}
            onChange={(e) => onUpdateManagerInfo('email', e.target.value)}
            placeholder="manager@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <Input
            type="tel"
            value={managerInfo.phone}
            onChange={(e) => onUpdateManagerInfo('phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Preferred Contact Method</label>
        <Select 
          value={managerInfo.preferred_contact} 
          onValueChange={(value) => onUpdateManagerInfo('preferred_contact', value as 'email' | 'phone' | 'both')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};