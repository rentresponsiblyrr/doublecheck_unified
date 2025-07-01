'use client';

import Link from 'next/link';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { formatTime } from '@/lib/utils';

// Temporary mock data
const mockInspections = {
  active: [
    {
      id: '1',
      property: {
        name: 'Sunset Beach Villa',
        address: '123 Ocean Drive, Miami Beach',
      },
      scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      progress: 45,
      itemsCompleted: 12,
      totalItems: 27,
    },
    {
      id: '2',
      property: {
        name: 'Downtown Loft',
        address: '456 Main St, Downtown',
      },
      scheduledDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      progress: 15,
      itemsCompleted: 4,
      totalItems: 27,
    },
  ],
  scheduled: [],
  completed: [],
};

interface InspectionListProps {
  status: 'active' | 'scheduled' | 'completed';
}

export function InspectionList({ status }: InspectionListProps) {
  const inspections = mockInspections[status];

  if (inspections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No {status} inspections</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inspections.map((inspection) => (
        <Link
          key={inspection.id}
          href={`/inspector/inspection/${inspection.id}`}
          className="block bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors touch-manipulation"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {inspection.property.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin className="h-3 w-3" />
                <span>{inspection.property.address}</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-3 w-3" />
              <span>{formatTime(inspection.scheduledDate)}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-900">
                {inspection.itemsCompleted}/{inspection.totalItems}
              </span>
              <span className="text-gray-600 ml-1">items</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${inspection.progress}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}