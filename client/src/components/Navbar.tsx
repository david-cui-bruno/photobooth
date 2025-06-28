import { Link } from 'react-router-dom';
import { useState } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-800">
            📸 PhotoBooth
          </Link>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-600 hover:text-gray-900 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          
          {/* Desktop menu */}
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              PhotoBooth
            </Link>
            <Link to="/editor" className="text-gray-600 hover:text-gray-900 transition-colors">
              Photo Editor
            </Link>
            <Link to="/bulletin" className="text-gray-600 hover:text-gray-900 transition-colors">
              Bulletin Board
            </Link>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2 pt-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-900 py-2 px-2 rounded hover:bg-gray-100 transition-colors" 
                onClick={() => setIsMenuOpen(false)}
              >
                📸 PhotoBooth
              </Link>
              <Link 
                to="/editor" 
                className="text-gray-600 hover:text-gray-900 py-2 px-2 rounded hover:bg-gray-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ✏️ Photo Editor
              </Link>
              <Link 
                to="/bulletin" 
                className="text-gray-600 hover:text-gray-900 py-2 px-2 rounded hover:bg-gray-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                📌 Bulletin Board
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
