
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import { create } from "zustand";
import { queryClient } from "./queryClient";

// TODO: PASTE YOUR FIREBASE WEB CONFIG HERE
// Go to Firebase Console -> Project Settings -> General -> Your apps -> Web app -> SDK Setup/Config
// Copy the object properties:
const firebaseConfig = {
    apiKey: "AIzaSyBBh5OtfakenF0dprezu5OFWbMme-UESE8", // Replace with yours
    authDomain: "lifejourney-fb0f7.firebaseapp.com",
    projectId: "lifejourney-fb0f7",
    storageBucket: "lifejourney-fb0f7.firebasestorage.app",
    messagingSenderId: "629793490752",
    appId: "1:629793490752:web:6ac2defaa8817d9588dca5"
};


// Initialize Firebase Client
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

interface AuthStore {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null, // Initially null
    loading: true, // Initially loading
    signInWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // The signed-in user info.
            const user = result.user;
            set({ user });


            // Optional: Send ID token to backend for session cookie if using server-side sessions
            const token = await user.getIdToken();
            await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Invalidate the auth query to trigger a re-fetch in the rest of the app
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        } catch (error) {

            console.error("Login Failed", error);
            throw error;
        }
    },
    logout: async () => {
        await signOut(auth);
        set({ user: null });
        // Optional: Call backend to clear session
    }
}));

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    useAuthStore.setState({ user, loading: false });
});
