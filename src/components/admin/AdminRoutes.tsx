import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AIPerformanceDashboard } from './AIPerformanceDashboard';
import { AILearningDashboard } from './AILearningDashboard';

// Admin Routes Component
export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/performance" element={<AIPerformanceDashboard />} />
      <Route path="/ai-learning" element={<AILearningDashboard />} />
      <Route path="/analytics" element={<div>Analytics Dashboard</div>} />
      <Route path="/settings" element={<div>Admin Settings</div>} />
      <Route path="*" element={<div>Admin Dashboard</div>} />
    </Routes>
  );
}