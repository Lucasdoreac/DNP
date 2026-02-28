/**
 * LUDOC HARDWARE - Environment Detection
 *
 * Phase 2.2: Hardware UUID Binding
 *
 * Detects the runtime environment with special handling for WSL2.
 * This module determines which UUID discovery strategy to use.
 *
 * Critical: WSL2 must be detected BEFORE generic Linux detection
 * because process.platform === 'linux' on both WSL2 and real Linux.
 */

import { execSync, execFileSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { cpus, version } from 'os';

export type PlatformType = 'windows-native' | 'wsl2' | 'linux' | 'macos';

export interface EnvironmentContext {
  platform: PlatformType;
  isVM: boolean;
  canAccessWindowsHost: boolean;
  cpuCount: number;
  osVersion: string;
}

export class EnvironmentDetector {
  /**
   * Cache environment detection to avoid repeated expensive PowerShell calls
   */
  private static _cached: EnvironmentContext | null = null;

  /**
   * Detect the current runtime environment
   */
  static async detect(): Promise<EnvironmentContext> {
    // Return cached result if available
    if (this._cached) {
      console.log('[ENV] Returning cached environment context');
      return this._cached;
    }

    // Check platform
    const platform = this.detectPlatform();

    // Get system info
    const cpuCount = this.detectCPUCount();
    const osVersion = this.detectOSVersion();

    // Check Windows host accessibility (for WSL2)
    let canAccessWindowsHost = false;
    if (platform === 'wsl2') {
      canAccessWindowsHost = await this.canAccessWindowsHostViaPowerShell();
    }

    const isVM = platform === 'wsl2';

    const context: EnvironmentContext = {
      platform,
      isVM,
      canAccessWindowsHost,
      cpuCount,
      osVersion,
    };

    // Cache the result for future calls
    this._cached = context;
    return context;
  }

  /**
   * Detect platform type with WSL2-first strategy
   * CRITICAL: Must check WSL2 BEFORE generic Linux
   */
  private static detectPlatform(): PlatformType {
    const nodePlatform = process.platform;

    // macOS is straightforward
    if (nodePlatform === 'darwin') {
      return 'macos';
    }

    // Windows native (no WSL)
    if (nodePlatform === 'win32') {
      return 'windows-native';
    }

    // Linux - but could be WSL2
    if (nodePlatform === 'linux') {
      // WSL2 detection: /proc/version contains "microsoft"
      try {
        if (existsSync('/proc/version')) {
          const procVersion = readFileSync('/proc/version', 'utf-8').toLowerCase();
          if (procVersion.includes('microsoft') || procVersion.includes('wsl')) {
            return 'wsl2';
          }
        }
      } catch (_) {
        // Ignore errors, fall through to generic linux
      }

      return 'linux';
    }

    // Fallback (shouldn't reach here)
    return 'linux';
  }

  /**
   * Try to access Windows host from WSL2 via PowerShell
   * Returns true if powershell.exe exists and can be executed
   */
  private static async canAccessWindowsHostViaPowerShell(): Promise<boolean> {
    try {
      // Try to run powershell.exe from WSL2
      // This is the critical "Violation of VM Boundaries" call
      execSync('which powershell.exe', { encoding: 'utf-8', timeout: 2000 });
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Detect number of CPUs
   */
  private static detectCPUCount(): number {
    try {
      if (process.platform === 'win32') {
        try {
          const output = execFileSync('powershell.exe', [
            '-Command',
            '(Get-WmiObject Win32_Processor).NumberOfCores',
          ], {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
            timeout: 5000,
          });
          const match = output.trim().match(/\d+/);
          if (match) return parseInt(match[0], 10);
          return cpus().length || 1;
        } catch (_inner) {
          return cpus().length || 1;
        }
      } else {
        const output = execSync('nproc', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        return parseInt(output.trim(), 10);
      }
    } catch (_) {
      return cpus().length || 1;
    }
  }

  /**
   * Detect OS version
   */
  private static detectOSVersion(): string {
    try {
      if (process.platform === 'win32') {
        try {
          const output = execFileSync('powershell.exe', [
            '-Command',
            '(Get-WmiObject Win32_OperatingSystem).Version',
          ], {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
            timeout: 5000,
          });
          const match = output.trim().match(/\d+\.\d+/);
          if (match) return `Windows ${match[0]}`;
          return version();
        } catch (_inner) {
          return version();
        }
      } else if (process.platform === 'darwin') {
        const output = execSync('sw_vers -productVersion', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        return `macOS ${output.trim()}`;
      } else {
        const output = execSync('uname -r', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        return `Linux ${output.trim()}`;
      }
    } catch (_) {
      return 'Unknown';
    }
  }
}

/**
 * Phase 2.2 Status
 *
 * ✅ Environment Detection: Complete (Windows, WSL2, Linux, macOS)
 * ⏳ Hardware UUID Discovery: Next (src/hardware/discovery.ts)
 * ⏳ Sealed Identity Binding: Phase 2.2 (src/crypto/sealed-identity.ts)
 * ⏳ Bootstrap v2 Integration: Phase 2.2 (src/kernel/bootstrap-v2.ts)
 */
