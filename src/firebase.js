import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase project config — provided by project owner.
// NOTE: Firebase web config values are not secret (they identify the project,
// not authorize access). Real security comes from Realtime Database Rules
// (see database.rules.json) and Firebase Auth. Do not rely on hiding this file.
const firebaseConfig = {
  apiKey: 'AIzaSyAVySINCJsR-L1vvJYlF6F5sGI3aHE1lhc',
  authDomain: 'dig-library-2f6f0.firebaseapp.com',
  // ⚠️ Fill this in from Firebase Console → Realtime Database → the URL shown
  // at the top of the data viewer. It depends on which region you created the
  // database in, e.g.:
  //   https://dig-library-2f6f0-default-rtdb.firebaseio.com          (US)
  //   https://dig-library-2f6f0-default-rtdb.asia-southeast1.firebasedatabase.app (Singapore)
  databaseURL: 'https://dig-library-2f6f0-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'dig-library-2f6f0',
  storageBucket: 'dig-library-2f6f0.firebasestorage.app',
  messagingSenderId: '735195976525',
  appId: '1:735195976525:web:51ff0a35444fceec375d04',
  measurementId: 'G-HS45733EDP'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
