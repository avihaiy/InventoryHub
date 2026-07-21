import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgZ4KnOn9R7hui8nYKJXLSHGb5g_2wUpk",
  authDomain: "inventoryhub-67ab4.firebaseapp.com",
  projectId: "inventoryhub-67ab4",
  storageBucket: "inventoryhub-67ab4.firebasestorage.app",
  messagingSenderId: "443491318101",
  appId: "1:443491318101:web:1d689209919c8eba2e97dc",
  measurementId: "G-VMZ3XCXMG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence (cache data locally so it works without internet!)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firebase persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firebase persistence not supported in this browser');
  }
});

export { db };
