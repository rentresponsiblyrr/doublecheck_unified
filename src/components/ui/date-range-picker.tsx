import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ className }) => {
  return (
    <Button variant="outline" className={className}>
      <Calendar className="mr-2 h-4 w-4" />
      Date Range
    </Button>
  );
};