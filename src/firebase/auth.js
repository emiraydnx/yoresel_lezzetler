import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

export const listenToAuthChanges = (callback) => onAuthStateChanged(auth, callback);

const createUserProfile = async (user, profile = {}) => {
  await setDoc(doc(db, 'users', user.uid), {
    displayName: profile.displayName || user.displayName || '',
    email: profile.email || user.email || '',
    role: 'user',
    photoURL: profile.photoURL || user.photoURL || '',
    createdAt: serverTimestamp(),
  });
};

const syncExistingUserProfile = async (user) => {
  await updateDoc(doc(db, 'users', user.uid), {
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    updatedAt: serverTimestamp(),
  });
};

export const registerWithEmail = async ({ email, password, displayName }) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  await createUserProfile(credential.user, { displayName, email });
  await sendEmailVerification(credential.user);

  return credential.user;
};

export const loginWithEmail = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const credential = await signInWithPopup(auth, provider);
  const profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    await createUserProfile(credential.user);
  } else {
    await syncExistingUserProfile(credential.user);
  }

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
