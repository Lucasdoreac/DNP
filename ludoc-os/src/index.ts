/**
 * LUDOC KERNEL v2.0
 * The Sovereign Kernel - Protocol Validator and Executor
 *
 * Entry point for the Phase 2.0 Validator Core
 */

export { ContextServer } from './api/context-server.js';
export { ProtocolValidator } from './kernel/validator.js';
export {
  ProtocolSchema,
  WorkspaceSchema,
  SovereignIdentitySchema,
  StandardsSchema,
  NetworkSchema,
  ProtocolViolation,
  NetworkViolation,
  IdentityViolation,
  formatViolations,
  type Protocol,
  type SovereignIdentity,
  type Standards,
  type Network,
  type Workspace,
} from './kernel/schema.js';

export {
  type CryptoKeyType,
  type SovereignKey,
  type HardwareIdentity,
  type ValidatedIdentity,
  type CryptoOperations,
  type BootstrapContext,
  type ValidationResult,
  CryptoModulePhases,
} from './crypto/types.js';

export const LUDOC_VERSION = '2.0.0';
export const LUDOC_FRAMEWORK = 'ludoc';
