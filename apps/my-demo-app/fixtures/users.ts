import { loadTestData } from '../../../src/index.js';

// Test-data references by name (ADR-009, BR-017). Values live in test-data.local.json on the QC
// machine; this module reads them through Config & Secrets and never holds a value itself.

export interface Account {
  username: string;
  password: string;
}

export function standardUser(): Account {
  return loadTestData('my-demo-app').secrets.standardUser as unknown as Account;
}
