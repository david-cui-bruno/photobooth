import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { faceDetectionService } from '../../services/faceDetectionService';
import type { FaceData } from '../../services/faceDetectionService';
import FaceOverlay from '../FaceOverlay/FaceOverlay';
import { FaceEnhancementService } from '../../utils/faceEnhancement';
import { EmotionAutoCaptureService } from '../../utils/emotionAutoCapture';

interface CameraProps {
  stripType: string;
  filters: string[];
  onComplete?: (images: string[]) => void;
}

const Camera = ({ stripType, filters, onComplete }: CameraProps) => {
  console.log('Camera component rendered with:', { stripType, filters });
  
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

  const [autoCapture, setAutoCapture] = useState<EmotionAutoCaptureService>(
    new EmotionAutoCaptureService({
      enabled: false,
      requireAllSmiling: true,
      smileThreshold: 0.5,
      confidenceThreshold: 0.5,
      stabilityFrames: 3
    })
  );
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);

  const getPanelCount = () => {
    return parseInt(stripType.split(' ')[0]) || 4;
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);
    setShowPhotoOptions(false);
    
    // Reset auto-capture when manually starting countdown
    autoCapture.resetCooldown();

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
    
    // Match canvas size to the displayed video size (not native resolution)
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    
    // Draw video frame scaled to match display
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply face enhancement if enabled
    if (enableRealTimeEnhancement && faces.length > 0) {
      const faceRegions = faces.map(face => ({
        x: face.detection.box.x * (canvas.width / video.videoWidth),
        y: face.detection.box.y * (canvas.height / video.videoHeight),
        width: face.detection.box.width * (canvas.width / video.videoWidth),
        height: face.detection.box.height * (canvas.height / video.videoHeight)
      }));
      
      FaceEnhancementService.enhanceFaceLighting(canvas, faceRegions);
      FaceEnhancementService.applyRealTimeSkinSmoothing(canvas, faceRegions, 0.3);
    }
    
    // Continue processing
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
    console.log('📸 takePhoto() called!');
    setIsCountingDown(false);
    
    let imageSrc: string;
    
    // If real-time enhancement is on, capture from the processed canvas
    if ((enableRealTimeEnhancement && faces.length > 0) || filters.length > 0) {
      if (canvasRef.current) {
        imageSrc = canvasRef.current.toDataURL('image/jpeg', 0.9);
        console.log('📸 Captured from canvas');
      } else {
        imageSrc = webcamRef.current?.getScreenshot() || '';
        console.log('📸 Canvas fallback to webcam');
      }
    } else {
      // Capture directly from webcam
      imageSrc = webcamRef.current?.getScreenshot() || '';
      console.log('📸 Captured from webcam');
    }
    
    if (imageSrc) {
      console.log('📸 Image captured successfully, updating state...');
      setCurrentPhotoJustTaken(imageSrc);
      setCapturedImages(prev => [...prev, imageSrc]);
      
      // If auto-capture is enabled, automatically continue (don't show options)
      if (autoCaptureEnabled && capturedImages.length + 1 < getPanelCount()) {
        setShowPhotoOptions(false);
        // Reset auto-capture for next photo
        setTimeout(() => {
          autoCapture.resetCooldown();
        }, 1000); // 1 second pause between auto-captures
      } else {
        setShowPhotoOptions(true);
      }
    } else {
      console.error('❌ Failed to capture image');
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
    
    // Only reset when we're actually starting a new photo session
    if (capturedImages.length < getPanelCount()) {
      console.log('🔄 Starting next photo - resetting auto-capture');
      autoCapture.resetCooldown();
    }
    
    if (capturedImages.length >= getPanelCount()) {
      if (onComplete) {
        onComplete(capturedImages);
      }
    }
    // For auto-capture, don't call startCountdown - just wait
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
        const video = webcamRef.current.video;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const detectedFaces = await faceDetectionService.detectFaces(video);
          setFaces(detectedFaces);
          
          // Update readiness score
          const score = autoCapture.getReadinessScore(detectedFaces);
          setReadinessScore(score);
          
          // Debug the conditions
          const shouldCapture = autoCapture.shouldAutoCapture(detectedFaces);
          const conditions = {
            shouldCapture,
            showPhotoOptions,
            isCountingDown,
            capturedCount: capturedImages.length,
            maxCount: getPanelCount(),
            belowLimit: capturedImages.length < getPanelCount()
          };
          
          console.log('🔍 Auto-capture conditions:', conditions);
          
          // Check for auto-capture - only if we haven't reached the photo limit
          if (shouldCapture && 
              !isCountingDown &&
              capturedImages.length < getPanelCount() &&
              (!showPhotoOptions || autoCaptureEnabled)) {
            console.log('📸 CALLING takePhoto()...');
            
            // Clear photo options first if they're showing
            if (showPhotoOptions) {
              setShowPhotoOptions(false);
              setCurrentPhotoJustTaken('');
            }
            
            takePhoto();
          } else if (shouldCapture) {
            console.log('❌ Auto-capture blocked by conditions:', {
              showPhotoOptions: showPhotoOptions && !autoCaptureEnabled,
              isCountingDown,
              reachedLimit: capturedImages.length >= getPanelCount()
            });
          }
        }
      }
    };

    const interval = setInterval(detectFaces, 200);
    return () => clearInterval(interval);
  }, [isCountingDown, isModelLoading, autoCapture, showPhotoOptions, capturedImages.length, getPanelCount()]);

  // Add this useEffect to automatically clear photo options when auto-capture is enabled
  useEffect(() => {
    if (autoCaptureEnabled && showPhotoOptions && capturedImages.length < getPanelCount()) {
      console.log('🤖 Auto-capture enabled: clearing photo options to allow next photo');
      setShowPhotoOptions(false);
      setCurrentPhotoJustTaken('');
      // Reset auto-capture for next photo
      setTimeout(() => {
        autoCapture.resetCooldown();
      }, 500);
    }
  }, [autoCaptureEnabled, showPhotoOptions, capturedImages.length, getPanelCount()]);

  const getFilterStyle = () => {
    const filterMap: { [key: string]: string } = {
      'grayscale': 'grayscale(100%)',
      'sepia': 'sepia(100%)',
      'vintage': 'sepia(50%) contrast(120%) brightness(110%)',
      'warm': 'brightness(110%) saturate(150%) hue-rotate(15deg)',
      'cool': 'brightness(110%) saturate(80%) hue-rotate(-15deg)',
      'vivid': 'saturate(150%) contrast(120%)',
    };

    const appliedFilters = filters.map(filter => filterMap[filter] || '').filter(Boolean);
    return appliedFilters.length > 0 ? appliedFilters.join(' ') : 'none';
  };

  const toggleAutoCapture = () => {
    const newEnabled = !autoCaptureEnabled;
    setAutoCaptureEnabled(newEnabled);
    autoCapture.updateConfig({ enabled: newEnabled });
    if (!newEnabled) {
      autoCapture.resetCooldown();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">
        Take Your Photos ({capturedImages.length}/{getPanelCount()})
      </h2>
      
      {/* Add debug info */}
      <div className="text-sm text-gray-600">
        Strip Type: {stripType}, Filters: {filters.join(', ') || 'None'}
      </div>
      
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
      
      <div className="relative inline-block">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full rounded-lg max-w-md mx-auto block"
          style={{ 
            filter: !enableRealTimeEnhancement ? getFilterStyle() : 'none'
          }}
        />
        
        {/* Face overlay - positioned absolutely within the relative container */}
        {showFaceOverlay && faces.length > 0 && webcamRef.current?.video && (
          <FaceOverlay
            faces={faces}
            videoRef={{ current: webcamRef.current.video }}
            showLandmarks={showLandmarks}
            showBoundingBox={showBoundingBox}
          />
        )}
        
        {/* Canvas overlay for real-time processing - positioned over video */}
        {enableRealTimeEnhancement && faces.length > 0 && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full rounded-lg max-w-md mx-auto pointer-events-none"
            style={{
              maxWidth: '28rem',
              height: 'auto',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1
            }}
          />
        )}
        
        {/* Countdown overlay */}
        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-lg" style={{ zIndex: 3 }}>
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
              {capturedImages.length >= getPanelCount() ? 'Finish & Continue' : 'Next Photo'}
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

      {/* Auto-Capture Controls */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoCaptureEnabled}
              onChange={toggleAutoCapture}
              className="rounded"
            />
            <span className="font-medium text-yellow-800">
              🎯 Smart Auto-Capture
            </span>
          </label>
          
          {autoCaptureEnabled && (
            <div className="text-sm text-yellow-700">
              Readiness: {Math.round(readinessScore)}%
            </div>
          )}
        </div>
        
        {autoCaptureEnabled && (
          <div className="space-y-2">
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${readinessScore}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-yellow-700">
              {readinessScore > 70 ?     // Lowered from 80
                "😊 Perfect! Get ready..." : 
                readinessScore > 40 ?    // Lowered from 50
                  "😐 Almost there - smile more!" : 
                  "😕 Need better lighting or bigger smiles"
              }
            </div>
            
            <div className="text-xs text-yellow-600">
              Photos will be taken automatically when everyone is smiling and looking good!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;
