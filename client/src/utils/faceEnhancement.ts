export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class FaceEnhancementService {
  
  // Simple but effective skin smoothing using gaussian blur + edge preservation
  static applySkinSmoothing(
    canvas: HTMLCanvasElement, 
    faceRegions: FaceRegion[], 
    intensity: number = 0.3
  ): void {
    const ctx = canvas.getContext('2d')!;
    
    faceRegions.forEach(face => {
      // Extract face region
      const faceImageData = ctx.getImageData(face.x, face.y, face.width, face.height);
      const smoothedData = this.smoothSkin(faceImageData, intensity);
      
      // Put smoothed data back
      ctx.putImageData(smoothedData, face.x, face.y);
    });
  }
  
  // Enhance face lighting (brighten + improve contrast)
  static enhanceFaceLighting(
    canvas: HTMLCanvasElement, 
    faceRegions: FaceRegion[]
  ): void {
    const ctx = canvas.getContext('2d')!;
    
    faceRegions.forEach(face => {
      const faceImageData = ctx.getImageData(face.x, face.y, face.width, face.height);
      const enhancedData = this.improveLighting(faceImageData);
      
      ctx.putImageData(enhancedData, face.x, face.y);
    });
  }
  
  // Skin smoothing algorithm - preserves edges while smoothing skin
  private static smoothSkin(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const smoothedData = new Uint8ClampedArray(data);
    
    // Apply selective smoothing (avoid edges like eyes, mouth)
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        const idx = (y * width + x) * 4;
        
        // Check if this pixel is likely skin (avoid edges)
        if (this.isSkinPixel(data, idx, width) && !this.isEdgePixel(data, idx, width)) {
          // Apply gaussian-like smoothing
          const smoothed = this.getSmoothedPixel(data, x, y, width, height);
          
          // Blend original with smoothed based on intensity
          smoothedData[idx] = data[idx] * (1 - intensity) + smoothed.r * intensity;
          smoothedData[idx + 1] = data[idx + 1] * (1 - intensity) + smoothed.g * intensity;
          smoothedData[idx + 2] = data[idx + 2] * (1 - intensity) + smoothed.b * intensity;
        }
      }
    }
    
    return new ImageData(smoothedData, width, height);
  }
  
  // Improve face lighting - brighten shadows, enhance contrast
  private static improveLighting(imageData: ImageData): ImageData {
    const data = imageData.data;
    const enhancedData = new Uint8ClampedArray(data);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Brighten dark areas more than bright areas (shadow lifting)
      const shadowLift = luminance < 128 ? (128 - luminance) / 128 * 0.3 : 0;
      const brightnessFactor = 1.0 + shadowLift + 0.1; // Base 10% brightness boost
      
      // Enhance contrast slightly
      const contrastFactor = 1.15;
      const midpoint = 128;
      
      // Apply lighting enhancement
      enhancedData[i] = Math.min(255, Math.max(0, 
        (r - midpoint) * contrastFactor + midpoint * brightnessFactor
      ));
      enhancedData[i + 1] = Math.min(255, Math.max(0, 
        (g - midpoint) * contrastFactor + midpoint * brightnessFactor
      ));
      enhancedData[i + 2] = Math.min(255, Math.max(0, 
        (b - midpoint) * contrastFactor + midpoint * brightnessFactor
      ));
      enhancedData[i + 3] = data[i + 3]; // Keep alpha unchanged
    }
    
    return new ImageData(enhancedData, imageData.width, imageData.height);
  }
  
  // Simple skin detection based on color ranges
  private static isSkinPixel(data: Uint8ClampedArray, idx: number, _width: number): boolean {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Basic skin color detection (works for most skin tones)
    return (
      r > 95 && g > 40 && b > 20 &&
      r > g && r > b &&
      Math.abs(r - g) > 15 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15
    );
  }
  
  // Detect edges to avoid smoothing important features
  private static isEdgePixel(data: Uint8ClampedArray, idx: number, width: number): boolean {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check surrounding pixels for high contrast (edges)
    const neighbors = [
      idx - width * 4, // Above
      idx + width * 4, // Below
      idx - 4,          // Left
      idx + 4           // Right
    ];
    
    for (const neighborIdx of neighbors) {
      if (neighborIdx >= 0 && neighborIdx < data.length) {
        const nr = data[neighborIdx];
        const ng = data[neighborIdx + 1];
        const nb = data[neighborIdx + 2];
        
        // If color difference is high, it's likely an edge
        const colorDiff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
        if (colorDiff > 60) return true;
      }
    }
    
    return false;
  }
  
  // Get smoothed pixel value using weighted average
  private static getSmoothedPixel(
    data: Uint8ClampedArray, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): { r: number; g: number; b: number } {
    let r = 0, g = 0, b = 0, totalWeight = 0;
    
    // 3x3 gaussian-like kernel
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    
    for (let ky = -1; ky <= 1; ky++) {
      for (let kx = -1; kx <= 1; kx++) {
        const px = x + kx;
        const py = y + ky;
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          const weight = kernel[ky + 1][kx + 1];
          
          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
          totalWeight += weight;
        }
      }
    }
    
    return {
      r: r / totalWeight,
      g: g / totalWeight,
      b: b / totalWeight
    };
  }
  
  // Add performance optimization for real-time processing
  static applyRealTimeSkinSmoothing(
    canvas: HTMLCanvasElement, 
    faceRegions: FaceRegion[], 
    intensity: number = 0.2 // Lower intensity for real-time
  ): void {
    const ctx = canvas.getContext('2d')!;
    
    faceRegions.forEach(face => {
      // Skip very small faces to improve performance
      if (face.width < 50 || face.height < 50) return;
      
      const faceImageData = ctx.getImageData(face.x, face.y, face.width, face.height);
      const smoothedData = this.fastSkinSmooth(faceImageData, intensity);
      
      ctx.putImageData(smoothedData, face.x, face.y);
    });
  }
  
  // Faster skin smoothing for real-time use
  private static fastSkinSmooth(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const smoothedData = new Uint8ClampedArray(data);
    
    // Process every 2nd pixel for speed (still looks good)
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        
        if (this.isSkinPixel(data, idx, width)) {
          // Simple 3x3 average for speed
          const smoothed = this.fastSmooth(data, x, y, width);
          
          smoothedData[idx] = data[idx] * (1 - intensity) + smoothed.r * intensity;
          smoothedData[idx + 1] = data[idx + 1] * (1 - intensity) + smoothed.g * intensity;
          smoothedData[idx + 2] = data[idx + 2] * (1 - intensity) + smoothed.b * intensity;
        }
      }
    }
    
    return new ImageData(smoothedData, width, height);
  }
  
  private static fastSmooth(
    data: Uint8ClampedArray, 
    x: number, 
    y: number, 
    width: number
  ): { r: number; g: number; b: number } {
    // Simple 3x3 average
    let r = 0, g = 0, b = 0, count = 0;
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
    
    return { r: r / count, g: g / count, b: b / count };
  }
}
