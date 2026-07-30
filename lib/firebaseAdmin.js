// Server-only — never import this from a "use client" file or it'll try to
// bundle firebase-admin (and your service account key) into client JS.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        // Service account keys come with literal "\n" sequences when pasted
        // into a single-line env var — this turns them back into real newlines.
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });

export const adminAuth = getAuth(adminApp);
