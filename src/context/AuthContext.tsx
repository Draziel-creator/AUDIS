import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  onAuthStateChanged,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove,
  handleFirestoreError,
  OperationType,
  type User
} from '../firebase/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalReason: string;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithPhoneMock: (phoneNumber: string, name: string) => Promise<void>;
  logOut: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  toggleFollowUser: (targetUserId: string) => Promise<boolean>;
  updateProfileInfo: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string>('');

  const openAuthModal = (reason = "Connectez-vous d'abord pour continuer") => {
    setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Sync Firebase Auth user and Firestore UserProfile
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        try {
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            // Auto-create user doc in Firestore collection "users"
            const newUserData: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Étudiant Goma',
              email: firebaseUser.email || `${firebaseUser.uid}@audis.cd`,
              photoURL: firebaseUser.photoURL || '',
              isPremium: false,
              followers: [],
              following: [],
              campus: 'Campus du Lac (UNIGOM)',
              faculty: 'Faculté des Sciences & Technologies',
              bio: 'Étudiant à Goma. Prêt à collaborer sur les projets campus et services.',
              createdAt: serverTimestamp()
            };

            await setDoc(userDocRef, newUserData);
            setUserProfile(newUserData);
          } else {
            const data = docSnap.data() as UserProfile;
            // Ensure photoURL is updated from Google if available
            if (firebaseUser.photoURL && data.photoURL !== firebaseUser.photoURL) {
              await updateDoc(userDocRef, { photoURL: firebaseUser.photoURL });
            }
            setUserProfile(data);
          }

          // Real-time snapshot listener on current user profile
          unsubscribeDoc = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data() as UserProfile);
            }
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      } else {
        setUserProfile(null);
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      // Auto ensure Firestore doc exists
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        const initialProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'Étudiant Goma',
          email: user.email || '',
          photoURL: user.photoURL || '',
          isPremium: false,
          followers: [],
          following: [],
          campus: 'Campus du Lac (UNIGOM)',
          faculty: 'Faculté des Sciences',
          bio: 'Membre certifié de la communauté universitaire AUDIS Goma.',
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, initialProfile);
        setUserProfile(initialProfile);
      }
      closeAuthModal();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      closeAuthModal();
    } catch (err: any) {
      console.error('Email Sign-In error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      const userDocRef = doc(db, 'users', cred.user.uid);
      const initialProfile: UserProfile = {
        uid: cred.user.uid,
        displayName: name,
        email: email,
        photoURL: '',
        isPremium: false,
        followers: [],
        following: [],
        campus: 'Campus du Lac (UNIGOM)',
        faculty: 'Faculté Polytechnique & Info',
        bio: 'Étudiant actif sur AUDIS Goma.',
        createdAt: serverTimestamp()
      };
      await setDoc(userDocRef, initialProfile);
      setUserProfile(initialProfile);
      closeAuthModal();
    } catch (err: any) {
      console.error('Email Sign-Up error:', err);
      throw err;
    }
  };

  const signInWithPhoneMock = async (phoneNumber: string, name: string) => {
    // Congolese phone auth simulator that creates or signs in student via standard credential
    const pseudoEmail = `phone_${phoneNumber.replace(/[^0-9]/g, '')}@audis.cd`;
    const pseudoPassword = `AudisPass_${phoneNumber.slice(-4)}!2026`;
    try {
      await signInWithEmailAndPassword(auth, pseudoEmail, pseudoPassword);
      closeAuthModal();
    } catch {
      // If doesn't exist, create it
      const cred = await createUserWithEmailAndPassword(auth, pseudoEmail, pseudoPassword);
      await updateProfile(cred.user, { displayName: name });
      const userDocRef = doc(db, 'users', cred.user.uid);
      const initialProfile: UserProfile = {
        uid: cred.user.uid,
        displayName: name,
        email: pseudoEmail,
        phone: phoneNumber,
        photoURL: '',
        isPremium: false,
        followers: [],
        following: [],
        campus: 'Campus Moïse (ULPGL)',
        faculty: 'Sciences Économiques & Gestion',
        bio: `Étudiant Goma connecté via ${phoneNumber}`,
        createdAt: serverTimestamp()
      };
      await setDoc(userDocRef, initialProfile);
      setUserProfile(initialProfile);
      closeAuthModal();
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign-Out error:', err);
    }
  };

  const upgradeToPremium = async () => {
    if (!currentUser) {
      openAuthModal("Connectez-vous pour passer à AUDIS Pro");
      return;
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, { isPremium: true });
      setUserProfile((prev) => prev ? { ...prev, isPremium: true } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      throw err;
    }
  };

  const toggleFollowUser = async (targetUserId: string): Promise<boolean> => {
    if (!currentUser) {
      openAuthModal("Connectez-vous pour vous abonner à cet étudiant");
      return false;
    }
    if (currentUser.uid === targetUserId) return false;

    const targetDocRef = doc(db, 'users', targetUserId);
    const myDocRef = doc(db, 'users', currentUser.uid);

    const isFollowing = userProfile?.following?.includes(targetUserId);

    try {
      if (isFollowing) {
        // Unfollow
        await updateDoc(targetDocRef, { followers: arrayRemove(currentUser.uid) });
        await updateDoc(myDocRef, { following: arrayRemove(targetUserId) });
        return false;
      } else {
        // Follow
        await updateDoc(targetDocRef, { followers: arrayUnion(currentUser.uid) });
        await updateDoc(myDocRef, { following: arrayUnion(targetUserId) });
        return true;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUserId}`);
      return false;
    }
  };

  const updateProfileInfo = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, data);
      setUserProfile((prev) => prev ? { ...prev, ...data } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthModalOpen,
        authModalReason,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithPhoneMock,
        logOut,
        upgradeToPremium,
        toggleFollowUser,
        updateProfileInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
