#!/usr/bin/env bun
/**
 * DIAGNOSTIC: PGP Signature Truncation Test
 *
 * This script:
 * 1. Creates a test signature
 * 2. Shows the original signature length
 * 3. Sends it via JSON (dispatcher)
 * 4. Logs what the server receives
 * 5. Identifies where truncation occurs
 */

import { PGPEngine } from "./src/crypto/pgp-engine.js";
import { readFileSync } from "fs";
import { homedir, EOL } from "os";
import { join } from "path";

const privateKeyPath = join(homedir(), ".ludoc-keys", "ludoc.priv.pgp");
const privateKey = readFileSync(privateKeyPath, "utf-8");
const passphrase = process.env.LUDOC_PASSPHRASE || "ludoc-wsl2-2026";

const testMessage = "TEST MESSAGE FOR DIAGNOSTIC";

console.log("\n=== PGP TRUNCATION DIAGNOSTIC ===\n");

// Step 1: Create signature
console.log("📝 Step 1: Creating PGP signature...");
const signature = await PGPEngine.sign(testMessage, privateKey, passphrase);

console.log(`   Original signature length: ${signature.length} characters`);
console.log(`   Signature preview:`);
console.log(`   ${signature.substring(0, 100)}...`);
console.log(`   ...${signature.substring(signature.length - 100)}`);

// Step 2: Simulate JSON.stringify (dispatcher)
console.log("\n📦 Step 2: JSON.stringify (dispatcher sends)...");
const jsonPayload = JSON.stringify({
  message: testMessage,
  signature,
  timestamp: new Date().toISOString(),
});

console.log(`   JSON payload length: ${jsonPayload.length} characters`);

// Step 3: Simulate JSON.parse (server receives)
console.log("\n🔍 Step 3: JSON.parse (server receives)...");
const parsed = JSON.parse(jsonPayload);
const receivedSignature = parsed.signature;

console.log(`   Received signature length: ${receivedSignature.length} characters`);
console.log(`   Received preview:`);
console.log(`   ${receivedSignature.substring(0, 100)}...`);
console.log(`   ...${receivedSignature.substring(receivedSignature.length - 100)}`);

// Step 4: Compare
console.log("\n⚖️ Step 4: Comparison...");
const lost = signature.length - receivedSignature.length;
console.log(`   Lost characters: ${lost}`);

if (signature === receivedSignature) {
  console.log("   ✅ Signatures match! JSON transport is safe.");
} else {
  console.log("   ❌ Signatures differ!");

  // Find where they diverge
  for (let i = 0; i < Math.min(signature.length, receivedSignature.length); i++) {
    if (signature[i] !== receivedSignature[i]) {
      console.log(`   Divergence at character ${i}`);
      console.log(`   Original: ${signature.substring(Math.max(0, i - 20), i + 20)}`);
      console.log(`   Received: ${receivedSignature.substring(Math.max(0, i - 20), i + 20)}`);
      break;
    }
  }
}

// Step 5: Verify both signatures
console.log("\n✔️ Step 5: Attempting PGP verification...");
const protocolContent = readFileSync("./protocol.yaml", "utf-8");
const yaml = await import("yaml");
const protocol = yaml.parse(protocolContent);
const publicKey = protocol.identity?.primaryKey?.public_key || "";

const originalValid = await PGPEngine.verify(testMessage, signature, publicKey);
console.log(`   Original signature valid: ${originalValid}`);

const receivedValid = await PGPEngine.verify(testMessage, receivedSignature, publicKey);
console.log(`   Received signature valid: ${receivedValid}`);

console.log("\n=== END DIAGNOSTIC ===\n");
