/**
 * LUDOC CRYPTO INTEGRATION - Connect PGP to Kernel Validator
 *
 * Phase 2.1: Sovereign Identity Integration
 *
 * This module bridges the PGP Engine with the Protocol Validator.
 * When you run `ludoc validate`, it now checks:
 *
 * 1. Schema validity (Phase 2.0)
 * 2. Network conformance (Phase 2.0)
 * 3. Signature validity (Phase 2.1) ← NEW
 *
 * The protocol is no longer just a configuration file.
 * It is now a legally-signed document.
 */

import { readFileSync } from 'fs';
import { PGPEngine, BootstrapLock } from './pgp-engine.js';
import { Protocol } from '../kernel/schema.js';

/**
 * Crypto-Enhanced Validator
 *
 * Extends the Phase 2.0 validator with cryptographic identity checks.
 */
export class SovereignValidator {
  /**
   * Validate protocol with cryptographic signature check
   *
   * This is the Phase 2.1 integration point.
   * If protocol.yaml has a signature field, it MUST be valid.
   *
   * @param protocol The parsed protocol object
   * @param protocolFileContent The raw protocol.yaml file content
   * @param signatureFileContent Optional: the detached signature file content
   * @returns Validation result with crypto status
   */
  static async validateWithSignature(
    protocol: Protocol,
    protocolFileContent: string,
    signatureFileContent?: string
  ): Promise<{
    valid: boolean;
    schemaValid: boolean;
    signatureValid?: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ================================================================
    // STEP 1: Check if signature is defined in protocol
    // ================================================================

    // Note: In Phase 2.1, we extend the schema to include:
    // identity:
    //   primaryKey: { ... }
    //   signature: "-----BEGIN PGP SIGNATURE-----..."

    // For now (v2.1 early), we check if the protocol references a signature

    const hasSignatureField = (protocol as any).signature !== undefined;

    if (hasSignatureField && !signatureFileContent) {
      errors.push('[CRYPTO] Protocol declares a signature, but signature file is missing.');
      errors.push('[BOOTSTRAP] System refuses to boot without valid signature.');
      return {
        valid: false,
        schemaValid: true, // Schema is fine, but crypto is not
        signatureValid: false,
        errors,
        warnings,
      };
    }

    // ================================================================
    // STEP 2: If signature exists, validate it
    // ================================================================

    let signatureValid: boolean | undefined;

    if (hasSignatureField && signatureFileContent) {
      console.log('[CRYPTO] Signature detected. Validating...');

      const publicKey = protocol.identity?.primaryKey;

      if (!publicKey || !publicKey.public_key) {
        errors.push('[CRYPTO] publicKey not found in protocol.identity.primaryKey');
        signatureValid = false;
      } else {
        try {
          // YAML multiline strings preserve indentation; OpenPGP.js requires clean formatting
          const cleanPublicKey = publicKey.public_key.split('\n').map((line) => line.trim()).join('\n');
          signatureValid = await PGPEngine.verify(
            protocolFileContent,
            signatureFileContent,
            cleanPublicKey
          );

          if (!signatureValid) {
            errors.push('[SIGNATURE VIOLATION] Protocol has been tampered. Signature is invalid.');
            errors.push('[BOOTSTRAP] System refuses to boot with invalid signature.');
          } else {
            console.log('[CRYPTO] ✅ Signature is valid. Protocol is authentic.');
          }
        } catch (error) {
          errors.push(`[CRYPTO ERROR] Signature validation failed: ${String(error)}`);
          signatureValid = false;
        }
      }
    }

    // ================================================================
    // STEP 3: Return Result
    // ================================================================

    return {
      valid: errors.length === 0,
      schemaValid: true,
      signatureValid,
      errors,
      warnings,
    };
  }

  /**
   * Bootstrap Lock: Enforce signature before allowing system execution
   *
   * This is called FIRST in the bootstrap sequence.
   *
   * @param protocolFileContent The raw protocol.yaml content
   * @param protocol The parsed protocol object
   * @param signatureFileContent The signature file content (if exists)
   * @throws If signature validation fails
   */
  static async enforceBootstrapLock(
    protocolFileContent: string,
    protocol: Protocol,
    signatureFileContent?: string
  ): Promise<void> {
    let publicKey = protocol.identity?.primaryKey?.public_key;

    if (!publicKey) {
      console.warn('[BOOTSTRAP] No public key in identity. Skipping signature validation.');
      return;
    }

    if (!signatureFileContent) {
      console.warn('[BOOTSTRAP] No signature file. Skipping signature validation.');
      return;
    }

    // YAML multiline strings preserve indentation; OpenPGP.js requires clean formatting
    publicKey = publicKey.split('\n').map((line) => line.trim()).join('\n');

    // This will throw if signature is invalid
    await BootstrapLock.enforceProtocolIntegrity(
      protocolFileContent,
      signatureFileContent,
      publicKey
    );
  }
}

/**
 * Helper: Sign a protocol.yaml file and create signature file
 *
 * Phase 2.1: Operational in early form. Will be refined in 2.2.
 *
 * @param protocolFilePath Path to protocol.yaml
 * @param privateKeyArmored The sovereign's private key (PEM format)
 * @param passphrase If key is protected
 * @returns The detached signature string
 */
export async function signProtocol(
  protocolFilePath: string,
  privateKeyArmored: string,
  passphrase: string = ''
): Promise<string> {
  const protocolContent = readFileSync(protocolFilePath, 'utf-8');

  const signature = await PGPEngine.sign(protocolContent, privateKeyArmored, passphrase);

  console.log(`[CRYPTO] Protocol signed. Write to: ${protocolFilePath}.sig`);

  return signature;
}

/**
 * Helper: Validate a signed protocol
 *
 * Usage:
 * ```typescript
 * const result = await validateSignedProtocol(
 *   './protocol.yaml',
 *   './protocol.yaml.sig',
 *   publicKeyArmored
 * );
 * ```
 *
 * @param protocolFilePath Path to protocol.yaml
 * @param signatureFilePath Path to detached signature
 * @param publicKeyArmored The sovereign's public key
 * @returns true if valid, false otherwise
 */
export async function validateSignedProtocol(
  protocolFilePath: string,
  signatureFilePath: string,
  publicKeyArmored: string
): Promise<boolean> {
  const protocolContent = readFileSync(protocolFilePath, 'utf-8');
  const signatureContent = readFileSync(signatureFilePath, 'utf-8');

  return await PGPEngine.verify(protocolContent, signatureContent, publicKeyArmored);
}

/**
 * Phase 2.1 Schema Extension (Future - in kernel/schema.ts)
 *
 * The protocol will be extended to require:
 *
 * ```typescript
 * identity: {
 *   name: string,
 *   organization: string,
 *   primaryKey: {
 *     type: 'pgp' | 'ssh' | 'hardware-bound',
 *     fingerprint: string,
 *     public_key: string,  // ← PEM format
 *   },
 *   signature?: string,     // ← Detached signature (optional in 2.1, mandatory in 2.2)
 * }
 * ```
 *
 * When signature is present, the validator will use SovereignValidator.validateWithSignature()
 */
