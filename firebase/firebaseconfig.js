import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
//import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { initializeAuth, getReactNativePersistence,createUserWithEmailAndPassword } from 'firebase/auth';

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

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);
//const analytics = getAnalytics(app);
const storage = getStorage(app); 

export { app, auth, db, storage };

