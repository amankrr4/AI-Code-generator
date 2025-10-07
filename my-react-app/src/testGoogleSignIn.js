// Simple test script to verify Google sign-in

window.testGoogleSignIn = async function() {
  console.log("Starting Google sign-in test...");
  
  try {
    // Try to import Firebase modules on-the-fly
    const { GoogleAuthProvider, signInWithPopup, getAuth } = await import('firebase/auth');
    const { initializeApp } = await import('firebase/app');
    
    // Use the same config as your app
    const firebaseConfig = {
      apiKey: "AIzaSyCyCrANBr61DyOaN639ZefKPI4y2fLzMQI",
      authDomain: "multimodelchatui.firebaseapp.com",
      projectId: "multimodelchatui", 
      storageBucket: "multimodelchatui.firebasestorage.app",
      messagingSenderId: "1086406111921",
      appId: "1:1086406111921:web:f5bf8a37ecc25d4646a890",
      measurementId: "G-EXDG4TWG8W"
    };
    
    // Initialize directly
    const app = initializeApp(firebaseConfig, 'test-auth-' + Date.now());
    const auth = getAuth(app);
    
    // Create a fresh provider
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    console.log("Initialized Firebase auth, attempting popup...");
    
    // Try the sign in
    const result = await signInWithPopup(auth, provider);
    console.log("Sign-in successful!", result.user);
    return true;
  } catch (error) {
    console.error("Test sign-in failed:", error);
    console.log("Error code:", error.code);
    console.log("Error message:", error.message);
    return false;
  }
};

console.log("Google sign-in test script loaded! Run window.testGoogleSignIn() to test.");