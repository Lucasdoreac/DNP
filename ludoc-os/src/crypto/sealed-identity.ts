/**
 * LUDOC SEALED IDENTITY - Phase 2.1 + 2.2 Integration
 *
 * Seals cryptographic identity to hardware via composite binding:
 * SHA256(PGP_fingerprint + hardware_uuid)
 *
 * Once sealed, identity becomes inseparable from hardware.
 * Cost: Portability. Benefit: Unbreakable sovereignty.
 *
 * Storage: .ludoc/sealed-identity.json (machine-specific, .gitignore'd)
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { dirname } from 'path';
import { HardwareDiscovery, UUIDDiscovery } from '../hardware/discovery.js';

export interface SealedIdentity {
  version: '2.2';
  pgpFingerprint: string;
  hardwareUUID: string;
  hardwareSource: string;
  hardwareConfidence: 'high' | 'medium' | 'low';
  sealedHash: string;
  createdAt: string;
  platform: string;
}

export interface SealedIdentityVerification {
  valid: boolean;
  sealed: SealedIdentity | null;
  error?: string;
  warnings: string[];
}

export class SealedIdentityManager {
  private static readonly SEALED_PATH = '.ludoc/sealed-identity.json';

  /**
   * Create a new sealed identity
   * Combines PGP fingerprint (Phase 2.1) with hardware UUID (Phase 2.2)
   */
  static async seal(pgpFingerprint: string): Promise<SealedIdentity> {
    console.log('[SEALED] Sealing identity to hardware...');

    // Validate PGP fingerprint
    if (!pgpFingerprint || pgpFingerprint.length < 40) {
      throw new Error('[SEALED] Invalid PGP fingerprint format');
    }

    // Discover hardware UUID
    const hardware = await HardwareDiscovery.getHardwareID();

    // Warn if confidence is low
    if (hardware.confidence === 'low') {
      console.warn(`[SEALED] ⚠️  Low confidence hardware UUID source: ${hardware.source}`);
      console.warn('[SEALED] Identity may not survive hardware changes');
    }

    // Create sealed identity
    const sealed: SealedIdentity = {
      version: '2.2',
      pgpFingerprint,
      hardwareUUID: hardware.uuid,
      hardwareSource: hardware.source,
      hardwareConfidence: hardware.confidence,
      sealedHash: this.createSealHash(pgpFingerprint, hardware.uuid),
      createdAt: new Date().toISOString(),
      platform: hardware.platform,
    };

    console.log(`[SEALED] ✅ Identity sealed`);
    console.log(`[SEALED] - PGP Fingerprint: ${pgpFingerprint}`);
    console.log(`[SEALED] - Hardware UUID: ${hardware.uuid}`);
    console.log(`[SEALED] - Sealed Hash: ${sealed.sealedHash}`);

    return sealed;
  }

  /**
   * Persist sealed identity to .ludoc/sealed-identity.json
   */
  static async persist(sealed: SealedIdentity): Promise<void> {
    try {
      // Create .ludoc directory if needed
      const dir = dirname(this.SEALED_PATH);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Write sealed identity
      writeFileSync(this.SEALED_PATH, JSON.stringify(sealed, null, 2), 'utf-8');
      console.log(`[SEALED] Persisted to ${this.SEALED_PATH}`);
    } catch (error) {
      throw new Error(`[SEALED] Failed to persist sealed identity: ${String(error)}`);
    }
  }

  /**
   * Load sealed identity from disk
   */
  static async load(): Promise<SealedIdentity | null> {
    try {
      if (!existsSync(this.SEALED_PATH)) {
        return null;
      }

      const content = readFileSync(this.SEALED_PATH, 'utf-8');
      const sealed = JSON.parse(content) as SealedIdentity;

      return sealed;
    } catch (error) {
      console.error(`[SEALED] Error loading sealed identity: ${String(error)}`);
      return null;
    }
  }

  /**
   * Verify that current hardware matches sealed identity
   * Returns true if identity is valid and bound to this hardware
   */
  static async verify(): Promise<SealedIdentityVerification> {
    const warnings: string[] = [];

    // Load sealed identity from disk
    const sealed = await this.load();
    if (!sealed) {
      return {
        valid: false,
        sealed: null,
        error: '[SEALED] No sealed identity found. Run bootstrap with --seal to create one.',
        warnings,
      };
    }

    // Discover current hardware
    let hardware: UUIDDiscovery;
    try {
      hardware = await HardwareDiscovery.getHardwareID();
    } catch (error) {
      return {
        valid: false,
        sealed,
        error: `[SEALED] Failed to discover hardware: ${String(error)}`,
        warnings,
      };
    }

    // Verify hardware UUID matches
    if (hardware.uuid !== sealed.hardwareUUID) {
      return {
        valid: false,
        sealed,
        error: `[SEALED] Hardware mismatch! Identity is sealed to different hardware.`,
        warnings: [
          `Expected UUID: ${sealed.hardwareUUID} (from ${sealed.hardwareSource})`,
          `Current UUID:  ${hardware.uuid} (from ${hardware.source})`,
          'This likely means:',
          '  1. You moved this sealed identity to another machine (not supported)',
          '  2. Your hardware changed (replaced disk, VM reinit, etc.)',
          '  3. Hardware UUID discovery strategy changed',
        ],
      };
    }

    // Verify sealed hash
    const expectedHash = this.createSealHash(sealed.pgpFingerprint, hardware.uuid);
    if (expectedHash !== sealed.sealedHash) {
      return {
        valid: false,
        sealed,
        error: '[SEALED] Seal integrity check failed. Hash mismatch.',
        warnings: [
          `Expected hash: ${sealed.sealedHash}`,
          `Current hash:  ${expectedHash}`,
          'This should never happen unless data was corrupted.',
        ],
      };
    }

    // Low confidence warning
    if (hardware.confidence === 'low') {
      warnings.push(
        `⚠️  Hardware UUID has LOW confidence: ${hardware.source}`,
        'Identity may not survive hardware changes.'
      );
    }

    // All checks passed
    return {
      valid: true,
      sealed,
      warnings,
    };
  }

  /**
   * Create seal hash from fingerprint + hardware UUID
   * This is the immutable binding that locks identity to hardware
   */
  private static createSealHash(pgpFingerprint: string, hardwareUUID: string): string {
    const combined = `${pgpFingerprint}${hardwareUUID}`;
    return createHash('sha256').update(combined).digest('hex').toUpperCase();
  }
}

/**
 * Phase 2.2 Status
 *
 * ✅ Environment Detection: Complete (src/hardware/environment.ts)
 * ✅ Hardware UUID Discovery: Complete (src/hardware/discovery.ts)
 * ✅ Sealed Identity Binding: Complete (this module)
 * ⏳ Bootstrap v2 Integration: Next (src/kernel/bootstrap-v2.ts)
 * ⏳ Comprehensive Tests: Phase 2.2 (tests/hardware.test.ts)
 */
