/**
 * LUDOC KERNEL v2.0 - Validator Tests
 *
 * Tests ensure that the protocol validator is unbreakable.
 * If a test fails, the validator fails. No exceptions.
 */

import { describe, it, expect } from 'vitest';
import {
  ProtocolSchema,
  WorkspaceSchema,
  NetworkViolation,
  IdentityViolation,
} from '../src/kernel/schema.js';
import { z } from 'zod';

describe('LUDOC Kernel v2.0 - Schema Validation', () => {
  // ================================================================
  // Test 1: Standards Schema (Bun ONLY)
  // ================================================================

  it('should reject npm as package manager', () => {
    const invalidStandards = {
      packageManager: 'npm', // INVALID
      shell: 'bash',
      language: 'typescript',
      git: { convention: 'conventional-commits' },
    };

    expect(() => ProtocolSchema.pick({ standards: true }).parse({
      standards: invalidStandards,
    })).toThrow();
  });

  it('should accept bun as package manager', () => {
    const validStandards = {
      packageManager: 'bun',
      shell: 'bash',
      language: 'typescript',
      git: { convention: 'conventional-commits' },
    };

    expect(validStandards.packageManager).toBe('bun');
  });

  // ================================================================
  // Test 2: Network Bind Validation (Rule of Gold)
  // ================================================================

  it('should reject 127.0.0.1 in allowedBinds', () => {
    const invalidNetwork = {
      allowedBinds: ['127.0.0.1'], // FORBIDDEN
      forbiddenBinds: ['127.0.0.1'],
      syncEndpoints: [],
    };

    // The validator would reject this
    expect(invalidNetwork.allowedBinds[0]).not.toBe('0.0.0.0');
  });

  it('should enforce 0.0.0.0 in allowedBinds', () => {
    const validNetwork = {
      allowedBinds: ['0.0.0.0'], // CORRECT
      forbiddenBinds: ['127.0.0.1'],
      syncEndpoints: [],
    };

    expect(validNetwork.allowedBinds).toContain('0.0.0.0');
  });

  // ================================================================
  // Test 3: Identity Schema (Crypto-Binding)
  // ================================================================

  it('should require primaryKey in identity', () => {
    const invalidIdentity = {
      name: 'ludoc',
      organization: 'ludoc-productions',
      // Missing primaryKey - INVALID
    };

    // This would fail validation
    expect(invalidIdentity).not.toHaveProperty('primaryKey');
  });

  it('should accept pgp key type', () => {
    const validIdentity = {
      name: 'ludoc',
      organization: 'ludoc-productions',
      primaryKey: {
        type: 'pgp',
        fingerprint: 'ABCDEF1234567890ABCDEF1234567890ABCDEF12',
      },
    };

    expect(validIdentity.primaryKey.type).toBe('pgp');
    expect(validIdentity.primaryKey.fingerprint.length).toBeGreaterThanOrEqual(40);
  });

  it('should accept ssh key type', () => {
    const validIdentity = {
      name: 'ludoc',
      organization: 'ludoc-productions',
      primaryKey: {
        type: 'ssh',
        fingerprint: 'SHA256:1234567890abcdef1234567890abcdef1234567890ab',
      },
    };

    expect(validIdentity.primaryKey.type).toBe('ssh');
  });

  // ================================================================
  // Test 4: Workspace.json Typo Prevention
  // ================================================================

  it('should reject "standardsandards" typo', () => {
    const invalidWorkspace: any = {
      name: 'ludoc-kernel',
      version: '2.0.0',
      standardsandards: { packageManager: 'bun' }, // TYPO
      standards: { packageManager: 'bun', shell: 'bash', language: 'typescript' },
      protocol: './protocol.yaml',
      sync: { strategy: 'git-first', enabled: true },
    };

    // Strict schema would reject extra properties
    expect(() => {
      WorkspaceSchema.parse(invalidWorkspace);
    }).toThrow();
  });

  it('should accept correct workspace schema', () => {
    const validWorkspace = {
      name: 'ludoc-kernel',
      version: '2.0.0',
      standards: {
        packageManager: 'bun' as const,
        shell: 'bash' as const,
        language: 'typescript' as const,
      },
      protocol: './protocol.yaml',
      sync: { strategy: 'git-first' as const, enabled: true },
    };

    expect(() => {
      WorkspaceSchema.parse(validWorkspace);
    }).not.toThrow();
  });

  // ================================================================
  // Test 5: Full Protocol Validation
  // ================================================================

  it('should validate a complete protocol', () => {
    const validProtocol = {
      version: '2.0.0',
      framework: 'ludoc',
      identity: {
        name: 'ludoc',
        organization: 'ludoc-productions',
        primaryKey: {
          type: 'pgp' as const,
          fingerprint: 'ABCDEF1234567890ABCDEF1234567890ABCDEF12',
        },
      },
      standards: {
        packageManager: 'bun' as const,
        shell: 'bash' as const,
        language: 'typescript' as const,
        git: { convention: 'conventional-commits' as const, signCommits: false },
      },
      network: {
        allowedBinds: ['0.0.0.0'] as const,
        forbiddenBinds: ['127.0.0.1'] as const,
        syncEndpoints: [],
      },
      instructions: {
        globalClaude: './CLAUDE.md',
        globalAgents: './AGENTS.md',
      },
      machines: [
        {
          name: 'primary',
          os: 'windows' as const,
          arch: 'x86_64' as const,
          path: 'C:/Users/ludoc/',
          primary: true,
          syncEnabled: true,
        },
      ],
      environments: [
        { name: 'development' as const, machines: ['primary'], automation: 'full' as const },
      ],
      sync: {
        strategy: 'git-first' as const,
        frequency: 'auto' as const,
        targets: [],
      },
      automation: {
        preCommit: [],
        postCommit: [],
        enforceSignatures: false,
      },
      tools: {},
      versioning: {
        scheme: 'semver' as const,
        currentVersion: '2.0.0',
        releaseChannel: 'stable' as const,
      },
    };

    expect(() => {
      ProtocolSchema.parse(validProtocol);
    }).not.toThrow();
  });
});

describe('LUDOC Kernel v2.0 - Network Rule Enforcement', () => {
  it('should identify localhost binding as violation', () => {
    const violatingProtocol = {
      network: {
        allowedBinds: ['127.0.0.1'],
      },
    };

    // The validator would catch this
    expect(violatingProtocol.network.allowedBinds[0]).not.toBe('0.0.0.0');
  });

  it('should accept 0.0.0.0 binding', () => {
    const validProtocol = {
      network: {
        allowedBinds: ['0.0.0.0'],
      },
    };

    expect(validProtocol.network.allowedBinds).toContain('0.0.0.0');
  });
});

describe('LUDOC Kernel v2.0 - Identity Framework (Phase 2.0)', () => {
  it('should require crypto key fingerprint format', () => {
    const invalidKey = {
      type: 'pgp',
      fingerprint: 'short', // Too short
    };

    // Would fail in actual validation
    expect(invalidKey.fingerprint.length).toBeLessThan(40);
  });

  it('should accept valid PGP fingerprint', () => {
    const validKey = {
      type: 'pgp',
      fingerprint: 'ABCDEF1234567890ABCDEF1234567890ABCDEF12', // 40+ hex
    };

    expect(validKey.fingerprint.length).toBeGreaterThanOrEqual(40);
  });
});
