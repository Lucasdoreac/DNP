/**
 * LUDOC KERNEL v2.0 - Protocol Validator
 *
 * The validator is the enforcer of truth. It runs on every bootstrap.
 * If the system violates the protocol, the validator aborts.
 * There are no warnings. There are no second chances.
 *
 * "- como era para não ser"
 */

import { existsSync, readFileSync } from 'fs';
import { z } from 'zod';
import {
  ProtocolSchema,
  WorkspaceSchema,
  NetworkViolation,
  IdentityViolation,
  formatViolations,
} from './schema.js';
import { SovereignValidator } from '../crypto/integration.js';

// ================================================================
// CORE VALIDATION ENGINE
// ================================================================

export class ProtocolValidator {
  private protocolPath: string;
  private workspacePath: string;
  private signaturePath: string | null;
  private verbose: boolean = false;

  constructor(
    protocolPath: string = './protocol.yaml',
    workspacePath: string = './workspace.json',
    signaturePath: string | null = null,
    verbose: boolean = false
  ) {
    this.protocolPath = protocolPath;
    this.workspacePath = workspacePath;
    this.signaturePath = signaturePath;
    this.verbose = verbose;
  }

  /**
   * PHASE 2.0: Core validation
   * PHASE 2.1: Added crypto signature checks (optional, if signature file present)
   * PHASE 2.2: Will add hardware UUID binding
   * PHASE 2.3: Will add P2P agêntico checks
   */
  async validate(): Promise<{
    valid: boolean;
    protocol: any;
    workspace: any;
    errors: string[];
    signatureValid?: boolean;
  }> {
    const errors: string[] = [];
    let protocol: any = null;
    let workspace: any = null;
    let signatureValid: boolean | undefined = undefined;

    // ================================================================
    // STEP 1: File Existence Check
    // ================================================================

    if (!existsSync(this.protocolPath)) {
      errors.push(`[FATAL] protocol.yaml not found at ${this.protocolPath}`);
      return { valid: false, protocol, workspace, errors };
    }

    if (!existsSync(this.workspacePath)) {
      errors.push(`[FATAL] workspace.json not found at ${this.workspacePath}`);
      return { valid: false, protocol, workspace, errors };
    }

    this.log('✓ Files found');

    // ================================================================
    // STEP 2: Load and Parse Protocol (YAML)
    // ================================================================

    try {
      const protocolContent = readFileSync(this.protocolPath, 'utf-8');
      const yaml = await import('yaml');
      protocol = yaml.parse(protocolContent);
      this.log('✓ protocol.yaml parsed');
    } catch (e) {
      errors.push(`[PARSE ERROR] protocol.yaml: ${String(e)}`);
      return { valid: false, protocol, workspace, errors };
    }

    // ================================================================
    // STEP 3: Load and Parse Workspace (JSON)
    // ================================================================

    try {
      const workspaceContent = readFileSync(this.workspacePath, 'utf-8');
      workspace = JSON.parse(workspaceContent);
      this.log('✓ workspace.json parsed');
    } catch (e) {
      errors.push(`[PARSE ERROR] workspace.json: ${String(e)}`);
      return { valid: false, protocol, workspace, errors };
    }

    // ================================================================
    // STEP 4: Validate Protocol Against Schema
    // ================================================================

    try {
      ProtocolSchema.parse(protocol);
      this.log('✓ Protocol schema valid');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`[SCHEMA VIOLATION] Protocol:\n${formatViolations(error)}`);
      }
      return { valid: false, protocol, workspace, errors };
    }

    // ================================================================
    // STEP 5: Validate Workspace Against Schema
    // ================================================================

    try {
      WorkspaceSchema.parse(workspace);
      this.log('✓ Workspace schema valid');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`[SCHEMA VIOLATION] Workspace:\n${formatViolations(error)}`);
      }
      return { valid: false, protocol, workspace, errors };
    }

    // ================================================================
    // STEP 6: Network Bind Validation (Rule of Gold)
    // ================================================================

    const networkErrors = this.validateNetworkBindings(protocol);
    if (networkErrors.length > 0) {
      errors.push(...networkErrors);
    }

    // ================================================================
    // STEP 7: Identity Validation (Phase 2.0 Framework)
    // ================================================================

    const identityErrors = this.validateIdentity(protocol);
    if (identityErrors.length > 0) {
      errors.push(...identityErrors);
    }

    // ================================================================
    // STEP 8: Standards Alignment
    // ================================================================

    const standardsErrors = this.validateStandards(protocol, workspace);
    if (standardsErrors.length > 0) {
      errors.push(...standardsErrors);
    }

    // ================================================================
    // STEP 9: Phase 2.1 - Cryptographic Signature Validation (Optional)
    // ================================================================

    const sigValidationResult = await this.validateSignature(protocol);
    if (sigValidationResult.errors.length > 0) {
      errors.push(...sigValidationResult.errors);
    }
    if (sigValidationResult.signatureValid !== undefined) {
      signatureValid = sigValidationResult.signatureValid;
    }

    // ================================================================
    // RESULT
    // ================================================================

    const valid = errors.length === 0;

    if (valid) {
      this.log('✅ Protocol validation PASSED');
    } else {
      this.log(`❌ Protocol validation FAILED (${errors.length} errors)`);
    }

    return { valid, protocol, workspace, errors, signatureValid };
  }

  // ================================================================
  // NETWORK VALIDATION: Rule of Gold = 0.0.0.0 ONLY
  // ================================================================

  private validateNetworkBindings(protocol: any): string[] {
    const errors: string[] = [];
    const network = protocol.network;

    if (!network) {
      errors.push('[NETWORK VIOLATION] No network configuration found');
      return errors;
    }

    // Check that allowedBinds contains only 0.0.0.0
    const allowedBinds = network.allowedBinds || [];
    const hasForbiddenBind = allowedBinds.some(
      (bind: string) => bind === '127.0.0.1' || bind === 'localhost'
    );

    if (hasForbiddenBind) {
      throw new NetworkViolation(
        'Localhost binding (127.0.0.1) detected. Only 0.0.0.0 is allowed. The hardware must be sovereign.'
      );
    }

    if (!allowedBinds.includes('0.0.0.0')) {
      errors.push(
        '[NETWORK VIOLATION] 0.0.0.0 binding not found in allowedBinds. Multi-machine communication is mandatory.'
      );
    }

    this.log('✓ Network bindings valid');
    return errors;
  }

  // ================================================================
  // IDENTITY VALIDATION: Zero-Email, Crypto-Binding
  // ================================================================

  private validateIdentity(protocol: any): string[] {
    const errors: string[] = [];
    const identity = protocol.identity;

    if (!identity) {
      errors.push('[IDENTITY VIOLATION] No identity configuration found');
      return errors;
    }

    // Phase 2.0: Check structure only
    // Phase 2.1: Will validate actual PGP/SSH key

    if (!identity.primaryKey) {
      throw new IdentityViolation(
        'primaryKey is mandatory in identity. No email-based authentication allowed. Hardware must be anchored to cryptographic proof.'
      );
    }

    const { type, fingerprint } = identity.primaryKey;

    if (!['pgp', 'ssh', 'hardware-bound'].includes(type)) {
      errors.push(
        `[IDENTITY VIOLATION] Invalid primaryKey type: ${type}. Must be one of: pgp, ssh, hardware-bound`
      );
    }

    if (!fingerprint || fingerprint.length < 40) {
      errors.push(
        '[IDENTITY VIOLATION] Fingerprint is too short or missing. Must be at least 40 hex characters.'
      );
    }

    this.log('✓ Identity framework valid (crypto binding pending 2.1)');
    return errors;
  }

  // ================================================================
  // STANDARDS VALIDATION: Bun, Bash, TypeScript
  // ================================================================

  private validateStandards(protocol: any, workspace: any): string[] {
    const errors: string[] = [];

    // Protocol standards
    const protocolStandards = protocol.standards;
    const workspaceStandards = workspace.standards;

    if (protocolStandards.packageManager !== 'bun') {
      errors.push('[STANDARDS VIOLATION] Only Bun is allowed as package manager');
    }

    if (workspaceStandards.packageManager !== 'bun') {
      errors.push('[STANDARDS VIOLATION] workspace.json must use Bun');
    }

    if (protocolStandards.shell !== 'bash') {
      errors.push('[STANDARDS VIOLATION] Only Bash is allowed as shell');
    }

    if (protocolStandards.language !== 'typescript') {
      errors.push('[STANDARDS VIOLATION] TypeScript is mandatory');
    }

    this.log('✓ Standards alignment valid');
    return errors;
  }

  // ================================================================
  // PHASE 2.1: Signature Validation (Optional)
  // ================================================================

  private async validateSignature(protocol: any): Promise<{
    signatureValid?: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let signatureValid: boolean | undefined = undefined;

    // Determine signature file path
    // Priority: explicit signaturePath > auto-detect {protocolPath}.sig > none
    let sigPath: string | null = this.signaturePath;

    if (!sigPath && existsSync(`${this.protocolPath}.sig`)) {
      sigPath = `${this.protocolPath}.sig`;
    }

    // If no signature file found, skip validation (Phase 2.1 is optional)
    if (!sigPath) {
      this.log('ℹ️  No signature file found. Signature validation skipped (Phase 2.1 optional).');
      return { errors };
    }

    // Signature file exists, validate it
    if (!existsSync(sigPath)) {
      errors.push(`[CRYPTO] Signature file not found at ${sigPath}`);
      return { errors, signatureValid: false };
    }

    try {
      const protocolContent = readFileSync(this.protocolPath, 'utf-8');
      const signatureContent = readFileSync(sigPath, 'utf-8');

      // Use SovereignValidator to check signature
      const result = await SovereignValidator.validateWithSignature(
        protocol,
        protocolContent,
        signatureContent
      );

      signatureValid = result.signatureValid || false;

      if (!result.valid) {
        errors.push(...result.errors);
      } else {
        this.log('✓ Signature validation passed (Phase 2.1)');
      }
    } catch (error) {
      errors.push(`[CRYPTO ERROR] Signature validation failed: ${String(error)}`);
      signatureValid = false;
    }

    return { signatureValid, errors };
  }

  // ================================================================
  // UTILITY: Logging
  // ================================================================

  private log(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
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

  const validator = new ProtocolValidator(
    protocolPath,
    workspacePath,
    signaturePath,
    true // verbose mode when run directly
  );

  try {
    const result = await validator.validate();

    if (result.valid) {
      console.log('\n✅ LUDOC PROTOCOL VALIDATION PASSED');
      if (result.signatureValid !== undefined) {
        console.log(`✅ Signature validation: ${result.signatureValid ? 'VALID' : 'INVALID'}`);
      }
      console.log();
      process.exit(0);
    } else {
      console.log('\n❌ LUDOC PROTOCOL VALIDATION FAILED\n');
      result.errors.forEach((err) => console.log(err));
      console.log();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n🚨 FATAL VALIDATION ERROR\n', error);
    process.exit(1);
  }
}

export default ProtocolValidator;
