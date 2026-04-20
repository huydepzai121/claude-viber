import { describe, expect, test } from 'bun:test';

import type { SessionInitData, SlashCommand } from '../../shared/types/ipc';

// Extract the same logic used in ChatInput for slash command filtering
function buildEffectiveCommands(
  slashCommands: SlashCommand[],
  sessionInitData: SessionInitData | null
): SlashCommand[] {
  return slashCommands.length > 0 ?
      slashCommands
    : (sessionInitData?.slashCommands ?? []).map((name) => ({
        name: name.startsWith('/') ? name : `/${name}`,
        description: '',
        argumentHint: ''
      }));
}

function getSlashFilter(value: string): string {
  return value.startsWith('/') ? value.slice(1).split(' ')[0] : '';
}

function filterCommands(commands: SlashCommand[], filter: string): SlashCommand[] {
  return commands.filter((cmd) => cmd.name.toLowerCase().includes(filter.toLowerCase()));
}

function shouldShowSlashMenu(
  value: string,
  filteredCommands: SlashCommand[],
  dismissed: boolean
): boolean {
  return value.startsWith('/') && !value.includes(' ') && filteredCommands.length > 0 && !dismissed;
}

const mockCommands: SlashCommand[] = [
  { name: '/commit', description: 'Commit changes', argumentHint: '[message]' },
  { name: '/compact', description: 'Compact conversation', argumentHint: '' },
  { name: '/plan', description: 'Create a plan', argumentHint: '[request]' },
  { name: '/fix', description: 'Fix a bug', argumentHint: '[description]' }
];

const mockSessionInit: SessionInitData = {
  tools: ['Bash', 'Read'],
  slashCommands: ['commit', 'plan', 'fix'],
  skills: ['workspace-tools'],
  plugins: [],
  mcpServers: [],
  model: 'claude-haiku-4-5-20251001',
  permissionMode: 'acceptEdits'
};

describe('slash command filtering', () => {
  describe('getSlashFilter', () => {
    test('returns empty when input does not start with /', () => {
      expect(getSlashFilter('hello')).toBe('');
      expect(getSlashFilter('')).toBe('');
    });

    test('extracts first word after /', () => {
      expect(getSlashFilter('/commit')).toBe('commit');
      expect(getSlashFilter('/com')).toBe('com');
    });

    test('stops at first space', () => {
      expect(getSlashFilter('/commit some message')).toBe('commit');
    });

    test('handles just slash', () => {
      expect(getSlashFilter('/')).toBe('');
    });
  });

  describe('filterCommands', () => {
    test('returns all commands when filter is empty', () => {
      const result = filterCommands(mockCommands, '');
      expect(result).toHaveLength(4);
    });

    test('filters by partial match', () => {
      const result = filterCommands(mockCommands, 'com');
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toEqual(['/commit', '/compact']);
    });

    test('is case insensitive', () => {
      const result = filterCommands(mockCommands, 'COM');
      expect(result).toHaveLength(2);
    });

    test('returns empty when no match', () => {
      const result = filterCommands(mockCommands, 'xyz');
      expect(result).toHaveLength(0);
    });
  });

  describe('shouldShowSlashMenu', () => {
    test('shows when starts with / and has matches', () => {
      expect(shouldShowSlashMenu('/com', mockCommands, false)).toBe(true);
    });

    test('hides when input has space (command selected)', () => {
      expect(shouldShowSlashMenu('/commit message', mockCommands, false)).toBe(false);
    });

    test('hides when no matches', () => {
      expect(shouldShowSlashMenu('/xyz', [], false)).toBe(false);
    });

    test('hides when dismissed', () => {
      expect(shouldShowSlashMenu('/com', mockCommands, true)).toBe(false);
    });

    test('hides when input does not start with /', () => {
      expect(shouldShowSlashMenu('hello', mockCommands, false)).toBe(false);
    });
  });

  describe('buildEffectiveCommands', () => {
    test('prefers slashCommands prop over sessionInitData', () => {
      const result = buildEffectiveCommands(mockCommands, mockSessionInit);
      expect(result).toBe(mockCommands);
    });

    test('falls back to sessionInitData when slashCommands is empty', () => {
      const result = buildEffectiveCommands([], mockSessionInit);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('/commit');
      expect(result[0].description).toBe('');
    });

    test('prefixes / when sessionInitData names lack it', () => {
      const result = buildEffectiveCommands([], mockSessionInit);
      result.forEach((cmd) => expect(cmd.name.startsWith('/')).toBe(true));
    });

    test('does not double-prefix / on names that already have it', () => {
      const initData: SessionInitData = {
        ...mockSessionInit,
        slashCommands: ['/commit', 'plan']
      };
      const result = buildEffectiveCommands([], initData);
      expect(result[0].name).toBe('/commit');
      expect(result[1].name).toBe('/plan');
    });

    test('returns empty when both sources are empty', () => {
      const result = buildEffectiveCommands([], null);
      expect(result).toHaveLength(0);
    });
  });
});
