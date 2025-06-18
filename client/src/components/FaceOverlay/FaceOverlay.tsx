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
  const [dimensions, setDimensions] = useState({
    scaleX: 1,
    scaleY: 1,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (!videoRef.current) return;
      
      const video = videoRef.current;
      const { videoWidth, videoHeight, clientWidth, clientHeight } = video;
      
      if (videoWidth === 0 || videoHeight === 0) return;
      
      // Simple scaling - match what the video display actually shows
      const scaleX = clientWidth / videoWidth;
      const scaleY = clientHeight / videoHeight;
      
      setDimensions({ scaleX, scaleY });
    };

    updateDimensions();
    const interval = setInterval(updateDimensions, 100);
    
    return () => clearInterval(interval);
  }, [videoRef]);

  if (!videoRef.current || faces.length === 0) return null;

  const { scaleX, scaleY } = dimensions;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg width="100%" height="100%" className="absolute inset-0">
        {faces.map((face, index) => {
          const { detection, landmarks } = face;
          const box = detection.box;
          
          // Simple coordinate scaling - no offsets needed
          const x = box.x * scaleX;
          const y = box.y * scaleY;
          const width = box.width * scaleX;
          const height = box.height * scaleY;
          
          return (
            <g key={face.id}>
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
              
              {showLandmarks && landmarks.positions.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x * scaleX}
                  cy={point.y * scaleY}
                  r="1.5"
                  fill="#ff0000"
                  opacity="0.8"
                />
              ))}
              
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
