import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { ref, onValue, set, get, update, serverTimestamp } from 'firebase/database';
import { auth, db, googleProvider } from '../firebase';
import { ROLES } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user || null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setProfile(firebaseUser === null ? null : undefined);
      return;
    }
    const userRef = ref(db, `users/${firebaseUser.uid}`);
    const unsub = onValue(userRef, (snap) => {
      setProfile(snap.exists() ? { uid: firebaseUser.uid, ...snap.val() } : null);
    });
    return unsub;
  }, [firebaseUser]);

  async function registerWithEmail({ name, email, password, role }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createUserProfile(cred.user.uid, { name, email, role });
    return cred.user;
  }

  async function loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    const existing = await get(ref(db, `users/${cred.user.uid}`));
    if (!existing.exists()) {
      // New Google sign-ins default to 'student' and pending status; a
      // librarian/admin can upgrade their role in Manage Users.
      await createUserProfile(cred.user.uid, {
        name: cred.user.displayName || 'New User',
        email: cred.user.email,
        role: ROLES.STUDENT
      });
    }
    return cred.user;
  }

  async function createUserProfile(uid, { name, email, role }) {
    await set(ref(db, `users/${uid}`), {
      name,
      email,
      role: role || ROLES.STUDENT,
      status: 'active',
      createdAt: serverTimestamp()
    });
  }

  async function logout() {
    await signOut(auth);
  }

  async function updateOwnProfile(fields) {
    if (!firebaseUser) return;
    await update(ref(db, `users/${firebaseUser.uid}`), fields);
  }

  const value = {
    firebaseUser,
    profile, // null = signed in but no profile row (shouldn't normally happen)
    loading: firebaseUser === undefined || (firebaseUser && profile === undefined),
    role: profile?.role || null,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateOwnProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
