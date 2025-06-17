import { useState } from 'react';

interface FilterSelectorProps {
  onSelect: (filters: string[]) => void;
}

const FilterSelector = ({ onSelect }: FilterSelectorProps) => {
  const filters = [
    { id: 'grayscale', name: 'Grayscale', preview: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', preview: 'sepia(100%)' },
    { id: 'vintage', name: 'Vintage', preview: 'sepia(50%) contrast(120%)' },
    { id: 'warm', name: 'Warm', preview: 'brightness(110%) saturate(150%)' },
    { id: 'cool', name: 'Cool', preview: 'brightness(110%) saturate(80%)' },
    { id: 'vivid', name: 'Vivid', preview: 'saturate(150%) contrast(120%)' },
    { id: 'face-enhance', name: 'Face Enhance', preview: 'brightness(110%)' },
    { id: 'background-blur', name: 'Background Blur', preview: 'blur(2px)' },
    { id: 'background-bw', name: 'Background B&W', preview: 'grayscale(50%)' },
    { id: 'portrait-mode', name: 'Portrait Mode', preview: 'contrast(120%)' },
  ];

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleFilterSelect = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(id => id !== filterId)
      : [...selectedFilters, filterId];
    
    setSelectedFilters(newFilters);
    onSelect(newFilters);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Select Filters</h2>
      <p className="text-gray-600 mb-4">
        Selected: {selectedFilters.length === 0 ? 'None' : selectedFilters.map(id => filters.find(f => f.id === id)?.name).join(', ')}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterSelect(filter.id)}
            className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-all ${
              selectedFilters.includes(filter.id) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300'
            }`}
          >
            <div 
              className="w-full h-24 mb-2 rounded bg-gradient-to-r from-gray-200 to-gray-300"
              style={{ filter: filter.preview }}
            >
              {/* Placeholder for filter preview */}
            </div>
            <span className="block text-center font-medium">{filter.name}</span>
            {selectedFilters.includes(filter.id) && (
              <div className="text-blue-600 text-sm mt-1">✓ Selected</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterSelector;
