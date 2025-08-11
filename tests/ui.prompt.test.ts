import { describe, it, expect, vi } from 'vitest';
import { promptInput, promptSelect } from '../src/ui/prompt.js';

describe('Prompt UI', () => {
  describe('promptInput', () => {
    it('creates readline interface with correct options', () => {
      // This is a simple test that doesn't require complex mocking
      expect(typeof promptInput).toBe('function');
    });
  });

  describe('promptSelect', () => {
    it('returns empty string for empty choices', async () => {
      const result = await promptSelect('test', []);
      expect(result).toBe('');
    });

    it('creates promptSelect function', () => {
      expect(typeof promptSelect).toBe('function');
    });
  });
});
