// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUOxni60Lh-__ZeE7vzeRMo7XvgWzBWUo",
  authDomain: "fire-detection-fcaf9.firebaseapp.com",
  databaseURL:
    "https://fire-detection-fcaf9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fire-detection-fcaf9",
  storageBucket: "fire-detection-fcaf9.firebasestorage.app",
  messagingSenderId: "446823890947",
  appId: "1:446823890947:web:5b161a0e03e506dbc3ce36",
  measurementId: "G-B9XVR0HR39",
};

// ThingSpeak Configuration
const thingspeakConfig = {
  channelId: "3116566",
  readApiKey: "6TL6IV8I62QZ509P",
  writeApiKey: "SKGNAYL7O2WJ0HI0",
  baseUrl: "https://api.thingspeak.com",
};

// Export configurations
export { firebaseConfig, thingspeakConfig };
