import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBh0BSosHOgbE0hDqEiePWyXVhM54Nr-MI",
    authDomain: "batalha-caminhada.firebaseapp.com",
    databaseURL: "https://batalha-caminhada-default-rtdb.firebaseio.com",
    projectId: "batalha-caminhada",
    storageBucket: "batalha-caminhada.firebasestorage.app",
    messagingSenderId: "478285949418",
    appId: "1:478285949418:web:eadf67b01055a09d8e2a93"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();