import { create } from 'zustand';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'qty_engineer' | 'tech_office' | 'collaborator';
  phone?: string;
  jobTitle?: string;
  createdAt?: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  initialize: () => () => void; // Returns unsubscribe function
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  error: null,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      let arabicError = 'خطأ في تسجيل الدخول. يرجى التحقق من البيانات.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        arabicError = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (err.code === 'auth/invalid-email') {
        arabicError = 'البريد الإلكتروني غير صالح.';
      }
      set({ error: arabicError, loading: false });
      throw new Error(arabicError);
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await fbSignOut(auth);
      set({ user: null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    // Cannot use 'get' directly in 'set' callback without adding 'get' to the create function signature.
    // Instead we can use set with a callback.
    set((state) => {
      if (!state.user) return state;
      // Optimistically update
      const updatedUser = { ...state.user, ...data };
      
      // Update firestore asynchronously
      const userRef = doc(db, 'users', state.user.uid);
      setDoc(userRef, data, { merge: true }).catch((err) => {
        console.error('Error updating profile in firestore:', err);
      });

      return { user: updatedUser };
    });
  },

  initialize: () => {
    set({ loading: true });
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          // Fetch Firestore user doc
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            set({ user: { ...profile, uid: fbUser.uid }, loading: false, initialized: true });
          } else {
            // Seed a default profile if it doesn't exist (e.g. first login/registration)
            const defaultProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'مهندس جديد',
              role: 'qty_engineer',
              phone: '',
              jobTitle: 'مهندس حصر'
            };
            await setDoc(userDocRef, { ...defaultProfile, createdAt: new Date().toISOString() });
            set({ user: defaultProfile, loading: false, initialized: true });
          }
        } catch (err: any) {
          console.error('Error fetching user profile:', err);
          // Fallback user if Firestore fetch fails
          set({ 
            user: { 
              uid: fbUser.uid, 
              email: fbUser.email || '', 
              name: fbUser.displayName || 'مهندس', 
              role: 'qty_engineer' 
            }, 
            loading: false, 
            initialized: true 
          });
        }
      } else {
        set({ user: null, loading: false, initialized: true });
      }
    });

    return unsubscribe;
  }
}));
