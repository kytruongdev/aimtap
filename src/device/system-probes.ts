import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { DeviceType } from '../shared/index.js';
import type { EnvironmentProbes } from './environment-check.js';

// The system-call layer of the environment check. Kept deliberately thin: it only shells out and
// returns null on failure, so all decision logic stays in environment-check.ts where it is unit
// tested. This file is verified manually on a QC machine (conventions.md, unit test strategy).

function run(command: string, args: string[]): string | null {
  try {
    const output = execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.trim();
  } catch {
    return null;
  }
}

interface SimulatorDevice {
  udid: string;
  name: string;
}

interface SimulatorList {
  devices: Record<string, SimulatorDevice[]>;
}

function listSimulators(): SimulatorList | null {
  const raw = run('xcrun', ['simctl', 'list', 'devices', 'available', '-j']);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as SimulatorList;
  } catch {
    return null;
  }
}

function listRealDevices(): string | null {
  return run('xcrun', ['xctrace', 'list', 'devices']);
}

export function createSystemProbes(): EnvironmentProbes {
  return {
    nodeVersion: () => process.version,

    requiredNodeRange: () => {
      try {
        const raw = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
        const pkg = JSON.parse(raw) as { engines?: { node?: string } };
        return pkg.engines?.node ?? null;
      } catch {
        return null;
      }
    },

    xcodeVersion: () => run('xcodebuild', ['-version']),

    appiumVersion: () => run('appium', ['--version']),

    availableDeviceIds: (deviceType: DeviceType) => {
      if (deviceType === 'simulator') {
        const list = listSimulators();
        if (list === null) return [];
        return Object.values(list.devices)
          .flat()
          .map((device) => device.udid);
      }

      const raw = listRealDevices();
      if (raw === null) return [];
      return [...raw.matchAll(/\(([0-9A-Fa-f-]{8,})\)/g)]
        .map((match) => match[1] ?? '')
        .filter((id) => id !== '');
    },

    deviceOsVersion: (deviceType: DeviceType, deviceId: string) => {
      if (deviceType === 'simulator') {
        const list = listSimulators();
        if (list === null) return null;
        for (const [runtime, devices] of Object.entries(list.devices)) {
          if (devices.some((device) => device.udid === deviceId)) {
            const match = /iOS-([0-9-]+)/.exec(runtime);
            return match?.[1]?.replace(/-/g, '.') ?? null;
          }
        }
        return null;
      }

      const raw = listRealDevices();
      if (raw === null) return null;
      const line = raw.split('\n').find((entry) => entry.includes(deviceId));
      if (line === undefined) return null;
      return /\(([0-9.]+)\)/.exec(line)?.[1] ?? null;
    },

    fileExists: (filePath: string) => fs.existsSync(filePath),
  };
}
