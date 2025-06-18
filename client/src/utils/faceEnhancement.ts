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
      const padding = 15;
      const expandedFace = {
        x: Math.max(0, face.x - padding),
        y: Math.max(0, face.y - padding),
        width: Math.min(canvas.width - face.x + padding, face.width + padding * 2),
        height: Math.min(canvas.height - face.y + padding, face.height + padding * 2)
      };
      
      const faceImageData = ctx.getImageData(
        expandedFace.x, 
        expandedFace.y, 
        expandedFace.width, 
        expandedFace.height
      );
      
      const enhancedData = this.improveLightingWithBlending(
        faceImageData,
        face,
        expandedFace,
        padding
      );
      
      ctx.putImageData(enhancedData, expandedFace.x, expandedFace.y);
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
    intensity: number = 0.2
  ): void {
    const ctx = canvas.getContext('2d')!;
    
    faceRegions.forEach(face => {
      if (face.width < 50 || face.height < 50) return;
      
      // Expand region with padding for smooth blending
      const padding = 20;
      const expandedFace = {
        x: Math.max(0, face.x - padding),
        y: Math.max(0, face.y - padding),
        width: Math.min(canvas.width - face.x + padding, face.width + padding * 2),
        height: Math.min(canvas.height - face.y + padding, face.height + padding * 2)
      };
      
      const faceImageData = ctx.getImageData(
        expandedFace.x, 
        expandedFace.y, 
        expandedFace.width, 
        expandedFace.height
      );
      
      const smoothedData = this.fastSkinSmoothWithBlending(
        faceImageData, 
        intensity,
        face,
        expandedFace,
        padding
      );
      
      ctx.putImageData(smoothedData, expandedFace.x, expandedFace.y);
    });
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
  
  // Skin smoothing with smooth edge blending
  private static fastSkinSmoothWithBlending(
    imageData: ImageData, 
    intensity: number,
    originalFace: FaceRegion,
    expandedFace: FaceRegion,
    padding: number
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const smoothedData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        
        if (this.isSkinPixel(data, idx, width)) {
          // Calculate distance from face center for blending
          const absoluteX = expandedFace.x + x;
          const absoluteY = expandedFace.y + y;
          
          const blendFactor = this.calculateBlendFactor(
            absoluteX, 
            absoluteY, 
            originalFace, 
            padding
          );
          
          const effectiveIntensity = intensity * blendFactor;
          
          if (effectiveIntensity > 0.01) { // Only process if effect is meaningful
            const smoothed = this.fastSmooth(data, x, y, width);
            
            smoothedData[idx] = data[idx] * (1 - effectiveIntensity) + smoothed.r * effectiveIntensity;
            smoothedData[idx + 1] = data[idx + 1] * (1 - effectiveIntensity) + smoothed.g * effectiveIntensity;
            smoothedData[idx + 2] = data[idx + 2] * (1 - effectiveIntensity) + smoothed.b * effectiveIntensity;
          }
        }
      }
    }
    
    return new ImageData(smoothedData, width, height);
  }
  
  // Lighting enhancement with smooth blending
  private static improveLightingWithBlending(
    imageData: ImageData,
    originalFace: FaceRegion,
    expandedFace: FaceRegion,
    padding: number
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const enhancedData = new Uint8ClampedArray(data);
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      const absoluteX = expandedFace.x + x;
      const absoluteY = expandedFace.y + y;
      
      const blendFactor = this.calculateBlendFactor(
        absoluteX, 
        absoluteY, 
        originalFace, 
        padding
      );
      
      if (blendFactor > 0.01) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Apply lighting enhancement
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const shadowLift = luminance < 128 ? (128 - luminance) / 128 * 0.2 : 0;
        const brightnessFactor = 1.0 + shadowLift + 0.05;
        const contrastFactor = 1.1;
        const midpoint = 128;
        
        const enhancedR = (r - midpoint) * contrastFactor + midpoint * brightnessFactor;
        const enhancedG = (g - midpoint) * contrastFactor + midpoint * brightnessFactor;
        const enhancedB = (b - midpoint) * contrastFactor + midpoint * brightnessFactor;
        
        // Blend enhanced with original based on distance from face center
        enhancedData[i] = Math.min(255, Math.max(0, 
          r * (1 - blendFactor) + enhancedR * blendFactor
        ));
        enhancedData[i + 1] = Math.min(255, Math.max(0, 
          g * (1 - blendFactor) + enhancedG * blendFactor
        ));
        enhancedData[i + 2] = Math.min(255, Math.max(0, 
          b * (1 - blendFactor) + enhancedB * blendFactor
        ));
      }
    }
    
    return new ImageData(enhancedData, imageData.width, imageData.height);
  }
  
  // Calculate smooth blend factor based on distance from face center
  private static calculateBlendFactor(
    x: number, 
    y: number, 
    face: FaceRegion, 
    padding: number
  ): number {
    const faceCenterX = face.x + face.width / 2;
    const faceCenterY = face.y + face.height / 2;
    
    // Distance from face center
    const dx = x - faceCenterX;
    const dy = y - faceCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Face radius (use the smaller dimension to ensure we stay within face bounds)
    const faceRadius = Math.min(face.width, face.height) / 2;
    const blendRadius = faceRadius + padding;
    
    if (distance <= faceRadius) {
      // Full effect in face center
      return 1.0;
    } else if (distance <= blendRadius) {
      // Smooth falloff from face edge to padding edge
      const falloffDistance = distance - faceRadius;
      const falloffRatio = falloffDistance / padding;
      // Smooth cubic falloff
      return Math.max(0, 1 - falloffRatio * falloffRatio * falloffRatio);
    } else {
      // No effect outside blend radius
      return 0;
    }
  }
}
