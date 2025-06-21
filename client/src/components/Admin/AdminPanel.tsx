import React, { useState, useEffect } from 'react';
import { firebaseService, type PhotoStrip } from '../../services/firebaseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import { auth } from '../../services/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth';

export const AdminPanel: React.FC = () => {
  const [photoStrips, setPhotoStrips] = useState<PhotoStrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 🎯 REPLACE WITH YOUR ADMIN EMAIL
  const ADMIN_EMAIL = 'davidcui824@gmail.com'; // Change this to your email

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setUser(user);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadPhotoStrips = async () => {
    try {
      setLoading(true);
      const strips = await firebaseService.getAllPhotoStrips();
      setPhotoStrips(strips);
      setError(null);
    } catch (err) {
      console.error('Failed to load photo strips:', err);
      setError('Failed to load photo strips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadPhotoStrips();
    }
  }, [isOpen, user]);

  const handleLogin = async () => {
    try {
      setLoginError('');
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone!`)) {
      try {
        setDeleting(id);
        await firebaseService.deletePhotoStrip(id);
        setPhotoStrips(prev => prev.filter(strip => strip.id !== id));
        alert('Photo strip deleted successfully!');
      } catch (err) {
        console.error('Failed to delete photo strip:', err);
        alert('Failed to delete photo strip');
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL photo strips? This cannot be undone!')) {
      if (window.confirm('This will permanently delete all photo strips. Are you absolutely sure?')) {
        try {
          setLoading(true);
          await firebaseService.deleteAllPhotoStrips();
          setPhotoStrips([]);
          alert('All photo strips deleted successfully!');
        } catch (err) {
          console.error('Failed to delete all photo strips:', err);
          alert('Failed to delete all photo strips');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Show nothing while checking auth
  if (authLoading) {
    return null;
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors"
          >
            🔐 Admin
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-2xl p-6 w-80">
            <h3 className="text-lg font-bold mb-4">Admin Login</h3>
            
            {loginError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                {loginError}
              </div>
            )}
            
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin email"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Password"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleLogin}
                disabled={!email || !password}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsOpen(false); 
                  setEmail(''); 
                  setPassword(''); 
                  setLoginError('');
                }}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show admin panel if authenticated
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors"
        >
          🔐 Admin Panel
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">🔐 Admin Panel - Manage Photo Strips</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {user.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-700 rounded hover:bg-red-800 text-sm"
            >
              Logout
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Stats and Actions */}
          <div className="flex justify-between items-center mb-4 p-4 bg-gray-100 rounded">
            <div>
              <p className="text-lg font-semibold">Total Photo Strips: {photoStrips.length}</p>
              <p className="text-sm text-gray-600">Manage all uploaded photo strips</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadPhotoStrips}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={loading || photoStrips.length === 0}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                🗑️ Delete All
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
              <span className="ml-2">Loading photo strips...</span>
            </div>
          ) : (
            /* Photo Strips List */
            <div className="max-h-96 overflow-y-auto">
              {photoStrips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No photo strips found
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photoStrips.map(strip => (
                    <div key={strip.id} className="border rounded-lg p-3 bg-gray-50">
                      {/* Thumbnail */}
                      <div className="mb-2">
                        <img 
                          src={strip.imageData}
                          alt={strip.title}
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-sm truncate">{strip.title}</h3>
                        <p className="text-xs text-gray-600">
                          {strip.stripType} • {strip.frameType}
                        </p>
                        {strip.author && (
                          <p className="text-xs text-gray-600">by {strip.author}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(strip.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(strip.id, strip.title)}
                        disabled={deleting === strip.id}
                        className="w-full px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === strip.id ? '🔄 Deleting...' : '🗑️ Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 