import React, { useState } from 'react';
import { firebaseService } from '../../services/firebaseService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoStripData: {
    imageData: string;
    stripType: '2-panel' | '4-panel' | '6-panel';
    frameType: string;
  };
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, photoStripData }) => {
  const [formData, setFormData] = useState({
    description: '',
    names: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [finalPhotoStrip, setFinalPhotoStrip] = useState<string>('');

  const addTextToPhotoStrip = (imageData: string, description: string, names: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx!.drawImage(img, 0, 0);
        
        // Add text if provided
        if (description || names) {
          ctx!.fillStyle = 'white';
          ctx!.strokeStyle = 'black';
          ctx!.lineWidth = 3;
          
          let yPosition = img.height - 60; // Start from bottom
          
          // Add description
          if (description) {
            ctx!.font = 'bold 28px "Comic Sans MS", cursive';
            ctx!.textAlign = 'left';
            ctx!.strokeText(description, 20, yPosition);
            ctx!.fillText(description, 20, yPosition);
            yPosition += 35;
          }
          
          // Add names (smaller font)
          if (names) {
            ctx!.font = '20px "Arial", sans-serif';
            ctx!.strokeText(names, 20, yPosition);
            ctx!.fillText(names, 20, yPosition);
          }
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      
      img.src = imageData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔄 Starting photo strip submission...');
      console.log('📊 Photo strip data:', {
        stripType: photoStripData.stripType,
        frameType: photoStripData.frameType,
        imageDataLength: photoStripData.imageData.length,
        description: formData.description,
        names: formData.names
      });

      const finalImage = await addTextToPhotoStrip(
        photoStripData.imageData, 
        formData.description, 
        formData.names
      );
      
      console.log('✅ Text added to photo strip');
      setFinalPhotoStrip(finalImage);

      const title = formData.description || 'Photo Strip';
      
      // Clean the data - don't pass undefined values
      const submitData = {
        title,
        imageData: finalImage,
        stripType: photoStripData.stripType,
        frameType: photoStripData.frameType,
        // Only include optional fields if they have values
        ...(formData.description && formData.description.trim() && { 
          description: formData.description.trim() 
        }),
        ...(formData.names && formData.names.trim() && { 
          author: formData.names.trim() 
        })
      };

      console.log('📤 Submitting to Firebase:', {
        ...submitData,
        imageData: `[${finalImage.length} chars]` // Don't log full image data
      });

      await firebaseService.createPhotoStrip(submitData);

      console.log('🎉 Successfully created photo strip!');
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ description: '', names: '' });
        setFinalPhotoStrip('');
      }, 3000);
    } catch (error) {
      console.error('❌ Failed to share photo strip:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Check if it's a Firebase-specific error
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('Firebase error code:', (error as any).code);
        console.error('Firebase error message:', (error as any).message);
      }
      
      alert(`Failed to share photo strip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📌 Pin to Bulletin Board</h2>
        
        {success ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-6xl mb-4">📌</div>
            <p className="text-lg font-medium">Successfully pinned to the board!</p>
            <p className="text-sm text-gray-600 mt-2">Your photo strip is now on the bulletin board!</p>
            {finalPhotoStrip && (
              <div className="mt-4 relative">
                <div className="inline-block bg-amber-100 p-4 rounded-lg">
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
                  <img 
                    src={finalPhotoStrip} 
                    alt="Pinned strip" 
                    className="max-w-32 h-auto rounded shadow-lg transform rotate-2"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="What's happening in this photo strip?"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name(s) (optional)
              </label>
              <input
                type="text"
                value={formData.names}
                onChange={(e) => setFormData(prev => ({ ...prev, names: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Who's in the photo?"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? 'Pinning...' : '📌 Pin to Board'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
