'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { InspectionList } from '@/components/inspector/InspectionList';
import { QuickStats } from '@/components/inspector/QuickStats';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';

export default function InspectorDashboard() {
  const { data: session } = useSession();
  const [view, setView] = useState<'active' | 'scheduled' | 'completed'>('active');

  return (
    <div className="mobile-container py-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Inspector'}
        </h1>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          variant="default"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Inspection</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <Calendar className="h-5 w-5" />
          <span>Schedule</span>
        </Button>
      </div>

      {/* Inspection Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setView('active')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'active'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600'
          }`}
        >
          Active (3)
        </button>
        <button
          onClick={() => setView('scheduled')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'scheduled'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600'
          }`}
        >
          Scheduled (5)
        </button>
        <button
          onClick={() => setView('completed')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'completed'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Inspection List */}
      <InspectionList status={view} />
    </div>
  );
}