export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class FaceAwareFilterService {
  
  // Apply filters that enhance faces (skin smoothing, brightness)
  static applyFaceEnhancementFilter(
    canvas: HTMLCanvasElement,
    faceRegions: FaceRegion[]
  ): void {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Create a mask for face regions
    const faceMask = this.createFaceMask(canvas.width, canvas.height, faceRegions);
    
    // Apply skin smoothing and brightening only to face areas
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      const y = Math.floor(pixelIndex / canvas.width);
      const x = pixelIndex % canvas.width;
      
      if (faceMask[y] && faceMask[y][x]) {
        // Enhance face pixels
        data[i] = Math.min(255, data[i] * 1.1);     // Red - slight brightness
        data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Green
        data[i + 2] = Math.min(255, data[i + 2] * 1.1); // Blue
        
        // Skin smoothing (simple blur effect)
        this.applySkinSmoothing(data, i, canvas.width);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  // Apply background-only filters (blur background, keep faces sharp)
  static applyBackgroundFilter(
    canvas: HTMLCanvasElement,
    faceRegions: FaceRegion[],
    filterType: 'blur' | 'desaturate' | 'darken'
  ): void {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const faceMask = this.createFaceMask(canvas.width, canvas.height, faceRegions);
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      const y = Math.floor(pixelIndex / canvas.width);
      const x = pixelIndex % canvas.width;
      
      // Apply filter only to NON-face areas
      if (!faceMask[y] || !faceMask[y][x]) {
        switch (filterType) {
          case 'blur':
            this.applyBlur(data, i, x, y, canvas.width, canvas.height);
            break;
          case 'desaturate':
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = data[i + 1] = data[i + 2] = gray;
            break;
          case 'darken':
            data[i] *= 0.7;
            data[i + 1] *= 0.7;
            data[i + 2] *= 0.7;
            break;
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  private static createFaceMask(
    width: number, 
    height: number, 
    faceRegions: FaceRegion[]
  ): boolean[][] {
    const mask: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
    
    faceRegions.forEach(face => {
      // Expand face region slightly for better coverage
      const padding = 20;
      const startX = Math.max(0, Math.floor(face.x - padding));
      const endX = Math.min(width, Math.floor(face.x + face.width + padding));
      const startY = Math.max(0, Math.floor(face.y - padding));
      const endY = Math.min(height, Math.floor(face.y + face.height + padding));
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          mask[y][x] = true;
        }
      }
    });
    
    return mask;
  }
  
  private static applySkinSmoothing(data: Uint8ClampedArray, index: number, _width: number): void {
    // Simple skin smoothing - average with neighboring pixels
    // This is a simplified version - real skin smoothing is more complex
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    
    // Apply subtle smoothing
    data[index] = Math.min(255, r * 0.9 + 25);
    data[index + 1] = Math.min(255, g * 0.9 + 25);
    data[index + 2] = Math.min(255, b * 0.9 + 25);
  }
  
  private static applyBlur(
    data: Uint8ClampedArray, 
    index: number, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): void {
    // Simple blur - average with surrounding pixels
    let r = 0, g = 0, b = 0, count = 0;
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 4;
          r += data[ni];
          g += data[ni + 1];
          b += data[ni + 2];
          count++;
        }
      }
    }
    
    data[index] = r / count;
    data[index + 1] = g / count;
    data[index + 2] = b / count;
  }
}
