import { describe, it, expect } from 'vitest';
import { createProvider, getProviderName, equalsProvider } from './Provider';

describe('Provider', () => {
  describe('createProvider', () => {
    it('有効なプロバイダーを作成する', () => {
      const provider = createProvider('google');
      expect(getProviderName(provider)).toBe('google');
    });

    it('大文字を含むプロバイダーを受け入れる', () => {
      const provider = createProvider('GitHub');
      expect(getProviderName(provider)).toBe('GitHub');
    });

    it('30文字のプロバイダー名を受け入れる', () => {
      const longName = 'a'.repeat(30);
      const provider = createProvider(longName);
      expect(getProviderName(provider)).toBe(longName);
    });

    it('空のプロバイダー名を拒否する', () => {
      expect(() => createProvider('')).toThrow('Provider name cannot be empty');
      expect(() => createProvider('   ')).toThrow('Provider name cannot be empty');
    });

    it('31文字のプロバイダー名を拒否する', () => {
      const tooLongName = 'a'.repeat(31);
      expect(() => createProvider(tooLongName)).toThrow(
        'Provider name cannot exceed 30 characters',
      );
    });
  });

  describe('equalsProvider', () => {
    it('同じプロバイダー名は等しい', () => {
      const provider1 = createProvider('google');
      const provider2 = createProvider('google');
      expect(equalsProvider(provider1, provider2)).toBe(true);
    });

    it('異なるプロバイダー名は等しくない', () => {
      const provider1 = createProvider('google');
      const provider2 = createProvider('github');
      expect(equalsProvider(provider1, provider2)).toBe(false);
    });
  });

  describe('一般的なプロバイダー', () => {
    it('各種プロバイダーを作成できる', () => {
      const providers = ['google', 'github', 'microsoft', 'twitter', 'facebook'];

      providers.forEach((name) => {
        const provider = createProvider(name);
        expect(getProviderName(provider)).toBe(name);
      });
    });
  });
});
