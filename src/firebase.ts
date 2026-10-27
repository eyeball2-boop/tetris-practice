import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyDe6A_ZNMuFT0xtK0EkkKFZc_V5IN_tspw",
  authDomain: "ai-studio-practice.firebaseapp.com",
  projectId: "ai-studio-practice",
  storageBucket: "ai-studio-practice.firebasestorage.app",
  messagingSenderId: "48117554136",
  appId: "1:48117554136:web:489643d6849ba2c9bab0ad",
  measurementId: "G-2WJJ181PC4",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Safe Analytics initialization
isAnalyticsSupported().then((supported) => {
  if (supported) {
    try {
      getAnalytics(app);
    } catch (e) {
      console.warn("Analytics initialization skipped:", e);
    }
  }
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in using Google popup
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google login failed:", error);
    throw error;
  }
}

/**
 * Sign in as guest (Anonymous) with a chosen nickname
 */
export async function loginAsGuest(nickname: string) {
  try {
    const result = await signInAnonymously(auth);
    if (nickname && result.user) {
      await updateProfile(result.user, {
        displayName: nickname.trim() || '익명 게이머',
      });
    }
    return result.user;
  } catch (error: any) {
    console.error("Guest login failed:", error);
    throw error;
  }
}

/**
 * Update current user's display name
 */
export async function updateUserDisplayName(nickname: string) {
  if (auth.currentUser && nickname.trim()) {
    await updateProfile(auth.currentUser, {
      displayName: nickname.trim(),
    });
    return auth.currentUser;
  }
}

/**
 * Log out
 */
export async function logoutUser() {
  await signOut(auth);
}

export interface ScoreRecord {
  id?: string;
  uid: string;
  displayName: string;
  photoURL?: string | null;
  score: number;
  lines: number;
  level: number;
  maxCombo: number;
  createdAt: any;
}

const SCORES_COLLECTION = 'tetris_scores';

/**
 * Save game score to Firestore
 */
export async function saveScoreToFirestore(data: {
  score: number;
  lines: number;
  level: number;
  maxCombo: number;
  user: User | null;
  fallbackName?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const uid = data.user?.uid || 'guest_' + Math.random().toString(36).substring(2, 9);
    const displayName =
      data.user?.displayName || data.fallbackName || (data.user?.isAnonymous ? '익명 랭커' : '게이머');
    const photoURL = data.user?.photoURL || null;

    const record = {
      uid,
      displayName,
      photoURL,
      score: data.score,
      lines: data.lines,
      level: data.level,
      maxCombo: data.maxCombo || 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, SCORES_COLLECTION), record);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error saving score to Firestore:", error);
    return {
      success: false,
      error: error?.message || '점수 저장 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Subscribe to real-time top scores
 */
export function subscribeToLeaderboard(
  onUpdate: (scores: ScoreRecord[]) => void,
  onError?: (error: Error) => void,
  maxItems = 50
) {
  try {
    const q = query(
      collection(db, SCORES_COLLECTION),
      orderBy('score', 'desc'),
      limit(maxItems)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const scores: ScoreRecord[] = [];
        snapshot.forEach((doc) => {
          scores.push({
            id: doc.id,
            ...(doc.data() as Omit<ScoreRecord, 'id'>),
          });
        });
        onUpdate(scores);
      },
      (error) => {
        console.warn("Leaderboard snapshot error:", error);
        if (onError) onError(error);
      }
    );
  } catch (e: any) {
    console.error("Leaderboard subscription error:", e);
    if (onError) onError(e);
    return () => {};
  }
}
