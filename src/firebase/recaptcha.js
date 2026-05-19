import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

const verifyRegistrationCaptchaCallable = httpsCallable(functions, 'verifyRegistrationCaptcha');

export const verifyRegistrationCaptcha = async (token) => {
  if (!token) {
    throw new Error('Lutfen reCAPTCHA dogrulamasini tamamlayin.');
  }

  const result = await verifyRegistrationCaptchaCallable({ token });
  return result.data;
};
