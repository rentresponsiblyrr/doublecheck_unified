import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const healthData = {
    timestamp: Date.now(),
    status: 'healthy',
    services: {},
    integration: {},
    database: {}
  };

  try {
    // Check Integration Bridge
    const bridgeHealth = (global as Record<string, unknown>).__INTEGRATION_BRIDGE_HEALTH__;
    const bridgeInstance = (global as Record<string, unknown>).__PWA_ENHANCED_BRIDGE__;

    healthData.integration = {
      bridgeActive: bridgeHealth?.bridgeActive || false,
      servicesReady: bridgeHealth?.enhancedServicesHealthy || false,
      pwaReady: bridgeHealth?.pwaComponentsHealthy || false,
      conflictQueueSize: bridgeHealth?.conflictQueueSize || 0,
      lastSync: bridgeHealth?.lastSync || 0,
      bridgeStatus: bridgeInstance?.getStatus() || null
    };

    // Check Enhanced Services
    const enhancedServices = (global as Record<string, unknown>).__ENHANCED_SERVICES__;
    healthData.services.enhanced = {
      initialized: enhancedServices?.initialized || false,
      healthy: enhancedServices?.healthy || false,
      queryCache: enhancedServices?.queryCache?.getStatus() || null,
      realTimeSync: enhancedServices?.realTimeSync?.getStatus() || null
    };

    // Check PWA Components
    const pwaStatus = (global as Record<string, unknown>).__PWA_STATUS__;
    const backgroundSyncManager = (global as Record<string, unknown>).__BACKGROUND_SYNC_MANAGER__ as { isActive?: () => boolean } | undefined;
    const pushNotificationManager = (global as Record<string, unknown>).__PUSH_NOTIFICATION_MANAGER__ as { isActive?: () => boolean } | undefined;
    
    healthData.services.pwa = {
      allSystemsReady: (pwaStatus as { allSystemsReady?: boolean })?.allSystemsReady || false,
      serviceWorkerActive: (pwaStatus as { serviceWorkerActive?: boolean })?.serviceWorkerActive || false,
      backgroundSyncActive: backgroundSyncManager?.isActive?.() || false,
      pushNotificationsActive: pushNotificationManager?.isActive?.() || false
    };

    // Overall health assessment
    const allServicesHealthy =
      healthData.integration.bridgeActive &&
      healthData.services.enhanced.initialized &&
      healthData.services.pwa.allSystemsReady;

    healthData.status = allServicesHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(healthData, {
      status: allServicesHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: unknown) {
    return NextResponse.json({
      timestamp: Date.now(),
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      services: healthData.services,
      integration: healthData.integration
    }, { status: 500 });
  }
}