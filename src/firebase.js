// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIjIaIWMOO8RaOIJ8p-dFujNZMXnqWydo",
  authDomain: "antoankhanh.firebaseapp.com",
  projectId: "antoankhanh",
  storageBucket: "antoankhanh.firebasestorage.app",
  messagingSenderId: "1054630604776",
  appId: "1:1054630604776:web:8d5b3a4d3d559d75d7fe5d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);