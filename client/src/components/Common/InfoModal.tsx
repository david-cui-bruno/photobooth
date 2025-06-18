interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal = ({ isOpen, onClose }: InfoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md mx-4">
        <h3 className="text-xl font-bold mb-4">🤖 AI-Powered PhotoBooth</h3>
        <ul className="space-y-2 text-sm mb-6">
          <li>✨ Real-time face enhancement</li>
          <li>😊 Smart emotion-based auto-capture</li>
          <li>🎯 68-point facial landmark detection</li>
          <li>🖼️ Custom frames and filters</li>
        </ul>
        <button 
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default InfoModal;
