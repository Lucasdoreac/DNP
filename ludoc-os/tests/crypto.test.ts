/**
 * LUDOC CRYPTO - Test Suite
 *
 * Tests that cryptographic identity works correctly.
 * If a test fails here, the sovereignty is compromised.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PGPEngine, BootstrapLock } from '../src/crypto/pgp-engine.js';

describe('LUDOC Crypto - Phase 2.1 (Sovereign Identity)', () => {
  let publicKey: string;
  let privateKey: string;
  let fingerprint: string;

  // ================================================================
  // Setup: Generate keypair for testing
  // ================================================================

  beforeAll(async () => {
    console.log('[TEST SETUP] Generating test keypair...');

    const result = await PGPEngine.generateKeypair(
      'ludoc-test',
      'test@ludoc.dev',
      'test-passphrase'
    );

    publicKey = result.publicKey;
    privateKey = result.privateKey;
    fingerprint = result.fingerprint;

    console.log(`[TEST SETUP] Keypair generated. Fingerprint: ${fingerprint}`);
  });

  // ================================================================
  // Test 1: Keypair Generation
  // ================================================================

  it('should generate valid PGP keypair', async () => {
    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();
    expect(fingerprint).toBeDefined();
    expect(fingerprint.length).toBeGreaterThanOrEqual(40);
  });

  it('should have valid key structure', async () => {
    expect(publicKey).toContain('-----BEGIN PGP PUBLIC KEY BLOCK-----');
    expect(privateKey).toContain('-----BEGIN PGP PRIVATE KEY BLOCK-----');
  });

  // ================================================================
  // Test 2: Message Signing
  // ================================================================

  it('should sign a protocol.yaml message', async () => {
    const protocolContent = `version: "2.0.0"
framework: ludoc
identity:
  name: ludoc
  organization: ludoc-productions`;

    const signature = await PGPEngine.sign(protocolContent, privateKey, 'test-passphrase');

    expect(signature).toBeDefined();
    expect(signature.length).toBeGreaterThan(0);
    expect(signature).toContain('-----BEGIN PGP SIGNATURE-----');
  });

  // ================================================================
  // Test 3: Signature Verification (Valid Signature)
  // ================================================================

  it('should verify a valid signature', async () => {
    const message = 'protocol.yaml signed content';

    const signature = await PGPEngine.sign(message, privateKey, 'test-passphrase');
    const isValid = await PGPEngine.verify(message, signature, publicKey);

    expect(isValid).toBe(true);
  });

  // ================================================================
  // Test 4: Signature Verification (Tampered Message)
  // ================================================================

  it('should reject signature if message is tampered', async () => {
    const originalMessage = 'original protocol content';
    const tamperedMessage = 'tampered protocol content';

    const signature = await PGPEngine.sign(originalMessage, privateKey, 'test-passphrase');
    const isValid = await PGPEngine.verify(tamperedMessage, signature, publicKey);

    expect(isValid).toBe(false);
  });

  // ================================================================
  // Test 5: Fingerprint Extraction
  // ================================================================

  it('should extract correct fingerprint from public key', async () => {
    const extractedFingerprint = await PGPEngine.getFingerprint(publicKey);

    expect(extractedFingerprint).toBe(fingerprint);
  });

  // ================================================================
  // Test 6: Key Metadata
  // ================================================================

  it('should extract key metadata (name, email, fingerprint)', async () => {
    const keyInfo = await PGPEngine.getKeyInfo(publicKey);

    expect(keyInfo.name).toBe('ludoc-test');
    expect(keyInfo.email).toBe('test@ludoc.dev');
    expect(keyInfo.fingerprint).toBe(fingerprint);
    expect(keyInfo.createdAt).toBeInstanceOf(Date);
  });

  // ================================================================
  // Test 7: Bootstrap Lock - Valid Signature
  // ================================================================

  it('should allow bootstrap with valid signature', async () => {
    const protocolContent = 'protocol.yaml content';
    const signature = await PGPEngine.sign(protocolContent, privateKey, 'test-passphrase');

    // Should NOT throw
    await expect(
      BootstrapLock.enforceProtocolIntegrity(protocolContent, signature, publicKey)
    ).resolves.toBeUndefined();
  });

  // ================================================================
  // Test 8: Bootstrap Lock - Invalid Signature
  // ================================================================

  it('should reject bootstrap with invalid signature', async () => {
    const protocolContent = 'protocol.yaml content';
    const invalidSignature = 'invalid signature data';

    // Should throw
    await expect(
      BootstrapLock.enforceProtocolIntegrity(protocolContent, invalidSignature, publicKey)
    ).rejects.toThrow('[BOOTSTRAP LOCK]');
  });

  // ================================================================
  // Test 9: Bootstrap Lock - Tampered Content
  // ================================================================

  it('should reject bootstrap if protocol content is tampered', async () => {
    const originalContent = 'original protocol content';
    const tamperedContent = 'tampered protocol content';

    const signature = await PGPEngine.sign(originalContent, privateKey, 'test-passphrase');

    // Should throw because content doesn't match signature
    await expect(
      BootstrapLock.enforceProtocolIntegrity(tamperedContent, signature, publicKey)
    ).rejects.toThrow('[BOOTSTRAP LOCK]');
  });

  // ================================================================
  // Test 10: Real-World Scenario
  // ================================================================

  it('should handle a complete sign/verify cycle like real deployment', async () => {
    // Simulating: protocol.yaml, private key, public key distribution

    const protocolYaml = `version: "2.0.0"
framework: ludoc
identity:
  name: ludoc
  organization: ludoc-productions
  primaryKey:
    type: pgp
    fingerprint: ${fingerprint}
standards:
  packageManager: bun
  shell: bash
  language: typescript
network:
  allowedBinds:
    - "0.0.0.0"
  forbiddenBinds:
    - "127.0.0.1"`;

    // Step 1: Sovereign signs the protocol
    const signature = await PGPEngine.sign(protocolYaml, privateKey, 'test-passphrase');

    // Step 2: Signature is stored in protocol.yaml.sig
    // Step 3: Both files are committed to git

    // Step 4: On bootstrap, system verifies
    const isValid = await PGPEngine.verify(protocolYaml, signature, publicKey);

    expect(isValid).toBe(true);

    // Step 5: Bootstrap lock is satisfied
    await expect(
      BootstrapLock.enforceProtocolIntegrity(protocolYaml, signature, publicKey)
    ).resolves.toBeUndefined();
  });

  // ================================================================
  // Test 11: Phase 2.1 - SovereignKey Validation
  // ================================================================

  it('should validate SovereignKey format', async () => {
    const sovereignKey = {
      type: 'pgp' as const,
      fingerprint,
      public_key: publicKey,
      created_at: new Date(),
    };

    const result = await PGPEngine.validateSovereignKey(sovereignKey, publicKey);

    expect(result.valid).toBe(true);
  });

  it('should reject SovereignKey with mismatched fingerprint', async () => {
    const wrongFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM'; // 46 chars - wrong
    const sovereignKey = {
      type: 'pgp' as const,
      fingerprint: wrongFingerprint, // Wrong fingerprint (but valid format - 40+ chars)
      public_key: publicKey,
      created_at: new Date(),
    };

    const result = await PGPEngine.validateSovereignKey(sovereignKey, publicKey);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Fingerprint mismatch');
  });
});

describe('LUDOC Crypto - Error Handling', () => {
  it('should handle invalid armored key gracefully', async () => {
    const invalidKey = 'not a valid pgp key';

    await expect(PGPEngine.getFingerprint(invalidKey)).rejects.toThrow();
  });

  it('should handle invalid signature gracefully', async () => {
    const invalidSignature = 'not a valid signature';
    const validKey =
      '-----BEGIN PGP PUBLIC KEY BLOCK-----\nfakekey\n-----END PGP PUBLIC KEY BLOCK-----';

    const result = await PGPEngine.verify('message', invalidSignature, validKey);

    expect(result).toBe(false); // Should return false, not throw
  });
});
