import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './config';

const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;
const ALLOWED_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadProfilePhoto = async ({ userId, file }) => {
  if (!file) {
    throw new Error('Lütfen bir profil fotoğrafı seçin.');
  }

  if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
    throw new Error('Profil fotoğrafı JPG, PNG veya WEBP formatında olmalı.');
  }

  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
    throw new Error('Profil fotoğrafı en fazla 2 MB olabilir.');
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  const fileRef = ref(storage, `users/${userId}/profile-photo/${Date.now()}-${safeFileName}`);

  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};
