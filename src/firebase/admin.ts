import * as admin from 'firebase-admin';

// Protect against multiple initializations and missing build-time env vars
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          // Replace escaped newlines and strip surrounding double quotes from environment variables
          privateKey: privateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim(),
        }),
      });
    } catch (error) {
      console.error('Firebase Admin Initialization Error:', error);
    }
  } else {
    console.warn('Firebase Admin skipped initialization: Missing environment variables. This is expected during build time if secrets are not provided.');
  }
}

// Export lazy-initialized services to prevent build-time crashes
export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
