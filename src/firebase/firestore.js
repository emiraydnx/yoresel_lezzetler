import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './config';

const withId = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
});

export const getCollection = async (collectionName, constraints = []) => {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(constraints.length ? query(collectionRef, ...constraints) : collectionRef);
  return snapshot.docs.map(withId);
};

export const getDocument = async (collectionName, id) => {
  const snapshot = await getDoc(doc(db, collectionName, id));
  return snapshot.exists() ? withId(snapshot) : null;
};

export const createDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

export const updateDocument = (collectionName, id, data) =>
  updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

export const deleteDocument = (collectionName, id) => deleteDoc(doc(db, collectionName, id));

export const firestoreQuery = {
  where,
  orderBy,
  limit,
};
