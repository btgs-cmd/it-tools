import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDqv9uLmtM46xBmQNkctKW54zW8m1xHp4c",
  authDomain: "btgs-domain-tracker.firebaseapp.com",
  projectId: "btgs-domain-tracker",
  storageBucket: "btgs-domain-tracker.firebasestorage.app",
  messagingSenderId: "947678127775",
  appId: "1:947678127775:web:39272a219f398cc2f6a4aa"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
