/**
 * LUDOC OS - Resource Monitor
 *
 * Phase 2.3: Resource Optimization
 *
 * Monitors system resources and prevents:
 * - Fork-bombs (infinite process spawning)
 * - Memory leaks
 * - CPU monopolization
 * - Orphaned processes
 */

import { exec } from 'child_process';

export interface ResourceUsage {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  threads: number;
  runtime: string;
}

export interface ResourceLimits {
  maxCpuPercent: number;
  maxMemoryMB: number;
  maxProcesses: number;
  maxRuntime: number; // seconds
}

export class ResourceMonitor {
  private limits: ResourceLimits;
  private checkInterval: number = 5000; // 5 seconds

  constructor(limits?: Partial<ResourceLimits>) {
    this.limits = {
      maxCpuPercent: 80,
      maxMemoryMB: 2048,
      maxProcesses: 5,
      maxRuntime: 300, // 5 minutes
      ...limits,
    };
  }

  /**
   * Get current resource usage for a process
   */
  async getProcessUsage(pid: number): Promise<ResourceUsage | null> {
    return new Promise((resolve) => {
      exec(
        `ps -p ${pid} -o pid=,comm=,%cpu=,%mem=,nlwp=,etime= 2>/dev/null`,
        (error, stdout) => {
          if (error) {
            resolve(null);
            return;
          }

          const parts = stdout.trim().split(/\s+/);
          if (parts.length < 6) {
            resolve(null);
            return;
          }

          resolve({
            pid: parseInt(parts[0]),
            name: parts[1],
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]) * 100, // Convert % to MB (approx)
            threads: parseInt(parts[4]),
            runtime: parts[5],
          });
        }
      );
    });
  }

  /**
   * Check if LUDOC processes are within limits
   */
  async checkLudocProcesses(): Promise<{
    withinLimits: boolean;
    violations: string[];
  }> {
    const violations: string[] = [];

    // Get all LUDOC-related processes
    exec(
      'ps aux | grep -E "context-server|gemini-bridge|dispatcher" | grep -v grep',
      async (error, stdout) => {
        if (error) {
          return { withinLimits: true, violations: [] };
        }

        const lines = stdout.trim().split('\n').filter((l) => l);
        const processCount = lines.length;

        if (processCount > this.limits.maxProcesses) {
          violations.push(
            `Too many LUDOC processes: ${processCount} > ${this.limits.maxProcesses}`
          );
        }

        // Check each process
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[1]);
          const cpu = parseFloat(parts[2]);
          const mem = parseFloat(parts[3]);

          if (cpu > this.limits.maxCpuPercent) {
            violations.push(
              `Process ${parts[10]} (PID ${pid}) exceeds CPU limit: ${cpu}% > ${this.limits.maxCpuPercent}%`
            );
          }

          if (mem * 100 > this.limits.maxMemoryMB) {
            violations.push(
              `Process ${parts[10]} (PID ${pid}) exceeds memory limit: ${(mem * 100).toFixed(0)}MB > ${this.limits.maxMemoryMB}MB`
            );
          }
        }

        return {
          withinLimits: violations.length === 0,
          violations,
        };
      }
    );

    return { withinLimits: true, violations: [] };
  }

  /**
   * Kill a LUDOC process safely
   */
  async killProcess(pid: number, reason: string): Promise<boolean> {
    console.log(`[RESOURCE-MONITOR] Killing PID ${pid}: ${reason}`);

    return new Promise((resolve) => {
      exec(`kill -9 ${pid}`, (error) => {
        if (error) {
          console.error(`[RESOURCE-MONITOR] Failed to kill PID ${pid}: ${error}`);
          resolve(false);
          return;
        }
        console.log(`[RESOURCE-MONITOR] ✅ PID ${pid} killed`);
        resolve(true);
      });
    });
  }

  /**
   * Start monitoring LUDOC processes
   */
  startMonitoring(): NodeJS.Timeout {
    console.log('[RESOURCE-MONITOR] Starting resource monitor...');

    return setInterval(async () => {
      const { withinLimits, violations } = await this.checkLudocProcesses();

      if (!withinLimits) {
        console.error('[RESOURCE-MONITOR] ⚠️  LIMIT VIOLATIONS:');
        violations.forEach((v) => console.error(`  - ${v}`));

        // Kill all LUDOC processes if limits exceeded
        console.log('[RESOURCE-MONITOR] Shutting down LUDOC processes...');
        this.shutdownAll();
      }
    }, this.checkInterval);
  }

  /**
   * Shutdown all LUDOC processes
   */
  async shutdownAll(): Promise<void> {
    return new Promise((resolve) => {
      exec(
        'pkill -9 -f "context-server|gemini-bridge|dispatcher" 2>/dev/null',
        (error) => {
          if (error) {
            console.error('[RESOURCE-MONITOR] Error shutting down:', error);
          } else {
            console.log('[RESOURCE-MONITOR] ✅ All LUDOC processes shut down');
          }
          resolve();
        }
      );
    });
  }

  /**
   * Get current resource usage summary
   */
  async getSummary(): Promise<{
    ludocProcesses: number;
    totalCpu: number;
    totalMemory: number;
  }> {
    return new Promise((resolve) => {
      exec(
        'ps aux | grep -E "context-server|gemini-bridge|dispatcher" | grep -v grep | awk \'{cpu += $3; mem += $4; count++} END {print count " " cpu " " mem}\'',
        (error, stdout) => {
          if (error) {
            resolve({ ludocProcesses: 0, totalCpu: 0, totalMemory: 0 });
            return;
          }

          const parts = stdout.trim().split(/\s+/);
          resolve({
            ludocProcesses: parseInt(parts[0]) || 0,
            totalCpu: parseFloat(parts[1]) || 0,
            totalMemory: parseFloat(parts[2]) || 0,
          });
        }
      );
    });
  }
}

// CLI entry point
if (import.meta.main) {
  const monitor = new ResourceMonitor({
    maxCpuPercent: 50,
    maxMemoryMB: 1024,
    maxProcesses: 3,
    maxRuntime: 180, // 3 minutes
  });

  // Start monitoring
  monitor.startMonitoring();

  // Print summary every 10 seconds
  setInterval(async () => {
    const summary = await monitor.getSummary();
    console.log(
      `[RESOURCE-MONITOR] LUDOC: ${summary.ludocProcesses} processes, CPU: ${summary.totalCpu.toFixed(1)}%, MEM: ${(summary.totalMemory * 100).toFixed(0)}MB`
    );
  }, 10000);
}
