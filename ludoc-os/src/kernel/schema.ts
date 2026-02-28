/**
 * LUDOC KERNEL v2.0 - Schema Definition
 *
 * The schema is the law. Any configuration that violates this contract
 * will be rejected at bootstrap. No exceptions. No grace period.
 *
 * This is where the 10-layer protocol becomes executable reality.
 */

import { z } from 'zod';

// ================================================================
// LAYER 1: IDENTITY (Zero-Email, Crypto-Binding)
// ================================================================

export const SovereignIdentitySchema = z.object({
  name: z.string().min(1).max(100),
  organization: z.string().min(1).max(100),

  // MANDATORY: Crypto-binding anchor
  // Phase 2.0: Type framework only (actual validation in 2.1)
  // Phase 2.1: Will validate against actual PGP/SSH key
  primaryKey: z.object({
    type: z.enum(['pgp', 'ssh', 'hardware-bound']),
    fingerprint: z.string().regex(/^[A-F0-9]{40,}$/, 'Invalid fingerprint format'),
    public_key: z.string().optional().describe('PEM format for PGP or OpenSSH format for SSH'),
    comment: z.string().optional(),
  }),

  // Hardware binding (for Phase 2.2)
  hardwareUUID: z.string().optional(),

  // Email is NO LONGER the identity anchor
  email: z.string().email().optional().describe('For notifications only, NOT identity'),
}).strict();

// ================================================================
// LAYER 2: STANDARDS (Mandatory Global Rules)
// ================================================================

export const StandardsSchema = z.object({
  packageManager: z.enum(['bun']).describe('Only Bun. No npm, yarn, or alternatives.'),
  shell: z.enum(['bash']).describe('Unix-first. PowerShell only for Windows APIs.'),
  language: z.enum(['typescript']).describe('Strict mode mandatory.'),
  git: z.object({
    convention: z.enum(['conventional-commits']),
    signCommits: z.boolean().default(false).describe('Will be MANDATORY in 2.1'),
  }),
}).strict();

// ================================================================
// LAYER 3: NETWORK (Sovereign Bind = 0.0.0.0 ONLY)
// ================================================================

export const NetworkSchema = z.object({
  // RULE OF GOLD: No localhost binding
  // This is not a recommendation. It is a law.
  allowedBinds: z.array(z.literal('0.0.0.0')).default(['0.0.0.0']),

  // Detection: Any config attempting localhost will fail
  forbiddenBinds: z.array(z.literal('127.0.0.1')).default(['127.0.0.1']),

  // Sync endpoints (for Phase 2.2)
  syncEndpoints: z.array(
    z.object({
      name: z.string(),
      protocol: z.enum(['git', 'p2p']),
      address: z.string(),
    })
  ).default([]),
}).strict();

// ================================================================
// LAYER 4: INSTRUCTIONS (The "Codex" - Human-Readable Rules)
// ================================================================

export const InstructionsSchema = z.object({
  globalClaude: z.string().describe('Path to global CLAUDE.md'),
  globalAgents: z.string().describe('Path to global AGENTS.md'),
  projectSpecific: z.string().optional().describe('Path to project/.ludoc/ rules'),
}).strict();

// ================================================================
// LAYER 5: MACHINE INVENTORY
// ================================================================

export const MachineSchema = z.object({
  name: z.string(),
  os: z.enum(['windows', 'macos', 'linux']),
  arch: z.enum(['x86_64', 'arm64']),
  primary: z.boolean().default(false),
  path: z.string(),
  syncEnabled: z.boolean().default(true),
});

export const MachinesSchema = z.array(MachineSchema).min(1);

// ================================================================
// LAYER 6: ENVIRONMENT (Dev, Staging, Prod)
// ================================================================

export const EnvironmentSchema = z.object({
  name: z.enum(['development', 'staging', 'production']),
  machines: z.array(z.string()),
  automation: z.enum(['full', 'partial', 'none']),
}).strict();

// ================================================================
// LAYER 7: SYNC PROTOCOL
// ================================================================

export const SyncSchema = z.object({
  strategy: z.enum(['git-first', 'p2p', 'hybrid']),
  frequency: z.enum(['auto', 'manual', 'scheduled']),
  targets: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      enabled: z.boolean().default(true),
      requireSignature: z.boolean().default(false).describe('Will be TRUE in 2.1'),
    })
  ),
}).strict();

// ================================================================
// LAYER 8: AUTOMATION (Git Hooks, CI/CD, Pre-flight Checks)
// ================================================================

export const AutomationSchema = z.object({
  preCommit: z.array(z.string()).default([]).describe('Validations before commit'),
  postCommit: z.array(z.string()).default([]).describe('Sync after commit'),
  enforceSignatures: z.boolean().default(false).describe('Will be TRUE in 2.1'),
}).strict();

// ================================================================
// LAYER 9: TOOLS (Multi-Tool Support: Claude, Cline, Gemini, etc)
// ================================================================

export const ToolSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  configPath: z.string(),
  syncMethod: z.enum(['git', 'symlink', 'copy']),
}).strict();

export const ToolsSchema = z.record(ToolSchema);

// ================================================================
// LAYER 10: VERSIONING & RELEASES
// ================================================================

export const VersioningSchema = z.object({
  scheme: z.enum(['semver', 'calver']),
  currentVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  releaseChannel: z.enum(['stable', 'beta', 'canary']).default('stable'),
}).strict();

// ================================================================
// MASTER PROTOCOL SCHEMA (All 10 Layers United)
// ================================================================

export const ProtocolSchema = z.object({
  version: z.literal('2.0.0').describe('Only v2.0.0 is accepted. v1.0 is legacy.'),
  framework: z.literal('ludoc').describe('The name of truth.'),

  // Layer 1
  identity: SovereignIdentitySchema,

  // Layer 2
  standards: StandardsSchema,

  // Layer 3
  network: NetworkSchema,

  // Layer 4
  instructions: InstructionsSchema,

  // Layer 5
  machines: MachinesSchema,

  // Layer 6
  environments: z.array(EnvironmentSchema).default([
    { name: 'development', machines: [], automation: 'full' },
  ]),

  // Layer 7
  sync: SyncSchema,

  // Layer 8
  automation: AutomationSchema,

  // Layer 9
  tools: ToolsSchema,

  // Layer 10
  versioning: VersioningSchema,

  // Metadata
  createdAt: z.string().datetime().optional(),
  lastValidated: z.string().datetime().optional(),
}).strict();

export type Protocol = z.infer<typeof ProtocolSchema>;
export type SovereignIdentity = z.infer<typeof SovereignIdentitySchema>;
export type Standards = z.infer<typeof StandardsSchema>;
export type Network = z.infer<typeof NetworkSchema>;

// ================================================================
// WORKSPACE.JSON SCHEMA (The Runtime Configuration)
// ================================================================

export const WorkspaceSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),

  // CRITICAL: Must match protocol standards
  standards: z.object({
    packageManager: z.enum(['bun']),
    shell: z.enum(['bash']),
    language: z.enum(['typescript']),
  }).strict(),

  // CRITICAL: No typos like "standardsandards"
  protocol: z.string().describe('Path to protocol.yaml'),

  // Sync configuration
  sync: z.object({
    strategy: z.enum(['git-first', 'p2p']),
    enabled: z.boolean().default(true),
  }).strict(),
}).strict();

export type Workspace = z.infer<typeof WorkspaceSchema>;

// ================================================================
// VALIDATION ERRORS (Sovereign Justice)
// ================================================================

export class ProtocolViolation extends Error {
  constructor(message: string, public violations: z.ZodError['issues']) {
    super(`[PROTOCOL VIOLATION] ${message}`);
    this.name = 'ProtocolViolation';
  }
}

export class NetworkViolation extends Error {
  constructor(message: string) {
    super(`[NETWORK VIOLATION] ${message}`);
    this.name = 'NetworkViolation';
  }
}

export class IdentityViolation extends Error {
  constructor(message: string) {
    super(`[IDENTITY VIOLATION] ${message}`);
    this.name = 'IdentityViolation';
  }
}

// ================================================================
// HELPER: Pretty Print Violations
// ================================================================

export function formatViolations(error: z.ZodError): string {
  return error.issues
    .map(
      (issue) =>
        `  ❌ ${issue.path.join('.')} - ${issue.message}`
    )
    .join('\n');
}
