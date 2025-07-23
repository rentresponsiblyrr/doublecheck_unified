// Video Navigation System for STR Certified Auditor Interface

import type {
  VideoRecording,
  VideoTimestamp,
  VideoAnalysisResult,
  SceneType,
  RoomSequence,
} from "@/types/video";

export interface NavigationChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  roomType?: string;
  sceneCount: number;
  hasIssues: boolean;
  thumbnail?: string;
  subChapters?: NavigationMarker[];
}

export interface NavigationMarker {
  id: string;
  time: number;
  type: "room_entry" | "key_moment" | "issue" | "bookmark" | "annotation";
  label: string;
  description?: string;
  severity?: "low" | "medium" | "high";
  icon?: string;
  color?: string;
}

export interface QuickJumpButton {
  id: string;
  label: string;
  icon: string;
  time: number;
  type: "room" | "issue" | "feature" | "custom";
  description?: string;
}

export interface VideoMetadata {
  title: string;
  propertyAddress: string;
  inspectorName: string;
  inspectionDate: Date;
  duration: number;
  roomsCovered: string[];
  issuesFound: number;
  overallQuality: number;
  tags: string[];
}

export class VideoNavigationManager {
  private video: VideoRecording;
  private analysis: VideoAnalysisResult;
  private bookmarks: Map<number, NavigationMarker> = new Map();

  constructor(video: VideoRecording, analysis: VideoAnalysisResult) {
    this.video = video;
    this.analysis = analysis;
  }

  /**
   * Generates smart navigation chapters based on AI analysis
   * @returns Array of navigation chapters
   */
  generateNavigationChapters(): NavigationChapter[] {
    const chapters: NavigationChapter[] = [];
    const roomSequences = this.analysis.roomSequence;

    // Create chapters for each room
    roomSequences.forEach((room, index) => {
      const roomTimestamps = this.video.timestamps.filter(
        (ts) => ts.time >= room.startTime && ts.time <= room.endTime,
      );

      const hasIssues = roomTimestamps.some(
        (ts) =>
          ts.sceneType === "issue_documentation" ||
          ts.features.includes("issue") ||
          ts.features.includes("damage"),
      );

      // Find thumbnail (first key frame in room)
      const thumbnail = this.analysis.scenes.find(
        (s) => s.startTime >= room.startTime && s.endTime <= room.endTime,
      )?.keyFrames[0]?.frameUrl;

      // Create sub-chapters for key moments
      const subChapters: NavigationMarker[] = [];

      // Add room entry
      subChapters.push({
        id: `${room.roomId}_entry`,
        time: room.startTime,
        type: "room_entry",
        label: `Enter ${room.roomType}`,
        description: `Beginning of ${room.roomType} inspection`,
      });

      // Add key moments
      room.keyMoments.forEach((moment, momentIndex) => {
        subChapters.push({
          id: `${room.roomId}_moment_${momentIndex}`,
          time: moment.time,
          type: "key_moment",
          label: moment.description || `Key moment ${momentIndex + 1}`,
          description: moment.features.join(", "),
        });
      });

      // Add issues
      roomTimestamps
        .filter((ts) => ts.sceneType === "issue_documentation")
        .forEach((issue, issueIndex) => {
          subChapters.push({
            id: `${room.roomId}_issue_${issueIndex}`,
            time: issue.time,
            type: "issue",
            label: `Issue: ${issue.description}`,
            severity: "medium",
            color: "#ef4444",
          });
        });

      chapters.push({
        id: room.roomId,
        title: this.formatRoomTitle(room.roomType),
        startTime: room.startTime,
        endTime: room.endTime,
        roomType: room.roomType,
        sceneCount: roomTimestamps.length,
        hasIssues,
        thumbnail,
        subChapters: subChapters.sort((a, b) => a.time - b.time),
      });
    });

    // Add intro/outro chapters if needed
    if (chapters.length > 0 && chapters[0].startTime > 5) {
      chapters.unshift({
        id: "intro",
        title: "Introduction",
        startTime: 0,
        endTime: chapters[0].startTime,
        sceneCount: 1,
        hasIssues: false,
      });
    }

    const lastChapter = chapters[chapters.length - 1];
    if (lastChapter && lastChapter.endTime < this.video.duration - 5) {
      chapters.push({
        id: "outro",
        title: "Conclusion",
        startTime: lastChapter.endTime,
        endTime: this.video.duration,
        sceneCount: 1,
        hasIssues: false,
      });
    }

    return chapters;
  }

  /**
   * Creates quick-jump buttons for key scenes
   * @param maxButtons Maximum number of buttons to generate
   * @returns Array of quick jump buttons
   */
  createQuickJumpButtons(maxButtons: number = 8): QuickJumpButton[] {
    const buttons: QuickJumpButton[] = [];

    // Add room entry buttons
    this.analysis.roomSequence.forEach((room) => {
      buttons.push({
        id: `quick_${room.roomId}`,
        label: this.formatRoomTitle(room.roomType),
        icon: this.getRoomIcon(room.roomType),
        time: room.startTime,
        type: "room",
        description: `Jump to ${room.roomType}`,
      });
    });

    // Add critical issues
    const criticalIssues = this.analysis.issues
      .filter((issue) => issue.severity === "high")
      .slice(0, 3);

    criticalIssues.forEach((issue, index) => {
      if (issue.affectedTimestamps.length > 0) {
        buttons.push({
          id: `quick_issue_${index}`,
          label: `Issue ${index + 1}`,
          icon: "⚠️",
          time: issue.affectedTimestamps[0],
          type: "issue",
          description: issue.description,
        });
      }
    });

    // Add key features
    const keyFeatures = this.analysis.featureDetection
      .filter((f) => f.detected && f.confidence > 80)
      .slice(0, 3);

    keyFeatures.forEach((feature) => {
      if (feature.timestamps.length > 0) {
        buttons.push({
          id: `quick_feature_${feature.feature}`,
          label: this.formatFeatureName(feature.feature),
          icon: "✨",
          time: feature.timestamps[0],
          type: "feature",
          description: `View ${feature.feature}`,
        });
      }
    });

    // Sort by time and limit
    return buttons.sort((a, b) => a.time - b.time).slice(0, maxButtons);
  }

  /**
   * Manages bookmarks for the video
   * @param time Timestamp to bookmark
   * @param label Label for the bookmark
   * @param description Optional description
   */
  addBookmark(
    time: number,
    label: string,
    description?: string,
  ): NavigationMarker {
    const bookmark: NavigationMarker = {
      id: `bookmark_${Date.now()}`,
      time,
      type: "bookmark",
      label,
      description,
      icon: "🔖",
      color: "#eab308",
    };

    this.bookmarks.set(time, bookmark);
    return bookmark;
  }

  /**
   * Removes a bookmark
   * @param time Timestamp of bookmark to remove
   */
  removeBookmark(time: number): boolean {
    return this.bookmarks.delete(time);
  }

  /**
   * Gets all bookmarks sorted by time
   */
  getBookmarks(): NavigationMarker[] {
    return Array.from(this.bookmarks.values()).sort((a, b) => a.time - b.time);
  }

  /**
   * Generates video metadata for display
   * @returns VideoMetadata object
   */
  generateVideoMetadata(): VideoMetadata {
    const roomsCovered = this.analysis.roomSequence.map((r) => r.roomType);
    const issuesFound = this.analysis.issues.length;
    const overallQuality = this.analysis.qualityMetrics.averageQuality;

    // Generate tags based on content
    const tags: string[] = [];

    if (issuesFound > 0) tags.push("Has Issues");
    if (overallQuality > 80) tags.push("High Quality");
    if (roomsCovered.length >= 5) tags.push("Comprehensive");
    if (this.analysis.qualityMetrics.stabilityScore > 85)
      tags.push("Stable Footage");

    // Add room tags
    roomsCovered.forEach((room) => {
      tags.push(this.formatRoomTitle(room));
    });

    return {
      title: `Property Inspection - ${this.video.metadata.propertyDetails.address}`,
      propertyAddress: this.video.metadata.propertyDetails.address,
      inspectorName: this.video.inspectorId, // Would be resolved to actual name
      inspectionDate: this.video.createdAt,
      duration: this.video.duration,
      roomsCovered,
      issuesFound,
      overallQuality,
      tags: [...new Set(tags)], // Remove duplicates
    };
  }

  /**
   * Finds the nearest navigation point to a given time
   * @param time Current time in seconds
   * @returns Nearest navigation marker
   */
  findNearestNavigationPoint(time: number): NavigationMarker | null {
    const allMarkers: NavigationMarker[] = [];

    // Collect all markers
    const chapters = this.generateNavigationChapters();
    chapters.forEach((chapter) => {
      if (chapter.subChapters) {
        allMarkers.push(...chapter.subChapters);
      }
    });

    // Add bookmarks
    allMarkers.push(...this.getBookmarks());

    // Find nearest
    let nearest: NavigationMarker | null = null;
    let minDistance = Infinity;

    allMarkers.forEach((marker) => {
      const distance = Math.abs(marker.time - time);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = marker;
      }
    });

    return minDistance < 10 ? nearest : null; // Within 10 seconds
  }

  /**
   * Generates a timeline summary for the video
   * @returns Array of timeline segments with descriptions
   */
  generateTimelineSummary(): Array<{
    start: number;
    end: number;
    label: string;
    type: string;
    hasIssues: boolean;
  }> {
    const summary: Array<any> = [];

    this.analysis.scenes.forEach((scene, index) => {
      const roomType = scene.roomType || "Unknown";
      const hasIssues = this.analysis.issues.some((issue) =>
        issue.affectedTimestamps.some(
          (t) => t >= scene.startTime && t <= scene.endTime,
        ),
      );

      summary.push({
        start: scene.startTime,
        end: scene.endTime,
        label: `${roomType} - ${scene.sceneType.replace(/_/g, " ")}`,
        type: scene.sceneType,
        hasIssues,
      });
    });

    return summary;
  }

  // Helper methods

  private formatRoomTitle(roomType: string): string {
    return roomType
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private getRoomIcon(roomType: string): string {
    const icons: Record<string, string> = {
      bedroom: "🛏️",
      bathroom: "🚿",
      kitchen: "🍳",
      "living-room": "🛋️",
      "dining-room": "🍽️",
      garage: "🚗",
      exterior: "🏠",
      basement: "🗺️",
      attic: "🏠",
    };
    return icons[roomType.toLowerCase()] || "📹";
  }

  private formatFeatureName(feature: string): string {
    return feature
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}

// Export factory function
export const createVideoNavigationManager = (
  video: VideoRecording,
  analysis: VideoAnalysisResult,
): VideoNavigationManager => {
  return new VideoNavigationManager(video, analysis);
};

// Utility functions for video navigation

export const formatTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const parseTimestamp = (timestamp: string): number => {
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

export const generateShareableLink = (
  videoId: string,
  timestamp?: number,
  annotationId?: string,
): string => {
  const params = new URLSearchParams();
  params.set("v", videoId);

  if (timestamp !== undefined) {
    params.set("t", timestamp.toString());
  }

  if (annotationId) {
    params.set("a", annotationId);
  }

  return `/audit/video?${params.toString()}`;
};
