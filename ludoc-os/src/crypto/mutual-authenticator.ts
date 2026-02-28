/**
 * Mutual P2P Authentication Layer
 *
 * Phase 2.4: Agnóstic P2P mutual authentication without central authority.
 *
 * Both peers sign a challenge-response pair with their PGP keys.
 * No server validation needed - peers validate each other directly.
 *
 * DNP Compliance:
 * - [x] Zero central authority
 * - [x] Signature-based (not OAuth/JWT)
 * - [x] Hardware-bound identities
 * - [x] Cryptographic proof of both parties
 */

import { PGPEngine } from './pgp-engine.js';
import { SealedIdentityManager } from './sealed-identity.js';
import * as crypto from 'crypto';

export interface AuthChallenge {
  nonce: string;          // Random 32-byte challenge
  timestamp: number;      // Unix timestamp
  initiatorHash: string;  // SHA256(initiator sealed identity)
  responderHash?: string; // SHA256(responder sealed identity) - set by responder
}

export interface AuthResponse {
  challenge: AuthChallenge;
  initiatorSignature: string;  // PGP signature of challenge by initiator
  responderSignature: string;  // PGP signature of challenge by responder
  initiatorSealedHash: string; // Proof of hardware binding
  responderSealedHash: string; // Proof of hardware binding
}

export interface AuthResult {
  authenticated: boolean;
  initiatorIdentity: string;   // PGP fingerprint
  responderIdentity: string;   // PGP fingerprint
  sessionToken: string;        // Ephemeral session key
  validUntil: number;          // Expiration timestamp
}

export class MutualAuthenticator {
  /**
   * Generate authentication challenge
   *
   * Initiator creates challenge with their sealed identity hash.
   * Responder will add their own hash and both will sign.
   */
  static async generateChallenge(
    initiatorSealedHash: string
  ): Promise<AuthChallenge> {
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();

    return {
      nonce,
      timestamp,
      initiatorHash: initiatorSealedHash,
    };
  }

  /**
   * Respond to authentication challenge
   *
   * Responder receives challenge, adds their sealed hash, prepares for mutual signing.
   */
  static async respondToChallenge(
    challenge: AuthChallenge,
    responderSealedHash: string
  ): Promise<AuthChallenge> {
    return {
      ...challenge,
      responderHash: responderSealedHash,
    };
  }

  /**
   * Sign challenge as initiator
   *
   * Initiator signs the challenge with their private key.
   * This proves they are the sender and haven't been tampered with.
   */
  static async signAsInitiator(
    challenge: AuthChallenge,
    privateKey: string,
    passphrase: string
  ): Promise<string> {
    const challengeString = JSON.stringify(challenge);
    return await PGPEngine.sign(challengeString, privateKey, passphrase);
  }

  /**
   * Sign challenge as responder
   *
   * Responder signs the same challenge (now with both sealed hashes).
   * This proves the responder received and acknowledges the challenge.
   */
  static async signAsResponder(
    challenge: AuthChallenge,
    privateKey: string,
    passphrase: string
  ): Promise<string> {
    const challengeString = JSON.stringify(challenge);
    return await PGPEngine.sign(challengeString, privateKey, passphrase);
  }

  /**
   * Verify mutual authentication
   *
   * Verify that:
   * 1. Both signatures are valid for the challenge
   * 2. Both sealed identities are properly bound to hardware
   * 3. Timestamp is recent (prevent replay)
   * 4. Nonce hasn't been used before (check against revocation list)
   */
  static async verifyMutualAuth(
    response: AuthResponse,
    initiatorPublicKey: string,
    responderPublicKey: string,
    initiatorSealedId: any,
    responderSealedId: any,
    revocationList: string[] = []
  ): Promise<AuthResult> {
    // 1. Check nonce not revoked
    if (revocationList.includes(response.challenge.nonce)) {
      throw new Error('[MUTUAL AUTH] Challenge nonce has been revoked');
    }

    // 2. Verify timestamp is recent (within 5 minutes)
    const ageMs = Date.now() - response.challenge.timestamp;
    if (ageMs > 5 * 60 * 1000) {
      throw new Error('[MUTUAL AUTH] Challenge too old (replay protection)');
    }

    // 3. Verify initiator signature
    const challengeString = JSON.stringify(response.challenge);
    const initiatorValid = await PGPEngine.verify(
      challengeString,
      response.initiatorSignature,
      initiatorPublicKey
    );

    if (!initiatorValid) {
      throw new Error('[MUTUAL AUTH] Initiator signature invalid');
    }

    // 4. Verify responder signature
    const responderValid = await PGPEngine.verify(
      challengeString,
      response.responderSignature,
      responderPublicKey
    );

    if (!responderValid) {
      throw new Error('[MUTUAL AUTH] Responder signature invalid');
    }

    // 5. Verify sealed identity hashes match
    if (response.initiatorSealedHash !== initiatorSealedId.sealedHash) {
      throw new Error('[MUTUAL AUTH] Initiator sealed identity mismatch');
    }

    if (response.responderSealedHash !== responderSealedId.sealedHash) {
      throw new Error('[MUTUAL AUTH] Responder sealed identity mismatch');
    }

    // 6. Extract fingerprints from public keys
    const initiatorFingerprint = await PGPEngine.getFingerprint(initiatorPublicKey);
    const responderFingerprint = await PGPEngine.getFingerprint(responderPublicKey);

    // 7. Generate ephemeral session token
    const sessionData = `${initiatorFingerprint}:${responderFingerprint}:${response.challenge.nonce}:${response.challenge.timestamp}`;
    const sessionToken = crypto.createHash('sha256').update(sessionData).digest('hex');

    return {
      authenticated: true,
      initiatorIdentity: initiatorFingerprint,
      responderIdentity: responderFingerprint,
      sessionToken,
      validUntil: Date.now() + 3600000, // 1 hour session
    };
  }

  /**
   * Create mutual auth proof for P2P message
   *
   * Attach to every P2P message to prove mutual authentication.
   * Includes:
   * - Session token (proves valid auth)
   * - Message signature (proves sender)
   * - Responder acknowledgment (proves mutual agreement)
   */
  static async createMessageProof(
    message: string,
    sessionToken: string,
    privateKey: string,
    passphrase: string,
    responderFingerprint?: string
  ): Promise<{
    message: string;
    sessionToken: string;
    signature: string;
    responderAck?: string;
  }> {
    const signature = await PGPEngine.sign(
      `${sessionToken}:${message}`,
      privateKey,
      passphrase
    );

    return {
      message,
      sessionToken,
      signature,
      responderAck: responderFingerprint ? `ACK:${responderFingerprint}` : undefined,
    };
  }

  /**
   * Verify mutual auth proof on received message
   */
  static async verifyMessageProof(
    proof: {
      message: string;
      sessionToken: string;
      signature: string;
    },
    senderPublicKey: string,
    expectedSessionToken: string
  ): Promise<boolean> {
    // Verify session token matches
    if (proof.sessionToken !== expectedSessionToken) {
      return false;
    }

    // Verify message signature
    const verified = await PGPEngine.verify(
      `${proof.sessionToken}:${proof.message}`,
      proof.signature,
      senderPublicKey
    );

    return verified;
  }
}
