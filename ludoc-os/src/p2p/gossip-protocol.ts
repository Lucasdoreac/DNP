import { randomBytes } from "crypto";
import type { GossipMessage, GossipResult, Peer } from "./types.js";
import { PeerRegistry } from "./peer-registry.js";

/** Max seen-message IDs to track in memory (FIFO eviction beyond this) */
const MAX_SEEN = 10_000;

/**
 * GossipEngine - Phase 3.0 Multi-Agent Swarm
 *
 * Fanout-based epidemic broadcast:
 *   - Each node forwards to FANOUT randomly chosen peers
 *   - TTL decremented per hop; message dropped at TTL=0
 *   - Seen-message deduplication prevents loops
 *   - Fire-and-forget HTTP; failures are counted but don't block
 */
export class GossipEngine {
  private registry: PeerRegistry;
  private fanout: number = 3;
  private selfId: string;
  private seenMessages: Set<string> = new Set();

  constructor(registry: PeerRegistry, selfId: string, fanout: number = 3) {
    this.registry = registry;
    this.selfId = selfId;
    this.fanout = fanout;
  }

  /**
   * Originate a new gossip message from this node.
   * ttl=6 → message travels at most 6 hops (fanout^6 = 729 potential paths)
   */
  originate(payload: any, ttl: number = 6): GossipMessage {
    return {
      id: `gossip_${Date.now()}_${randomBytes(3).toString("hex")}`,
      originPeer: this.selfId,
      hops: 0,
      ttl,
      payload,
      timestamp: Date.now(),
    };
  }

  /**
   * Spread a message to FANOUT randomly chosen eligible peers.
   * Call this when originating OR when forwarding a received message.
   */
  async spread(message: GossipMessage, knownPeers: Peer[]): Promise<GossipResult> {
    // Drop if TTL exhausted
    if (message.hops >= message.ttl) {
      console.log(`[GOSSIP] Drop ${message.id} — TTL exhausted (hops=${message.hops})`);
      return { messageId: message.id, forwarded: 0, skipped: 0, dropped: true };
    }

    // Dedup: drop if already seen
    if (this.seenMessages.has(message.id)) {
      return { messageId: message.id, forwarded: 0, skipped: 0, dropped: true };
    }
    this._markSeen(message.id);

    // Eligible = all peers except the message origin and ourselves
    const eligible = knownPeers.filter(
      p => p.id !== message.originPeer && p.id !== this.selfId
    );

    if (eligible.length === 0) {
      console.log(`[GOSSIP] No eligible peers for ${message.id}`);
      return { messageId: message.id, forwarded: 0, skipped: 0, dropped: false };
    }

    // Shuffle and take FANOUT targets
    const targets = this._shuffle(eligible).slice(0, this.fanout);

    const forwarded_msg: GossipMessage = { ...message, hops: message.hops + 1 };

    let forwarded = 0;
    let skipped = 0;

    // Fire-and-forget: don't await, let failures accumulate
    await Promise.all(
      targets.map(async peer => {
        try {
          const res = await fetch(`${peer.endpoint}/gossip/receive`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(forwarded_msg),
            signal: AbortSignal.timeout(3000), // 3s per peer
          });
          if (res.ok) {
            forwarded++;
            this.registry.updateLastSeen(peer.id);
            console.log(`[GOSSIP] ✓ Forwarded ${message.id} → ${peer.id.substring(0, 8)} (hop ${forwarded_msg.hops})`);
          } else {
            skipped++;
            console.warn(`[GOSSIP] ✗ ${peer.id.substring(0, 8)} returned ${res.status}`);
          }
        } catch (err) {
          skipped++;
          console.warn(`[GOSSIP] ✗ ${peer.id.substring(0, 8)} unreachable: ${(err as Error).message}`);
        }
      })
    );

    console.log(`[GOSSIP] ${message.id} — forwarded: ${forwarded}, skipped: ${skipped}, hop: ${forwarded_msg.hops}/${message.ttl}`);
    return { messageId: message.id, forwarded, skipped, dropped: false };
  }

  /**
   * Handle an incoming gossip message from another peer.
   * Deduplicates, then re-spreads to active peers in registry.
   */
  async receive(message: GossipMessage): Promise<GossipResult> {
    if (this.seenMessages.has(message.id)) {
      return { messageId: message.id, forwarded: 0, skipped: 0, dropped: true };
    }

    console.log(`[GOSSIP] Received ${message.id} from ${message.originPeer.substring(0, 8)} (hop ${message.hops}/${message.ttl})`);

    // Re-spread using known active peers from registry
    const activePeers = this.registry.getActivePeers(300_000); // seen in last 5 min
    return this.spread(message, activePeers);
  }

  /** Fisher-Yates shuffle */
  private _shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private _markSeen(id: string): void {
    if (this.seenMessages.size >= MAX_SEEN) {
      // FIFO eviction: remove oldest entry (first inserted)
      const oldest = this.seenMessages.values().next().value;
      if (oldest) this.seenMessages.delete(oldest);
    }
    this.seenMessages.add(id);
  }
}
