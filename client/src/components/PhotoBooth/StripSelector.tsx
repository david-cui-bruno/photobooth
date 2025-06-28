interface StripSelectorProps {
  onSelect: (type: string) => void;
  selectedType?: string;
}

const StripSelector = ({ onSelect, selectedType }: StripSelectorProps) => {
  const stripTypes = [
    { 
      id: '2 Panel', 
      name: '2 Panel', 
      description: 'Quick & Simple',
      icon: '📸📸'
    },
    { 
      id: '4 Panel', 
      name: '4 Panel', 
      description: 'Classic Style',
      icon: '📸📸📸📸'
    },
    { 
      id: '6 Panel', 
      name: '6 Panel', 
      description: 'Extended Fun',
      icon: '📸📸📸📸📸📸'
    }
  ];

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
        Select Photo Strip Type
      </h2>
      {/* Mobile: stack vertically, Tablet+: 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
        {stripTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`p-4 sm:p-6 border-2 rounded-lg transition-all text-center touch-manipulation min-h-[120px] sm:min-h-[140px] ${
              selectedType === type.id
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105 sm:scale-100'
                : 'border-gray-300 hover:bg-gray-50 active:bg-gray-100 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl sm:text-3xl mb-2">{type.icon}</div>
            <div className="text-lg sm:text-xl font-semibold mb-1">{type.name}</div>
            <div className="text-xs sm:text-sm text-gray-500">{type.description}</div>
            {selectedType === type.id && (
              <div className="text-sm text-blue-600 mt-2 font-medium">✓ Selected</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StripSelector;
