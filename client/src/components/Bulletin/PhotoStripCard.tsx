import React from 'react';
import type { PhotoStrip } from '../../types/PhotoStrip';

interface PhotoStripCardProps {
  photoStrip: PhotoStrip;
  onLike: (id: string) => void;
}

export const PhotoStripCard: React.FC<PhotoStripCardProps> = ({ photoStrip, onLike }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Full-length Photo Strip - No Footer */}
      <div className="w-full">
        <img 
          src={photoStrip.imageData}
          alt={photoStrip.title}
          className="w-full h-auto object-contain cursor-pointer"
          onClick={() => onLike(photoStrip.id)} // Make entire image clickable to like
        />
      </div>
    </div>
  );
};
