// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
// Import the test script
import './testGoogleSignIn.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  // Temporarily disabled StrictMode to prevent double-mounting issues with Firebase auth
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
);