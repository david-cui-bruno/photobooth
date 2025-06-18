import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PhotoBooth from './components/PhotoBooth/PhotoBooth.tsx';
import PhotoEditor from './components/PhotoEditor/PhotoEditor.tsx';
import Navbar from './components/Navbar.tsx';
import LoadingSpinner from './components/Common/LoadingSpinner';

const PhotoBoothLazy = lazy(() => import('./components/PhotoBooth/PhotoBooth.tsx'));
const PhotoEditorLazy = lazy(() => import('./components/PhotoEditor/PhotoEditor.tsx'));

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              <Suspense fallback={<LoadingSpinner message="Loading PhotoBooth..." />}>
                <PhotoBoothLazy />
              </Suspense>
            } />
            <Route path="/editor" element={
              <Suspense fallback={<LoadingSpinner message="Loading PhotoEditor..." />}>
                <PhotoEditorLazy />
              </Suspense>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
