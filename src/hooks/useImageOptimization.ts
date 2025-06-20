
import { useState } from "react";

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export const useImageOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeImage = async (
    file: File,
    options: OptimizationOptions = {}
  ): Promise<File> => {
    setIsOptimizing(true);

    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    try {
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Create image from file
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, `.${format}`),
                  {
                    type: `image/${format}`,
                    lastModified: Date.now()
                  }
                );
                resolve(optimizedFile);
              } else {
                reject(new Error('Failed to optimize image'));
              }
              setIsOptimizing(false);
              URL.revokeObjectURL(imageUrl);
            },
            `image/${format}`,
            quality
          );
        };

        img.onerror = () => {
          setIsOptimizing(false);
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image'));
        };

        img.src = imageUrl;
      });
    } catch (error) {
      setIsOptimizing(false);
      console.error('Image optimization failed:', error);
      // Return original file if optimization fails
      return file;
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    });
  };

  return {
    optimizeImage,
    getImageDimensions,
    isOptimizing
  };
};
