
// Test Firebase API Key
async function testFirebaseApiKey(apiKey) {
  console.log(`Testing Firebase API key: ${apiKey}`);
  try {
    // Try to make a simple request to Firebase Auth API
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        continueUri: window.location.origin,
        identifier: 'test@example.com',
        providerId: 'google.com'
      })
    });
    
    const data = await response.json();
    console.log("API Key test response:", data);
    
    if (response.ok) {
      console.log("✅ API key appears to be valid!");
      return true;
    } else {
      console.error("❌ API key test failed:", data.error);
      return false;
    }
  } catch (error) {
    console.error("❌ API key test error:", error);
    return false;
  }
}

// Test Firebase project configuration
async function testFirebaseProjectConfig(apiKey, projectId) {
  console.log(`Testing Firebase project configuration for project: ${projectId}`);
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/defaultSupportedIdpConfigs/google.com?key=${apiKey}`);
    const data = await response.json();
    
    console.log("Project config test response:", data);
    
    if (response.ok) {
      console.log("✅ Project Google auth configuration appears to be set up!");
      return true;
    } else if (data.error && data.error.message === "CONFIGURATION_NOT_FOUND") {
      console.error("❌ Google authentication is not configured for this project.");
      console.log("Please go to Firebase Console > Authentication > Sign-in methods and enable Google.");
      return false;
    } else {
      console.error("❌ Project configuration test failed:", data.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Project configuration test error:", error);
    return false;
  }
}

// Function to create a new Firebase config test
async function testFirebaseConfig() {
  // Your current Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyCyCrANBr61DyOaN639ZefKPI4y2fLzMQI",
    authDomain: "multimodelchatui.firebaseapp.com",
    projectId: "multimodelchatui",
    storageBucket: "multimodelchatui.appspot.com",
    messagingSenderId: "1086406111921",
    appId: "1:1086406111921:web:f5bf8a37ecc25d4646a890",
    measurementId: "G-EXDG4TWG8W"
  };

  console.log("Testing Firebase configuration:", firebaseConfig);
  
  // Step 1: Test API key
  const apiKeyValid = await testFirebaseApiKey(firebaseConfig.apiKey);
  
  // Step 2: Test project configuration
  if (apiKeyValid) {
    const projectConfigValid = await testFirebaseProjectConfig(firebaseConfig.apiKey, firebaseConfig.projectId);
    
    if (projectConfigValid) {
      console.log("✅ Firebase configuration appears valid!");
      return true;
    } else {
      console.log("⚠️ Firebase API key is valid, but project configuration has issues.");
      return false;
    }
  } else {
    console.log("⚠️ Firebase API key appears to be invalid.");
    return false;
  }
}

// Make the function available globally
window.testFirebaseConfig = testFirebaseConfig;

// Run the test automatically
testFirebaseConfig().then(result => {
  console.log("Firebase configuration test complete. Overall result:", result ? "PASSED" : "FAILED");
});