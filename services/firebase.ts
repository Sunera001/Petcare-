import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCOMzjgONaUbQfqLbntZIEFihF7Tw7U1g",
  authDomain: "pet-care-cfafe.firebaseapp.com",
  projectId: "pet-care-cfafe",
  storageBucket: "pet-care-cfafe.firebasestorage.app",
  messagingSenderId: "391033155258",
  appId: "1:391033155258:web:d8ed091acec777814e5c83",
  measurementId: "G-DKM8ZZHV93"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
