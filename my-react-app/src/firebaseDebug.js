// This is a test file to check Firebase authentication
import { auth } from './firebase';

// This function will check if Firebase Auth is properly initialized
export const checkFirebaseAuth = () => {
  if (!auth) {
    console.error("Firebase auth is not initialized!");
    return false;
  }
  
  console.log("Firebase auth is properly initialized");
  return true;
};

// Check authentication state
export const checkAuthState = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        console.log("User is signed in:", user.email);
      } else {
        console.log("No user is signed in");
      }
      resolve(user);
    });
  });
};

// Export these so we can call them from the console for debugging
window.checkFirebaseAuth = checkFirebaseAuth;
window.checkAuthState = checkAuthState;