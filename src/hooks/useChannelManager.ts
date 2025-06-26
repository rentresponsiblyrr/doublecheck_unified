
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/utils/debugLogger';

// Global channel registry to prevent duplicate channels
const channelRegistry = new Map<string, any>();
const subscriptionRegistry = new Map<string, 'pending' | 'subscribed' | 'error'>();
const subscriptionPromises = new Map<string, Promise<void>>();

export const useChannelManager = () => {
  const channelsRef = useRef<Map<string, any>>(new Map());
  const isMountedRef = useRef(true);

  const createChannel = useCallback((channelName: string, config: any) => {
    debugLogger.debug('ChannelManager', 'Creating channel', { channelName });

    // Check if channel already exists globally
    if (channelRegistry.has(channelName)) {
      const existingChannel = channelRegistry.get(channelName);
      debugLogger.info('ChannelManager', 'Reusing existing channel', { channelName });
      
      // Store reference locally too
      if (!channelsRef.current.has(channelName)) {
        channelsRef.current.set(channelName, existingChannel);
      }
      
      return existingChannel;
    }

    // Clean up any existing channel with this name (defensive)
    if (channelsRef.current.has(channelName)) {
      const existingChannel = channelsRef.current.get(channelName);
      try {
        supabase.removeChannel(existingChannel);
        debugLogger.debug('ChannelManager', 'Cleaned up existing channel', { channelName });
      } catch (error) {
        debugLogger.warn('ChannelManager', 'Error removing existing channel', { channelName, error });
      }
    }

    debugLogger.info('ChannelManager', 'Creating new channel', { channelName });

    // Create new channel
    const channel = supabase.channel(channelName);
    
    // Apply configuration
    Object.keys(config).forEach(key => {
      if (typeof config[key] === 'function') {
        channel.on('postgres_changes', config[key].filter, config[key].callback);
      }
    });

    // Store in registries
    channelsRef.current.set(channelName, channel);
    channelRegistry.set(channelName, channel);
    subscriptionRegistry.set(channelName, 'pending');

    debugLogger.debug('ChannelManager', 'Channel created and stored', { channelName });
    return channel;
  }, []);

  const subscribeChannel = useCallback(async (channelName: string, onStatusChange?: (status: string) => void) => {
    if (!isMountedRef.current) {
      debugLogger.warn('ChannelManager', 'Attempted to subscribe to unmounted component', { channelName });
      return;
    }

    debugLogger.debug('ChannelManager', 'Subscribing to channel', { channelName });

    // Check if subscription is already in progress or completed
    const currentStatus = subscriptionRegistry.get(channelName);
    if (currentStatus === 'subscribed') {
      debugLogger.info('ChannelManager', 'Channel already subscribed', { channelName });
      onStatusChange?.('SUBSCRIBED');
      return;
    }
    
    if (currentStatus === 'pending') {
      debugLogger.info('ChannelManager', 'Subscription already pending', { channelName });
      // Wait for existing subscription to complete
      const existingPromise = subscriptionPromises.get(channelName);
      if (existingPromise) {
        await existingPromise;
        onStatusChange?.('SUBSCRIBED');
        return;
      }
    }

    const channel = channelsRef.current.get(channelName) || channelRegistry.get(channelName);
    if (!channel) {
      debugLogger.error('ChannelManager', 'Channel not found for subscription', { channelName });
      return;
    }

    // Create subscription promise to prevent race conditions
    const subscriptionPromise = new Promise<void>((resolve, reject) => {
      try {
        debugLogger.info('ChannelManager', 'Starting subscription', { channelName });
        subscriptionRegistry.set(channelName, 'pending');
        
        channel.subscribe((status: string) => {
          debugLogger.info('ChannelManager', 'Channel subscription status', { channelName, status });
          
          if (status === 'SUBSCRIBED') {
            subscriptionRegistry.set(channelName, 'subscribed');
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            subscriptionRegistry.set(channelName, 'error');
            reject(new Error('Channel subscription error'));
          }
          
          onStatusChange?.(status);
        });
      } catch (error) {
        debugLogger.error('ChannelManager', 'Error subscribing to channel', { channelName, error });
        subscriptionRegistry.set(channelName, 'error');
        reject(error);
      }
    });

    subscriptionPromises.set(channelName, subscriptionPromise);

    try {
      await subscriptionPromise;
      debugLogger.info('ChannelManager', 'Channel subscription successful', { channelName });
    } catch (error) {
      debugLogger.error('ChannelManager', 'Subscription failed', { channelName, error });
    } finally {
      subscriptionPromises.delete(channelName);
    }
  }, []);

  const cleanupChannel = useCallback((channelName: string) => {
    debugLogger.info('ChannelManager', 'Cleaning up channel', { channelName });
    
    const channel = channelsRef.current.get(channelName);
    if (channel) {
      try {
        supabase.removeChannel(channel);
        debugLogger.debug('ChannelManager', 'Channel removed from Supabase', { channelName });
      } catch (error) {
        debugLogger.warn('ChannelManager', 'Error removing channel', { channelName, error });
      }
    }
    
    // Clean up all references
    channelsRef.current.delete(channelName);
    channelRegistry.delete(channelName);
    subscriptionRegistry.delete(channelName);
    subscriptionPromises.delete(channelName);
    
    debugLogger.debug('ChannelManager', 'Channel cleanup complete', { channelName });
  }, []);

  const cleanupAllChannels = useCallback(() => {
    debugLogger.info('ChannelManager', 'Cleaning up all channels');
    
    const channelNames = Array.from(channelsRef.current.keys());
    channelNames.forEach(channelName => cleanupChannel(channelName));
    
    debugLogger.info('ChannelManager', 'All channels cleaned up', { count: channelNames.length });
  }, [cleanupChannel]);

  useEffect(() => {
    isMountedRef.current = true;
    debugLogger.debug('ChannelManager', 'Hook mounted');
    
    return () => {
      isMountedRef.current = false;
      debugLogger.debug('ChannelManager', 'Hook unmounting, cleaning up');
      cleanupAllChannels();
    };
  }, [cleanupAllChannels]);

  return {
    createChannel,
    subscribeChannel,
    cleanupChannel,
    cleanupAllChannels
  };
};
