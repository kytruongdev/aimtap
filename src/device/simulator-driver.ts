import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PlatformFailure } from '../shared/index.js';
import type { DeviceDriver } from './device-manager.js';
import { readBuildInfo, readPlist } from './build-info.js';

// simctl-backed driver for iOS simulators. Shell layer: verified manually on a QC machine.

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

interface SimulatorDevice {
  udid: string;
  state: string;
}

interface SimulatorList {
  devices: Record<string, SimulatorDevice[]>;
}

function listSimulators(): SimulatorList | null {
  const raw = run(['simctl', 'list', 'devices', '-j']);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as SimulatorList;
  } catch {
    return null;
  }
}

function findRuntime(deviceId: string): string | null {
  const list = listSimulators();
  if (list === null) return null;
  for (const [runtime, devices] of Object.entries(list.devices)) {
    if (devices.some((device) => device.udid === deviceId)) return runtime;
  }
  return null;
}

export function createSimulatorDriver(): DeviceDriver {
  return {
    isPresent: (deviceId) => findRuntime(deviceId) !== null,

    osVersion: (deviceId) => {
      const runtime = findRuntime(deviceId);
      if (runtime === null) return null;
      return /iOS-([0-9-]+)/.exec(runtime)?.[1]?.replace(/-/g, '.') ?? null;
    },

    prepare: (deviceId) => {
      // Booting an already booted simulator is a no-op error, so bootstatus is used to settle it.
      run(['simctl', 'boot', deviceId]);
      runOrFail(['simctl', 'bootstatus', deviceId, '-b'], `Cannot boot simulator ${deviceId}`, {
        device_id: deviceId,
      });
    },

    readBuildInfo,

    installedVersion: (deviceId, bundleId) => {
      const container = run(['simctl', 'get_app_container', deviceId, bundleId]);
      if (container === null) return null;
      return readPlist(path.join(container, 'Info.plist'))?.version ?? null;
    },

    install: (deviceId, buildPath) => {
      runOrFail(
        ['simctl', 'install', deviceId, buildPath],
        `Cannot install ${buildPath} on simulator ${deviceId}`,
        { device_id: deviceId, build_path: buildPath },
      );
    },
  };
}
