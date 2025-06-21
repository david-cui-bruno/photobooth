import React, { useState, useEffect } from 'react';
import { firebaseService, type PhotoStrip } from '../../services/firebaseService';
import LoadingSpinner from '../Common/LoadingSpinner';

interface PositionedPhotoStrip extends PhotoStrip {
  position: {
    x: number;
    y: number;
    rotation: number;
  };
}

export const BulletinBoard: React.FC = () => {
  const [photoStrips, setPhotoStrips] = useState<PositionedPhotoStrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MAX_PHOTOSTRIPS = 50;

  // Generate random position - pins stay on board, strips can hang off
  const generateRandomPosition = () => {
    // Board dimensions (accounting for padding and borders)
    const boardWidth = 1100;  
    const boardHeight = 700;  
    const topMargin = 120;    // Exclude top region (header + decorations)
    const sideMargin = 20;    // Side margins for pins
    const bottomMargin = 20;  // Bottom margin for pins
    const pinSize = 8;        // Push pin size (4px radius = 8px diameter)

    // Pin constraints - pins must stay within these boundaries
    const pinMinX = sideMargin + pinSize;
    const pinMaxX = boardWidth - sideMargin - pinSize;
    const pinMinY = topMargin + pinSize;
    const pinMaxY = boardHeight - bottomMargin - pinSize;

    // Random pin position (within safe boundaries)
    const pinX = pinMinX + (Math.random() * (pinMaxX - pinMinX));
    const pinY = pinMinY + (Math.random() * (pinMaxY - pinMinY));

    // Strip position is offset from pin position
    // Strip is centered horizontally on the pin, hangs down from pin
    const stripWidth = 120;
    const stripX = pinX - (stripWidth / 2); // Center strip on pin horizontally
    const stripY = pinY + 8; // Strip hangs down from pin

    return {
      x: stripX, // 🎯 STRIP CAN GO BEYOND BOARD EDGES
      y: stripY, // 🎯 STRIP CAN HANG OFF BOTTOM
      rotation: (Math.random() - 0.5) * 20
    };
  };

  // Shuffle array function for random selection
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    console.log('🔄 BulletinBoard: Loading photo strips...');
    
    const loadPhotoStrips = async () => {
      try {
        const allStrips = await firebaseService.getAllPhotoStrips();
        console.log('✅ Firebase: Loaded photo strips:', allStrips.length);
        
        // 🎯 RANDOM SELECTION: Shuffle all strips and take up to MAX_PHOTOSTRIPS
        const shuffledStrips = shuffleArray(allStrips);
        const selectedStrips = shuffledStrips.slice(0, MAX_PHOTOSTRIPS);
        
        // 🎯 RANDOM POSITIONING: Give each selected strip a random position
        const positionedStrips = selectedStrips.map((strip) => ({
          ...strip,
          position: generateRandomPosition() // NEW RANDOM POSITION EVERY TIME
        }));
        
        setPhotoStrips(positionedStrips);
        setError(null);
      } catch (err) {
        console.error('❌ Firebase: Failed to load photo strips:', err);
        setError(`Failed to load: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadPhotoStrips();
  }, []); // 🎯 RUNS ON EVERY PAGE REFRESH

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading bulletin board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Photo Strip Bulletin Board</h1>
        <p className="text-gray-600">A community board for sharing memories!</p>
        <p className="text-amber-600 text-sm mt-2">
          Showing {photoStrips.length} random photo strips (refresh for new selection!)
        </p>
      </div>

      {/* Bulletin Board - Remove overflow-hidden to allow hanging */}
      <div className="relative mx-auto max-w-6xl">
        <div 
          className="relative w-full bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 rounded-lg shadow-2xl border-8 border-amber-900" // 🎯 REMOVED overflow-hidden
          style={{ 
            minHeight: '800px',
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(160, 82, 45, 0.1) 0%, transparent 50%),
              linear-gradient(45deg, rgba(139, 69, 19, 0.05) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(160, 82, 45, 0.05) 25%, transparent 25%)
            `,
            backgroundSize: '40px 40px, 40px 40px, 20px 20px, 20px 20px'
          }}
        >
          {/* Board Header */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-yellow-100 px-6 py-2 rounded shadow-md border-2 border-yellow-300">
              <h2 className="text-xl font-bold text-amber-900">Community Photo Strips</h2>
            </div>
          </div>

          {/* Push Pins Decoration */}
          <div className="absolute top-6 left-6 w-3 h-3 bg-red-500 rounded-full shadow-md"></div>
          <div className="absolute top-6 right-6 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
          <div className="absolute top-20 left-12 w-3 h-3 bg-green-500 rounded-full shadow-md"></div>
          <div className="absolute top-20 right-12 w-3 h-3 bg-yellow-500 rounded-full shadow-md"></div>

          {photoStrips.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white/80 p-8 rounded-lg shadow-lg">
                <p className="text-amber-800 text-lg font-medium">No photo strips yet!</p>
                <p className="text-amber-600 text-sm mt-2">Create a photo strip and share it here!</p>
              </div>
            </div>
          ) : (
            /* Photo Strips Can Hang Off Board */
            photoStrips.map(strip => (
              <div
                key={`${strip.id}-${strip.position.x}-${strip.position.y}`}
                className="absolute transition-all duration-300 hover:scale-110 hover:z-20 cursor-pointer group"
                style={{
                  left: `${strip.position.x}px`, // 🎯 CAN BE NEGATIVE OR > BOARD WIDTH
                  top: `${strip.position.y}px`,  // 🎯 CAN EXTEND BEYOND BOARD HEIGHT
                  transform: `rotate(${strip.position.rotation}deg)`,
                  width: '120px'
                }}
              >
                {/* Push Pin - ALWAYS stays within board boundaries */}
                <div 
                  className="absolute w-4 h-4 rounded-full shadow-lg z-10 group-hover:scale-125 transition-transform"
                  style={{
                    // 🎯 PIN POSITION: Always centered on strip and within board
                    left: '50%',
                    top: '-8px', // Pin is above the strip
                    transform: 'translateX(-50%)',
                    backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][
                      Math.floor(Math.random() * 7)
                    ]
                  }}
                ></div>
                
                {/* Photo Strip - Can hang off board */}
                <div className="rounded shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group-hover:brightness-110">
                  <img 
                    src={strip.imageData}
                    alt={strip.title}
                    className="w-full h-auto object-contain rounded"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
