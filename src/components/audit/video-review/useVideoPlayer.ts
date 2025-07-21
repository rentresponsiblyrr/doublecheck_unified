import { useState, useRef, useCallback, useEffect } from 'react';
import { VideoPlayerState, VideoControls, VideoBookmark } from './types';

export const useVideoPlayer = (videoUrl: string) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    playbackRate: 1,
    isLoading: true
  });

  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, state.duration));
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, [state.duration]);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      videoRef.current.volume = clampedVolume;
      setState(prev => ({ 
        ...prev, 
        volume: clampedVolume,
        isMuted: clampedVolume === 0 
      }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !state.isMuted;
      videoRef.current.muted = newMuted;
      setState(prev => ({ ...prev, isMuted: newMuted }));
    }
  }, [state.isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (!state.isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
    }
  }, [state.isFullscreen]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setState(prev => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  const addBookmark = useCallback((time: number, description: string) => {
    const newBookmark: VideoBookmark = {
      id: Date.now().toString(),
      time,
      description,
      createdAt: new Date()
    };
    setBookmarks(prev => [...prev, newBookmark]);
  }, []);

  const deleteBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  }, []);

  const seekToBookmark = useCallback((time: number) => {
    seek(time);
  }, [seek]);

  const handleTimeUpdate = useCallback((currentTime: number) => {
    setState(prev => ({ ...prev, currentTime }));
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setState(prev => ({ ...prev, duration }));
  }, []);

  const handleLoadStart = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
  }, []);

  const handleCanPlay = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const handleEnded = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in inputs
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          state.isPlaying ? pause() : play();
          break;
        case 'arrowleft':
          e.preventDefault();
          seek(state.currentTime - 10);
          break;
        case 'arrowright':
          e.preventDefault();
          seek(state.currentTime + 10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(Math.min(1, state.volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'b':
          addBookmark(state.currentTime, `Bookmark at ${Math.floor(state.currentTime / 60)}:${Math.floor(state.currentTime % 60).toString().padStart(2, '0')}`);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state, play, pause, seek, setVolume, toggleMute, toggleFullscreen, addBookmark]);

  const controls: VideoControls = {
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    setPlaybackRate
  };

  return {
    videoRef,
    state,
    controls,
    bookmarks,
    addBookmark,
    deleteBookmark,
    seekToBookmark,
    handleTimeUpdate,
    handleDurationChange,
    handleLoadStart,
    handleCanPlay,
    handleEnded
  };
};