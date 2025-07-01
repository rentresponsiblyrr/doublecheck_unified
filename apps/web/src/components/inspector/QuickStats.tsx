'use client';

import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const stats = [
  {
    label: 'Completed Today',
    value: '3',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    label: 'In Progress',
    value: '2',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    label: 'Pending Review',
    value: '1',
    icon: AlertCircle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-lg p-4 border border-gray-200 text-center"
          >
            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor} mb-2`}
            >
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}