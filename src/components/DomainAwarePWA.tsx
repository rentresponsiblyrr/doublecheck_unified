import React, { useEffect } from 'react';
import { isInspectorDomain, isAdminDomain } from '@/lib/config/app-type';
import { env } from '@/lib/config/environment';

// Domain-aware PWA registration component
export const DomainAwarePWA: React.FC = () => {
  useEffect(() => {
    // Only register PWA service worker on inspector domain
    if (isInspectorDomain() && 'serviceWorker' in navigator) {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn('PWA registration timeout - skipping');
      }, 10000);
      
      registerPWA().finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }, []);

  const registerPWA = async () => {
    try {
      // Check if we should register PWA
      const shouldRegister = isInspectorDomain() && env.features.pwa;
      
      if (!shouldRegister) {
        console.log('PWA registration skipped - not inspector domain or PWA disabled');
        return;
      }

      // Register the service worker with improved error handling
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('PWA Service Worker registered successfully:', registration);

      // Listen for updates with timeout protection
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New PWA version available. Refresh to update.');
            }
          });
        }
      });

      // Handle service worker messages with error protection
      navigator.serviceWorker.addEventListener('message', (event) => {
        try {
          if (event.data && event.data.type === 'SKIP_WAITING') {
            // Update available, reload the page
            setTimeout(() => window.location.reload(), 1000);
          }
        } catch (error) {
          console.warn('Service worker message handling error:', error);
        }
      });

    } catch (error) {
      console.error('PWA Service Worker registration failed:', error);
      // Don't throw the error to prevent app crashes
    }
  };

  // Add meta tags for PWA on inspector domain
  useEffect(() => {
    if (isInspectorDomain()) {
      // Add PWA meta tags
      const metaTags = [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'STR Inspector' },
        { name: 'application-name', content: 'STR Inspector' },
        { name: 'msapplication-TileColor', content: '#8b5cf6' },
        { name: 'theme-color', content: '#8b5cf6' },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ];

      metaTags.forEach(({ name, content }) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });

      // Add PWA icons
      const iconSizes = [
        { size: '180x180', name: 'apple-touch-icon' },
        { size: '32x32', name: 'icon' },
        { size: '16x16', name: 'icon' },
        { size: '192x192', name: 'icon' },
        { size: '512x512', name: 'icon' },
      ];

      iconSizes.forEach(({ size, name }) => {
        let link = document.querySelector(`link[rel="${name}"][sizes="${size}"]`);
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', name);
          link.setAttribute('sizes', size);
          document.head.appendChild(link);
        }
        link.setAttribute('href', `/pwa-${size}.png`);
      });

      // Add manifest link
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.setAttribute('rel', 'manifest');
        manifestLink.setAttribute('href', '/manifest.json');
        document.head.appendChild(manifestLink);
      }
    }
  }, []);

  // Add analytics script for admin domain
  useEffect(() => {
    if (isAdminDomain() && env.features.analytics) {
      // Add Google Analytics or other analytics scripts
      if (env.monitoring.gaTrackingId) {
        addAnalyticsScript();
      }
    }
  }, []);

  const addAnalyticsScript = () => {
    const gaTrackingId = env.monitoring.gaTrackingId;
    if (!gaTrackingId) return;

    // Check if script already exists
    if (document.querySelector(`script[src*="${gaTrackingId}"]`)) {
      return;
    }

    // Add Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaTrackingId}');
    `;
    document.head.appendChild(script2);

    console.log('Analytics script added for admin domain');
  };

  return null; // This component doesn't render anything
};

// Hook to get PWA installation status
export const usePWAInstallation = () => {
  const [canInstall, setCanInstall] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  useEffect(() => {
    // Only enable PWA installation on inspector domain
    if (!isInspectorDomain()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      console.log('PWA installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setCanInstall(false);
      return true;
    }
    
    return false;
  };

  return {
    canInstall,
    promptInstall,
    isInspectorDomain: isInspectorDomain(),
  };
};