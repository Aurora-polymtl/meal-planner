// src/app/firebase/firebase.config.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBoaN97PRO7QNe-ECIdma6pbzXbwwmHiI4",
  authDomain: "meal-planner-9c0b6.firebaseapp.com",
  projectId: "meal-planner-9c0b6",
  storageBucket: "meal-planner-9c0b6.firebasestorage.app",
  messagingSenderId: "24162187567",
  appId: "1:24162187567:web:d0a64ad3552ae3e62789da"
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);