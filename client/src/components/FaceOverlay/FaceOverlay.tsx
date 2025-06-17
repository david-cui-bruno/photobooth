import React, { useEffect, useState } from 'react';
import type { FaceData } from '../../services/faceDetectionService';

interface FaceOverlayProps {
  faces: FaceData[];
  videoRef: React.RefObject<HTMLVideoElement>;
  showLandmarks?: boolean;
  showBoundingBox?: boolean;
}

const FaceOverlay: React.FC<FaceOverlayProps> = ({ 
  faces, 
  videoRef, 
  showLandmarks = true, 
  showBoundingBox = true 
}) => {
  // Store the video element's position and size on the page
  const [videoRect, setVideoRect] = useState<DOMRect | null>(null);
  
  // Store scaling factors for coordinate conversion
  const [dimensions, setDimensions] = useState({
    scaleX: 1,
    scaleY: 1,
    displayWidth: 0,
    displayHeight: 0,
    offsetX: 0,
    offsetY: 0
  });

  useEffect(() => {
    const updateVideoRect = () => {
      if (!videoRef.current) return;
      
      const video = videoRef.current;
      const { videoWidth, videoHeight, clientWidth, clientHeight } = video;
      
      // Skip if video dimensions aren't ready
      if (videoWidth === 0 || videoHeight === 0) return;
      
      // Get the actual position of the video element in the viewport
      const rect = video.getBoundingClientRect();
      setVideoRect(rect);
      
      // Calculate how the video is actually displayed within its container
      // Videos maintain aspect ratio, so they might not fill the entire container
      const videoAspectRatio = videoWidth / videoHeight;
      const containerAspectRatio = clientWidth / clientHeight;
      
      let displayWidth, displayHeight, offsetX = 0, offsetY = 0;
      
      if (videoAspectRatio > containerAspectRatio) {
        // Video is wider than container - video fills width, has empty space top/bottom
        displayWidth = clientWidth;
        displayHeight = clientWidth / videoAspectRatio;
        offsetY = (clientHeight - displayHeight) / 2; // Center vertically
      } else {
        // Video is taller than container - video fills height, has empty space left/right
        displayHeight = clientHeight;
        displayWidth = clientHeight * videoAspectRatio;
        offsetX = (clientWidth - displayWidth) / 2; // Center horizontally
      }
      
      // Calculate scale factors to convert face detection coordinates to display coordinates
      const scaleX = displayWidth / videoWidth;
      const scaleY = displayHeight / videoHeight;
      
      setDimensions({
        scaleX,
        scaleY,
        displayWidth,
        displayHeight,
        offsetX,
        offsetY
      });
      
      console.log('Video Debug Info:', {
        videoWidth,
        videoHeight,
        clientWidth,
        clientHeight,
        displayWidth,
        displayHeight,
        scaleX,
        scaleY,
        offsetX,
        offsetY,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      });
    };

    // Update video rect when component mounts and periodically
    updateVideoRect();
    const interval = setInterval(updateVideoRect, 100);
    
    return () => clearInterval(interval);
  }, [videoRef]);

  // Don't render if we don't have the necessary data
  if (!videoRef.current || faces.length === 0 || !videoRect) return null;

  const { scaleX, scaleY, offsetX, offsetY } = dimensions;

  return (
    // 🔧 FIX: Position the overlay exactly where the video is
    <div 
      className="fixed pointer-events-none z-10"
      style={{
        left: videoRect.left + window.scrollX,  // Video's X position + scroll
        top: videoRect.top + window.scrollY,   // Video's Y position + scroll  
        width: videoRect.width,                // Match video's display width
        height: videoRect.height,              // Match video's display height
        // Remove debug border once it works
        // border: '2px solid blue',
      }}
    >
      <svg width="100%" height="100%" className="absolute inset-0">
        {faces.map((face, index) => {
          const { detection, landmarks } = face;
          const box = detection.box;
          
          // Convert face detection coordinates to display coordinates
          // Face detection gives us coordinates in the video's native resolution
          // We need to scale them to match the displayed video size
          const x = (box.x * scaleX) + offsetX;
          const y = (box.y * scaleY) + offsetY;
          const width = box.width * scaleX;
          const height = box.height * scaleY;
          
          // Debug: Log the first face's coordinates
          if (index === 0) {
            console.log('Face Coordinates:', {
              original: { x: box.x, y: box.y, width: box.width, height: box.height },
              scaled: { x, y, width, height },
              scaleFactors: { scaleX, scaleY },
              offsets: { offsetX, offsetY }
            });
          }
          
          return (
            <g key={face.id}>
              {/* Face bounding box - green rectangle around detected face */}
              {showBoundingBox && (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill="none"
                  stroke="#00ff00"
                  strokeWidth="2"
                  rx="8"
                />
              )}
              
              {/* Face landmarks - red dots on facial features (68 points) */}
              {showLandmarks && landmarks.positions.map((point, i) => (
                <circle
                  key={i}
                  cx={(point.x * scaleX) + offsetX}
                  cy={(point.y * scaleY) + offsetY}
                  r="1.5"
                  fill="#ff0000"
                  opacity="0.8"
                />
              ))}
              
              {/* Face number label - green text above bounding box */}
              <text
                x={x + 5}
                y={y - 5}
                fill="#00ff00"
                fontSize="14"
                fontWeight="bold"
              >
                Face {index + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default FaceOverlay;
