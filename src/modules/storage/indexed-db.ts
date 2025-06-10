export class IndexedDBStorage {
  private dbName = 'audio2youtube';
  private storeName = 'convertedFiles';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private version = 1;

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.initPromise;
  }

  private async withTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => void
  ): Promise<T> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(this.storeName, mode);
        const store = transaction.objectStore(this.storeName);

        operation(store);

        transaction.oncomplete = () => resolve(undefined as T);
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async saveConvertedFile(blob: Blob, fileName: string): Promise<void> {
    return this.withTransaction('readwrite', (store) => {
      store.put(blob, 'convertedBlob');
      store.put(fileName, 'originalFileName');
    });
  }

  async getConvertedFile(): Promise<{ blob: Blob | null; fileName: string | null }> {
    return new Promise((resolve, reject) => {
      this.withTransaction('readonly', (store) => {
        const blobRequest = store.get('convertedBlob');
        const fileNameRequest = store.get('originalFileName');

        let blob: Blob | null = null;
        let fileName: string | null = null;

        blobRequest.onsuccess = () => {
          blob = blobRequest.result;
          if (fileName !== null) resolve({ blob, fileName });
        };

        fileNameRequest.onsuccess = () => {
          fileName = fileNameRequest.result;
          if (blob !== null) resolve({ blob, fileName });
        };
      }).catch(reject);
    });
  }

  async clearConvertedFile(): Promise<void> {
    return this.withTransaction('readwrite', (store) => {
      store.delete('convertedBlob');
      store.delete('originalFileName');
    });
  }
} 