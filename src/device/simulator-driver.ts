import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PlatformFailure } from '../shared/index.js';
import type { DeviceDriver } from './device-manager.js';
import { readBuildInfo, readPlist } from './build-info.js';

// simctl-backed driver for iOS simulators. Shell layer: verified manually on a QC machine.
//
// deviceId may be a simulator name (e.g. "iPhone 17") or a UDID. The name is what the Appium
// capabilities use as appium:deviceName, so the config stays portable across machines; here it is
// resolved to the concrete UDID for the simctl operations, which are keyed by UDID (US-5.2 fix).

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
  name: string;
  state: string;
  isAvailable?: boolean;
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

interface ResolvedDevice {
  udid: string;
  runtime: string;
}

/** Resolve a simulator by UDID or name, preferring an available device; returns its udid + runtime. */
function findDevice(deviceId: string): ResolvedDevice | null {
  const list = listSimulators();
  if (list === null) return null;
  for (const [runtime, devices] of Object.entries(list.devices)) {
    const match = devices.find(
      (device) =>
        (device.udid === deviceId || device.name === deviceId) && device.isAvailable !== false,
    );
    if (match !== undefined) return { udid: match.udid, runtime };
  }
  return null;
}

/** The concrete UDID for a simctl call; falls back to the given id (already a udid or "booted"). */
function udidFor(deviceId: string): string {
  return findDevice(deviceId)?.udid ?? deviceId;
}

export function createSimulatorDriver(): DeviceDriver {
  return {
    isPresent: (deviceId) => findDevice(deviceId) !== null,

    osVersion: (deviceId) => {
      const device = findDevice(deviceId);
      if (device === null) return null;
      return /iOS-([0-9-]+)/.exec(device.runtime)?.[1]?.replace(/-/g, '.') ?? null;
    },

    prepare: (deviceId) => {
      const udid = udidFor(deviceId);
      // Booting an already booted simulator is a no-op error, so bootstatus is used to settle it.
      run(['simctl', 'boot', udid]);
      runOrFail(['simctl', 'bootstatus', udid, '-b'], `Cannot boot simulator ${deviceId}`, {
        device_id: deviceId,
      });
    },

    readBuildInfo,

    installedVersion: (deviceId, bundleId) => {
      const container = run(['simctl', 'get_app_container', udidFor(deviceId), bundleId]);
      if (container === null) return null;
      return readPlist(path.join(container, 'Info.plist'))?.version ?? null;
    },

    install: (deviceId, buildPath) => {
      runOrFail(
        ['simctl', 'install', udidFor(deviceId), buildPath],
        `Cannot install ${buildPath} on simulator ${deviceId}`,
        { device_id: deviceId, build_path: buildPath },
      );
    },
  };
}
