/**
 * Audit Center - Admin Portal Integration
 *
 * Provides audit functionality within the admin portal using the existing
 * AuditorDashboard component. Shows completed inspections with AI analysis,
 * pass/fail verdicts, and audit management capabilities.
 */

import React from "react";
import { AuditorDashboard } from "@/pages/AuditorDashboard";

export default function AuditCenter() {
  return (
    <div id="audit-center-container" className="w-full">
      <div id="audit-center-header" className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Center</h1>
        <p className="text-gray-600 mt-2">
          Review completed inspections, AI analysis results, and manage audit
          workflows
        </p>
      </div>

      <div id="audit-center-content">
        <AuditorDashboard />
      </div>
    </div>
  );
}
