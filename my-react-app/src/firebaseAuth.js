import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { 
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { db, auth, googleProvider } from "./firebase";

// Debug function to log Firebase configuration
export const debugFirebaseConfig = () => {
  // This will log information useful for debugging, but avoids exposing sensitive info
  console.log("Firebase Auth Instance:", !!auth);
  console.log("Firebase Auth Provider:", !!googleProvider);
  console.log("Firebase Auth Config Domain:", auth?.config?.authDomain);
  console.log("Firebase Project ID:", auth?.app?.options?.projectId);
  
  // Test if auth is properly initialized
  if (!auth) {
    console.error("Auth is not initialized properly");
    return false;
  }
  
  // Test if provider is properly initialized
  if (!googleProvider) {
    console.error("Google provider is not initialized properly");
    return false;
  }
  
  return true;
};

// Enhanced Google Sign-In function with better error handling
export const signInWithGoogle = async () => {
  try {
    // First debug the configuration
    debugFirebaseConfig();
    
    console.log("Starting Google sign-in process...");
    
    // Make sure the provider has custom parameters
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Use the signInWithPopup method
    console.log("Opening popup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Sign-in successful, got user:", !!result.user);
    
    const user = result.user;
    
    // Save user info to Firestore
    if (user) {
      try {
        console.log("Saving user to Firestore...");
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          lastLogin: serverTimestamp()
        }, { merge: true });
        console.log("User saved to Firestore successfully");
      } catch (err) {
        console.error("Firestore save error (non-critical):", err);
      }
    }
    
    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Special handling for configuration errors
    if (error.code === 'auth/configuration-not-found') {
      console.error("Firebase configuration error. Check your Firebase project settings and make sure Authentication is enabled.");
    }
    
    throw error;
  }
};

// Simple function to sign out
export const signOutUser = () => {
  return signOut(auth);
};

// Export the onAuthStateChanged function directly
export { onAuthStateChanged };