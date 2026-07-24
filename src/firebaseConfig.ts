// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCaUxFsUI871ceaiZypAWn2fOdSkrIzzQs",
  authDomain: "digital-wallet-2489f.firebaseapp.com",
  databaseURL: "https://digital-wallet-2489f-default-rtdb.europe-west1.firebasedatabase.app/"
  projectId: "digital-wallet-2489f",
  storageBucket: "digital-wallet-2489f.firebasestorage.app",
  messagingSenderId: "885549921751",
  appId: "1:885549921751:web:7216a24837aec5d0440792"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
