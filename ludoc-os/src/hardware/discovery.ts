/**
 * LUDOC HARDWARE - UUID Discovery
 *
 * Phase 2.2: Hardware-Binding Identity
 *
 * Extracts hardware UUID from various platforms with fallback strategies.
 * Each UUID source is rated for confidence: high/medium/low.
 *
 * Critical Pattern: WSL2 calls powershell.exe to get Windows host UUID,
 * not Linux VM UUID. This ensures identity portability across WSL2 reinstalls.
 */

import { execFileSync, spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import { EnvironmentDetector, EnvironmentContext } from './environment.js';

export interface UUIDDiscovery {
  uuid: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  platform: string;
}

export class HardwareDiscovery {
  /**
   * Main entry point: Get hardware UUID for current platform
   */
  static async getHardwareID(): Promise<UUIDDiscovery> {
    const env = await EnvironmentDetector.detect();

    console.log(`[HARDWARE] Detecting UUID on ${env.platform}...`);

    let discovery: UUIDDiscovery | null = null;

    switch (env.platform) {
      case 'windows-native':
        discovery = this.discoverWindows();
        break;

      case 'wsl2':
        discovery = await this.discoverWSL2Host(env);
        break;

      case 'linux':
        discovery = this.discoverLinux();
        break;

      case 'macos':
        discovery = this.discoverMacOS();
        break;
    }

    if (!discovery) {
      throw new Error('[HARDWARE] Failed to discover hardware UUID on any strategy');
    }

    console.log(`[HARDWARE] UUID: ${discovery.uuid} (source: ${discovery.source}, confidence: ${discovery.confidence})`);
    return discovery;
  }

  /**
   * Windows Native: WMI → BIOS Serial Fallback
   */
  private static discoverWindows(): UUIDDiscovery {
    try {
      // Strategy 1: WMI GUID (most reliable on Windows)
      const output = execFileSync('powershell.exe', ['-Command', '(Get-WmiObject Win32_ComputerSystemProduct).UUID'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 5000,
      }).trim();

      if (output && this.isValidUUID(output)) {
        return {
          uuid: output.toUpperCase(),
          source: 'Windows WMI UUID',
          confidence: 'high',
          platform: 'windows-native',
        };
      }
    } catch (_) {
      // Fallthrough to next strategy
    }

    try {
      // Strategy 2: BIOS Serial Number (fallback)
      const output = execFileSync('powershell.exe', ['-Command', '(Get-WmiObject Win32_BIOS).SerialNumber'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 5000,
      }).trim();

      if (output) {
        return {
          uuid: this.sha256(output),
          source: 'Windows BIOS Serial (hashed)',
          confidence: 'medium',
          platform: 'windows-native',
        };
      }
    } catch (_) {
      // Continue to machine name fallback
    }

    // Strategy 3: Machine name hash (last resort)
    try {
      const output = execFileSync('powershell.exe', ['-Command', '$env:COMPUTERNAME'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (output) {
        return {
          uuid: this.sha256(output),
          source: 'Windows Machine Name (hashed)',
          confidence: 'low',
          platform: 'windows-native',
        };
      }
    } catch (_) {
      // Fallthrough
    }

    throw new Error('[HARDWARE] Windows: Could not discover UUID from WMI, BIOS, or machine name');
  }

  /**
   * WSL2: Critical Path - Call powershell.exe to Get Windows Host UUID
   *
   * This is the "Violation of VM Boundaries" pattern:
   * - We are inside Linux VM (WSL2)
   * - We call powershell.exe to interrogate Windows host
   * - We get Windows host UUID (persistent across WSL2 reinstalls)
   * - NOT the Linux VM UUID (which is ephemeral)
   */
  private static async discoverWSL2Host(env: EnvironmentContext): Promise<UUIDDiscovery> {
    // First: Can we access Windows host?
    if (!env.canAccessWindowsHost) {
      console.warn('[HARDWARE] WSL2: Cannot access Windows host via powershell.exe');
      console.warn('[HARDWARE] WSL2: Falling back to Linux-only UUID (low confidence)');
      return this.discoverLinux();
    }

    try {
      // Call powershell.exe from WSL2 to get Windows UUID
      // This is the critical cross-boundary call
      const pwshResult = spawnSync('powershell.exe', ['-Command', '(Get-WmiObject Win32_ComputerSystemProduct).UUID'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5000,
      });

      if (pwshResult.status === 0 && pwshResult.stdout) {
        const uuid = pwshResult.stdout.trim().toUpperCase();

        if (this.isValidUUID(uuid)) {
          return {
            uuid,
            source: 'WSL2 → Windows WMI UUID (via powershell.exe)',
            confidence: 'high',
            platform: 'wsl2',
          };
        }
      }
    } catch (_) {
      // Fallthrough to BIOS serial
    }

    // Fallback: BIOS Serial via powershell.exe
    try {
      const pwshResult = spawnSync('powershell.exe', ['-Command', '(Get-WmiObject Win32_BIOS).SerialNumber'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5000,
      });

      if (pwshResult.status === 0 && pwshResult.stdout) {
        const serial = pwshResult.stdout.trim();
        return {
          uuid: this.sha256(serial),
          source: 'WSL2 → Windows BIOS Serial (hashed, via powershell.exe)',
          confidence: 'medium',
          platform: 'wsl2',
        };
      }
    } catch (_) {
      // Fallthrough
    }

    // Last resort: Linux-only UUID
    console.warn('[HARDWARE] WSL2: Could not get Windows host UUID, using Linux VM UUID (ephemeral)');
    return this.discoverLinux();
  }

  /**
   * Linux: Unprivileged DMI sysfs → dmidecode (requires sudo) → fallback
   */
  private static discoverLinux(): UUIDDiscovery {
    try {
      // Strategy 1: Unprivileged DMI sysfs (no sudo needed)
      const dmiPaths = [
        '/sys/class/dmi/id/product_uuid',
        '/sys/class/dmi/id/system-uuid',
        '/sys/devices/virtual/dmi/id/product_uuid',
      ];

      for (const path of dmiPaths) {
        try {
          if (existsSync(path)) {
            const uuid = readFileSync(path, 'utf-8').trim().toUpperCase();
            if (uuid && this.isValidUUID(uuid)) {
              return {
                uuid,
                source: `Linux DMI sysfs (${path})`,
                confidence: 'high',
                platform: 'linux',
              };
            }
          }
        } catch (_) {
          // Continue to next path
        }
      }
    } catch (_) {
      // Fallthrough to dmidecode
    }

    try {
      // Strategy 2: dmidecode (requires sudo)
      const output = execFileSync('sudo', ['dmidecode', '-s', 'system-uuid'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 5000,
      }).trim();

      if (output && this.isValidUUID(output)) {
        return {
          uuid: output.toUpperCase(),
          source: 'Linux dmidecode (requires sudo)',
          confidence: 'high',
          platform: 'linux',
        };
      }
    } catch (_) {
      // Fallthrough
    }

    try {
      // Strategy 3: Machine ID from /etc/machine-id
      if (existsSync('/etc/machine-id')) {
        const machineId = readFileSync('/etc/machine-id', 'utf-8').trim();
        if (machineId) {
          return {
            uuid: machineId,
            source: 'Linux /etc/machine-id',
            confidence: 'medium',
            platform: 'linux',
          };
        }
      }
    } catch (_) {
      // Fallthrough
    }

    try {
      // Strategy 4: Hostname hash (last resort)
      const hostname = execFileSync('hostname', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (hostname) {
        return {
          uuid: this.sha256(hostname),
          source: 'Linux hostname (hashed)',
          confidence: 'low',
          platform: 'linux',
        };
      }
    } catch (_) {
      // Continue
    }

    throw new Error('[HARDWARE] Linux: Could not discover UUID from any source');
  }

  /**
   * macOS: ioreg parsing for IOPlatformUUID
   */
  private static discoverMacOS(): UUIDDiscovery {
    try {
      // Strategy 1: ioreg for IOPlatformUUID (most reliable on Mac)
      const output = execFileSync('ioreg', ['-d2', '-c', 'IOPlatformExpertDevice'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 5000,
      });

      const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      if (match && match[1]) {
        const uuid = match[1].toUpperCase();
        if (this.isValidUUID(uuid)) {
          return {
            uuid,
            source: 'macOS ioreg IOPlatformUUID',
            confidence: 'high',
            platform: 'macos',
          };
        }
      }
    } catch (_) {
      // Fallthrough
    }

    try {
      // Strategy 2: system_profiler
      const output = execFileSync('system_profiler', ['SPHardwareDataType'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 5000,
      });

      const match = output.match(/UUID:\s*([a-f0-9\-]+)/i);
      if (match && match[1]) {
        const uuid = match[1].toUpperCase();
        if (this.isValidUUID(uuid)) {
          return {
            uuid,
            source: 'macOS system_profiler',
            confidence: 'high',
            platform: 'macos',
          };
        }
      }
    } catch (_) {
      // Fallthrough
    }

    try {
      // Strategy 3: hostname hash (fallback)
      const hostname = execFileSync('hostname', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (hostname) {
        return {
          uuid: this.sha256(hostname),
          source: 'macOS hostname (hashed)',
          confidence: 'low',
          platform: 'macos',
        };
      }
    } catch (_) {
      // Continue
    }

    throw new Error('[HARDWARE] macOS: Could not discover UUID from any source');
  }

  /**
   * Validate UUID format (basic check)
   */
  private static isValidUUID(uuid: string): boolean {
    // Standard UUID format: 8-4-4-4-12 hex chars
    const uuidRegex = /^[A-F0-9]{8}-?[A-F0-9]{4}-?[A-F0-9]{4}-?[A-F0-9]{4}-?[A-F0-9]{12}$/i;
    // Also accept just hex string (some platforms return non-standard format)
    const hexRegex = /^[A-F0-9]+$/i;

    return uuidRegex.test(uuid) || (hexRegex.test(uuid) && uuid.length >= 32);
  }

  /**
   * SHA256 hash helper for non-standard IDs
   */
  private static sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex').toUpperCase();
  }
}

/**
 * Phase 2.2 Status
 *
 * ✅ Environment Detection: Complete (src/hardware/environment.ts)
 * ✅ Hardware UUID Discovery: Complete (this module)
 * ⏳ Sealed Identity Binding: Next (src/crypto/sealed-identity.ts)
 * ⏳ Bootstrap v2 Integration: Phase 2.2 (src/kernel/bootstrap-v2.ts)
 */
