/**
 * Photo Quality Validation Service
 * Provides immediate feedback on photo quality
 * Helps inspectors take better photos on the first try
 */

import { debugLogger } from '@/utils/debugLogger';

export interface PhotoQualityResult {
  isAcceptable: boolean;
  qualityScore: number; // 0-100
  issues: string[];
  suggestions: string[];
}

export class PhotoQualityService {
  /**
   * Validate photo quality using browser-based image analysis
   * No AI API needed - just practical quality checks
   */
  static async validatePhoto(file: File): Promise<PhotoQualityResult> {
    try {
      // Basic file validation
      if (!file || !file.type.startsWith("image/")) {
        return {
          isAcceptable: false,
          qualityScore: 0,
          issues: ["Invalid file type"],
          suggestions: ["Please select an image file"],
        };
      }

      // Check file size (too small = low quality, too large = slow upload)
      const fileSizeMB = file.size / (1024 * 1024);
      const issues: string[] = [];
      const suggestions: string[] = [];
      let qualityScore = 100;

      if (fileSizeMB < 0.1) {
        issues.push("Image resolution too low");
        suggestions.push("Move closer to the subject");
        qualityScore -= 40;
      } else if (fileSizeMB > 10) {
        issues.push("File size too large");
        suggestions.push("Reduce camera quality settings slightly");
        qualityScore -= 10;
      }

      // Load image to check dimensions and brightness
      const imageAnalysis = await this.analyzeImage(file);
      
      // Check dimensions
      if (imageAnalysis.width < 800 || imageAnalysis.height < 600) {
        issues.push("Image resolution too small");
        suggestions.push("Use a higher resolution camera setting");
        qualityScore -= 30;
      }

      // Check brightness
      if (imageAnalysis.averageBrightness < 40) {
        issues.push("Photo is too dark");
        suggestions.push("Turn on more lights", "Use camera flash", "Open curtains/blinds");
        qualityScore -= 30;
      } else if (imageAnalysis.averageBrightness > 220) {
        issues.push("Photo is overexposed");
        suggestions.push("Reduce lighting", "Move away from direct sunlight");
        qualityScore -= 20;
      }

      // Check blur (using edge detection approximation)
      if (imageAnalysis.sharpnessScore < 30) {
        issues.push("Photo appears blurry");
        suggestions.push("Hold camera steady", "Tap to focus before capturing", "Clean camera lens");
        qualityScore -= 30;
      }

      // Ensure score is between 0-100
      qualityScore = Math.max(0, Math.min(100, qualityScore));

      return {
        isAcceptable: qualityScore >= 50,
        qualityScore,
        issues,
        suggestions,
      };
    } catch (error) {
      debugLogger.error("Error analyzing photo quality:", error);
      return {
        isAcceptable: true, // Don't block on error
        qualityScore: 75,
        issues: [],
        suggestions: [],
      };
    }
  }

  /**
   * Analyze image properties using canvas
   */
  private static analyzeImage(file: File): Promise<{
    width: number;
    height: number;
    averageBrightness: number;
    sharpnessScore: number;
  }> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        canvas.width = Math.min(img.width, 1000); // Limit size for performance
        canvas.height = Math.min(img.height, 1000);
        
        // Scale image if needed
        const scale = Math.min(1, 1000 / img.width, 1000 / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        
        ctx?.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        if (!ctx) {
          resolve({
            width: img.width,
            height: img.height,
            averageBrightness: 128,
            sharpnessScore: 50,
          });
          return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate average brightness
        let totalBrightness = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }

        const averageBrightness = totalBrightness / pixelCount;

        // Simple sharpness detection using edge detection
        let edgeStrength = 0;
        const step = 4; // Sample every 4th pixel for performance
        
        for (let y = 1; y < canvas.height - 1; y += step) {
          for (let x = 1; x < canvas.width - 1; x += step) {
            const idx = (y * canvas.width + x) * 4;
            const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            
            // Check neighbors
            const leftIdx = (y * canvas.width + (x - 1)) * 4;
            const left = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
            
            const rightIdx = (y * canvas.width + (x + 1)) * 4;
            const right = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
            
            const topIdx = ((y - 1) * canvas.width + x) * 4;
            const top = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
            
            const bottomIdx = ((y + 1) * canvas.width + x) * 4;
            const bottom = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
            
            // Calculate edge strength
            const horizontalEdge = Math.abs(left - right);
            const verticalEdge = Math.abs(top - bottom);
            edgeStrength += (horizontalEdge + verticalEdge) / 2;
          }
        }

        const sampledPixels = ((canvas.width - 2) / step) * ((canvas.height - 2) / step);
        const sharpnessScore = Math.min(100, (edgeStrength / sampledPixels) * 2);

        resolve({
          width: img.width,
          height: img.height,
          averageBrightness,
          sharpnessScore,
        });
      };

      img.onerror = () => {
        resolve({
          width: 0,
          height: 0,
          averageBrightness: 128,
          sharpnessScore: 50,
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get user-friendly feedback message
   */
  static getFeedbackMessage(result: PhotoQualityResult): string {
    if (result.isAcceptable) {
      if (result.qualityScore >= 90) {
        return "✅ Excellent photo quality!";
      } else if (result.qualityScore >= 70) {
        return "✅ Good photo quality";
      } else {
        return "⚠️ Photo acceptable but could be better";
      }
    } else {
      return "❌ Please retake photo";
    }
  }
}