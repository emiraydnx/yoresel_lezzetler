import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  changeUserPassword,
  getUserProfile,
  listenToAuthChanges,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  registerWithEmail,
  sendUserEmailVerification,
  updateUserProfile,
} from '../firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = useCallback(
    async (uid = currentUser?.uid) => {
      if (!uid) {
        setUserProfile(null);
        return null;
      }

      const profile = await getUserProfile(uid);
      setUserProfile(profile);
      return profile;
    },
    [currentUser]
  );

  useEffect(() => {
    const unsubscribe = listenToAuthChanges(async (user) => {
      setCurrentUser(user);

      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      userRole: userProfile?.role || null,
      isAdmin: userProfile?.role === 'admin',
      loading,
      login: loginWithEmail,
      loginGoogle: loginWithGoogle,
      register: registerWithEmail,
      logout: logoutUser,
      changePassword: changeUserPassword,
      refreshUserProfile,
      sendVerificationEmail: sendUserEmailVerification,
      updateProfileInfo: updateUserProfile,
    }),
    [currentUser, loading, refreshUserProfile, userProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
