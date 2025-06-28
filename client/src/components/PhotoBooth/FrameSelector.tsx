import { useState, useEffect } from 'react';
import { generatePhotoStrip } from '../../utils/stripGenerator';
import { ShareModal } from './ShareModal';
import firebaseService from '../../services/firebaseService';

// Import Chikawa images
import chikawa1 from '../../assets/ChiikawaFrame/chikawa1.png';
import chikawa2 from '../../assets/ChiikawaFrame/chikawa2.png';
import usagi1 from '../../assets/ChiikawaFrame/usagi1.png';

interface FrameSelectorProps {
  onSelect: (frame: string) => void;
  images?: string[];
  stripType?: string;
  filters?: string[];
}

const FrameSelector = ({ onSelect, images = [], stripType = '4 Panel', filters: _filters = [] }: FrameSelectorProps) => {
  const [finalStrip, setFinalStrip] = useState<string>('');
  const [selectedFrame, setSelectedFrame] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const frames = [
    { 
      id: 'classic', 
      name: 'Classic', 
      preview: 'border-4 border-black bg-white', 
      description: 'Clean black border' 
    },
    { 
      id: 'vintage', 
      name: 'Vintage', 
      preview: 'border-4 border-yellow-800 bg-yellow-50', 
      description: 'Warm vintage style' 
    },
    { 
      id: 'modern', 
      name: 'Modern', 
      preview: 'border-2 border-gray-300 bg-gray-50', 
      description: 'Minimal modern look' 
    },
    { 
      id: 'colorful', 
      name: 'Colorful', 
      preview: 'border-4 border-blue-500 bg-white', 
      description: 'Bright and fun' 
    },
    { 
      id: 'chikawa', 
      name: 'Chikawa', 
      preview: 'border-4 border-pink-400 bg-pink-50', 
      description: 'Cute Chikawa characters',
      isSpecial: true
    },
  ];

  useEffect(() => {
    if (images.length > 0 && selectedFrame) {
      setIsGenerating(true);
      generatePhotoStrip(images, stripType, selectedFrame)
        .then(setFinalStrip)
        .finally(() => setIsGenerating(false));
    }
  }, [images, stripType, selectedFrame]);

  const handleFrameSelect = (frameId: string) => {
    setSelectedFrame(frameId);
    onSelect(frameId);
  };

  const downloadStrip = () => {
    if (finalStrip) {
      const link = document.createElement('a');
      link.download = `photostrip-${selectedFrame}-${Date.now()}.jpg`;
      link.href = finalStrip;
      link.click();
    }
  };

  const handleShare = () => {
    if (finalStrip && selectedFrame) {
      setShowShareModal(true);
    }
  };

  const testFirebase = async () => {
    console.log('🧪 Testing Firebase connection...');
    try {
      const success = await firebaseService.testConnection();
      if (success) {
        alert('✅ Firebase connection successful!');
      } else {
        alert('❌ Firebase connection failed - check console for details');
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('❌ Firebase test error - check console');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Select Frame & Download</h2>
      
      {selectedFrame && (
        <p className="text-green-600 mb-4">
          ✓ Selected: {frames.find(f => f.id === selectedFrame)?.name}
          {selectedFrame === 'chikawa' && ' 🐾'}
        </p>
      )}
      
      {isGenerating && (
        <div className="text-center py-4">
          <p className="text-blue-600">Generating your photo strip...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-2"></div>
        </div>
      )}
      
      {finalStrip && !isGenerating && (
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-gray-100 rounded-lg">
            <img 
              src={finalStrip} 
              alt="Final Strip" 
              className="mx-auto rounded-lg shadow-lg max-w-xs"
            />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={downloadStrip}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-lg font-semibold"
            >
              📥 Download Photo Strip
            </button>
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg font-semibold"
            >
              📤 Share to Bulletin Board
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <button
          onClick={testFirebase}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          🧪 Test Firebase Connection
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {frames.map((frame) => (
          <button
            key={frame.id}
            onClick={() => handleFrameSelect(frame.id)}
            className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-all ${
              selectedFrame === frame.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300'
            } ${frame.isSpecial ? 'ring-2 ring-pink-200' : ''}`}
          >
            <div className={`w-full h-24 mb-2 rounded ${frame.preview} flex items-center justify-center relative overflow-hidden`}>
              {frame.id === 'chikawa' ? (
                <div className="flex space-x-1">
                  <img src={chikawa1} alt="Chikawa" className="w-6 h-6 object-contain" />
                  <img src={usagi1} alt="Usagi" className="w-6 h-6 object-contain" />
                  <img src={chikawa2} alt="Chikawa 2" className="w-6 h-6 object-contain" />
                </div>
              ) : (
                <span className="text-xs text-gray-600">Preview</span>
              )}
            </div>
            <span className="block text-center font-medium">{frame.name}</span>
            <span className="block text-center text-xs text-gray-500 mt-1">{frame.description}</span>
            {selectedFrame === frame.id && (
              <div className="text-blue-600 text-sm mt-2">✓ Selected</div>
            )}
          </button>
        ))}
      </div>

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          photoStripData={{
            imageData: finalStrip,
            stripType: stripType as '2-panel' | '4-panel' | '6-panel',
            frameType: selectedFrame
          }}
        />
      )}
    </div>
  );
};

export default FrameSelector;