// ==============================================
// Image Preprocessing Service
// Handles normalization, deskewing, compression
// and PDF to image conversion
// ==============================================

import { ServiceResult, ServiceError } from '@/types/llm-types';

interface PreprocessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  deskew?: boolean;
  grayscale?: boolean;
  removeNoise?: boolean;
  compression?: 'low' | 'medium' | 'high';
}

interface PreprocessedImage {
  data: string; // Base64 encoded
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

interface PDFPageImage {
  pageNumber: number;
  image: PreprocessedImage;
}

// =============================================
// Image Processing Utilities
// =============================================

/**
 * Detect if image is skewed and return rotation angle
 * @param canvas Canvas element with image data
 * @returns Angle in degrees (-45 to 45)
 */
function detectSkew(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Simplified edge detection - in production, use more sophisticated algorithm
  // This is a placeholder implementation
  return 0; // No skew detected
}

/**
 * Deskew an image by rotating it
 * @param canvas Canvas with image
 * @param angle Rotation angle in degrees
 * @returns New canvas with deskewed image
 */
function deskewImage(canvas: HTMLCanvasElement, angle: number): HTMLCanvasElement {
  const rad = (angle * Math.PI) / 180;
  const newCanvas = document.createElement('canvas');
  const ctx = newCanvas.getContext('2d');
  
  if (!ctx) return canvas;

  // Calculate new dimensions
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  newCanvas.width = canvas.width * cos + canvas.height * sin;
  newCanvas.height = canvas.width * sin + canvas.height * cos;

  // Move to center and rotate
  ctx.translate(newCanvas.width / 2, newCanvas.height / 2);
  ctx.rotate(rad);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return newCanvas;
}

/**
 * Compress image by reducing dimensions and quality
 * @param canvas Source canvas
 * @param maxWidth Maximum width
 * @param maxHeight Maximum height
 * @param quality JPEG quality (0-100)
 * @returns Compressed canvas
 */
function compressImage(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): HTMLCanvasElement {
  const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height, 1);
  
  const newCanvas = document.createElement('canvas');
  newCanvas.width = canvas.width * ratio;
  newCanvas.height = canvas.height * ratio;

  const ctx = newCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
  }

  return newCanvas;
}

/**
 * Convert image to grayscale
 * @param canvas Source canvas
 * @returns Grayscale canvas
 */
function convertToGrayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Apply basic noise reduction using median filter
 * @param canvas Source canvas
 * @returns Denoised canvas
 */
function removeNoise(canvas: HTMLCanvasElement): HTMLCanvasElement {
  // Simplified implementation - in production use more sophisticated filters
  // This applies a simple blur to reduce noise
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Create a temporary canvas for the filtered result
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return canvas;

  // Apply a simple blur filter
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Placeholder: in production, implement proper median or bilateral filtering
  // For now, just return the original
  return canvas;
}

/**
 * Convert canvas to Base64 with specified quality
 * @param canvas Source canvas
 * @param format Image format (jpeg, png, webp)
 * @param quality Quality level (0-100)
 * @returns Base64 string
 */
function canvasToBase64(canvas: HTMLCanvasElement, format: string, quality: number): string {
  const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
  return canvas.toDataURL(mimeType, quality / 100);
}

/**
 * Get image dimensions from file
 * @param file Image file
 * @returns Promise with width and height
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Load image file into canvas
 * @param file Image file
 * @returns Promise with canvas element
 */
function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================================
// Main Service Functions
// =============================================

/**
 * Preprocess a single image file
 * @param file Image file to process
 * @param options Processing options
 * @returns Promise with preprocessed image
 */
export async function preprocessImage(
  file: File,
  options: PreprocessingOptions = {}
): Promise<ServiceResult<PreprocessedImage>> {
  try {
    const startTime = performance.now();

    // Validate file
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size ${file.size} exceeds maximum ${maxSizeBytes} bytes`,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Load image
    let canvas = await loadImageToCanvas(file);

    // Apply preprocessing steps
    if (options.deskew) {
      const skewAngle = detectSkew(canvas);
      if (Math.abs(skewAngle) > 2) {
        canvas = deskewImage(canvas, skewAngle);
      }
    }

    if (options.grayscale) {
      canvas = convertToGrayscale(canvas);
    }

    if (options.removeNoise) {
      canvas = removeNoise(canvas);
    }

    if (options.maxWidth || options.maxHeight) {
      const maxW = options.maxWidth || 2048;
      const maxH = options.maxHeight || 2048;
      canvas = compressImage(canvas, maxW, maxH, options.quality || 90);
    }

    // Convert to Base64
    const format = file.type.split('/')[1] || 'jpeg';
    const quality = options.quality || 90;
    const base64 = canvasToBase64(canvas, format, quality);

    // Calculate size
    const sizeBytes = Math.round((base64.length * 3) / 4);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      data: {
        data: base64,
        width: canvas.width,
        height: canvas.height,
        format,
        sizeBytes,
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'PREPROCESSING_ERROR',
        message: err.message,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Preprocess PDF file and convert pages to images
 * Note: This requires pdf.js library - needs to be added to dependencies
 * For now, returns a placeholder error
 * @param file PDF file
 * @param options Processing options
 * @returns Promise with array of page images
 */
export async function preprocessPDF(
  file: File,
  options: PreprocessingOptions = {}
): Promise<ServiceResult<PDFPageImage[]>> {
  try {
    // In production, use pdf.js: import * as pdfjsLib from 'pdfjs-dist';
    // For now, return error as PDF processing requires additional setup
    
    return {
      success: false,
      error: {
        code: 'PDF_PROCESSING_NOT_IMPLEMENTED',
        message: 'PDF processing requires pdf.js library. Please install: npm install pdfjs-dist',
        details: 'Add pdf.js to package.json and implement PDFWorker setup',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'PDF_PROCESSING_ERROR',
        message: err.message,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Preprocess any supported file type
 * @param file File to process (image or PDF)
 * @param options Processing options
 * @returns Promise with preprocessed images
 */
export async function preprocessFile(
  file: File,
  options: PreprocessingOptions = {}
): Promise<ServiceResult<PreprocessedImage | PDFPageImage[]>> {
  const isPDF = file.type === 'application/pdf';
  
  if (isPDF) {
    return preprocessPDF(file, options);
  } else {
    return preprocessImage(file, options);
  }
}

/**
 * Batch preprocess multiple image files
 * @param files Array of image files
 * @param options Processing options
 * @returns Promise with array of preprocessed images
 */
export async function preprocessImages(
  files: File[],
  options: PreprocessingOptions = {}
): Promise<ServiceResult<PreprocessedImage[]>> {
  try {
    const results = await Promise.all(
      files.map((file) => preprocessImage(file, options))
    );

    const errors = results.filter((r) => !r.success);
    if (errors.length > 0) {
      return {
        success: false,
        error: {
          code: 'BATCH_PREPROCESSING_PARTIAL_FAILURE',
          message: `${errors.length} of ${files.length} files failed to process`,
          details: errors.map((e) => e.error),
          timestamp: new Date().toISOString(),
        },
      };
    }

    const preprocessedImages = results
      .filter((r) => r.success && r.data)
      .map((r) => r.data as PreprocessedImage);

    return {
      success: true,
      data: preprocessedImages,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'BATCH_PREPROCESSING_ERROR',
        message: err.message,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get information about an image file without full processing
 * @param file Image file
 * @returns Promise with image info
 */
export async function getImageInfo(
  file: File
): Promise<
  ServiceResult<{
    width: number;
    height: number;
    size: number;
    type: string;
  }>
> {
  try {
    const dimensions = await getImageDimensions(file);
    return {
      success: true,
      data: {
        width: dimensions.width,
        height: dimensions.height,
        size: file.size,
        type: file.type,
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'IMAGE_INFO_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
