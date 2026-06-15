import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFirebaseConfigOverride } from "../lib/settings";

// .env (.env.local) の VITE_FIREBASE_* を優先。
// 値が無ければ、設定画面で貼り付けた localStorage の設定を使う。
function readEnvConfig() {
  const e = import.meta.env;
  const cfg = {
    apiKey: e.VITE_FIREBASE_API_KEY,
    authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: e.VITE_FIREBASE_PROJECT_ID,
    storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: e.VITE_FIREBASE_APP_ID,
  };
  return cfg.projectId ? cfg : null;
}

export function resolveFirebaseConfig() {
  return readEnvConfig() || getFirebaseConfigOverride();
}

let app = null;
let db = null;
let storage = null;

export function isFirebaseReady() {
  return !!db;
}

export function initFirebase() {
  if (db) return { db, storage };
  const cfg = resolveFirebaseConfig();
  if (!cfg || !cfg.projectId) return { db: null, storage: null };
  app = initializeApp(cfg);
  db = getFirestore(app);
  storage = getStorage(app);
  return { db, storage };
}

export function getDb() {
  if (!db) initFirebase();
  return db;
}
export function getStore() {
  if (!storage) initFirebase();
  return storage;
}
