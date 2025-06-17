interface StripSelectorProps {
  onSelect: (type: string) => void;
  selectedType?: string;
}

const StripSelector = ({ onSelect, selectedType }: StripSelectorProps) => {
  const stripTypes = ['2 Panel', '4 Panel', '6 Panel'];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Select Photo Strip Type</h2>
      <div className="grid grid-cols-3 gap-4">
        {stripTypes.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedType === type
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-lg font-semibold">{type}</div>
            {selectedType === type && (
              <div className="text-sm text-blue-600 mt-1">✓ Selected</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StripSelector;
