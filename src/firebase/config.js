
// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";


// 
{/*const firebaseConfig = {
    apiKey: "AIzaSyB8eXjvvPB_gAmUwm80MkCiSCFRS56y5Ho",
    authDomain: "rohis-site.firebaseapp.com",
    databaseURL: "https://rohis-site-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rohis-site",
    storageBucket: "rohis-site.firebasestorage.app",
    messagingSenderId: "426699344284",
    appId: "1:426699344284:web:8f3b4864169707c6d0e059"
  };*/}
 

// 
const firebaseConfig = {
  apiKey: "AIzaSyBJTuuNiISFXoyXf9JRl_zUtyeVw3S3D44",
  authDomain: "rohishiayah.firebaseapp.com",
  databaseURL: "https://rohishiayah-default-rtdb.firebaseio.com",
  projectId: "rohishiayah",
  storageBucket: "rohishiayah.firebasestorage.app",
  messagingSenderId: "790250211079",
  appId: "1:790250211079:web:43f1f8b4706e8facbb67a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export database & auth
export const db = getDatabase(app);
export const auth = getAuth(app);
