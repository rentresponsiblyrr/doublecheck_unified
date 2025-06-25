
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global channel registry to prevent duplicate channels
const channelRegistry = new Map<string, any>();
const subscriptionRegistry = new Map<string, 'pending' | 'subscribed' | 'error'>();
const subscriptionPromises = new Map<string, Promise<void>>();

export const useChannelManager = () => {
  const channelsRef = useRef<Map<string, any>>(new Map());
  const isMountedRef = useRef(true);

  const createChannel = useCallback((channelName: string, config: any) => {
    // Check if channel already exists globally
    if (channelRegistry.has(channelName)) {
      const existingChannel = channelRegistry.get(channelName);
      console.log('Reusing existing channel:', channelName);
      
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
      } catch (error) {
        console.warn('Error removing existing channel:', error);
      }
    }

    console.log('Creating new channel:', channelName);

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

    return channel;
  }, []);

  const subscribeChannel = useCallback(async (channelName: string, onStatusChange?: (status: string) => void) => {
    if (!isMountedRef.current) return;

    // Check if subscription is already in progress or completed
    const currentStatus = subscriptionRegistry.get(channelName);
    if (currentStatus === 'subscribed') {
      console.log('Channel already subscribed:', channelName);
      onStatusChange?.('SUBSCRIBED');
      return;
    }
    
    if (currentStatus === 'pending') {
      console.log('Subscription already pending for:', channelName);
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
      console.error('Channel not found:', channelName);
      return;
    }

    // Create subscription promise to prevent race conditions
    const subscriptionPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log('Starting subscription for:', channelName);
        subscriptionRegistry.set(channelName, 'pending');
        
        channel.subscribe((status: string) => {
          console.log('Channel subscription status:', channelName, status);
          
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
        console.error('Error subscribing to channel:', channelName, error);
        subscriptionRegistry.set(channelName, 'error');
        reject(error);
      }
    });

    subscriptionPromises.set(channelName, subscriptionPromise);

    try {
      await subscriptionPromise;
    } catch (error) {
      console.error('Subscription failed for:', channelName, error);
    } finally {
      subscriptionPromises.delete(channelName);
    }
  }, []);

  const cleanupChannel = useCallback((channelName: string) => {
    console.log('Cleaning up channel:', channelName);
    
    const channel = channelsRef.current.get(channelName);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
    }
    
    // Clean up all references
    channelsRef.current.delete(channelName);
    channelRegistry.delete(channelName);
    subscriptionRegistry.delete(channelName);
    subscriptionPromises.delete(channelName);
  }, []);

  const cleanupAllChannels = useCallback(() => {
    console.log('Cleaning up all channels');
    
    channelsRef.current.forEach((channel, channelName) => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
      channelRegistry.delete(channelName);
      subscriptionRegistry.delete(channelName);
      subscriptionPromises.delete(channelName);
    });
    channelsRef.current.clear();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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
