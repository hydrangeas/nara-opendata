import { describe, it, expect } from 'vitest';
import {
  ProviderType,
  createProvider,
  getProviderType,
  equalsProvider,
  getProviderDisplayName,
  parseProviderType,
  createGoogleProvider,
  createGitHubProvider,
  createEmailProvider,
} from './Provider';

describe('Provider', () => {
  describe('createProvider', () => {
    it('有効なプロバイダーを作成する', () => {
      const provider = createProvider(ProviderType.GOOGLE);
      expect(getProviderType(provider)).toBe(ProviderType.GOOGLE);
    });

    it('各種プロバイダータイプで作成できる', () => {
      const googleProvider = createProvider(ProviderType.GOOGLE);
      expect(getProviderType(googleProvider)).toBe(ProviderType.GOOGLE);

      const githubProvider = createProvider(ProviderType.GITHUB);
      expect(getProviderType(githubProvider)).toBe(ProviderType.GITHUB);

      const emailProvider = createProvider(ProviderType.EMAIL);
      expect(getProviderType(emailProvider)).toBe(ProviderType.EMAIL);
    });
  });

  describe('equalsProvider', () => {
    it('同じプロバイダータイプは等しい', () => {
      const provider1 = createProvider(ProviderType.GOOGLE);
      const provider2 = createProvider(ProviderType.GOOGLE);
      expect(equalsProvider(provider1, provider2)).toBe(true);
    });

    it('異なるプロバイダータイプは等しくない', () => {
      const provider1 = createProvider(ProviderType.GOOGLE);
      const provider2 = createProvider(ProviderType.GITHUB);
      expect(equalsProvider(provider1, provider2)).toBe(false);
    });
  });

  describe('getProviderDisplayName', () => {
    it('各プロバイダーの表示名を取得できる', () => {
      const googleProvider = createProvider(ProviderType.GOOGLE);
      expect(getProviderDisplayName(googleProvider)).toBe('Google');

      const githubProvider = createProvider(ProviderType.GITHUB);
      expect(getProviderDisplayName(githubProvider)).toBe('GitHub');

      const emailProvider = createProvider(ProviderType.EMAIL);
      expect(getProviderDisplayName(emailProvider)).toBe('Email');
    });
  });

  describe('parseProviderType', () => {
    it('文字列からプロバイダータイプに変換できる', () => {
      expect(parseProviderType('google')).toBe(ProviderType.GOOGLE);
      expect(parseProviderType('GOOGLE')).toBe(ProviderType.GOOGLE);
      expect(parseProviderType('Google')).toBe(ProviderType.GOOGLE);

      expect(parseProviderType('github')).toBe(ProviderType.GITHUB);
      expect(parseProviderType('GITHUB')).toBe(ProviderType.GITHUB);
      expect(parseProviderType('GitHub')).toBe(ProviderType.GITHUB);

      expect(parseProviderType('email')).toBe(ProviderType.EMAIL);
      expect(parseProviderType('EMAIL')).toBe(ProviderType.EMAIL);
      expect(parseProviderType('Email')).toBe(ProviderType.EMAIL);
    });

    it('前後の空白を含む文字列も正しく変換できる', () => {
      expect(parseProviderType('  google  ')).toBe(ProviderType.GOOGLE);
      expect(parseProviderType('\tgithub\n')).toBe(ProviderType.GITHUB);
      expect(parseProviderType(' email ')).toBe(ProviderType.EMAIL);
    });

    it('不明なプロバイダータイプはエラーになる', () => {
      expect(() => parseProviderType('unknown')).toThrow('Unknown provider type: unknown');
      expect(() => parseProviderType('microsoft')).toThrow('Unknown provider type: microsoft');
      expect(() => parseProviderType('')).toThrow('Unknown provider type: ');
    });
  });

  describe('便利関数', () => {
    it('createGoogleProviderでGoogleプロバイダーを作成できる', () => {
      const provider = createGoogleProvider();
      expect(getProviderType(provider)).toBe(ProviderType.GOOGLE);
      expect(getProviderDisplayName(provider)).toBe('Google');
    });

    it('createGitHubProviderでGitHubプロバイダーを作成できる', () => {
      const provider = createGitHubProvider();
      expect(getProviderType(provider)).toBe(ProviderType.GITHUB);
      expect(getProviderDisplayName(provider)).toBe('GitHub');
    });

    it('createEmailProviderでEmailプロバイダーを作成できる', () => {
      const provider = createEmailProvider();
      expect(getProviderType(provider)).toBe(ProviderType.EMAIL);
      expect(getProviderDisplayName(provider)).toBe('Email');
    });
  });

  describe('ユースケース', () => {
    it('認証ログエントリでプロバイダー情報を記録できる', () => {
      // 各種プロバイダーでログイン
      const authLogs = [
        { provider: createGoogleProvider(), timestamp: new Date() },
        { provider: createGitHubProvider(), timestamp: new Date() },
        { provider: createEmailProvider(), timestamp: new Date() },
      ];

      // プロバイダー別にグループ化
      const googleLogs = authLogs.filter(
        (log) => getProviderType(log.provider) === ProviderType.GOOGLE,
      );
      expect(googleLogs).toHaveLength(1);
    });

    it('外部システムからのプロバイダー情報を処理できる', () => {
      // 外部APIから受け取った文字列
      const externalProviders = ['Google', 'github', 'EMAIL', '  google  '];

      const providers = externalProviders.map((str) => {
        const type = parseProviderType(str);
        return createProvider(type);
      });

      expect(providers.filter((p) => getProviderType(p) === ProviderType.GOOGLE)).toHaveLength(2);
      expect(providers.filter((p) => getProviderType(p) === ProviderType.GITHUB)).toHaveLength(1);
      expect(providers.filter((p) => getProviderType(p) === ProviderType.EMAIL)).toHaveLength(1);
    });
  });
});
