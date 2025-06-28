import { useState } from 'react';
import StripSelector from './StripSelector';
import FilterSelector from './FilterSelector';
import Camera from './Camera';
import FrameSelector from './FrameSelector';
import InfoModal from '../Common/InfoModal';

const PhotoBooth = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stripType, setStripType] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedFrame, setSelectedFrame] = useState('');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImagesComplete = (images: string[]) => {
    console.log('📸 Images complete received:', images.length);
    setCapturedImages(images);
    
    // Automatically advance to frame selection step
    setTimeout(() => {
      setCurrentStep(4);
    }, 500);
  };

  const handleCreateNewStrip = () => {
    // Reset all states and go back to step 1
    setCurrentStep(1);
    setStripType('');
    setSelectedFilters([]);
    setSelectedFrame('');
    setCapturedImages([]);
  };

  const steps = [
    { 
      id: 1, 
      component: <StripSelector onSelect={setStripType} selectedType={stripType} />
    },
    { 
      id: 2, 
      component: <FilterSelector onSelect={setSelectedFilters} />
    },
    { 
      id: 3, 
      component: <Camera 
        stripType={stripType} 
        filters={selectedFilters} 
        onComplete={handleImagesComplete}
      />
    },
    { 
      id: 4, 
      component: <FrameSelector 
        onSelect={setSelectedFrame}
        images={capturedImages}
        stripType={stripType}
        filters={selectedFilters}
      />
    },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1: return stripType !== '';
      case 2: return true; // Filters are optional
      case 3: return capturedImages.length > 0;
      case 4: return false; // Last step
      default: return false;
    }
  };

  const stepNames = ['Strip Type', 'Filters', 'Photos', 'Frames'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
        {/* Progress indicator - responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium ${
                    currentStep >= step.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                <span className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
                  {stepNames[step.id - 1]}
                </span>
              </div>
            ))}
          </div>
          
          {/* Mobile step indicator */}
          <div className="block sm:hidden text-center">
            <span className="text-sm text-gray-600">
              Step {currentStep}: {stepNames[currentStep - 1]}
            </span>
          </div>
        </div>
        
        {steps[currentStep - 1].component}
        
        {/* Show selected frame information */}
        {selectedFrame && currentStep === 4 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-700 text-sm sm:text-base">
              Selected frame: <span className="font-semibold">{selectedFrame}</span>
            </p>
          </div>
        )}
        
        {/* Navigation buttons - responsive */}
        <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 order-2 sm:order-1"
          >
            ← Back
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
            {/* Create Another Strip button - only show on final step */}
            {currentStep === 4 && (
              <button
                onClick={handleCreateNewStrip}
                className="w-full sm:w-auto px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold"
              >
                🎬 Create Another Strip
              </button>
            )}
            
            {/* Next button - only show if not on final step */}
            {currentStep < 4 && (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                {currentStep === 3 && capturedImages.length > 0 ? 'Continue to Frames →' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
};

export default PhotoBooth;
