#!/usr/bin/env bun
/**
 * FIX: Regenerate PGP Keys with Correct Passphrase
 *
 * The stored keys at ~/.ludoc-keys/ appear to be corrupted or created
 * with an incorrect passphrase. This script regenerates them cleanly.
 */

import { PGPEngine } from "./src/crypto/pgp-engine.js";
import { writeFileSync, mkdirSync } from "fs";
import { homedir, EOL } from "os";
import { join } from "path";

console.log("\n🔧 REGENERATING PGP KEYS\n");

const keyDir = join(homedir(), ".ludoc-keys");
const passphrase = "test-passphrase";  // Match what's in dispatcher.ts CLI default

console.log(`📁 Key directory: ${keyDir}`);
console.log(`🔑 Generating keypair with passphrase: ${passphrase.substring(0, 4)}****\n`);

// Create directory if it doesn't exist
mkdirSync(keyDir, { recursive: true });

// Generate new keypair
const result = await PGPEngine.generateKeypair(
  'ludoc',
  'ludoc@ludoc.dev',
  passphrase
);

console.log(`\n✅ Keypair generated:`);
console.log(`   Fingerprint: ${result.fingerprint}`);
console.log(`   Private key size: ${result.privateKey.length} bytes`);
console.log(`   Public key size: ${result.publicKey.length} bytes`);

// Write keys
writeFileSync(join(keyDir, "ludoc.priv.pgp"), result.privateKey, "utf-8");
writeFileSync(join(keyDir, "ludoc.pub.pgp"), result.publicKey, "utf-8");

console.log(`\n📝 Keys written:`);
console.log(`   ${join(keyDir, "ludoc.priv.pgp")}`);
console.log(`   ${join(keyDir, "ludoc.pub.pgp")}`);

// Update protocol.yaml with the new public key
console.log(`\n🔄 Updating protocol.yaml with new public key...`);

import { readFileSync } from "fs";
const yaml = await import("yaml");

const protocolPath = "./protocol.yaml";
const protocolContent = readFileSync(protocolPath, "utf-8");
const protocol = yaml.parse(protocolContent);

// Update public key in protocol
protocol.identity.primaryKey.public_key = result.publicKey;

const updatedProtocol = yaml.stringify(protocol, { version: "1.1" });
writeFileSync(protocolPath, updatedProtocol, "utf-8");

console.log(`✅ protocol.yaml updated with new public key`);

console.log(`\n🎯 NEXT STEPS:`);
console.log(`1. Re-run the bootstrap to update sealed identity:`);
console.log(`   export LUDOC_PASSPHRASE="test-passphrase"`);
console.log(`   bun run src/kernel/bootstrap-v2.ts --seal`);
console.log(`\n2. Test the dispatcher:`);
console.log(`   export LUDOC_PASSPHRASE="test-passphrase"`);
console.log(`   bun run src/api/dispatcher.ts --send "TEST" --host 127.0.0.1 --port 9000`);

console.log(`\n✨ PGP Key regeneration complete!\n`);
