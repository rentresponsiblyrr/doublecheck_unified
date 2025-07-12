
/**
 * Mobile Index Page - Enterprise Edition
 * 
 * Main dashboard for mobile inspectors using the STR Certified platform.
 * This component provides a mobile-optimized interface for property selection,
 * inspection management, and real-time status updates with enterprise-grade
 * error handling and performance monitoring.
 * 
 * @fileoverview Mobile inspector dashboard with enterprise property status integration
 * @version 2.0.0
 * @since 2025-07-12
 * @author Senior Engineering Team
 * 
 * Key Features:
 * - Enterprise property status calculation with business rules
 * - Mobile-optimized touch interface with 44px+ touch targets
 * - Real-time property status updates with comprehensive metadata
 * - Offline resilience with intelligent caching and sync
 * - Performance monitoring and debug capabilities
 * - Role-based functionality (inspector/admin detection)
 * 
 * Usage:
 * This is the main landing page for mobile inspectors after authentication.
 * It automatically loads properties assigned to the inspector and provides
 * an optimized interface for starting and managing inspections.
 * 
 * Architecture:
 * - Uses enterprise-grade hooks for data management and authentication
 * - Integrates with the enhanced property status service for accurate status display
 * - Implements proper error boundaries and recovery mechanisms
 * - Supports both online and offline inspection workflows
 */

import { useState } from "react";
import { PropertyHeader } from "@/components/PropertyHeader";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { MobileOptimizedPropertyList } from "@/components/MobileOptimizedPropertyList";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useMobileDataManager } from "@/hooks/useMobileDataManager";
import { useMobileInspectionOptimizer } from "@/hooks/useMobileInspectionOptimizer";
import { useMobilePropertyActions } from "@/hooks/useMobilePropertyActions";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";

/**
 * Mobile Index Component
 * 
 * Primary dashboard interface for mobile inspectors. Handles property listing,
 * status display, and inspection workflow initiation with enterprise-grade
 * error handling and performance monitoring.
 * 
 * @returns React component with mobile-optimized inspector dashboard
 */
const MobileIndex = () => {
  const { user, isAuthenticated, loading: authLoading, userRole } = useMobileAuth();
  const { 
    properties, 
    selectedProperty,
    isLoading, 
    error, 
    selectProperty,
    getPropertyStatus,
    refreshData,
    cacheStats
  } = useMobileDataManager(user?.id);
  
  const { 
    startOrJoinInspection, 
    isLoading: isCreatingInspection, 
    error: inspectionError 
  } = useMobileInspectionOptimizer();

  const { handleEdit } = useMobilePropertyActions();

  // Debug logging
  console.log('📱 MobileIndex Debug with Edit:', {
    userRole,
    hasUser: !!user,
    userEmail: user?.email,
    propertiesCount: properties?.length || 0,
    hasHandleEdit: !!handleEdit,
    isAdmin: userRole === 'admin'
  });

  /**
   * Handle property selection with toggle functionality
   * 
   * Manages property selection state with toggle behavior (selecting the same
   * property again will deselect it). Provides visual feedback to users about
   * which property is currently active.
   * 
   * @param propertyId - Unique identifier for the property to select/deselect
   */
  const handlePropertySelect = (propertyId: string) => {
    console.log('📱 Mobile property selected:', propertyId);
    selectProperty(propertyId === selectedProperty ? null : propertyId);
  };

  /**
   * Initiate inspection workflow for a property
   * 
   * Starts the optimized mobile inspection process using the enterprise
   * inspection optimizer. Automatically handles property selection and
   * transitions to the inspection interface.
   * 
   * @param propertyId - Unique identifier for the property to inspect
   * @throws {Error} When inspection creation fails or network is unavailable
   */
  const handleStartInspection = async (propertyId: string) => {
    console.log('📱 Starting optimized inspection for property:', propertyId);
    
    // Ensure property is selected before starting inspection
    if (propertyId !== selectedProperty) {
      selectProperty(propertyId);
    }
    
    // Use enterprise inspection optimizer for enhanced workflow
    await startOrJoinInspection(propertyId);
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Handle critical errors with mobile recovery
  if (error && !properties.length) {
    return (
      <MobileErrorRecovery
        error={new Error(error)}
        onRetry={refreshData}
        onNavigateHome={() => window.location.reload()}
        context="Property loading"
      />
    );
  }

  // Enhanced property status integration with enterprise business rules
  const selectedPropertyData = selectedProperty ? properties.find(p => p.property_id === selectedProperty) : null;
  
  /**
   * Enhanced Property Status Integration
   * 
   * Uses the enterprise property status service that provides:
   * - Sophisticated business rule-based status calculation
   * - Comprehensive metadata including calculation reasons
   * - Priority-based status precedence (rejected > in-progress > under-review > etc.)
   * - Future-proof status configuration system
   * 
   * The _statusResult is pre-calculated and cached by the useMobileDataManager hook
   * for optimal performance and consistency across the application.
   */
  const selectedPropertyStatus = selectedPropertyData?._statusResult || null;

  console.log('📱 MobileIndex optimized rendering:', { 
    isAuthenticated, 
    propertiesCount: properties?.length || 0, 
    isLoading, 
    error: !!error,
    selectedProperty,
    authLoading,
    cacheStats
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PropertyHeader 
        title="DoubleCheck Mobile"
        subtitle="Select a property to begin inspection"
      />

      {/* Performance Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
            <Zap className="w-3 h-3" />
            <span>Optimized • Cache: {cacheStats.size}/{cacheStats.maxSize}</span>
            {/* Debug role info */}
            <span>• Role: {userRole || 'Loading...'}</span>
          </div>
        </div>
      )}

      {/* Inspection Error Alert */}
      {inspectionError && (
        <div className="px-4 py-2">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {inspectionError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Property Selection Status */}
      {selectedPropertyData && selectedPropertyStatus && (
        <div className="px-4 py-2">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">
                    {selectedPropertyData.property_name}
                  </div>
                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {selectedPropertyStatus?.config?.textLabel || 'Unknown Status'}
                  </div>
                </div>
                {isCreatingInspection && (
                  <div className="flex items-center text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="text-xs">Creating...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Properties List */}
      <MobileOptimizedPropertyList
        properties={properties || []}
        isLoading={isLoading}
        error={error ? new Error(error) : null}
        onRefresh={refreshData}
        isFetching={false}
        selectedProperty={selectedProperty}
        onPropertySelect={handlePropertySelect}
        onStartInspection={handleStartInspection}
        onEdit={handleEdit} // Now passing the edit handler
        getPropertyStatus={(completed, active, draft) => {
          /**
           * Enterprise Property Status Adapter
           * 
           * Bridges the enterprise property status service with the legacy component interface.
           * The enterprise service returns a comprehensive PropertyStatusResult with business
           * rules, metadata, and configuration, while the component expects a simpler interface.
           * 
           * This adapter:
           * - Uses sophisticated business rules (rejected > in-progress > under-review > etc.)
           * - Provides consistent status configuration across the platform
           * - Includes detailed calculation metadata for debugging
           * - Maintains backward compatibility with existing components
           * 
           * @param completed - Number of completed inspections
           * @param active - Number of active (in-progress) inspections  
           * @param draft - Number of draft (not started) inspections
           * @returns Legacy PropertyStatus interface for component compatibility
           */
          const result = getPropertyStatus(completed, active, draft);
          return {
            status: result.status,
            color: result.config.color,
            textLabel: result.config.textLabel,
            badgeColor: result.config.badgeColor
          };
        }}
        isCreatingInspection={isCreatingInspection}
      />

      {/* Add Property Button */}
      <div className="px-4 mt-auto pb-safe">
        <div className="py-4">
          <AddPropertyButton />
        </div>
      </div>
    </div>
  );
};

export default MobileIndex;
