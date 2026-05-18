import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

export const listenToAuthChanges = (callback) => onAuthStateChanged(auth, callback);

export const registerWithEmail = async ({ email, password, displayName }) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  await setDoc(doc(db, 'users', credential.user.uid), {
    displayName: displayName || '',
    email,
    role: 'user',
    photoURL: credential.user.photoURL || '',
    createdAt: serverTimestamp(),
  });
  await sendEmailVerification(credential.user);

  return credential.user;
};

export const loginWithEmail = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const logoutUser = () => signOut(auth);

export const getUserProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const updateUserProfile = async ({ user, displayName, photoURL }) => {
  await updateProfile(user, {
    displayName,
    photoURL,
  });

  await updateDoc(doc(db, 'users', user.uid), {
    displayName,
    photoURL,
    updatedAt: serverTimestamp(),
  });
};

export const changeUserPassword = async ({ user, newPassword }) => {
  await updatePassword(user, newPassword);
};

export const sendUserEmailVerification = (user) => sendEmailVerification(user);
