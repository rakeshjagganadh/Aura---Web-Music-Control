import { Track, Playlist, AppSettings, UserPreset, SongAudioProfile, DeviceProfile, WaveformMarker, AuraMoment } from '../types';

const DB_NAME = 'AuraAudioStudioDB';
const DB_VERSION = 3;

const STORES = {
  TRACKS: 'tracks',
  AUDIO_BLOBS: 'audio_blobs',
  PLAYLISTS: 'playlists',
  FAVORITES: 'favorites',
  SETTINGS: 'settings',
  USER_PRESETS: 'user_presets',
  SONG_PROFILES: 'song_profiles',
  DEVICE_PROFILES: 'device_profiles',
  MARKERS: 'markers',
  MOMENTS: 'moments',
};

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.TRACKS)) {
          db.createObjectStore(STORES.TRACKS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.AUDIO_BLOBS)) {
          db.createObjectStore(STORES.AUDIO_BLOBS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PLAYLISTS)) {
          db.createObjectStore(STORES.PLAYLISTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
          db.createObjectStore(STORES.FAVORITES, { keyPath: 'trackId' });
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORES.USER_PRESETS)) {
          db.createObjectStore(STORES.USER_PRESETS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SONG_PROFILES)) {
          db.createObjectStore(STORES.SONG_PROFILES, { keyPath: 'trackId' });
        }
        if (!db.objectStoreNames.contains(STORES.DEVICE_PROFILES)) {
          db.createObjectStore(STORES.DEVICE_PROFILES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.MARKERS)) {
          db.createObjectStore(STORES.MARKERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.MOMENTS)) {
          db.createObjectStore(STORES.MOMENTS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to open local music database.'));
      };
    });

    return this.dbPromise;
  }

  // --- Tracks & Audio Blobs ---

  async saveTrack(track: Track, audioBlob?: Blob): Promise<void> {
    const db = await this.getDB();
    
    // Save metadata (without large Blob in metadata store for speed)
    const metadata: Partial<Track> = { ...track };
    delete metadata.audioBlob;
    delete metadata.audioUrl;

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TRACKS, STORES.AUDIO_BLOBS], 'readwrite');
      const tracksStore = tx.objectStore(STORES.TRACKS);
      const blobsStore = tx.objectStore(STORES.AUDIO_BLOBS);

      tracksStore.put(metadata);

      if (audioBlob) {
        blobsStore.put({ id: track.id, blob: audioBlob });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllTracks(): Promise<Track[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRACKS, 'readonly');
      const store = tx.objectStore(STORES.TRACKS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAudioBlob(trackId: string): Promise<Blob | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AUDIO_BLOBS, 'readonly');
      const store = tx.objectStore(STORES.AUDIO_BLOBS);
      const request = store.get(trackId);

      request.onsuccess = () => {
        resolve(request.result?.blob || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTrack(trackId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TRACKS, STORES.AUDIO_BLOBS, STORES.FAVORITES, STORES.SONG_PROFILES], 'readwrite');
      tx.objectStore(STORES.TRACKS).delete(trackId);
      tx.objectStore(STORES.AUDIO_BLOBS).delete(trackId);
      tx.objectStore(STORES.FAVORITES).delete(trackId);
      tx.objectStore(STORES.SONG_PROFILES).delete(trackId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Playlists ---

  async getAllPlaylists(): Promise<Playlist[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PLAYLISTS, 'readonly');
      const store = tx.objectStore(STORES.PLAYLISTS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PLAYLISTS, 'readwrite');
      const store = tx.objectStore(STORES.PLAYLISTS);
      store.put(playlist);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PLAYLISTS, 'readwrite');
      const store = tx.objectStore(STORES.PLAYLISTS);
      store.delete(playlistId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Favorites ---

  async getFavorites(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.FAVORITES, 'readonly');
      const store = tx.objectStore(STORES.FAVORITES);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        resolve(items.map((i: { trackId: string }) => i.trackId));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setFavorite(trackId: string, isFav: boolean): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.FAVORITES, 'readwrite');
      const store = tx.objectStore(STORES.FAVORITES);
      if (isFav) {
        store.put({ trackId, addedAt: Date.now() });
      } else {
        store.delete(trackId);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- User Custom Presets ---

  async getAllUserPresets(): Promise<UserPreset[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USER_PRESETS, 'readonly');
      const store = tx.objectStore(STORES.USER_PRESETS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveUserPreset(preset: UserPreset): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USER_PRESETS, 'readwrite');
      const store = tx.objectStore(STORES.USER_PRESETS);
      store.put(preset);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteUserPreset(presetId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USER_PRESETS, 'readwrite');
      const store = tx.objectStore(STORES.USER_PRESETS);
      store.delete(presetId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Per-Song Audio Profiles ---

  async getSongProfile(trackId: string): Promise<SongAudioProfile | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SONG_PROFILES, 'readonly');
      const store = tx.objectStore(STORES.SONG_PROFILES);
      const request = store.get(trackId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSongProfile(profile: SongAudioProfile): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SONG_PROFILES, 'readwrite');
      const store = tx.objectStore(STORES.SONG_PROFILES);
      store.put(profile);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteSongProfile(trackId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SONG_PROFILES, 'readwrite');
      const store = tx.objectStore(STORES.SONG_PROFILES);
      store.delete(trackId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Device Profiles ---

  async getAllDeviceProfiles(): Promise<DeviceProfile[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DEVICE_PROFILES, 'readonly');
      const store = tx.objectStore(STORES.DEVICE_PROFILES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveDeviceProfile(device: DeviceProfile): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DEVICE_PROFILES, 'readwrite');
      const store = tx.objectStore(STORES.DEVICE_PROFILES);
      store.put(device);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Settings ---

  async getSettings(): Promise<AppSettings | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const request = store.get('app_settings');

      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETTINGS, 'readwrite');
      const store = tx.objectStore(STORES.SETTINGS);
      store.put({ key: 'app_settings', data: settings });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Markers ---

  async getMarkersForTrack(trackId: string): Promise<WaveformMarker[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MARKERS, 'readonly');
      const store = tx.objectStore(STORES.MARKERS);
      const request = store.getAll();

      request.onsuccess = () => {
        const all: WaveformMarker[] = request.result || [];
        resolve(all.filter(m => m.trackId === trackId).sort((a, b) => a.time - b.time));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMarkers(): Promise<WaveformMarker[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MARKERS, 'readonly');
      const store = tx.objectStore(STORES.MARKERS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveMarker(marker: WaveformMarker): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MARKERS, 'readwrite');
      const store = tx.objectStore(STORES.MARKERS);
      store.put(marker);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteMarker(markerId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MARKERS, 'readwrite');
      const store = tx.objectStore(STORES.MARKERS);
      store.delete(markerId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Aura Moments ---

  async getAllMoments(): Promise<AuraMoment[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MOMENTS, 'readonly');
      const store = tx.objectStore(STORES.MOMENTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const all: AuraMoment[] = request.result || [];
        resolve(all.sort((a, b) => b.createdAt - a.createdAt));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveMoment(moment: AuraMoment): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MOMENTS, 'readwrite');
      const store = tx.objectStore(STORES.MOMENTS);
      store.put(moment);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteMoment(momentId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MOMENTS, 'readwrite');
      const store = tx.objectStore(STORES.MOMENTS);
      store.delete(momentId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Storage stats & clear ---

  async getStorageUsage(): Promise<{ trackCount: number; approxBytes: number }> {
    try {
      const tracks = await this.getAllTracks();
      const approxBytes = tracks.reduce((acc, t) => acc + (t.fileSize || 0), 0);
      return { trackCount: tracks.length, approxBytes };
    } catch {
      return { trackCount: 0, approxBytes: 0 };
    }
  }

  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    const availableStores = Object.values(STORES).filter(storeName => 
      db.objectStoreNames.contains(storeName)
    );
    if (availableStores.length === 0) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(availableStores, 'readwrite');
      for (const store of availableStores) {
        tx.objectStore(store).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const storageService = new StorageService();
