import * as faceapi from 'face-api.js';

export interface FaceData {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  expressions: faceapi.FaceExpressions;
  ageAndGender: { age: number; gender: string; genderProbability: number };
  id: string;
  dominantEmotion: string;
  confidence: number;
}

export class FaceDetectionService {
  private isLoaded = false;
  private detectionOptions: faceapi.TinyFaceDetectorOptions;

  constructor() {
    this.detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 512,
      scoreThreshold: 0.3
    });
  }

  async loadModels(): Promise<boolean> {
    try {
      console.log('Loading face detection models...');
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);
      
      this.isLoaded = true;
      console.log('✅ Face detection models loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load face detection models:', error);
      return false;
    }
  }

  async detectFaces(input: HTMLVideoElement | HTMLImageElement): Promise<FaceData[]> {
    if (!this.isLoaded) {
      console.warn('Face detection models not loaded');
      return [];
    }

    try {
      const detections = await faceapi
        .detectAllFaces(input, this.detectionOptions)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      return detections.map((detection, index) => {
        const expressions = detection.expressions;
        const sortedExpressions = Object.entries(expressions)
          .sort(([,a], [,b]) => b - a);
        
        const [topEmotion, topConfidence] = sortedExpressions[0];
        const finalEmotion = topConfidence > 0.5 ? topEmotion : 'neutral';

        return {
          detection: detection.detection,
          landmarks: detection.landmarks,
          expressions: detection.expressions,
          ageAndGender: {
            age: detection.age,
            gender: detection.gender,
            genderProbability: detection.genderProbability
          },
          id: `face-${Date.now()}-${index}`,
          dominantEmotion: finalEmotion,
          confidence: topConfidence
        };
      });
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  isReady(): boolean {
    return this.isLoaded;
  }
}

export const faceDetectionService = new FaceDetectionService();
