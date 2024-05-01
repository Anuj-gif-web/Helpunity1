// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence,getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChZuO8bU5yIndByodLwETLKFXKS4kJmSA",
  authDomain: "helpunity-eed68.firebaseapp.com",
  projectId: "helpunity-eed68",
  storageBucket: "helpunity-eed68.appspot.com",
  messagingSenderId: "504075592698",
  appId: "1:504075592698:web:c6afae52d6c23adf9c3a43",
  measurementId: "G-ZWSBY8YPGF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
