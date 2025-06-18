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
      {/* Image */}
      <div className="aspect-w-3 aspect-h-4">
        <img 
          src={photoStrip.imageData} 
          alt={photoStrip.title}
          className="w-full h-64 object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
          {photoStrip.title}
        </h3>
        
        {photoStrip.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {photoStrip.description}
          </p>
        )}
        
        {/* Tags */}
        {photoStrip.tags && photoStrip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {photoStrip.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {photoStrip.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{photoStrip.tags.length - 3} more</span>
            )}
          </div>
        )}
        
        {/* Meta info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="capitalize">{photoStrip.stripType}</span>
          <span>{formatDate(photoStrip.createdAt)}</span>
        </div>
        
        {photoStrip.author && (
          <p className="text-sm text-gray-600 mb-3">
            by <span className="font-medium">{photoStrip.author}</span>
          </p>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onLike(photoStrip.id)}
            className="flex items-center space-x-1 text-pink-500 hover:text-pink-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>{photoStrip.likes}</span>
          </button>
          
          <div className="text-xs text-gray-400">
            {photoStrip.frameType}
          </div>
        </div>
      </div>
    </div>
  );
};
