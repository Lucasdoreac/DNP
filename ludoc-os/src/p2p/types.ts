export interface Peer {
  id: string;           // sealedHash do peer
  endpoint: string;     // http://IP:PORT
  lastSeen: number;     // timestamp
  sessionToken?: string;
}

export interface GossipMessage {
  id: string;
  originPeer: string;   // sealedHash de quem originou
  hops: number;
  ttl: number;          // max hops antes de descartar
  payload: any;
  timestamp: number;
}

export interface GossipResult {
  messageId: string;
  forwarded: number;   // peers successfully notified
  skipped: number;     // peers that failed
  dropped: boolean;    // true if TTL expired or already seen
}
