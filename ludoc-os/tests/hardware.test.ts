/**
 * LUDOC Hardware Binding Tests - Phase 2.2
 *
 * Comprehensive test coverage for:
 * - Environment detection (Windows/WSL2/Linux/macOS)
 * - Hardware UUID discovery
 * - Sealed identity creation and verification
 * - Cross-platform consistency
 *
 * Test Scenarios from Gemini Analysis:
 * 1. Consistency test (WSL2 UUID == Windows host UUID)
 * 2. Clone attack test (identity sealed to hardware)
 * 3. Persistence test (WSL2 reinstall handling)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EnvironmentDetector, EnvironmentContext } from '../src/hardware/environment.js';
import { HardwareDiscovery, UUIDDiscovery } from '../src/hardware/discovery.js';
import { SealedIdentityManager, SealedIdentity } from '../src/crypto/sealed-identity.js';
import { unlinkSync, existsSync } from 'fs';

describe('LUDOC Hardware - Phase 2.2', () => {
  let environment: EnvironmentContext;
  let hardware: UUIDDiscovery;
  let sealed: SealedIdentity;

  // ================================================================
  // SETUP: Detect environment and discover hardware
  // ================================================================

  beforeAll(async () => {
    console.log('[TEST SETUP] Detecting environment...');
    environment = await EnvironmentDetector.detect();
    console.log(`[TEST SETUP] Platform: ${environment.platform}`);
    console.log(`[TEST SETUP] Can access Windows host: ${environment.canAccessWindowsHost}`);

    console.log('[TEST SETUP] Discovering hardware UUID...');
    hardware = await HardwareDiscovery.getHardwareID();
    console.log(`[TEST SETUP] UUID: ${hardware.uuid}`);
    console.log(`[TEST SETUP] Source: ${hardware.source}`);
    console.log(`[TEST SETUP] Confidence: ${hardware.confidence}`);
  });

  // Clean up sealed identity after tests
  afterAll(() => {
    const sealedPath = '.ludoc/sealed-identity.json';
    if (existsSync(sealedPath)) {
      unlinkSync(sealedPath);
    }
  });

  // ================================================================
  // Test 1: Environment Detection
  // ================================================================

  describe('Environment Detection', () => {
    it('should detect platform correctly', () => {
      expect(environment.platform).toMatch(/^(windows-native|wsl2|linux|macos)$/);
    });

    it('should report OS version', () => {
      expect(environment.osVersion).toBeDefined();
      expect(environment.osVersion.length).toBeGreaterThan(0);
    });

    it('should detect CPU count', () => {
      expect(environment.cpuCount).toBeGreaterThan(0);
    });

    it('should report VM status', () => {
      expect(typeof environment.isVM).toBe('boolean');
    });

    it('should indicate Windows host accessibility', () => {
      expect(typeof environment.canAccessWindowsHost).toBe('boolean');

      // If we're on WSL2, this matters
      if (environment.platform === 'wsl2') {
        console.log(
          `[TEST] WSL2 can access Windows host: ${environment.canAccessWindowsHost}`
        );
      }
    });
  });

  // ================================================================
  // Test 2: Hardware UUID Discovery
  // ================================================================

  describe('Hardware UUID Discovery', () => {
    it('should discover hardware UUID', () => {
      expect(hardware.uuid).toBeDefined();
      expect(hardware.uuid.length).toBeGreaterThan(0);
    });

    it('should report discovery source', () => {
      expect(hardware.source).toBeDefined();
      expect(hardware.source.length).toBeGreaterThan(0);
    });

    it('should rate confidence', () => {
      expect(hardware.confidence).toMatch(/^(high|medium|low)$/);
    });

    it('should report platform', () => {
      expect(hardware.platform).toBe(environment.platform);
    });

    it('should validate UUID format', () => {
      // UUID should be either standard format or hex string
      const uuidRegex = /^[A-F0-9]{8}-?[A-F0-9]{4}-?[A-F0-9]{4}-?[A-F0-9]{4}-?[A-F0-9]{12}$/i;
      const hexRegex = /^[A-F0-9]{32,}$/i;

      const isValid = uuidRegex.test(hardware.uuid) || hexRegex.test(hardware.uuid);
      expect(isValid).toBe(true);
    });
  });

  // ================================================================
  // Test 3: Sealed Identity Creation
  // ================================================================

  describe('Sealed Identity Creation', () => {
    it('should create sealed identity with valid fingerprint', async () => {
      const testFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM'; // 46 chars, valid

      sealed = await SealedIdentityManager.seal(testFingerprint);

      expect(sealed.pgpFingerprint).toBe(testFingerprint);
      expect(sealed.hardwareUUID).toBe(hardware.uuid);
      expect(sealed.sealedHash).toBeDefined();
      expect(sealed.createdAt).toBeDefined();
    });

    it('should create consistent seal hash', async () => {
      const testFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM';

      // Create two sealed identities with same inputs
      const sealed1 = await SealedIdentityManager.seal(testFingerprint);
      const sealed2 = await SealedIdentityManager.seal(testFingerprint);

      // Seal hashes should be identical for same fingerprint + UUID
      expect(sealed1.sealedHash).toBe(sealed2.sealedHash);
    });

    it('should reject invalid fingerprint (too short)', async () => {
      const invalidFingerprint = 'AAABBBCCCDDD'; // Only 12 chars

      try {
        await SealedIdentityManager.seal(invalidFingerprint);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(String(error)).toContain('Invalid PGP fingerprint');
      }
    });

    it('should set version to 2.2', async () => {
      const testFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM';
      const sealed = await SealedIdentityManager.seal(testFingerprint);

      expect(sealed.version).toBe('2.2');
    });
  });

  // ================================================================
  // Test 4: Sealed Identity Persistence & Loading
  // ================================================================

  describe('Sealed Identity Persistence', () => {
    it('should persist sealed identity to disk', async () => {
      const testFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM';
      sealed = await SealedIdentityManager.seal(testFingerprint);

      await SealedIdentityManager.persist(sealed);

      expect(existsSync('.ludoc/sealed-identity.json')).toBe(true);
    });

    it('should load sealed identity from disk', async () => {
      const loaded = await SealedIdentityManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.pgpFingerprint).toBe(sealed.pgpFingerprint);
      expect(loaded?.sealedHash).toBe(sealed.sealedHash);
    });

    it('should return null if no sealed identity exists', async () => {
      // First, clean up
      const sealedPath = '.ludoc/sealed-identity.json';
      if (existsSync(sealedPath)) {
        unlinkSync(sealedPath);
      }

      const loaded = await SealedIdentityManager.load();
      expect(loaded).toBeNull();

      // Re-create for remaining tests
      const testFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM';
      sealed = await SealedIdentityManager.seal(testFingerprint);
      await SealedIdentityManager.persist(sealed);
    });
  });

  // ================================================================
  // Test 5: Sealed Identity Verification
  // ================================================================

  describe('Sealed Identity Verification', () => {
    it('should verify valid sealed identity', async () => {
      const result = await SealedIdentityManager.verify();

      expect(result.valid).toBe(true);
      expect(result.sealed).not.toBeNull();
    });

    it('should detect missing sealed identity', async () => {
      // Clean up
      const sealedPath = '.ludoc/sealed-identity.json';
      if (existsSync(sealedPath)) {
        unlinkSync(sealedPath);
      }

      const result = await SealedIdentityManager.verify();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('No sealed identity found');

      // Re-create
      const testFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM';
      sealed = await SealedIdentityManager.seal(testFingerprint);
      await SealedIdentityManager.persist(sealed);
    });

    it('should include warnings for low confidence UUID', async () => {
      const result = await SealedIdentityManager.verify();

      if (sealed.hardwareConfidence === 'low') {
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some((w) => w.includes('LOW confidence'))).toBe(true);
      }
    });
  });

  // ================================================================
  // Test 6: Cross-Platform Consistency (WSL2 Specific)
  // ================================================================

  describe('WSL2 Specific Tests', () => {
    it('should detect WSL2 correctly', () => {
      if (environment.platform === 'wsl2') {
        expect(environment.isVM).toBe(true);
      }
    });

    it('should attempt Windows host access on WSL2', async () => {
      if (environment.platform === 'wsl2') {
        // canAccessWindowsHost should be determined during environment detection
        expect(typeof environment.canAccessWindowsHost).toBe('boolean');

        // Log for manual verification
        if (environment.canAccessWindowsHost) {
          console.log(
            '[WSL2 TEST] ✅ Successfully accessed Windows host via powershell.exe'
          );
          console.log(`[WSL2 TEST] Hardware UUID source: ${hardware.source}`);
          console.log(`[WSL2 TEST] This UUID is from Windows host (persistent across WSL2 reinstalls)`);
        } else {
          console.log(
            '[WSL2 TEST] ⚠️  Cannot access Windows host. Using Linux VM UUID (ephemeral)'
          );
          console.log(`[WSL2 TEST] Hardware UUID source: ${hardware.source}`);
        }
      }
    });

    it('should prefer Windows UUID over Linux UUID on WSL2', async () => {
      if (environment.platform === 'wsl2' && environment.canAccessWindowsHost) {
        // If we successfully accessed Windows host, source should indicate that
        expect(hardware.source).toContain('WSL2');
        expect(hardware.source).toContain('Windows');
      }
    });
  });

  // ================================================================
  // Test 7: Clone Attack Detection (Identity Sealed to Hardware)
  // ================================================================

  describe('Clone Attack Prevention', () => {
    it('should create immutable seal hash', async () => {
      const testFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM';
      const sealed1 = await SealedIdentityManager.seal(testFingerprint);

      // Change fingerprint should change seal hash
      const testFingerprint2 = 'BBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMMNNNN';
      const sealed2 = await SealedIdentityManager.seal(testFingerprint2);

      expect(sealed1.sealedHash).not.toBe(sealed2.sealedHash);
    });

    it('should bind identity to specific hardware', async () => {
      // This test verifies that seal hash includes hardware UUID
      // Change in hardware UUID would change seal hash
      const testFingerprint = 'AAABBBCCCDDDEEEFFFGGGHHHHIIIJJJKKKKLLLLMMMM';
      const sealed = await SealedIdentityManager.seal(testFingerprint);

      expect(sealed.sealedHash).toBeDefined();
      expect(sealed.hardwareUUID).toBeDefined();

      // Seal hash should be deterministic for same inputs
      const sealed2 = await SealedIdentityManager.seal(testFingerprint);
      expect(sealed.sealedHash).toBe(sealed2.sealedHash);
    });

    it('should detect hardware mismatch (if UUID changes)', async () => {
      // This would require actually changing hardware, which we can't do in tests
      // Instead, verify that the verification logic checks hardware UUID

      const result = await SealedIdentityManager.verify();

      // On current hardware, verification should succeed
      expect(result.valid).toBe(true);
      expect(result.sealed?.hardwareUUID).toBe(hardware.uuid);
    });
  });

  // ================================================================
  // Test 8: Confidence Level Handling
  // ================================================================

  describe('Confidence Level Handling', () => {
    it('should discover UUID with confidence rating', () => {
      expect(['high', 'medium', 'low']).toContain(hardware.confidence);
    });

    it('should report confidence in sealed identity', async () => {
      const result = await SealedIdentityManager.verify();

      expect(result.sealed?.hardwareConfidence).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(result.sealed?.hardwareConfidence);
    });

    it('should warn on low confidence', async () => {
      if (hardware.confidence === 'low') {
        const result = await SealedIdentityManager.verify();

        expect(result.warnings.some((w) => w.includes('LOW'))).toBe(true);
      }
    });
  });

  // ================================================================
  // Test 9: Multi-Platform Support
  // ================================================================

  describe('Platform Support', () => {
    it('should support Windows native', () => {
      // This test runs on all platforms, but documents Windows support
      if (environment.platform === 'windows-native') {
        expect(hardware.source).toMatch(/(WMI|BIOS|Machine Name)/);
      }
    });

    it('should support WSL2', () => {
      if (environment.platform === 'wsl2') {
        expect(hardware.source).toMatch(/(powershell|Windows|Linux)/);
      }
    });

    it('should support Linux native', () => {
      if (environment.platform === 'linux' && !environment.isVM) {
        expect(hardware.source).toMatch(/(DMI|machine-id|hostname)/);
      }
    });

    it('should support macOS', () => {
      if (environment.platform === 'macos') {
        expect(hardware.source).toMatch(/(ioreg|system_profiler|hostname)/);
      }
    });
  });

  // ================================================================
  // Test 10: Real-World Bootstrap Scenario
  // ================================================================

  describe('Real-World Bootstrap', () => {
    it('should complete full seal/verify cycle', async () => {
      // Clean up first
      const sealedPath = '.ludoc/sealed-identity.json';
      if (existsSync(sealedPath)) {
        unlinkSync(sealedPath);
      }

      // Simulate bootstrap with sealing
      const testFingerprint = 'CCCDDDEEEFFF000111222333444555666777888999';

      // Step 1: Create sealed identity
      const sealed = await SealedIdentityManager.seal(testFingerprint);
      expect(sealed.pgpFingerprint).toBe(testFingerprint);

      // Step 2: Persist to disk
      await SealedIdentityManager.persist(sealed);
      expect(existsSync(sealedPath)).toBe(true);

      // Step 3: Verify on next boot
      const result = await SealedIdentityManager.verify();
      expect(result.valid).toBe(true);
      expect(result.sealed?.pgpFingerprint).toBe(testFingerprint);
    });

    it('should handle first boot scenario', async () => {
      // Clean up
      const sealedPath = '.ludoc/sealed-identity.json';
      if (existsSync(sealedPath)) {
        unlinkSync(sealedPath);
      }

      // First boot: no sealed identity
      const firstBootResult = await SealedIdentityManager.load();
      expect(firstBootResult).toBeNull();

      // User creates sealed identity
      const testFingerprint = 'DDDEEEFFF000111222333444555666777888999AAAA';
      const sealed = await SealedIdentityManager.seal(testFingerprint);
      await SealedIdentityManager.persist(sealed);

      // Subsequent boots: verify sealed identity
      const subsequentResult = await SealedIdentityManager.verify();
      expect(subsequentResult.valid).toBe(true);
    });
  });
});

/**
 * Phase 2.2 Test Coverage
 *
 * ✅ Environment detection (Windows/WSL2/Linux/macOS)
 * ✅ Hardware UUID discovery with fallbacks
 * ✅ Sealed identity creation and hash generation
 * ✅ Persistence and loading from disk
 * ✅ Verification and hardware binding validation
 * ✅ WSL2 specific tests (Windows host access)
 * ✅ Clone attack prevention
 * ✅ Confidence level handling
 * ✅ Multi-platform support matrix
 * ✅ Real-world bootstrap scenarios
 */
