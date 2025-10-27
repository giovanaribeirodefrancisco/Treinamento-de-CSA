import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA-MNmzqNC79sEg0cXGXAKtlI-QYfJzzms",
  authDomain: "treinamento-professores-caa.firebaseapp.com",
  projectId: "treinamento-professores-caa",
  storageBucket: "treinamento-professores-caa.firebasestorage.app",
  messagingSenderId: "314429373705",
  appId: "1:314429373705:web:95588a0a958006979e67d8",
  measurementId: "G-KPYCRJ8T5W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
