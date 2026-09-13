/** Hidden, hot-reloaded override for ordinary local Claude runtime reclamation. */
import { app } from 'electron';
import path from 'node:path';
import { desktopMakerLogger } from './logger-adapter.js';
import { createOverrideSettingsFile } from './override-settings-file.js';

export const DEFAULT_CLAUDE_IDLE_MINUTES = 30;
export function normalizeClaudeIdleSettings(raw: unknown): { minutes: number } {
  const value = raw && typeof raw === 'object' ? (raw as { minutes?: unknown }).minutes : undefined;
  return { minutes: typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1440
    ? value : DEFAULT_CLAUDE_IDLE_MINUTES };
}
const store = createOverrideSettingsFile({
  filePath: () => path.join(app.getPath('userData'), 'claude-idle-release.json'),
  defaults: { minutes: DEFAULT_CLAUDE_IDLE_MINUTES },
  normalize: normalizeClaudeIdleSettings,
  log: desktopMakerLogger.child('claude-idle-release-settings'),
  label: 'claude-idle-release',
});
export function readClaudeIdleMinutes(): number {
  store.invalidateIfChanged();
  return store.read().minutes;
}
