// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyCrANBr61DyOaN639ZefKPI4y2fLzMQI",
  authDomain: "multimodelchatui.firebaseapp.com",
  projectId: "multimodelchatui",
  storageBucket: "multimodelchatui.appspot.com",
  messagingSenderId: "1086406111921",
  appId: "1:1086406111921:web:f5bf8a37ecc25d4646a890",
  measurementId: "G-EXDG4TWG8W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (err) {
  console.error("Analytics initialization error:", err);
}

// Create Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export the Firebase services
export { db, auth, googleProvider, analytics };
