import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace this with YOUR Firebase config from the console
const firebaseConfig = {
    apiKey: "AIzaSyD8LRyqfwiCJYPYbjIo4SpVYy1giYc50Iw",
    authDomain: "photobooth-app-d4d72.firebaseapp.com",
    projectId: "photobooth-app-d4d72",
    storageBucket: "photobooth-app-d4d72.firebasestorage.app",
    messagingSenderId: "257719230399",
    appId: "1:257719230399:web:74c42ffb05ffacc3d80b0a"  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (no storage)
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;