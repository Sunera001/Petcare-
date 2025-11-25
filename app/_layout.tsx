import { Slot, SplashScreen } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { setUser } from '../store/slices/authSlice';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            store.dispatch(setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              fullName: userData.fullName || '',
              role: userData.role || 'owner',
              phoneNumber: userData.phoneNumber || '',
              createdAt: userData.createdAt || new Date().toISOString(),
            }));
          } else {
            // User document doesn't exist, sign out
            store.dispatch(setUser(null));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          store.dispatch(setUser(null));
        }
      } else {
        // User is signed out
        store.dispatch(setUser(null));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
            <ActivityIndicator size="large" color="#0EA5E9" />
          </View>
        }
        persistor={persistor}
      >
        <Slot />
      </PersistGate>
    </Provider>
  );
}
