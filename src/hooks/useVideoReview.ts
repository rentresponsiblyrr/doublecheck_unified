// Video Review Hook for STR Certified Auditor Interface

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MutableRefObject,
} from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { debugLogger } from "@/utils/debugLogger";
import type { VideoRecording, VideoTimestamp, SceneType } from "@/types/video";
import type { VideoAnnotation } from "@/components/audit/VideoAnnotationTools";

export interface VideoBookmark {
  id: string;
  time: number;
  description: string;
  createdAt: Date;
}

export interface UseVideoReviewReturn {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  playbackRate: number;

  // Scene information
  currentScene: VideoTimestamp | null;
  nearestTimestamp: VideoTimestamp | null;
  activeScenes: VideoTimestamp[];

  // Controls
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;

  // Navigation
  jumpToTimestamp: (timestamp: VideoTimestamp) => void;
  jumpToNextScene: () => void;
  jumpToPreviousScene: () => void;
  jumpToRoom: (roomType: string) => void;

  // Bookmarks
  bookmarks: VideoBookmark[];
  addBookmark: (time: number, description: string) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (time: number) => boolean;

  // Annotations
  annotations: VideoAnnotation[];
  addAnnotation: (
    annotation: Omit<VideoAnnotation, "id" | "createdAt">,
  ) => void;
  updateAnnotation: (id: string, annotation: Partial<VideoAnnotation>) => void;
  deleteAnnotation: (id: string) => void;

  // Review progress
  reviewProgress: number;
  markAsReviewed: (startTime: number, endTime: number) => void;
  isReviewed: (time: number) => boolean;
  reviewedSegments: Array<{ start: number; end: number }>;
}

export const useVideoReview = (
  video: VideoRecording,
  videoRef: MutableRefObject<HTMLVideoElement | null>,
): UseVideoReviewReturn => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Scene state
  const [currentScene, setCurrentScene] = useState<VideoTimestamp | null>(null);
  const [nearestTimestamp, setNearestTimestamp] =
    useState<VideoTimestamp | null>(null);

  // Bookmarks and annotations
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);

  // Review progress
  const [reviewedSegments, setReviewedSegments] = useState<
    Array<{ start: number; end: number }>
  >([]);
  const progressTrackingRef = useRef<{ start: number; accumulated: number }>({
    start: 0,
    accumulated: 0,
  });

  // Load saved data
  useEffect(() => {
    // Load bookmarks
    const savedBookmarks = localStorage.getItem(`video_bookmarks_${video.id}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    // Load annotations
    const savedAnnotations = localStorage.getItem(
      `video_annotations_${video.id}`,
    );
    if (savedAnnotations) {
      setAnnotations(JSON.parse(savedAnnotations));
    }

    // Load review progress
    const savedProgress = localStorage.getItem(`video_progress_${video.id}`);
    if (savedProgress) {
      setReviewedSegments(JSON.parse(savedProgress));
    }
  }, [video.id]);

  // Save data on changes
  useEffect(() => {
    localStorage.setItem(
      `video_bookmarks_${video.id}`,
      JSON.stringify(bookmarks),
    );
  }, [bookmarks, video.id]);

  useEffect(() => {
    localStorage.setItem(
      `video_annotations_${video.id}`,
      JSON.stringify(annotations),
    );
  }, [annotations, video.id]);

  useEffect(() => {
    localStorage.setItem(
      `video_progress_${video.id}`,
      JSON.stringify(reviewedSegments),
    );
  }, [reviewedSegments, video.id]);

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);

      // Update buffered amount
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(
          videoElement.buffered.length - 1,
        );
        setBuffered(bufferedEnd);
      }

      // Track review progress
      if (isPlaying) {
        progressTrackingRef.current.accumulated +=
          videoElement.currentTime - progressTrackingRef.current.start;
        progressTrackingRef.current.start = videoElement.currentTime;
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      progressTrackingRef.current.start = videoElement.currentTime;
    };

    const handlePause = () => {
      setIsPlaying(false);
      // Mark segment as reviewed
      if (progressTrackingRef.current.accumulated > 2) {
        // At least 2 seconds
        const start = Math.max(
          0,
          videoElement.currentTime - progressTrackingRef.current.accumulated,
        );
        const end = videoElement.currentTime;
        markAsReviewed(start, end);
      }
      progressTrackingRef.current.accumulated = 0;
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
    };

    const handleRateChange = () => {
      setPlaybackRate(videoElement.playbackRate);
    };

    // Add event listeners
    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("volumechange", handleVolumeChange);
    videoElement.addEventListener("ratechange", handleRateChange);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("volumechange", handleVolumeChange);
      videoElement.removeEventListener("ratechange", handleRateChange);
    };
  }, [videoRef, isPlaying]);

  // Update current scene based on time
  useEffect(() => {
    const scene = video.timestamps.find(
      (ts) =>
        currentTime >= ts.time &&
        currentTime <
          (video.timestamps[video.timestamps.indexOf(ts) + 1]?.time ||
            duration),
    );
    setCurrentScene(scene || null);

    // Find nearest timestamp
    let nearest = video.timestamps[0];
    let minDiff = Math.abs(video.timestamps[0].time - currentTime);

    for (const ts of video.timestamps) {
      const diff = Math.abs(ts.time - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = ts;
      }
    }

    setNearestTimestamp(minDiff < 10 ? nearest : null); // Within 10 seconds
  }, [currentTime, video.timestamps, duration]);

  // Calculate active scenes (within view)
  const activeScenes = video.timestamps.filter(
    (ts) => Math.abs(ts.time - currentTime) < 30, // Within 30 seconds
  );

  // Playback controls
  const play = useCallback(() => {
    videoRef.current?.play();
  }, [videoRef]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, [videoRef]);

  const seek = useCallback(
    (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
      }
    },
    [videoRef, duration],
  );

  const updateVolume = useCallback(
    (vol: number) => {
      if (videoRef.current) {
        videoRef.current.volume = Math.max(0, Math.min(1, vol));
      }
    },
    [videoRef],
  );

  const updatePlaybackRate = useCallback(
    (rate: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = rate;
      }
    },
    [videoRef],
  );

  // Navigation
  const jumpToTimestamp = useCallback(
    (timestamp: VideoTimestamp) => {
      seek(timestamp.time);
    },
    [seek],
  );

  const jumpToNextScene = useCallback(() => {
    const nextScene = video.timestamps.find((ts) => ts.time > currentTime);
    if (nextScene) {
      jumpToTimestamp(nextScene);
    }
  }, [currentTime, video.timestamps, jumpToTimestamp]);

  const jumpToPreviousScene = useCallback(() => {
    const previousScenes = video.timestamps.filter(
      (ts) => ts.time < currentTime - 1,
    );
    if (previousScenes.length > 0) {
      jumpToTimestamp(previousScenes[previousScenes.length - 1]);
    }
  }, [currentTime, video.timestamps, jumpToTimestamp]);

  const jumpToRoom = useCallback(
    (roomType: string) => {
      const roomScene = video.timestamps.find(
        (ts) => ts.roomDetected === roomType,
      );
      if (roomScene) {
        jumpToTimestamp(roomScene);
      }
    },
    [video.timestamps, jumpToTimestamp],
  );

  // Bookmarks
  const addBookmark = useCallback((time: number, description: string) => {
    const bookmark: VideoBookmark = {
      id: `bookmark_${Date.now()}`,
      time,
      description,
      createdAt: new Date(),
    };
    setBookmarks((prev) => [...prev, bookmark].sort((a, b) => a.time - b.time));
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const isBookmarked = useCallback(
    (time: number): boolean => {
      return bookmarks.some((b) => Math.abs(b.time - time) < 1);
    },
    [bookmarks],
  );

  // Annotations
  const addAnnotation = useCallback(
    (annotation: Omit<VideoAnnotation, "id" | "createdAt">) => {
      const newAnnotation: VideoAnnotation = {
        ...annotation,
        id: `annotation_${Date.now()}`,
        createdAt: new Date(),
      };
      setAnnotations((prev) =>
        [...prev, newAnnotation].sort((a, b) => a.timestamp - b.timestamp),
      );
    },
    [],
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<VideoAnnotation>) => {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
    },
    [],
  );

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Review progress
  const markAsReviewed = useCallback((startTime: number, endTime: number) => {
    setReviewedSegments((prev) => {
      // Merge overlapping segments
      const newSegment = { start: startTime, end: endTime };
      const merged = [...prev, newSegment].sort((a, b) => a.start - b.start);

      const result: typeof prev = [];
      for (const segment of merged) {
        if (result.length === 0) {
          result.push(segment);
        } else {
          const last = result[result.length - 1];
          if (segment.start <= last.end) {
            // Merge segments
            last.end = Math.max(last.end, segment.end);
          } else {
            result.push(segment);
          }
        }
      }

      return result;
    });
  }, []);

  const isReviewed = useCallback(
    (time: number): boolean => {
      return reviewedSegments.some(
        (seg) => time >= seg.start && time <= seg.end,
      );
    },
    [reviewedSegments],
  );

  // Calculate review progress
  const reviewProgress = (() => {
    const totalReviewed = reviewedSegments.reduce(
      (sum, seg) => sum + (seg.end - seg.start),
      0,
    );
    return Math.min(100, (totalReviewed / duration) * 100);
  })();

  return {
    // Playback state
    isPlaying,
    currentTime,
    duration,
    buffered,
    volume,
    playbackRate,

    // Scene information
    currentScene,
    nearestTimestamp,
    activeScenes,

    // Controls
    play,
    pause,
    seek,
    setVolume: updateVolume,
    setPlaybackRate: updatePlaybackRate,

    // Navigation
    jumpToTimestamp,
    jumpToNextScene,
    jumpToPreviousScene,
    jumpToRoom,

    // Bookmarks
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,

    // Annotations
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,

    // Review progress
    reviewProgress,
    markAsReviewed,
    isReviewed,
    reviewedSegments,
  };
};

// Hook for managing video review sessions
export const useVideoReviewSession = (videoId: string, auditorId: string) => {
  const [sessionId] = useState(`session_${Date.now()}`);
  const [sessionStart] = useState(new Date());
  const [sessionNotes, setSessionNotes] = useState("");

  // Save session data
  const saveSession = useCallback(
    async (
      annotations: VideoAnnotation[],
      reviewProgress: number,
      reviewedSegments: Array<{ start: number; end: number }>,
    ) => {
      const sessionData = {
        id: sessionId,
        videoId,
        auditorId,
        startTime: sessionStart,
        endTime: new Date(),
        annotations,
        reviewProgress,
        reviewedSegments,
        notes: sessionNotes,
      };

      // In production, this would save to database
      localStorage.setItem(
        `review_session_${sessionId}`,
        JSON.stringify(sessionData),
      );

      return sessionData;
    },
    [sessionId, videoId, auditorId, sessionStart, sessionNotes],
  );

  // Load previous sessions
  const loadSessions = useCallback(() => {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("review_session_")) {
        try {
          const session = JSON.parse(localStorage.getItem(key) || "{}");
          if (session.videoId === videoId) {
            sessions.push(session);
          }
        } catch (error) {
          debugLogger.error('useVideoReview', 'Failed to parse video progress from localStorage', { error });
        }
      }
    }
    return sessions.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [videoId]);

  return {
    sessionId,
    sessionStart,
    sessionNotes,
    setSessionNotes,
    saveSession,
    loadSessions,
  };
};
