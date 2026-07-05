import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

/**
 * Subscribes to an RTDB list node in real time and returns it as an array,
 * with each item's push-key attached as `id`. This is the single source of
 * truth for "list" data across the app (books, users, borrowRecords, etc.)
 * so that availability, circulation, and approvals all update live for
 * everyone looking at the same data.
 *
 * @param {string|null} path e.g. 'books', 'bookmarks/uid123'. Pass null/undefined
 *   to skip subscribing (e.g. while waiting on profile.uid).
 */
export function useCollection(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(!!path);

  useEffect(() => {
    if (!path || path.includes('undefined') || path.includes('null')) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onValue(
      ref(db, path),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        setData(list);
        setLoading(false);
      },
      (error) => {
        console.error(`useCollection(${path}) failed:`, error);
        setData([]);
        setLoading(false);
      }
    );
    return unsub;
  }, [path]);

  return { data, loading };
}

/**
 * Subscribes to a single RTDB node in real time.
 * Returns `undefined` while loading, `null` if the node doesn't exist,
 * or the value (with `id` set to the node's own key) once loaded.
 *
 * @param {string|null} path e.g. `books/${id}`
 */
export function useDoc(path) {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (!path || path.includes('undefined') || path.includes('null')) {
      setData(null);
      return;
    }
    setData(undefined);
    const unsub = onValue(
      ref(db, path),
      (snap) => {
        if (!snap.exists()) {
          setData(null);
          return;
        }
        const key = path.split('/').filter(Boolean).pop();
        setData({ id: key, ...snap.val() });
      },
      (error) => {
        console.error(`useDoc(${path}) failed:`, error);
        setData(null);
      }
    );
    return unsub;
  }, [path]);

  return data;
}
