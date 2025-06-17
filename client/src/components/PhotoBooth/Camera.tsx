import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { faceDetectionService } from '../../services/faceDetectionService';
import type { FaceData } from '../../services/faceDetectionService';
import FaceOverlay from '../FaceOverlay/FaceOverlay';
import { FaceEnhancementService } from '../../utils/faceEnhancement';

interface CameraProps {
  stripType: string;
  filters: string[];
  onComplete?: (images: string[]) => void;
}

const Camera = ({ stripType, filters, onComplete }: CameraProps) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For real-time processing
  const animationRef = useRef<number>(0);
  
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [currentPhotoJustTaken, setCurrentPhotoJustTaken] = useState<string>('');
  const [faces, setFaces] = useState<FaceData[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [showFaceOverlay, setShowFaceOverlay] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  
  // New state for real-time enhancement
  const [enableRealTimeEnhancement, setEnableRealTimeEnhancement] = useState(false);

  const getPanelCount = () => {
    return parseInt(stripType.split(' ')[0]) || 4;
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);
    setShowPhotoOptions(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          takePhoto();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // NEW: Real-time video processing
  const processVideoFrame = () => {
    if (!webcamRef.current?.video || !canvasRef.current) return;
    
    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply real-time face enhancement if enabled and faces detected
    if (enableRealTimeEnhancement && faces.length > 0) {
      const faceRegions = faces.map(face => ({
        x: face.detection.box.x,
        y: face.detection.box.y,
        width: face.detection.box.width,
        height: face.detection.box.height
      }));
      
      // Apply enhancements
      FaceEnhancementService.enhanceFaceLighting(canvas, faceRegions);
      FaceEnhancementService.applySkinSmoothing(canvas, faceRegions, 0.3);
    }
    
    // Apply other filters
    if (filters.length > 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (const filter of filters) {
        applyPixelFilter(data, filter);
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    // Continue processing next frame
    animationRef.current = requestAnimationFrame(processVideoFrame);
  };

  // Start/stop real-time processing
  useEffect(() => {
    if (enableRealTimeEnhancement || filters.length > 0) {
      animationRef.current = requestAnimationFrame(processVideoFrame);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enableRealTimeEnhancement, filters, faces]);

  // Updated takePhoto to capture from enhanced canvas
  const takePhoto = () => {
    setIsCountingDown(false);
    
    let imageSrc: string;
    
    // If real-time enhancement is on, capture from the processed canvas
    if ((enableRealTimeEnhancement && faces.length > 0) || filters.length > 0) {
      if (canvasRef.current) {
        imageSrc = canvasRef.current.toDataURL('image/jpeg', 0.9);
      } else {
        imageSrc = webcamRef.current?.getScreenshot() || '';
      }
    } else {
      // Capture directly from webcam
      imageSrc = webcamRef.current?.getScreenshot() || '';
    }
    
    if (imageSrc) {
      setCurrentPhotoJustTaken(imageSrc);
      setCapturedImages(prev => [...prev, imageSrc]);
      setShowPhotoOptions(true);
    }
  };

  const applyPixelFilter = (data: Uint8ClampedArray, filter: string) => {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      switch (filter) {
        case 'grayscale':
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
          break;
          
        case 'sepia':
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          break;
          
        case 'vintage':
          // Sepia + slight brightness + contrast
          const sepiaR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          const sepiaG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          const sepiaB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          data[i] = Math.min(255, sepiaR * 1.1);
          data[i + 1] = Math.min(255, sepiaG * 1.1);
          data[i + 2] = Math.min(255, sepiaB * 1.1);
          break;
          
        case 'warm':
          data[i] = Math.min(255, r * 1.2); // Increase red
          data[i + 1] = Math.min(255, g * 1.1); // Slightly increase green
          data[i + 2] = Math.max(0, b * 0.9); // Decrease blue
          break;
          
        case 'cool':
          data[i] = Math.max(0, r * 0.9); // Decrease red
          data[i + 1] = Math.min(255, g * 1.05); // Slightly increase green
          data[i + 2] = Math.min(255, b * 1.2); // Increase blue
          break;
          
        case 'vivid':
          // Increase saturation and contrast
          const avg = (r + g + b) / 3;
          data[i] = Math.min(255, avg + (r - avg) * 1.5);
          data[i + 1] = Math.min(255, avg + (g - avg) * 1.5);
          data[i + 2] = Math.min(255, avg + (b - avg) * 1.5);
          break;
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImages(prev => prev.slice(0, -1));
    setCurrentPhotoJustTaken('');
    setShowPhotoOptions(false);
    startCountdown();
  };

  const nextPhoto = () => {
    setCurrentPhotoJustTaken('');
    setShowPhotoOptions(false);
    
    if (capturedImages.length < getPanelCount()) {
      startCountdown();
    } else {
      if (onComplete) {
        onComplete(capturedImages);
      }
    }
  };

  const allPhotosComplete = capturedImages.length === getPanelCount();

  useEffect(() => {
    const loadModels = async () => {
      setIsModelLoading(true);
      const success = await faceDetectionService.loadModels();
      if (success) {
        console.log('Face detection ready!');
      } else {
        console.error('Failed to load face detection models');
      }
      setIsModelLoading(false);
    };
    
    loadModels();
  }, []);

  useEffect(() => {
    if (!faceDetectionService.isReady() || isCountingDown) return;

    const detectFaces = async () => {
      if (webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
        // Check if video is actually playing and has dimensions
        const video = webcamRef.current.video;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const detectedFaces = await faceDetectionService.detectFaces(video);
          setFaces(detectedFaces);
        }
      }
    };

    const interval = setInterval(detectFaces, 300); // 3 FPS
    return () => clearInterval(interval);
  }, [isCountingDown, isModelLoading]); // Add isModelLoading as dependency

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">
        Take Your Photos ({capturedImages.length}/{getPanelCount()})
      </h2>
      
      {/* Face Enhancement Controls */}
      <div className="bg-purple-50 p-3 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableRealTimeEnhancement}
              onChange={(e) => setEnableRealTimeEnhancement(e.target.checked)}
              className="rounded"
            />
            <span className="text-purple-800 font-medium">
              Real-time Face Enhancement
            </span>
          </label>
          {enableRealTimeEnhancement && (
            <span className="text-purple-600 text-sm">
              ✨ Live skin smoothing & lighting enhancement
            </span>
          )}
        </div>
      </div>
      
      {filters.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-800 font-medium">
            Active Filters: {filters.join(', ')}
          </p>
          <p className="text-blue-600 text-sm">Preview shows on webcam, filters apply to captured photos</p>
        </div>
      )}
      
      {isModelLoading && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <p className="text-blue-800">Loading face detection models...</p>
        </div>
      )}

      {faces.length > 0 && (
        <div className="bg-green-50 p-3 rounded-lg mb-4">
          <p className="text-green-800 font-medium">
            ✅ {faces.length} face{faces.length > 1 ? 's' : ''} detected!
          </p>
          {faces.map((face, index) => (
            <div key={face.id} className="text-sm text-green-600">
              Face {index + 1}: {face.dominantEmotion} ({(face.confidence * 100).toFixed(0)}%) • {face.ageAndGender.gender} • {Math.round(face.ageAndGender.age)} years old
            </div>
          ))}
        </div>
      )}
      
      {faces.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowFaceOverlay(!showFaceOverlay)}
            className={`px-3 py-1 rounded text-sm ${showFaceOverlay ? 'bg-green-200 text-green-800' : 'bg-gray-200'}`}
          >
            {showFaceOverlay ? 'Hide' : 'Show'} Overlay
          </button>
          <button
            onClick={() => setShowBoundingBox(!showBoundingBox)}
            className={`px-3 py-1 rounded text-sm ${showBoundingBox ? 'bg-blue-200 text-blue-800' : 'bg-gray-200'}`}
          >
            Bounding Box
          </button>
          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`px-3 py-1 rounded text-sm ${showLandmarks ? 'bg-red-200 text-red-800' : 'bg-gray-200'}`}
          >
            Landmarks
          </button>
        </div>
      )}
      
      <div className="relative">
        {/* Original webcam - hidden when processing is active */}
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className={`w-full rounded-lg max-w-md mx-auto ${
            (enableRealTimeEnhancement && faces.length > 0) || filters.length > 0 
              ? 'hidden' 
              : ''
          }`}
        />
        
        {/* Enhanced canvas - shown when processing is active */}
        <canvas
          ref={canvasRef}
          className={`w-full rounded-lg max-w-md mx-auto ${
            (enableRealTimeEnhancement && faces.length > 0) || filters.length > 0 
              ? '' 
              : 'hidden'
          }`}
          style={{
            maxWidth: '28rem', // Match webcam max-width
            height: 'auto'
          }}
        />
        
        {/* Face overlay - position over whichever is visible */}
        {showFaceOverlay && faces.length > 0 && webcamRef.current?.video && (
          <FaceOverlay
            faces={faces}
            videoRef={{ current: webcamRef.current.video }}
            showLandmarks={showLandmarks}
            showBoundingBox={showBoundingBox}
          />
        )}
        
        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-lg">
            <div className="text-center">
              <span className="text-6xl font-bold text-white">{countdown}</span>
              <p className="text-white mt-2 text-xl">
                Photo {capturedImages.length + 1} of {getPanelCount()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance indicator */}
      {enableRealTimeEnhancement && (
        <div className="text-center text-sm text-gray-600">
          🎬 Real-time processing active - {faces.length} face{faces.length !== 1 ? 's' : ''} enhanced
        </div>
      )}

      <div className="flex justify-center space-x-4">
        {capturedImages.length === 0 && !isCountingDown && !showPhotoOptions && (
          <button
            onClick={startCountdown}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg"
          >
            Start Photoshoot
          </button>
        )}

        {showPhotoOptions && (
          <>
            <button
              onClick={retakePhoto}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Retake
            </button>
            <button
              onClick={nextPhoto}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              {allPhotosComplete ? 'Next' : 'Next Photo'}
            </button>
          </>
        )}

        {capturedImages.length > 0 && capturedImages.length < getPanelCount() && !isCountingDown && !showPhotoOptions && (
          <button
            onClick={startCountdown}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg"
          >
            Take Photo {capturedImages.length + 1}
          </button>
        )}
      </div>

      {currentPhotoJustTaken && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Photo just taken (with filters applied):</h3>
          <img
            src={currentPhotoJustTaken}
            alt="Just taken"
            className="w-48 mx-auto rounded border-2 border-blue-500"
          />
        </div>
      )}

      {capturedImages.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">All Photos ({capturedImages.length}/{getPanelCount()}):</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {capturedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Photo ${index + 1}`}
                  className="w-full rounded border"
                />
                <span className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;
