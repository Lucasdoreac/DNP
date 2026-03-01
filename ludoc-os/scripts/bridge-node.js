#!/usr/bin/env bun
// LUDOC Bridge - Node version (no jq needed)

import { readFileSync, writeFileSync, existsSync } from 'fs';
const QUEUE_FILE = ".ludoc/message-queue.json";
const COMMAND_FILE = ".ludoc/incoming.txt";
const RESPONSE_FILE = ".ludoc/response.json";

console.log("[BRIDGE] 🚀 Started - watching queue...");

while (true) {
  if (existsSync(QUEUE_FILE)) {
    const queueContent = readFileSync(QUEUE_FILE, 'utf-8');
    const queue = JSON.parse(queueContent);
    
    if (queue.length > 0) {
      const message = queue[0].text;
      console.log(`[BRIDGE] Queuing: ${message.substring(0, 60)}...`);
      
      // Clean message (remove SEAL)
      const cleanMessage = message.replace(/ \[SEAL:.*\]/, '');
      
      // Write to command file for Gemini CLI window to pick up
      writeFileSync(COMMAND_FILE, cleanMessage);
      
      console.log("[BRIDGE] ⏳ Waiting for Gemini CLI window to process...");
      
      // Wait for response (max 30s)
      let waited = 0;
      while (!existsSync(RESPONSE_FILE) && waited < 30) {
        await new Promise(r => setTimeout(r, 1000));
        waited++;
      }
      
      if (existsSync(RESPONSE_FILE)) {
        const response = readFileSync(RESPONSE_FILE, 'utf-8');
        console.log(`[BRIDGE] ✅ Got response (${response.length} chars)`);
        
        // Save to final response file
        const finalResponse = {
          originalMessage: message,
          response: response,
          respondedAt: new Date().toISOString()
        };
        writeFileSync(".ludoc/gemini-response.json", JSON.stringify(finalResponse, null, 2));
        
        // Remove response file
        // @ts-ignore
        unlinkSync(RESPONSE_FILE);
        
        // Remove from queue
        const newQueue = queue.slice(1);
        writeFileSync(QUEUE_FILE, JSON.stringify(newQueue, null, 2));
      } else {
        console.log("[BRIDGE] ❌ Timeout waiting for response");
        // Remove from queue anyway
        const newQueue = queue.slice(1);
        writeFileSync(QUEUE_FILE, JSON.stringify(newQueue, null, 2));
      }
    }
  }
  
  await new Promise(r => setTimeout(r, 1000));
}
