const CACHE_NAME = 'choiros-v1';
const OFFLINE_DB_NAME = 'choiros-offline';
const OFFLINE_DB_VERSION = 1;
const ATTENDANCE_STORE = 'pending-attendance';

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Message event - handle sync requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_ATTENDANCE') {
    event.waitUntil(syncPendingAttendance());
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncPendingAttendance());
  }
});

// Function to sync pending attendance records
async function syncPendingAttendance() {
  try {
    const db = await openDB();
    const tx = db.transaction(ATTENDANCE_STORE, 'readonly');
    const store = tx.objectStore(ATTENDANCE_STORE);
    const records = await getAllRecords(store);

    for (const record of records) {
      try {
        // Attempt to send to server
        const response = await fetch('/api/trpc/attendance.checkIn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: record.eventId,
            userId: record.userId,
            checkInAt: record.checkInAt,
          }),
        });

        if (response.ok) {
          // Remove from offline storage on success
          await removeRecord(db, record.id);
          
          // Notify clients
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'ATTENDANCE_SYNCED',
              recordId: record.id,
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync attendance record:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
        db.createObjectStore(ATTENDANCE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllRecords(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removeRecord(db, id) {
  const tx = db.transaction(ATTENDANCE_STORE, 'readwrite');
  const store = tx.objectStore(ATTENDANCE_STORE);
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
