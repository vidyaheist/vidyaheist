'use client';

import { useEffect, useState } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { ADMIN_EMAIL } from '@/lib/constants';

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      async (authUser) => {
        setUser(authUser);
        if (authUser) {
          if (authUser.email === ADMIN_EMAIL) {
            setRole('admin');
            setLoading(false);
          } else if (firestore) {
            try {
              const docRef = doc(firestore, 'users', authUser.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const data = docSnap.data();
                setRole(data.role || 'student');
              } else {
                setRole('student');
              }
            } catch (err) {
              console.error('Error fetching user role:', err);
              setRole('student');
            } finally {
              setLoading(false);
            }
          } else {
            setRole('student');
            setLoading(false);
          }
        } else {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Auth state change error', error);
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  const isAdmin = user?.email === ADMIN_EMAIL || role === 'admin';
  const isMicroAdmin = role === 'microadmin';

  return { user, loading, role, isAdmin, isMicroAdmin };
}
