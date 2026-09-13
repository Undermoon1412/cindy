import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ dir: '' }));
vi.mock('electron', () => ({ app: { getPath: () => state.dir } }));
vi.mock('../maker-host/logger-adapter.js', () => ({ desktopMakerLogger: {
  child: () => ({ info: vi.fn(), warn: vi.fn() }),
} }));
import { normalizeClaudeIdleSettings, readClaudeIdleMinutes } from '../maker-host/claude-idle-release-settings';

describe('Claude idle release override', () => {
  it.each([undefined, null, {}, { minutes: -1 }, { minutes: 1.5 }, { minutes: 1441 },
    { minutes: '0' }, { minutes: NaN }, { minutes: Infinity }])('rejects malformed settings %j', raw => {
    expect(normalizeClaudeIdleSettings(raw)).toEqual({ minutes: 30 });
  });
  it.each([0, 1, 30, 1440])('accepts %i minutes', minutes => {
    expect(normalizeClaudeIdleSettings({ minutes })).toEqual({ minutes });
  });
  it('does not persist defaults and reloads explicit overrides and reset without restarting', () => {
    state.dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-idle-settings-'));
    const file = path.join(state.dir, 'claude-idle-release.json');
    try {
      expect(readClaudeIdleMinutes()).toBe(30); expect(fs.existsSync(file)).toBe(false);
      fs.writeFileSync(file, '{"minutes":0}'); expect(readClaudeIdleMinutes()).toBe(0);
      fs.writeFileSync(file, '{"minutes":60}');
      const changed = new Date(Date.now() + 5000); fs.utimesSync(file, changed, changed);
      expect(readClaudeIdleMinutes()).toBe(60);
      fs.unlinkSync(file); expect(readClaudeIdleMinutes()).toBe(30);
    } finally { fs.rmSync(state.dir, { recursive: true, force: true }); }
  });
});
