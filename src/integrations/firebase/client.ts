import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDgsVvuQsqejmw8B6cxJxWENnkIBCkSslU",
  authDomain: "bombaiwala-chat.firebaseapp.com",
  projectId: "bombaiwala-chat",
  storageBucket: "bombaiwala-chat.firebasestorage.app",
  messagingSenderId: "231756735849",
  appId: "1:231756735849:web:77b1bc54bdcc374f47c9f8",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
