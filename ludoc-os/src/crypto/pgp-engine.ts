/**
 * LUDOC CRYPTO ENGINE - PGP/OpenPGP Integration
 *
 * Phase 2.1: Sovereign Identity via Cryptographic Signatures
 *
 * This module implements the core crypto operations:
 * - Sign: Create detached signature of protocol.yaml
 * - Verify: Validate that protocol.yaml is unaltered
 * - Bootstrap Lock: Abort if signature validation fails
 *
 * The hardware is free when the signature is valid.
 */

import * as openpgp from 'openpgp';
import { SovereignKey } from './types.js';

/**
 * PGP Engine - Cryptographic Identity Anchor
 *
 * Phase 2.0: Types defined
 * Phase 2.1: PGP validation active (this module)
 * Phase 2.2: Hardware UUID binding
 */
export class PGPEngine {
  /**
   * Generate a new PGP keypair
   *
   * @param name User name (e.g., "ludoc")
   * @param email Email address (metadata only, not identity anchor)
   * @returns Public key, private key, and fingerprint
   */
  static async generateKeypair(
    name: string,
    email: string,
    passphrase: string = ''
  ): Promise<{
    publicKey: string;
    privateKey: string;
    fingerprint: string;
  }> {
    console.log(`[PGP] Generating keypair for ${name} <${email}>...`);

    const result = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: 4096,
      userIDs: [{ name, email }],
      passphrase,
    });

    const publicKeyArmored = result.publicKey;
    const privateKeyArmored = result.privateKey;
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const fingerprint = publicKey.getFingerprint();

    return {
      publicKey: publicKeyArmored,
      privateKey: privateKeyArmored,
      fingerprint: fingerprint.toUpperCase(),
    };
  }

  /**
   * Sign a message (protocol.yaml content) with a private key
   *
   * @param message The content to sign (protocol.yaml as string)
   * @param privateKeyArmored The private key in armored format (PEM)
   * @param passphrase If the key is passphrase-protected
   * @returns Detached signature
   */
  static async sign(
    message: string,
    privateKeyArmored: string,
    passphrase: string = ''
  ): Promise<string> {
    console.log('[PGP] Signing protocol.yaml...');

    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });

    let unlockedKey = privateKey;
    if (passphrase) {
      unlockedKey = await openpgp.decryptKey({
        privateKey,
        passphrase,
      });
    }

    // Create message and sign
    const signature = await openpgp.sign({
      message: await openpgp.createMessage({ text: message }),
      signingKeys: unlockedKey,
      detached: true,
      format: 'armored',
    });

    console.log('[PGP] ✅ Signature created');
    return signature as string; // Detached signature
  }

  /**
   * Verify that a message matches a signature
   *
   * @param message The original content (protocol.yaml as string)
   * @param detachedSignature The signature to verify
   * @param publicKeyArmored The public key in armored format
   * @returns true if signature is valid, false otherwise
   */
  static async verify(
    message: string,
    detachedSignature: string,
    publicKeyArmored: string
  ): Promise<boolean> {
    console.log('[PGP] Verifying protocol.yaml signature...');

    try {
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
      const signature = await openpgp.readSignature({ armoredSignature: detachedSignature });

      const verified = await openpgp.verify({
        message: await openpgp.createMessage({ text: message }),
        signature: signature,
        verificationKeys: publicKey,
      });

      // Check if verification was successful
      // Note: verified.signatures[].verified is a Promise that needs to be awaited
      let signatureIsValid = false;
      if (verified.signatures && verified.signatures.length > 0) {
        for (const sig of verified.signatures) {
          try {
            const isValid = await sig.verified;
            if (isValid === true) {
              signatureIsValid = true;
              break;
            }
          } catch (_) {
            // Signature verification failed
            continue;
          }
        }
      }

      if (signatureIsValid) {
        console.log('[PGP] ✅ Signature verified - Protocol is authentic');
        return true;
      } else {
        console.log('[PGP] ❌ Signature invalid - Protocol has been tampered');
        return false;
      }
    } catch (error) {
      console.error('[PGP] ❌ Verification error:', error);
      return false;
    }
  }

  /**
   * Get fingerprint from public key
   *
   * @param publicKeyArmored The public key in armored format
   * @returns Fingerprint in uppercase hex
   */
  static async getFingerprint(publicKeyArmored: string): Promise<string> {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    return publicKey.getFingerprint().toUpperCase();
  }

  /**
   * Extract key info from armored key
   *
   * @param publicKeyArmored The public key in armored format
   * @returns Key metadata (name, email, fingerprint, creation date)
   */
  static async getKeyInfo(publicKeyArmored: string): Promise<{
    name: string;
    email: string;
    fingerprint: string;
    createdAt: Date;
    expiresAt?: Date;
  }> {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    const user = await publicKey.getPrimaryUser();
    const name = user?.user?.userID?.name || 'Unknown';
    const email = user?.user?.userID?.email || 'Unknown';
    const fingerprint = publicKey.getFingerprint().toUpperCase();

    // Handle creation date - can be number (timestamp) or Date
    let createdAt = new Date();
    if ((publicKey as any).created) {
      const created = (publicKey as any).created;
      if (created instanceof Date) {
        createdAt = created;
      } else if (typeof created === 'number') {
        createdAt = new Date(created * 1000);
      }
    }

    let expiresAt: Date | undefined;
    try {
      const expirationTime = await publicKey.getExpirationTime();
      if (expirationTime) {
        if (expirationTime instanceof Date) {
          expiresAt = expirationTime;
        } else if (typeof expirationTime === 'number') {
          expiresAt = new Date(expirationTime * 1000);
        }
      }
    } catch (_) {
      // Ignore if expiration time cannot be determined
    }

    return { name, email, fingerprint, createdAt, expiresAt };
  }

  /**
   * Validate a SovereignKey object
   *
   * This is the Phase 2.1 integration point with the identity framework.
   *
   * @param key The SovereignKey to validate
   * @param publicKeyArmored The actual public key (for fingerprint comparison)
   * @returns Validation result
   */
  static async validateSovereignKey(
    key: SovereignKey,
    publicKeyArmored: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // Get actual fingerprint from key first (to validate format)
    try {
      const actualFingerprint = await this.getFingerprint(publicKeyArmored);

      // Check fingerprint format and match
      if (!key.fingerprint || key.fingerprint.length < 40) {
        return { valid: false, reason: 'Fingerprint too short or missing' };
      }

      if (actualFingerprint !== key.fingerprint) {
        return {
          valid: false,
          reason: `Fingerprint mismatch: expected ${key.fingerprint}, got ${actualFingerprint}`,
        };
      }

      // Check key type
      if (!['pgp', 'ssh', 'hardware-bound'].includes(key.type)) {
        return { valid: false, reason: `Invalid key type: ${key.type}` };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: `Key validation error: ${String(error)}` };
    }
  }
}

/**
 * Bootstrap Lock Mechanism
 *
 * This is the enforcement layer. If protocol.yaml signature is invalid,
 * the system refuses to proceed. Period.
 */
export class BootstrapLock {
  /**
   * Verify protocol integrity before bootstrap
   *
   * This must be called as the FIRST step in any Ludoc OS initialization.
   *
   * @param protocolContent The full protocol.yaml file content
   * @param signature The detached signature
   * @param publicKey The sovereign's public key
   * @throws Error if signature is invalid (Bootstrap Lock engaged)
   */
  static async enforceProtocolIntegrity(
    protocolContent: string,
    signature: string,
    publicKey: string
  ): Promise<void> {
    console.log('[BOOTSTRAP] Enforcing protocol integrity...');

    const isValid = await PGPEngine.verify(protocolContent, signature, publicKey);

    if (!isValid) {
      throw new Error(
        '[BOOTSTRAP LOCK] Protocol signature validation failed. System refuses to boot. The hardware is not free.'
      );
    }

    console.log('[BOOTSTRAP] ✅ Protocol integrity verified. Proceeding.');
  }
}

/**
 * Phase 2.1 Status
 *
 * ✅ PGP Engine: Complete (sign, verify, key generation)
 * ✅ Bootstrap Lock: Complete (enforcement layer)
 * ⏳ Integration with Validator Core: Next (src/crypto/integration.ts)
 * ⏳ Hardware UUID Binding: Phase 2.2
 * ⏳ P2P Agêntico: Phase 2.3
 */
