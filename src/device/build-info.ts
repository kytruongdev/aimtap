import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { BuildInfo } from './device-manager.js';

// Reads bundle id and version out of a build's Info.plist. Shell layer: verified manually on a QC
// machine, kept free of decision logic (conventions.md, unit test strategy).

function run(command: string, args: string[]): string | null {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

interface InfoPlist {
  CFBundleIdentifier?: string;
  CFBundleShortVersionString?: string;
}

export function readPlist(plistPath: string): BuildInfo | null {
  const raw = run('plutil', ['-convert', 'json', '-o', '-', plistPath]);
  if (raw === null) return null;

  try {
    const parsed = JSON.parse(raw) as InfoPlist;
    const bundleId = parsed.CFBundleIdentifier;
    const version = parsed.CFBundleShortVersionString;
    return bundleId === undefined || version === undefined ? null : { bundleId, version };
  } catch {
    return null;
  }
}

/** Read build metadata from a .app bundle or a signed .ipa archive. */
export function readBuildInfo(buildPath: string): BuildInfo | null {
  if (!fs.existsSync(buildPath)) return null;

  if (buildPath.endsWith('.app')) {
    return readPlist(path.join(buildPath, 'Info.plist'));
  }

  if (buildPath.endsWith('.ipa')) {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aimtap-ipa-'));
    try {
      if (run('unzip', ['-qo', buildPath, 'Payload/*/Info.plist', '-d', workDir]) === null) {
        return null;
      }
      const payload = path.join(workDir, 'Payload');
      const appDir = fs.readdirSync(payload).find((entry) => entry.endsWith('.app'));
      return appDir === undefined ? null : readPlist(path.join(payload, appDir, 'Info.plist'));
    } catch {
      return null;
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }

  return null;
}
