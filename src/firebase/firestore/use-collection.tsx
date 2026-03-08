'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  query,
  where,
  getDocs,
  QuerySnapshot,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// Custom hook for real-time collection data
export function useCollection<T>(collectionPath: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const collectionRef = collection(firestore, collectionPath);
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const a: T[] = [];
        snapshot.docs.forEach((doc) => {
          a.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(a);
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionPath]);

  return { data, loading, error };
}

// Custom hook for querying a collection
export function useCollectionQuery<T>(
  collectionPath: string,
  field: string,
  operator: any,
  value: any
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If we don't have a value to query for (e.g. user is logged out), don't run the query
    if (!firestore || value === undefined || value === null) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, collectionPath),
      where(field, operator, value)
    );

    const getCollection = async () => {
      try {
        const querySnapshot = await getDocs(q);
        const a: T[] = [];
        querySnapshot.forEach((doc) => {
          a.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(a);
        setLoading(false);
      } catch (err) {
        // Only emit if it's a real error, not just a missing auth on a public page
        const permissionError = new FirestorePermissionError({
          path: (q as Query).path,
          operation: 'list',
        } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    };
    getCollection();
  }, [firestore, collectionPath, field, operator, value]);

  return { data, loading, error };
}
