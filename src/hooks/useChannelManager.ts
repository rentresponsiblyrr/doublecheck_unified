
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global channel registry to prevent duplicate channels
const channelRegistry = new Map<string, any>();
const subscriptionRegistry = new Map<string, boolean>();

export const useChannelManager = () => {
  const channelsRef = useRef<Map<string, any>>(new Map());
  const isMountedRef = useRef(true);

  const createChannel = useCallback((channelName: string, config: any) => {
    // Check if channel already exists globally
    if (channelRegistry.has(channelName)) {
      console.log('Channel already exists globally:', channelName);
      return channelRegistry.get(channelName);
    }

    // Clean up any existing channel with this name
    if (channelsRef.current.has(channelName)) {
      const existingChannel = channelsRef.current.get(channelName);
      try {
        supabase.removeChannel(existingChannel);
      } catch (error) {
        console.warn('Error removing existing channel:', error);
      }
      channelsRef.current.delete(channelName);
      channelRegistry.delete(channelName);
      subscriptionRegistry.delete(channelName);
    }

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
    subscriptionRegistry.set(channelName, false);

    return channel;
  }, []);

  const subscribeChannel = useCallback((channelName: string, onStatusChange?: (status: string) => void) => {
    if (!isMountedRef.current) return;

    const channel = channelsRef.current.get(channelName) || channelRegistry.get(channelName);
    if (!channel) {
      console.error('Channel not found:', channelName);
      return;
    }

    // Check if already subscribed
    if (subscriptionRegistry.get(channelName)) {
      console.log('Channel already subscribed:', channelName);
      return;
    }

    try {
      channel.subscribe((status: string) => {
        console.log('Channel subscription status:', channelName, status);
        if (status === 'SUBSCRIBED') {
          subscriptionRegistry.set(channelName, true);
        } else if (status === 'CHANNEL_ERROR') {
          subscriptionRegistry.set(channelName, false);
        }
        onStatusChange?.(status);
      });
    } catch (error) {
      console.error('Error subscribing to channel:', channelName, error);
    }
  }, []);

  const cleanupChannel = useCallback((channelName: string) => {
    const channel = channelsRef.current.get(channelName);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
      channelsRef.current.delete(channelName);
      channelRegistry.delete(channelName);
      subscriptionRegistry.delete(channelName);
    }
  }, []);

  const cleanupAllChannels = useCallback(() => {
    channelsRef.current.forEach((channel, channelName) => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
      channelRegistry.delete(channelName);
      subscriptionRegistry.delete(channelName);
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
