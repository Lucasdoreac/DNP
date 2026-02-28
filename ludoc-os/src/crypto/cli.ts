/**
 * LUDOC CRYPTO CLI - Command-line interface for cryptographic operations
 *
 * Phase 2.1: Operational Commands
 *
 * Commands:
 * - ludoc crypto:generate-keypair
 * - ludoc crypto:sign
 * - ludoc crypto:verify
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { PGPEngine } from './pgp-engine.js';
import { signProtocol, validateSignedProtocol } from './integration.js';

interface CLIArgs {
  command: string;
  name?: string;
  email?: string;
  passphrase?: string;
  protocol?: string;
  signature?: string;
  key?: string;
  output?: string;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const command = args[0] || '';

  const result: CLIArgs = { command };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' && i + 1 < args.length) result.name = args[++i];
    if (arg === '--email' && i + 1 < args.length) result.email = args[++i];
    if (arg === '--passphrase' && i + 1 < args.length) result.passphrase = args[++i];
    if (arg === '--protocol' && i + 1 < args.length) result.protocol = args[++i];
    if (arg === '--signature' && i + 1 < args.length) result.signature = args[++i];
    if (arg === '--key' && i + 1 < args.length) result.key = args[++i];
    if (arg === '--output' && i + 1 < args.length) result.output = args[++i];
  }

  return result;
}

/**
 * Command: generate-keypair
 * Creates a new PGP keypair for signing protocols
 */
async function cmdGenerateKeypair(args: CLIArgs): Promise<void> {
  const name = args.name || 'ludoc';
  const email = args.email || `${name}@ludoc-productions`;
  const passphrase = args.passphrase || '';
  const output = args.output || './';

  console.log('[CRYPTO:CLI] Generating keypair...');
  console.log(`  Name: ${name}`);
  console.log(`  Email: ${email}`);
  console.log(`  Passphrase: ${passphrase ? '(set)' : '(none)'}`);

  try {
    const keypair = await PGPEngine.generateKeypair(name, email, passphrase);

    const pubKeyPath = resolve(output, `${name}.pub.pgp`);
    const privKeyPath = resolve(output, `${name}.priv.pgp`);

    writeFileSync(pubKeyPath, keypair.publicKey, 'utf-8');
    writeFileSync(privKeyPath, keypair.privateKey, 'utf-8');

    console.log('\n✅ Keypair generated successfully!\n');
    console.log(`  Public Key:  ${pubKeyPath}`);
    console.log(`  Private Key: ${privKeyPath}`);
    console.log(`  Fingerprint: ${keypair.fingerprint}\n`);
    console.log('⚠️  IMPORTANT:');
    console.log('  - Store the private key in a secure location (Yubikey, password manager, etc.)');
    console.log('  - Never commit the private key to git');
    console.log('  - Share only the public key fingerprint\n');
  } catch (error) {
    console.error('[CRYPTO:CLI] ❌ Error generating keypair:', error);
    process.exit(1);
  }
}

/**
 * Command: sign
 * Sign protocol.yaml with a private key, creating a detached signature
 */
async function cmdSign(args: CLIArgs): Promise<void> {
  const protocolPath = args.protocol || './protocol.yaml';
  const keyPath = args.key;
  const passphrase = args.passphrase || '';

  if (!keyPath) {
    console.error('[CRYPTO:CLI] ❌ Error: --key is required');
    console.error('Usage: ludoc crypto:sign ./protocol.yaml --key ~/.ssh/ludoc.priv.pgp');
    process.exit(1);
  }

  if (!existsSync(protocolPath)) {
    console.error(`[CRYPTO:CLI] ❌ Protocol file not found: ${protocolPath}`);
    process.exit(1);
  }

  if (!existsSync(keyPath)) {
    console.error(`[CRYPTO:CLI] ❌ Key file not found: ${keyPath}`);
    process.exit(1);
  }

  console.log('[CRYPTO:CLI] Signing protocol...');
  console.log(`  Protocol: ${protocolPath}`);
  console.log(`  Key: ${keyPath}`);

  try {
    const privateKeyArmored = readFileSync(keyPath, 'utf-8');
    const signature = await signProtocol(protocolPath, privateKeyArmored, passphrase);

    const sigPath = `${protocolPath}.sig`;
    writeFileSync(sigPath, signature, 'utf-8');

    console.log('\n✅ Protocol signed successfully!\n');
    console.log(`  Signature written to: ${sigPath}`);
    console.log('\nNext steps:');
    console.log(`  1. git add ${protocolPath} ${sigPath}`);
    console.log(`  2. git commit -m "chore: sign protocol"`);
    console.log(`  3. git push\n`);
  } catch (error) {
    console.error('[CRYPTO:CLI] ❌ Error signing protocol:', error);
    process.exit(1);
  }
}

/**
 * Command: verify
 * Verify that a protocol.yaml matches its signature
 */
async function cmdVerify(args: CLIArgs): Promise<void> {
  const protocolPath = args.protocol || './protocol.yaml';
  const sigPath = args.signature || `${protocolPath}.sig`;
  const keyPath = args.key;

  if (!keyPath) {
    console.error('[CRYPTO:CLI] ❌ Error: --key is required');
    console.error('Usage: ludoc crypto:verify ./protocol.yaml --signature protocol.yaml.sig --key ludoc.pub.pgp');
    process.exit(1);
  }

  if (!existsSync(protocolPath)) {
    console.error(`[CRYPTO:CLI] ❌ Protocol file not found: ${protocolPath}`);
    process.exit(1);
  }

  if (!existsSync(sigPath)) {
    console.error(`[CRYPTO:CLI] ❌ Signature file not found: ${sigPath}`);
    process.exit(1);
  }

  if (!existsSync(keyPath)) {
    console.error(`[CRYPTO:CLI] ❌ Key file not found: ${keyPath}`);
    process.exit(1);
  }

  console.log('[CRYPTO:CLI] Verifying protocol...');
  console.log(`  Protocol: ${protocolPath}`);
  console.log(`  Signature: ${sigPath}`);
  console.log(`  Key: ${keyPath}`);

  try {
    const publicKeyArmored = readFileSync(keyPath, 'utf-8');
    const isValid = await validateSignedProtocol(protocolPath, sigPath, publicKeyArmored);

    if (isValid) {
      console.log('\n✅ Signature is valid. Protocol is authentic.\n');
      process.exit(0);
    } else {
      console.error('\n❌ Signature is invalid. Protocol has been tampered.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('[CRYPTO:CLI] ❌ Error verifying protocol:', error);
    process.exit(1);
  }
}

/**
 * Help message
 */
function showHelp(): void {
  console.log(`
LUDOC CRYPTO CLI - Phase 2.1

Commands:

  ludoc crypto:generate-keypair
    Generate a new PGP keypair for protocol signing

    Options:
      --name NAME              Your name (default: ludoc)
      --email EMAIL            Email address (default: ludoc@ludoc-productions)
      --passphrase PASS        Protect key with passphrase (recommended)
      --output DIR             Save keys to directory (default: ./)

    Example:
      ludoc crypto:generate-keypair --name ludoc --email you@ludoc.dev --passphrase your-secure-pass

  ludoc crypto:sign
    Sign protocol.yaml with your private key

    Options:
      --protocol FILE          Path to protocol.yaml (default: ./protocol.yaml)
      --key FILE               Path to private key (required)
      --passphrase PASS        Key passphrase if protected

    Example:
      ludoc crypto:sign ./protocol.yaml --key ~/.ssh/ludoc.priv.pgp

  ludoc crypto:verify
    Verify protocol.yaml signature matches

    Options:
      --protocol FILE          Path to protocol.yaml (default: ./protocol.yaml)
      --signature FILE         Path to signature file (default: protocol.yaml.sig)
      --key FILE               Path to public key (required)

    Example:
      ludoc crypto:verify ./protocol.yaml --signature protocol.yaml.sig --key ludoc.pub.pgp
  `);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = parseArgs();

  if (!args.command || args.command === '--help' || args.command === '-h') {
    showHelp();
    return;
  }

  switch (args.command) {
    case 'crypto:generate-keypair':
      await cmdGenerateKeypair(args);
      break;
    case 'crypto:sign':
      await cmdSign(args);
      break;
    case 'crypto:verify':
      await cmdVerify(args);
      break;
    default:
      console.error(`[CRYPTO:CLI] ❌ Unknown command: ${args.command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('[CRYPTO:CLI] ❌ Fatal error:', error);
  process.exit(1);
});
