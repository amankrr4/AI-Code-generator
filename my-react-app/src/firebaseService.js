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

// ===== Authentication Services =====

// Sign in with Google
// Enhanced Google Sign-In function with better debugging
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign-in process...");
    
    // Check if provider is properly configured
    if (!googleProvider) {
      console.error("Google provider is not initialized properly");
      throw new Error("Google provider not initialized");
    }
    
    // Make sure the provider has custom parameters
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log("Opening popup...");
    // Use the signInWithPopup method directly
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log("Sign-in successful, got user:", !!user);
    
    // Save user info to Firestore
    if (user) {
      try {
        console.log("Saving user to Firestore...");
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
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
    
    // Special handling for common errors
    if (error.code === 'auth/configuration-not-found') {
      console.error("Firebase configuration error. Check your Firebase project settings and make sure Authentication is enabled with Google provider.");
      alert("Authentication failed: Please make sure Google authentication is enabled in your Firebase project.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.log("Sign-in popup was closed by the user");
    }
    
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email: ", error);
    throw error;
  }
};

// Create a new user with email and password
export const createUserWithEmail = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Create user document
    await saveUserToFirestore(user, { displayName });
    
    return user;
  } catch (error) {
    console.error("Error creating user: ", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

// Auth state listener (to be used with useEffect)
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ===== User Services =====

// Save user to Firestore - simpler version
export const saveUserToFirestore = async (user, additionalData = {}) => {
  if (!user || !user.uid) return;
  
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || additionalData.displayName || '',
      lastLogin: serverTimestamp(),
      ...additionalData
    }, { merge: true }); // merge: true means it will update existing fields and add new ones
  } catch (error) {
    console.log("Error saving user:", error);
  }
};

// Get user data
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log("No such user!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user data: ", error);
    throw error;
  }
};

// ===== Chat Sessions =====

// Create a new chat session
export const createChatSession = async (userId, title = "New Chat") => {
  try {
    const docRef = await addDoc(collection(db, "sessions"), {
      userId,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      title,
      messages: []
    };
  } catch (error) {
    console.error("Error creating chat session: ", error);
    throw error;
  }
};

// Get all chat sessions for a user
export const getUserSessions = async (userId) => {
  if (!userId) return [];
  
  try {
    const sessionsQuery = query(
      collection(db, "sessions"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    
    const querySnapshot = await getDocs(sessionsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting chat sessions: ", error);
    return [];
  }
};

// Delete a chat session
export const deleteSession = async (sessionId) => {
  try {
    // Delete the session
    await deleteDoc(doc(db, "sessions", sessionId));
    
    // Delete all messages in the session
    const messagesQuery = query(
      collection(db, "messages"),
      where("sessionId", "==", sessionId)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error deleting session: ", error);
    return false;
  }
};

// Update session title
export const updateSessionTitle = async (sessionId, title) => {
  try {
    await updateDoc(doc(db, "sessions", sessionId), {
      title,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating session title: ", error);
    return false;
  }
};

// ===== Messages =====

// Save a message
export const saveMessage = async (sessionId, content, role, language = null) => {
  try {
    const messageData = {
      sessionId,
      content,
      role, // 'user' or 'assistant'
      timestamp: serverTimestamp()
    };
    
    if (language) {
      messageData.language = language;
    }
    
    const docRef = await addDoc(collection(db, "messages"), messageData);
    
    // Update the session's updatedAt timestamp
    await updateDoc(doc(db, "sessions", sessionId), {
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...messageData,
      timestamp: new Date() // For immediate display
    };
  } catch (error) {
    console.error("Error saving message: ", error);
    throw error;
  }
};

// Get all messages for a session
export const getSessionMessages = async (sessionId) => {
  try {
    const messagesQuery = query(
      collection(db, "messages"),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "asc")
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting messages: ", error);
    return [];
  }
};

// ===== API Keys =====

// Save API key
export const saveApiKey = async (userId, service, key) => {
  try {
    // Create a unique ID for the API key document
    const keyId = `${userId}_${service}`;
    
    const keyRef = doc(db, "apiKeys", keyId);
    const keySnap = await getDoc(keyRef);
    
    if (keySnap.exists()) {
      await updateDoc(keyRef, {
        key,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, "apiKeys"), {
        userId,
        service,
        key,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error saving API key: ", error);
    return false;
  }
};

// Get API key
export const getApiKey = async (userId, service) => {
  try {
    const keyId = `${userId}_${service}`;
    const keyRef = doc(db, "apiKeys", keyId);
    const keySnap = await getDoc(keyRef);
    
    if (keySnap.exists()) {
      return keySnap.data().key;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting API key: ", error);
    return null;
  }
};

// Delete API key
export const deleteApiKey = async (userId, service) => {
  try {
    const keyId = `${userId}_${service}`;
    await deleteDoc(doc(db, "apiKeys", keyId));
    return true;
  } catch (error) {
    console.error("Error deleting API key: ", error);
    return false;
  }
};