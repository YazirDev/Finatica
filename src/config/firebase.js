// ============================================================
// firebase.js — Configuración e inicialización de Firebase
// Este archivo se importa desde el renderer process (React)
// ============================================================

import { initializeApp }       from 'firebase/app';
import { getFirestore }        from 'firebase/firestore';
import { getAuth }             from 'firebase/auth';

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey:            "AIzaSyDUMx1pa0NhGOMAgLgiLgwo6fwDfGfqeVI",
  authDomain:        "finatica-69f88.firebaseapp.com",
  projectId:         "finatica-69f88",
  storageBucket:     "finatica-69f88.firebasestorage.app",
  messagingSenderId: "461816320303",
  appId:             "1:461816320303:web:32dcf6f935e6ad5aba11da"
};

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Exportar servicios que se usan en la app
export const db   = getFirestore(firebaseApp); // Base de datos Firestore
export const auth = getAuth(firebaseApp);       // Autenticación
