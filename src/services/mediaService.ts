// Media Service - Handles video/photo retrieval and URL generation from Supabase storage
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface MediaFile {
  id: string;
  url: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: 'photo' | 'video';
  checklistItemId: string;
  createdAt: string;
  isAccessible: boolean;
  duration?: number; // For videos
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
  codec: string;
}

export class MediaService {
  private readonly CACHE_DURATION = 3600; // 1 hour
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  /**
   * Get media file with public URL
   */
  async getMediaFile(mediaId: string): Promise<{ success: boolean; data?: MediaFile; error?: string }> {
    try {
      logger.info('Fetching media file', { mediaId }, 'MEDIA_SERVICE');

      // Get media file record
      const { data: mediaRecord, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (fetchError) {
        logger.error('Failed to fetch media record', fetchError, 'MEDIA_SERVICE');
        return { success: false, error: fetchError.message };
      }

      if (!mediaRecord) {
        return { success: false, error: 'Media file not found' };
      }

      // Get public URL from Supabase storage
      // Handle different possible field names for file path
      const filePath = mediaRecord.file_path || mediaRecord.path || mediaRecord.url || '';
      
      if (!filePath) {
        // REMOVED: console.error('❌ No file path found in media record:', mediaRecord);
        return { success: false, error: 'No file path found in media record' };
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('inspection-media')
        .getPublicUrl(filePath);

      // Check if file is accessible
      const isAccessible = await this.checkFileAccessibility(publicUrl);

      const mediaFile: MediaFile = {
        id: mediaRecord.id,
        url: mediaRecord.url || publicUrl,
        publicUrl,
        fileName: mediaRecord.file_name || 'unknown',
        fileSize: mediaRecord.file_size || 0,
        mimeType: mediaRecord.mime_type || 'application/octet-stream',
        type: mediaRecord.type as 'photo' | 'video',
        checklistItemId: mediaRecord.checklist_item_id,
        createdAt: mediaRecord.created_at,
        isAccessible
      };

      // Get video metadata if it's a video file
      if (mediaFile.type === 'video' && isAccessible) {
        const metadata = await this.getVideoMetadata(publicUrl);
        if (metadata) {
          mediaFile.duration = metadata.duration;
        }
      }

      logger.info('Successfully fetched media file', {
        mediaId,
        type: mediaFile.type,
        fileSize: mediaFile.fileSize,
        isAccessible
      }, 'MEDIA_SERVICE');

      return { success: true, data: mediaFile };
    } catch (error) {
      logger.error('Unexpected error fetching media file', error, 'MEDIA_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get all media files for a checklist item
   */
  async getMediaFilesForItem(checklistItemId: string): Promise<{
    success: boolean;
    data?: { photos: MediaFile[]; videos: MediaFile[] };
    error?: string;
  }> {
    try {
      logger.info('Fetching media files for checklist item', { checklistItemId }, 'MEDIA_SERVICE');

      const { data: mediaRecords, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('checklist_item_id', checklistItemId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        logger.error('Failed to fetch media records', fetchError, 'MEDIA_SERVICE');
        return { success: false, error: fetchError.message };
      }

      const photos: MediaFile[] = [];
      const videos: MediaFile[] = [];

      // Process each media record
      for (const record of mediaRecords || []) {
        const { data: { publicUrl } } = supabase.storage
          .from('inspection-media')
          .getPublicUrl(record.file_path || '');

        const isAccessible = await this.checkFileAccessibility(publicUrl);

        const mediaFile: MediaFile = {
          id: record.id,
          url: record.url || publicUrl,
          publicUrl,
          fileName: record.file_name || 'unknown',
          fileSize: record.file_size || 0,
          mimeType: record.mime_type || 'application/octet-stream',
          type: record.type as 'photo' | 'video',
          checklistItemId: record.checklist_item_id,
          createdAt: record.created_at,
          isAccessible
        };

        // Get video metadata if it's a video
        if (mediaFile.type === 'video' && isAccessible) {
          const metadata = await this.getVideoMetadata(publicUrl);
          if (metadata) {
            mediaFile.duration = metadata.duration;
          }
        }

        if (mediaFile.type === 'photo') {
          photos.push(mediaFile);
        } else {
          videos.push(mediaFile);
        }
      }

      logger.info('Successfully fetched media files', {
        checklistItemId,
        photoCount: photos.length,
        videoCount: videos.length
      }, 'MEDIA_SERVICE');

      return { success: true, data: { photos, videos } };
    } catch (error) {
      logger.error('Unexpected error fetching media files', error, 'MEDIA_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Generate signed URL for secure access
   */
  async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('inspection-media')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        logger.error('Failed to create signed URL', error, 'MEDIA_SERVICE');
        return { success: false, error: error.message };
      }

      return { success: true, data: data.signedUrl };
    } catch (error) {
      logger.error('Unexpected error creating signed URL', error, 'MEDIA_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Check if file is accessible
   */
  private async checkFileAccessibility(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      logger.warn('File accessibility check failed', { url, error }, 'MEDIA_SERVICE');
      return false;
    }
  }

  /**
   * Get video metadata (duration, etc.)
   */
  private async getVideoMetadata(url: string): Promise<VideoMetadata | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          bitrate: 0, // Not available in HTML5 video
          framerate: 0, // Not available in HTML5 video
          codec: 'unknown' // Not available in HTML5 video
        };
        
        resolve(metadata);
      };
      
      video.onerror = () => {
        logger.warn('Failed to get video metadata', { url }, 'MEDIA_SERVICE');
        resolve(null);
      };
      
      video.src = url;
    });
  }

  /**
   * Get optimized video URL based on device capabilities
   */
  async getOptimizedVideoUrl(
    originalUrl: string,
    targetQuality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<string> {
    // For now, return original URL
    // In a full implementation, this would:
    // 1. Check if optimized versions exist
    // 2. Generate them if needed
    // 3. Return appropriate quality version
    
    logger.info('Getting optimized video URL', { originalUrl, targetQuality }, 'MEDIA_SERVICE');
    return originalUrl;
  }

  /**
   * Preload video for better performance
   */
  async preloadVideo(url: string): Promise<boolean> {
    try {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      
      return new Promise((resolve) => {
        video.oncanplaythrough = () => resolve(true);
        video.onerror = () => resolve(false);
        
        // Timeout after 10 seconds
        setTimeout(() => resolve(false), 10000);
      });
    } catch (error) {
      logger.error('Failed to preload video', { url, error }, 'MEDIA_SERVICE');
      return false;
    }
  }

  /**
   * Get video thumbnail
   */
  async getVideoThumbnail(url: string, timeSeconds: number = 1): Promise<string | null> {
    try {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return null;
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          video.currentTime = Math.min(timeSeconds, video.duration - 1);
        };
        
        video.onseeked = () => {
          context.drawImage(video, 0, 0);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailUrl);
        };
        
        video.onerror = () => resolve(null);
        video.src = url;
      });
    } catch (error) {
      logger.error('Failed to generate video thumbnail', { url, error }, 'MEDIA_SERVICE');
      return null;
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
}

// Export singleton instance
export const mediaService = new MediaService();