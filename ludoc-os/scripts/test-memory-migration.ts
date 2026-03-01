#!/usr/bin/env bun

/**
 * Test Script: Ternary Memory Auto-Migration (Phase 2.4)
 *
 * Tests the HOT → WARM migration logic without PGP signatures.
 * Simulates dispatches arriving and aging out of HOT memory.
 */

import { TernaryMemoryModel, MemoryTier } from "../src/kernel/memory-model.js";

async function testMemoryMigration() {
  console.log("\n[TEST] 🧪 Memory Auto-Migration Test\n");

  const memory = new TernaryMemoryModel();

  // Test 1: Add items to HOT
  console.log("=== TEST 1: Adding 5 items to HOT tier ===");
  for (let i = 0; i < 5; i++) {
    await memory.set(`test_item_${i}`, {
      data: `Message ${i}`,
      timestamp: new Date().toISOString(),
      value: Math.random(),
    }, MemoryTier.HOT);

    console.log(`✅ Added test_item_${i} to HOT`);
  }

  // Test 2: Check stats
  console.log("\n=== TEST 2: Memory stats after adding ===");
  let stats = await memory.getStats();
  console.log(`HOT: ${stats.hot.count} items, ${stats.hot.size} bytes`);
  console.log(`WARM: ${stats.warm.count} items, ${stats.warm.size} bytes`);
  console.log(`COLD: ${stats.cold.count} items, ${stats.cold.size} bytes`);

  // Test 3: Simulate access (which increases accessCount)
  console.log("\n=== TEST 3: Accessing items to trigger demotion ===");
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 12; j++) { // Access 12 times to exceed demotionThreshold (10)
      await memory.get(`test_item_${i}`);
    }
    console.log(`✅ Accessed test_item_${i} 12 times (should trigger demotion)`);
  }

  // Test 4: Check stats after demotion
  console.log("\n=== TEST 4: Memory stats after demotion ===");
  stats = await memory.getStats();
  console.log(`HOT: ${stats.hot.count} items, ${stats.hot.size} bytes`);
  console.log(`WARM: ${stats.warm.count} items, ${stats.warm.size} bytes`);
  console.log(`COLD: ${stats.cold.count} items, ${stats.cold.size} bytes`);

  if (stats.warm.count > 0) {
    console.log("\n✅ SUCCESS: Items were migrated to WARM tier!");
  } else {
    console.log("\n❌ FAILED: No items in WARM tier");
  }

  // Test 5: Verify integrity
  console.log("\n=== TEST 5: Verifying data integrity ===");
  for (let i = 0; i < 5; i++) {
    const isValid = await memory.verify(`test_item_${i}`);
    console.log(`test_item_${i}: ${isValid ? "✅ Valid" : "❌ Corrupted"}`);
  }

  console.log("\n[TEST] 🎉 Memory migration test completed!\n");
}

// Run test
await testMemoryMigration();
