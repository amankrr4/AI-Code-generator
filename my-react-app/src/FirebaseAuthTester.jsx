// FirebaseAuthTester.jsx
import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const FirebaseAuthTester = () => {
  const [status, setStatus] = useState('Not started');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const firebaseConfig = {
    apiKey: "AIzaSyCyCrANBr61DyOaN639ZefKPI4y2fLzMQI",
    authDomain: "multimodelchatui.firebaseapp.com",
    projectId: "multimodelchatui",
    storageBucket: "multimodelchatui.firebasestorage.app",
    messagingSenderId: "1086406111921",
    appId: "1:1086406111921:web:f5bf8a37ecc25d4646a890",
    measurementId: "G-EXDG4TWG8W"
  };

  // Simple direct auth test
  const testAuth = async () => {
    setStatus('Starting auth test...');
    setError(null);
    
    try {
      // Initialize Firebase directly in this component
      const app = initializeApp(firebaseConfig, 'tester');
      setStatus('Firebase initialized');
      
      const auth = getAuth(app);
      setStatus('Auth instance created');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      setStatus('Opening Google popup...');
      const result = await signInWithPopup(auth, provider);
      
      // Get user info
      const signedInUser = result.user;
      setUser(signedInUser);
      setStatus('Authentication successful');
      
      return signedInUser;
    } catch (err) {
      console.error('Auth test error:', err);
      setStatus('Authentication failed');
      setError(err.message || 'Unknown error');
      return null;
    }
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '20px auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>Firebase Auth Diagnostics</h2>
      
      <div style={{marginBottom: '20px'}}>
        <strong>Status:</strong> {status}
      </div>
      
      {error && (
        <div style={{
          color: 'red',
          padding: '10px',
          border: '1px solid red',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {user && (
        <div style={{
          padding: '10px',
          border: '1px solid green',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Authenticated User:</strong><br />
          Email: {user.email}<br />
          Name: {user.displayName}<br />
          ID: {user.uid}
        </div>
      )}
      
      <button 
        onClick={testAuth}
        style={{
          padding: '10px 15px',
          backgroundColor: '#4285F4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Test Google Sign In
      </button>
    </div>
  );
};

export default FirebaseAuthTester;