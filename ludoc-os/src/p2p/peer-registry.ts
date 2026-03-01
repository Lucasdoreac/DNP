import { LudocStore } from "../db/ludoc-store.js";
import type { Peer } from "./types.js";

const INDEX_KEY = "peers:index";

export class PeerRegistry {
  private store: LudocStore;

  constructor(store: LudocStore) {
    this.store = store;
  }

  register(peer: Peer): void {
    this.store.setMemory(`peer:${peer.id}`, peer, "warm");
    // Maintain a flat index of all peer IDs
    const ids = this._loadIndex();
    if (!ids.includes(peer.id)) {
      ids.push(peer.id);
      this.store.setMemory(INDEX_KEY, ids, "warm");
    }
  }

  get(id: string): Peer | null {
    const entry = this.store.getMemory(`peer:${id}`);
    return entry ? JSON.parse(entry.data) : null;
  }

  list(): Peer[] {
    return this._loadIndex()
      .map(id => this.get(id))
      .filter((p): p is Peer => p !== null);
  }

  remove(id: string): void {
    // Note: LudocStore has no delete; we overwrite with a tombstone marker
    const ids = this._loadIndex().filter(i => i !== id);
    this.store.setMemory(INDEX_KEY, ids, "warm");
    // Peer entry left in store but excluded from index — acceptable for Phase 3.0
  }

  updateLastSeen(id: string): void {
    const peer = this.get(id);
    if (peer) {
      peer.lastSeen = Date.now();
      this.store.setMemory(`peer:${id}`, peer, "warm");
    }
  }

  /** Return peers seen within the last maxAgeMs milliseconds */
  getActivePeers(maxAgeMs: number = 300_000): Peer[] {
    const cutoff = Date.now() - maxAgeMs;
    return this.list().filter(p => p.lastSeen >= cutoff);
  }

  private _loadIndex(): string[] {
    const entry = this.store.getMemory(INDEX_KEY);
    if (!entry) return [];
    try {
      return JSON.parse(entry.data) as string[];
    } catch {
      return [];
    }
  }
}
