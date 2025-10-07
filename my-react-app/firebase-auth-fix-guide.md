# Firebase Auth Configuration Fix Guide

## 1. Check Your Firebase Project Setup

The `auth/configuration-not-found` error you're seeing indicates that Firebase cannot find the authentication configuration for your project. This typically happens when:

1. Authentication service hasn't been properly enabled in the Firebase Console
2. The API key is incorrect or restricted
3. The Firebase project ID doesn't match your configuration

## 2. Step-by-Step Fix

### Verify Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `multimodelchatui`
3. Go to **Authentication** in the left sidebar
4. Click on **Get Started** if you haven't enabled Authentication yet
5. Go to the **Sign-in method** tab
6. Make sure **Google** is enabled:
   - Click on Google in the list
   - Toggle the **Enable** switch to ON
   - Configure a support email (your email address)
   - Click **Save**

### Add Authorized Domains

1. Still in the **Authentication** section, go to the **Settings** tab
2. Under **Authorized domains**, make sure these domains are added:
   - `localhost`
   - Any other domain where you'll be hosting your app

### Check API Key Restrictions

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find the API key used in your application (`AIzaSyCyCrANBr61DyOaN639ZefKPI4y2fLzMQI`)
4. Check if there are any restrictions that might be blocking its use:
   - If the key is restricted to specific websites, make sure your domain is included
   - If the key is restricted to specific APIs, make sure Firebase Authentication is included

### Update Your Firebase Configuration

Make sure your firebase.js configuration is correct:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCyCrANBr61DyOaN639ZefKPI4y2fLzMQI",
  authDomain: "multimodelchatui.firebaseapp.com",
  projectId: "multimodelchatui",
  storageBucket: "multimodelchatui.appspot.com",
  messagingSenderId: "1086406111921",
  appId: "1:1086406111921:web:f5bf8a37ecc25d4646a890",
  measurementId: "G-EXDG4TWG8W"
};
```

## 3. Test with Diagnostic Tool

Use the Firebase diagnostics tool I created:

1. Run your Vite development server: `npm run dev`
2. Open: `http://localhost:5173/firebase-diagnostics.html`
3. Run the tests one by one to identify exactly where the issue is occurring

## 4. Verify API Key

To check if your API key is working correctly:

1. Try this URL in your browser (replace with your actual API key):
   ```
   https://identitytoolkit.googleapis.com/v1/projects/multimodelchatui/defaultSupportedIdpConfigs/google.com?key=AIzaSyCyCrANBr61DyOaN639ZefKPI4y2fLzMQI
   ```

2. If you see a JSON error about "CONFIGURATION_NOT_FOUND" or "API key not valid", there's an issue with your API key or project configuration.

## 5. Create New Project (If Needed)

If you can't resolve the issues with your current project:

1. Create a new Firebase project in the console
2. Enable Authentication with Google sign-in
3. Get the new configuration and replace it in your code
4. Make sure to update all references to the Firebase project