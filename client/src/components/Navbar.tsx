import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-800">
            PhotoBooth
          </Link>
          <div className="flex space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              PhotoBooth
            </Link>
            <Link to="/editor" className="text-gray-600 hover:text-gray-900">
              Photo Editor
            </Link>
            <Link to="/bulletin" className="text-gray-600 hover:text-gray-900">
              Bulletin Board
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
