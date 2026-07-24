import { execFileSync } from 'node:child_process';
import { PlatformFailure } from '../shared/index.js';
import type { DeviceDriver } from './device-manager.js';
import { readBuildInfo } from './build-info.js';

// devicectl-backed driver for physical iOS devices. Shell layer: verified manually on a QC machine
// with a connected, unlocked and trusted device.

function run(args: string[]): string | null {
  try {
    return execFileSync('xcrun', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function runOrFail(args: string[], what: string, context: Record<string, unknown>): string {
  try {
    return execFileSync('xcrun', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new PlatformFailure(`${what}: ${reason}`, context);
  }
}

function deviceLine(deviceId: string): string | null {
  const raw = run(['devicectl', 'list', 'devices']);
  if (raw === null) return null;
  return raw.split('\n').find((line) => line.includes(deviceId)) ?? null;
}

export function createRealDeviceDriver(): DeviceDriver {
  return {
    isPresent: (deviceId) => deviceLine(deviceId) !== null,

    osVersion: (deviceId) => {
      const line = deviceLine(deviceId);
      if (line === null) return null;
      return /\b(\d+\.\d+(?:\.\d+)?)\b/.exec(line)?.[1] ?? null;
    },

    prepare: (deviceId) => {
      // A physical device is prepared by the QC: connected, unlocked and trusted. Confirm only.
      if (deviceLine(deviceId) === null) {
        throw new PlatformFailure(
          `Device ${deviceId} is not connected, or the Mac is not trusted by it`,
          { device_id: deviceId },
        );
      }
    },

    readBuildInfo,

    // devicectl does not expose installed app versions reliably across Xcode releases; returning
    // null means "unknown", so installBuild reinstalls instead of skipping.
    installedVersion: () => null,

    install: (deviceId, buildPath) => {
      runOrFail(
        ['devicectl', 'device', 'install', 'app', '--device', deviceId, buildPath],
        `Cannot install ${buildPath} on device ${deviceId}`,
        { device_id: deviceId, build_path: buildPath },
      );
    },
  };
}
