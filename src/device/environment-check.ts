import { PlatformFailure, type DeviceType } from '../shared/index.js';

// Environment preconditions for a run (UC-05, BR-015). Every check is gathered before reporting so
// QC sees all problems at once instead of fixing them one round-trip at a time.
// Pure logic: all system access goes through EnvironmentProbes, faked in unit tests.

export type CheckStatus = 'ok' | 'failed';

export interface EnvironmentCheckItem {
  name: string;
  status: CheckStatus;
  reason: string | null;
}

export interface EnvironmentReport {
  ok: boolean;
  items: EnvironmentCheckItem[];
}

/** App-specific part of the check. Structurally satisfied by AppConfig, so Device stays decoupled. */
export interface AppEnvironmentTarget {
  buildPath: string;
  deviceType: DeviceType;
  deviceId: string;
  osVersion: string;
}

/** The system-call seam: implemented in system-probes.ts, replaced by fakes in unit tests. */
export interface EnvironmentProbes {
  nodeVersion(): string;
  requiredNodeRange(): string | null;
  xcodeVersion(): string | null;
  appiumVersion(): string | null;
  availableDeviceIds(deviceType: DeviceType): string[];
  deviceOsVersion(deviceType: DeviceType, deviceId: string): string | null;
  fileExists(filePath: string): boolean;
}

function ok(name: string): EnvironmentCheckItem {
  return { name, status: 'ok', reason: null };
}

function failed(name: string, reason: string): EnvironmentCheckItem {
  return { name, status: 'failed', reason };
}

function majorOf(version: string): number | null {
  const match = /(\d+)/.exec(version);
  const captured = match?.[1];
  return captured === undefined ? null : Number.parseInt(captured, 10);
}

function checkNode(probes: EnvironmentProbes): EnvironmentCheckItem {
  const required = probes.requiredNodeRange();
  if (required === null) {
    return failed('node', 'required Node version is not declared in package.json engines');
  }

  const actual = probes.nodeVersion();
  const actualMajor = majorOf(actual);
  const requiredMajor = majorOf(required);
  if (actualMajor === null || requiredMajor === null) {
    return failed('node', `cannot compare Node ${actual} against ${required}`);
  }

  return actualMajor >= requiredMajor
    ? ok('node')
    : failed('node', `Node ${actual} does not satisfy ${required}`);
}

function checkTarget(
  probes: EnvironmentProbes,
  target: AppEnvironmentTarget,
): EnvironmentCheckItem[] {
  const items: EnvironmentCheckItem[] = [
    probes.fileExists(target.buildPath)
      ? ok('build')
      : failed('build', `build not found at ${target.buildPath}`),
  ];

  const available = probes.availableDeviceIds(target.deviceType);
  if (!available.includes(target.deviceId)) {
    const found = available.length === 0 ? 'none' : available.join(', ');
    items.push(failed('device', `device ${target.deviceId} is not available; found: ${found}`));
    return items;
  }

  items.push(ok('device'));

  const osVersion = probes.deviceOsVersion(target.deviceType, target.deviceId);
  if (osVersion === null) {
    items.push(failed('device-os', `cannot read the OS version of device ${target.deviceId}`));
  } else if (osVersion !== target.osVersion) {
    items.push(
      failed('device-os', `device runs OS ${osVersion} but the app declares ${target.osVersion}`),
    );
  } else {
    items.push(ok('device-os'));
  }

  return items;
}

/** Run every environment check. Pass a target to include the app-specific build and device checks. */
export function checkEnvironment(
  probes: EnvironmentProbes,
  target?: AppEnvironmentTarget,
): EnvironmentReport {
  const items: EnvironmentCheckItem[] = [
    checkNode(probes),
    probes.xcodeVersion() === null
      ? failed('xcode', 'Xcode command line tools not found')
      : ok('xcode'),
    probes.appiumVersion() === null ? failed('appium', 'Appium not found on PATH') : ok('appium'),
  ];

  if (target !== undefined) {
    items.push(...checkTarget(probes, target));
  }

  return { ok: items.every((item) => item.status === 'ok'), items };
}

/** Turn a failing report into the single PlatformFailure that stops a run before the Appium session. */
export function assertEnvironmentReady(report: EnvironmentReport): void {
  if (report.ok) return;

  const failures = report.items
    .filter((item) => item.status === 'failed')
    .map((item) => `${item.name}: ${item.reason ?? 'failed'}`);

  throw new PlatformFailure(`Environment is not ready: ${failures.join('; ')}`, {
    failed_checks: failures,
  });
}
