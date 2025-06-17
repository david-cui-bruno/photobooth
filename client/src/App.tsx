import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PhotoBooth from './components/PhotoBooth/Photobooth.tsx';
import PhotoEditor from './components/PhotoEditor/PhotoEditor.tsx';
import Navbar from './components/Navbar.tsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<PhotoBooth />} />
            <Route path="/editor" element={<PhotoEditor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
