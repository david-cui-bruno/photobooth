import type { FaceData } from '../services/faceDetectionService';

export interface AutoCaptureConfig {
  enabled: boolean;
  requireAllSmiling: boolean;
  smileThreshold: number;
  confidenceThreshold: number;
  stabilityFrames: number; // How many consecutive frames needed
}

export class EmotionAutoCaptureService {
  private consecutiveGoodFrames = 0;
  private lastCaptureTime = 0;
  private readonly minTimeBetweenCaptures = 1500; // Reduced from 3000 to 1500ms (1.5 seconds)

  constructor(private config: AutoCaptureConfig) {}

  updateConfig(config: Partial<AutoCaptureConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Check if conditions are met for auto-capture
  shouldAutoCapture(faces: FaceData[]): boolean {
    if (!this.config.enabled || faces.length === 0) {
      this.consecutiveGoodFrames = 0;
      return false;
    }

    const now = Date.now();
    const timeSinceLastCapture = now - this.lastCaptureTime;
    
    if (timeSinceLastCapture < this.minTimeBetweenCaptures) {
      console.log(`⏰ Cooldown: ${Math.round((this.minTimeBetweenCaptures - timeSinceLastCapture)/1000)}s remaining`);
      return false;
    }

    const frameQuality = this.analyzeFrame(faces);
    
    if (frameQuality.isGood) {
      this.consecutiveGoodFrames++;
      console.log(`✅ Good frame ${this.consecutiveGoodFrames}/${this.config.stabilityFrames}: ${frameQuality.details}`);
      
      if (this.consecutiveGoodFrames >= this.config.stabilityFrames) {
        this.lastCaptureTime = now;
        this.consecutiveGoodFrames = 0;
        console.log('🎯 AUTO-CAPTURE TRIGGERED!');
        return true;
      }
    } else {
      console.log(`❌ Bad frame (resetting to 0): ${frameQuality.details}`);
      this.consecutiveGoodFrames = 0;
    }

    return false;
  }

  private analyzeFrame(faces: FaceData[]): { isGood: boolean; details: string } {
    // Check face confidence
    const lowConfidenceFaces = faces.filter(face => 
      face.confidence < this.config.confidenceThreshold
    );
    
    if (lowConfidenceFaces.length > 0) {
      return { 
        isGood: false, 
        details: `${lowConfidenceFaces.length} face(s) with low confidence` 
      };
    }

    // Check emotions
    if (this.config.requireAllSmiling) {
      const nonSmilingFaces = faces.filter(face => 
        face.expressions.happy < this.config.smileThreshold
      );
      
      if (nonSmilingFaces.length > 0) {
        return { 
          isGood: false, 
          details: `${nonSmilingFaces.length} face(s) not smiling enough` 
        };
      }
    } else {
      // At least one person smiling
      const smilingFaces = faces.filter(face => 
        face.expressions.happy >= this.config.smileThreshold
      );
      
      if (smilingFaces.length === 0) {
        return { 
          isGood: false, 
          details: 'No one is smiling' 
        };
      }
    }

    return { 
      isGood: true, 
      details: `All conditions met (${faces.length} face${faces.length > 1 ? 's' : ''})` 
    };
  }

  // Get readiness score for UI feedback
  getReadinessScore(faces: FaceData[]): number {
    if (faces.length === 0) return 0;

    let totalScore = 0;
    
    for (const face of faces) {
      let faceScore = 0;
      
      // Confidence score (0-40 points)
      faceScore += Math.min(40, face.confidence * 40);
      
      // Smile score (0-40 points)
      faceScore += Math.min(40, face.expressions.happy * 40);
      
      // Stability bonus (0-20 points)
      const stabilityBonus = Math.min(20, this.consecutiveGoodFrames * 4);
      faceScore += stabilityBonus;
      
      console.log(`Face ${faces.indexOf(face) + 1}: confidence=${Math.round(face.confidence*100)}%, smile=${Math.round(face.expressions.happy*100)}%, stability=${this.consecutiveGoodFrames} frames, total=${Math.round(faceScore)}`);
      
      totalScore += faceScore;
    }

    const finalScore = Math.min(100, totalScore / faces.length);
    console.log(`📊 Final readiness: ${Math.round(finalScore)}%`);
    return finalScore;
  }

  // Add a method to manually reset the cooldown (call this after each photo is taken)
  resetCooldown() {
    this.consecutiveGoodFrames = 0;
    // Don't reset lastCaptureTime - keep the cooldown
  }
}
