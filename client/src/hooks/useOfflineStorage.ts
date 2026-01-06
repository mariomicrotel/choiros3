import { useState, useEffect, useCallback } from "react";

const DB_NAME = "choiros-offline";
const DB_VERSION = 1;
const ATTENDANCE_STORE = "pending-attendance";

interface PendingAttendance {
  id?: number;
  eventId: number;
  userId: number;
  checkInAt: string;
  synced: boolean;
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingRecords();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          // Listen for sync messages
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data.type === "ATTENDANCE_SYNCED") {
              updatePendingCount();
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    updatePendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
          db.createObjectStore(ATTENDANCE_STORE, { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }, []);

  const savePendingAttendance = useCallback(
    async (attendance: Omit<PendingAttendance, "id" | "synced">): Promise<void> => {
      const db = await openDB();
      const tx = db.transaction(ATTENDANCE_STORE, "readwrite");
      const store = tx.objectStore(ATTENDANCE_STORE);

      return new Promise((resolve, reject) => {
        const request = store.add({
          ...attendance,
          synced: false,
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          updatePendingCount();
          resolve();
        };
      });
    },
    [openDB]
  );

  const getPendingAttendance = useCallback(async (): Promise<PendingAttendance[]> => {
    const db = await openDB();
    const tx = db.transaction(ATTENDANCE_STORE, "readonly");
    const store = tx.objectStore(ATTENDANCE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }, [openDB]);

  const removePendingAttendance = useCallback(
    async (id: number): Promise<void> => {
      const db = await openDB();
      const tx = db.transaction(ATTENDANCE_STORE, "readwrite");
      const store = tx.objectStore(ATTENDANCE_STORE);

      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          updatePendingCount();
          resolve();
        };
      });
    },
    [openDB]
  );

  const updatePendingCount = useCallback(async () => {
    try {
      const records = await getPendingAttendance();
      setPendingCount(records.filter((r) => !r.synced).length);
    } catch (error) {
      console.error("Failed to update pending count:", error);
    }
  }, [getPendingAttendance]);

  const syncPendingRecords = useCallback(async () => {
    if (!isOnline) return;

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SYNC_ATTENDANCE",
      });
    }
  }, [isOnline]);

  return {
    isOnline,
    pendingCount,
    savePendingAttendance,
    getPendingAttendance,
    removePendingAttendance,
    syncPendingRecords,
  };
}
