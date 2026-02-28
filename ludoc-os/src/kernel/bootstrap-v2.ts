/**
 * LUDOC BOOTSTRAP v2 - Phase 2.1 + 2.2 Complete
 *
 * Sovereign Identity Verification with Hardware Binding
 *
 * Bootstrap flow:
 * 1. Verify PGP signature (Phase 2.1)
 * 2. Discover hardware UUID (Phase 2.2)
 * 3. Check/Create sealed identity (Phase 2.2)
 * 4. Proceed or abort with sealed lock
 *
 * "The hardware is free only when the signature is valid AND identity is sealed to hardware."
 */

import { ProtocolValidator } from './validator.js';
import { PGPEngine } from '../crypto/pgp-engine.js';
import { SealedIdentityManager, SealedIdentity } from '../crypto/sealed-identity.js';
import { readFileSync, existsSync } from 'fs';

export interface BootstrapResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  phase21: {
    signatureValid?: boolean;
  };
  phase22: {
    sealed?: SealedIdentity | null;
    sealVerified?: boolean;
  };
  protocol?: any;
  workspace?: any;
}

export class BootstrapV2 {
  /**
   * Complete bootstrap with Phase 2.1 + Phase 2.2 verification
   */
  static async execute(
    protocolPath: string = './protocol.yaml',
    workspacePath: string = './workspace.json',
    signaturePath: string | null = null,
    options: {
      verbose?: boolean;
      seal?: boolean; // Create sealed identity on first boot
    } = {}
  ): Promise<BootstrapResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log('\n[BOOTSTRAP v2] 🚀 Initializing sovereignty...\n');

    const result: BootstrapResult = {
      valid: false,
      errors,
      warnings,
      phase21: {},
      phase22: {},
    };

    // ================================================================
    // PHASE 2.0: Schema & Config Validation (Existing Validator)
    // ================================================================

    console.log('[BOOTSTRAP v2] Phase 2.0: Validating protocol schema...');

    const validator = new ProtocolValidator(protocolPath, workspacePath, signaturePath, options.verbose);
    const validationResult = await validator.validate();

    if (!validationResult.valid) {
      errors.push(...validationResult.errors);
      return result; // Abort immediately
    }

    result.protocol = validationResult.protocol;
    result.workspace = validationResult.workspace;
    console.log('[BOOTSTRAP v2] ✅ Schema validation passed\n');

    // ================================================================
    // PHASE 2.1: Cryptographic Signature Verification
    // ================================================================

    console.log('[BOOTSTRAP v2] Phase 2.1: Verifying cryptographic signature...');

    let signatureValid = false;

    // Determine signature file
    let sigPath = signaturePath;
    if (!sigPath && existsSync(`${protocolPath}.sig`)) {
      sigPath = `${protocolPath}.sig`;
    }

    if (sigPath) {
      try {
        if (!existsSync(sigPath)) {
          errors.push(`[BOOTSTRAP v2] Signature file not found: ${sigPath}`);
          return result; // Abort
        }

        const protocolContent = readFileSync(protocolPath, 'utf-8');
        const signatureContent = readFileSync(sigPath, 'utf-8');
        const publicKey = result.protocol.identity?.primaryKey?.public_key;

        if (!publicKey) {
          errors.push('[BOOTSTRAP v2] No public key in protocol.yaml identity.primaryKey.public_key');
          return result; // Abort
        }

        signatureValid = await PGPEngine.verify(protocolContent, signatureContent, publicKey);

        if (!signatureValid) {
          errors.push('[BOOTSTRAP v2] ❌ Signature verification FAILED. Protocol has been tampered.');
          return result; // Abort
        }

        console.log('[BOOTSTRAP v2] ✅ Signature verification passed\n');
      } catch (error) {
        errors.push(`[BOOTSTRAP v2] Error during signature verification: ${String(error)}`);
        return result; // Abort
      }
    } else {
      console.log('[BOOTSTRAP v2] ℹ️  No signature found. Phase 2.1 verification skipped.\n');
      warnings.push('Phase 2.1 (PGP signature) is optional. Will be mandatory in Phase 2.3.');
    }

    result.phase21.signatureValid = signatureValid;

    // ================================================================
    // PHASE 2.2: Hardware Binding & Sealed Identity
    // ================================================================

    console.log('[BOOTSTRAP v2] Phase 2.2: Verifying hardware-bound identity...');

    const pgpFingerprint = result.protocol.identity?.primaryKey?.fingerprint;
    if (!pgpFingerprint) {
      errors.push('[BOOTSTRAP v2] No PGP fingerprint in protocol.identity.primaryKey.fingerprint');
      return result; // Abort
    }

    // Check if sealed identity exists
    const existingSealed = await SealedIdentityManager.load();

    if (existingSealed) {
      // Verify existing sealed identity
      const verification = await SealedIdentityManager.verify();

      if (!verification.valid) {
        errors.push(`[BOOTSTRAP v2] ${verification.error}`);
        if (verification.warnings.length > 0) {
          errors.push(...verification.warnings.map((w) => `  ${w}`));
        }
        return result; // Abort - identity mismatch
      }

      // Verify fingerprint matches
      if (verification.sealed && verification.sealed.pgpFingerprint !== pgpFingerprint) {
        errors.push(
          '[BOOTSTRAP v2] PGP fingerprint mismatch. Protocol identity changed after sealing.'
        );
        return result; // Abort - identity tampering
      }

      if (verification.warnings.length > 0) {
        warnings.push(...verification.warnings);
      }

      result.phase22.sealed = verification.sealed;
      result.phase22.sealVerified = true;
      console.log('[BOOTSTRAP v2] ✅ Sealed identity verified\n');
    } else {
      // First boot - create sealed identity if requested
      if (options.seal) {
        console.log('[BOOTSTRAP v2] First boot detected. Creating sealed identity...');

        try {
          const sealed = await SealedIdentityManager.seal(pgpFingerprint);
          await SealedIdentityManager.persist(sealed);

          result.phase22.sealed = sealed;
          result.phase22.sealVerified = true;
          console.log('[BOOTSTRAP v2] ✅ Sealed identity created and persisted\n');
        } catch (error) {
          errors.push(`[BOOTSTRAP v2] Failed to create sealed identity: ${String(error)}`);
          return result; // Abort
        }
      } else {
        // No sealed identity, no request to create one
        console.log('[BOOTSTRAP v2] ℹ️  No sealed identity found. Phase 2.2 optional on first boot.\n');
        warnings.push(
          'Run with --seal flag to create hardware-bound identity for maximum sovereignty.'
        );
      }
    }

    // ================================================================
    // BOOTSTRAP SUCCESS
    // ================================================================

    result.valid = true;

    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ BOOTSTRAP v2 SUCCESSFUL');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`Phase 2.0: Schema validation - PASSED`);
    console.log(`Phase 2.1: PGP signature ${signatureValid ? 'VERIFIED' : 'SKIPPED'}`);
    console.log(`Phase 2.2: Hardware binding ${result.phase22.sealVerified ? 'VERIFIED' : 'OPTIONAL'}`);
    console.log('════════════════════════════════════════════════════════════\n');

    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach((w) => console.log(`  - ${w}`));
      console.log();
    }

    return result;
  }

  /**
   * Display sealed identity info
   */
  static async showSealedIdentity(): Promise<void> {
    const sealed = await SealedIdentityManager.load();

    if (!sealed) {
      console.log('[SEALED] No sealed identity found');
      return;
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  SEALED IDENTITY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Version:           ${sealed.version}`);
    console.log(`Platform:          ${sealed.platform}`);
    console.log(`PGP Fingerprint:   ${sealed.pgpFingerprint}`);
    console.log(`Hardware UUID:     ${sealed.hardwareUUID}`);
    console.log(`UUID Source:       ${sealed.hardwareSource}`);
    console.log(`UUID Confidence:   ${sealed.hardwareConfidence}`);
    console.log(`Sealed Hash:       ${sealed.sealedHash}`);
    console.log(`Created At:        ${sealed.createdAt}`);
    console.log('═══════════════════════════════════════════════════\n');
  }
}

// ================================================================
// CLI ENTRY POINT
// ================================================================

// @ts-ignore - Bun-specific feature
if (import.meta.main) {
  const protocolPath = process.env.PROTOCOL_PATH || './protocol.yaml';
  const workspacePath = process.env.WORKSPACE_PATH || './workspace.json';
  const signaturePath = process.env.SIGNATURE_PATH || null;
  const seal = process.argv.includes('--seal');
  const verbose = process.argv.includes('--verbose');

  BootstrapV2.execute(protocolPath, workspacePath, signaturePath, {
    verbose,
    seal,
  })
    .then((result) => {
      if (result.valid) {
        process.exit(0);
      } else {
        console.log('\n❌ BOOTSTRAP FAILED\n');
        result.errors.forEach((err) => console.log(err));
        console.log();
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n🚨 FATAL BOOTSTRAP ERROR\n', error);
      process.exit(1);
    });
}

export default BootstrapV2;

/**
 * Phase 2.2 Complete Architecture
 *
 * ✅ Phase 2.0: Schema validation (ProtocolValidator)
 * ✅ Phase 2.1: Cryptographic binding (PGPEngine + BootstrapLock)
 * ✅ Phase 2.2: Hardware binding (HardwareDiscovery + SealedIdentityManager)
 * ✅ Bootstrap v2: Complete integration (this module)
 *
 * Next: Phase 2.3 - P2P Agêntico
 *       Phase 3.0 - Multi-Machine Sovereignty
 */
