import React, { useState, useEffect } from 'react';
import { bulletinService } from '../../services/bulletinService';
import type { PhotoStrip } from '../../types/PhotoStrip';
import { PhotoStripCard } from './PhotoStripCard';
import LoadingSpinner from '../Common/LoadingSpinner';

export const BulletinBoard: React.FC = () => {
  const [photoStrips, setPhotoStrips] = useState<PhotoStrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPhotoStrips();
  }, []);

  const loadPhotoStrips = async () => {
    try {
      setLoading(true);
      const strips = await bulletinService.getAllPhotoStrips();
      setPhotoStrips(strips);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photo strips');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const updatedStrip = await bulletinService.likePhotoStrip(id);
      setPhotoStrips(prev => 
        prev.map(strip => strip.id === id ? updatedStrip : strip)
      );
    } catch (err) {
      console.error('Failed to like photo strip:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={loadPhotoStrips}
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
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Photo Strip Bulletin</h1>
        <p className="text-gray-600">Share and discover amazing photo strips!</p>
      </div>

      {photoStrips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No photo strips yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photoStrips.map(strip => (
            <PhotoStripCard 
              key={strip.id} 
              photoStrip={strip} 
              onLike={handleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
};
