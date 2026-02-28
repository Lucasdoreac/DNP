/**
 * LUDOC CRYPTO MODULE - Type Definitions
 *
 * Phase 2.0: Type framework and interfaces
 * Phase 2.1: Actual PGP/SSH validation logic
 * Phase 2.2: Hardware UUID binding (TPM2.0 / Motherboard Serial)
 *
 * This module defines the identity anchors for sovereign hardware.
 */

/**
 * Crypto Key Types Supported by Ludoc OS
 */
export type CryptoKeyType = 'pgp' | 'ssh' | 'hardware-bound';

/**
 * A cryptographic identity anchored to hardware
 */
export interface SovereignKey {
  type: CryptoKeyType;
  fingerprint: string; // SHA256 or similar, 40+ hex chars
  public_key?: string; // PEM or OpenSSH format
  created_at: Date;
  expires_at?: Date;
  comment?: string;
}

/**
 * Hardware Identity (Phase 2.2)
 * Binds a machine to its physical motherboard/TPM
 */
export interface HardwareIdentity {
  uuid: string; // /sys/class/dmi/id/product_uuid or similar
  serial_number?: string; // Motherboard serial
  tpm_version?: string; // TPM2.0, etc
  binding_key: SovereignKey; // The key that signed this binding
}

/**
 * A validated identity context
 * Used during bootstrap to ensure the nodo is sovereign
 */
export interface ValidatedIdentity {
  name: string;
  organization: string;
  primary_key: SovereignKey;
  hardware_identity?: HardwareIdentity;
  valid: boolean;
  validation_timestamp: Date;
  next_validation: Date; // When to re-validate
}

/**
 * Crypto Operations Interface (for Phase 2.1)
 */
export interface CryptoOperations {
  /**
   * Validate that a key is legitimate
   * Phase 2.1: Will check against actual PGP/SSH infrastructure
   */
  validateKey(key: SovereignKey): Promise<boolean>;

  /**
   * Sign a message with the hardware's primary key
   * Phase 2.1: Will use actual PGP/SSH signing
   */
  signMessage(message: string, key: SovereignKey): Promise<string>;

  /**
   * Verify a signature
   * Phase 2.1: Will use actual PGP/SSH verification
   */
  verifySignature(message: string, signature: string, key: SovereignKey): Promise<boolean>;

  /**
   * Bind this nodo to its hardware
   * Phase 2.2: Will integrate with TPM2.0 or motherboard serial
   */
  bindToHardware(key: SovereignKey): Promise<HardwareIdentity>;
}

/**
 * Bootstrap Context
 * Contains all information needed for secure initialization
 */
export interface BootstrapContext {
  identity: ValidatedIdentity;
  protocol_version: string;
  timestamp: Date;
  nodo_name: string; // Machine identifier
  network_bind: string; // Must be 0.0.0.0
  signatures: {
    protocol_signed_by: SovereignKey;
    bootstrap_signed_by: SovereignKey;
  };
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  identity: ValidatedIdentity | null;
  errors: string[];
  warnings: string[];
}

/**
 * Phase 2.1: Will contain actual PGP/SSH operations
 * Phase 2.0: Stubbed for schema validation
 */
export const CryptoModulePhases = {
  '2.0': 'Type framework and interfaces',
  '2.1': 'PGP/SSH integration with openpgp.js',
  '2.2': 'Hardware UUID binding (TPM2.0)',
  '2.3': 'P2P agêntico with signature chains',
} as const;
