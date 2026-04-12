// ─── IndexedDB helpers ────────────────────────────────────────────────────────
export const IDB_NAME = "clasificador_db"
export const IDB_STORE = "pending_files"

export async function saveFilesToIDB(files: File[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IDB_STORE))
        db.createObjectStore(IDB_STORE, { keyPath: "i" })
    }
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      const tx = db.transaction(IDB_STORE, "readwrite")
      const store = tx.objectStore(IDB_STORE)
      store.clear()
      files.forEach((file, i) => store.put({ i, file }))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function loadFilesFromIDB(): Promise<File[]> {
  return new Promise((resolve) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IDB_STORE)) { resolve([]); return }
      const tx = db.transaction(IDB_STORE, "readonly")
      const getAll = tx.objectStore(IDB_STORE).getAll()
      getAll.onsuccess = () => {
        const items = (getAll.result as { i: number; file: File }[])
        items.sort((a, b) => a.i - b.i)
        resolve(items.map((x) => x.file))
      }
      getAll.onerror = () => resolve([])
    }
    req.onerror = () => resolve([])
  })
}

export async function clearFilesFromIDB(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IDB_STORE)) { resolve(); return }
      const tx = db.transaction(IDB_STORE, "readwrite")
      tx.objectStore(IDB_STORE).clear()
      tx.oncomplete = () => resolve()
    }
    req.onerror = () => resolve()
  })
}
