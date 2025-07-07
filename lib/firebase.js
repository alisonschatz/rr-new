// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAKcm0qaeFaMw00q9rhRCn_qA8ki1Uk5dY",
  authDomain: "rr-exchange.firebaseapp.com",
  projectId: "rr-exchange",
  storageBucket: "rr-exchange.firebasestorage.app",
  messagingSenderId: "749266777135",
  appId: "1:749266777135:web:521ff0f03d57d0f5a202da"
};

// Inicializar Firebase apenas uma vez
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicializar serviços Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;