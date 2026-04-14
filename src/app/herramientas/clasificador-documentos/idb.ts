// ─── IndexedDB helpers ────────────────────────────────────────────────────────
// We store raw ArrayBuffer bytes (not File objects) so the data is always
// readable regardless of browser security context or file-system availability.
export const IDB_NAME  = "clasificador_db"
export const IDB_STORE = "pending_files"

interface StoredFile {
  i:    number
  name: string
  type: string
  data: ArrayBuffer
}

export async function saveFilesToIDB(files: File[]): Promise<void> {
  // Read all file bytes upfront — this is the only moment we're guaranteed
  // the browser has unobstructed access to the user-selected files.
  const entries: StoredFile[] = await Promise.all(
    files.map(async (file, i) => ({
      i,
      name: file.name,
      type: file.type,
      data: await file.arrayBuffer(),
    }))
  )

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IDB_STORE))
        db.createObjectStore(IDB_STORE, { keyPath: "i" })
    }
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      const tx    = db.transaction(IDB_STORE, "readwrite")
      const store = tx.objectStore(IDB_STORE)
      store.clear()
      entries.forEach((entry) => store.put(entry))
      tx.oncomplete = () => resolve()
      tx.onerror    = () => reject(tx.error)
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
      const tx     = db.transaction(IDB_STORE, "readonly")
      const getAll = tx.objectStore(IDB_STORE).getAll()
      getAll.onsuccess = () => {
        const items = (getAll.result as StoredFile[])
        items.sort((a, b) => a.i - b.i)
        // Reconstruct File objects from stored bytes — always readable
        resolve(items.map((x) => new File([x.data], x.name, { type: x.type })))
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
