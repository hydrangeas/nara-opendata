/**
 * 認証プロバイダータイプ
 * サポートされている認証プロバイダーを定義
 */
export enum ProviderType {
  /**
   * Google OAuth
   */
  GOOGLE = 'GOOGLE',

  /**
   * GitHub OAuth
   */
  GITHUB = 'GITHUB',

  /**
   * Email/Password認証
   */
  EMAIL = 'EMAIL',
}

/**
 * プロバイダー属性
 */
export interface IProviderAttributes {
  type: ProviderType;
}

/**
 * プロバイダーバリューオブジェクト
 * 認証プロバイダー（Google、GitHub等）を表現
 */
export type Provider = IProviderAttributes & { readonly brand: unique symbol };

/**
 * プロバイダーを作成する
 */
export function createProvider(type: ProviderType): Provider {
  return { type } as Provider;
}

/**
 * プロバイダータイプを取得する
 */
export function getProviderType(provider: Provider): ProviderType {
  return provider.type;
}

/**
 * プロバイダーの等価性を判定する
 */
export function equalsProvider(a: Provider, b: Provider): boolean {
  return a.type === b.type;
}

/**
 * プロバイダーの表示名を取得する
 */
export function getProviderDisplayName(provider: Provider): string {
  switch (provider.type) {
    case ProviderType.GOOGLE:
      return 'Google';
    case ProviderType.GITHUB:
      return 'GitHub';
    case ProviderType.EMAIL:
      return 'Email';
    default: {
      // 型の網羅性チェック
      const _exhaustiveCheck: never = provider.type;
      return _exhaustiveCheck;
    }
  }
}

/**
 * 文字列からプロバイダータイプに変換する（外部連携用）
 */
export function parseProviderType(value: string): ProviderType {
  const normalizedValue = value.trim().toUpperCase();

  switch (normalizedValue) {
    case 'GOOGLE':
    case ProviderType.GOOGLE:
      return ProviderType.GOOGLE;
    case 'GITHUB':
    case ProviderType.GITHUB:
      return ProviderType.GITHUB;
    case 'EMAIL':
    case ProviderType.EMAIL:
      return ProviderType.EMAIL;
    default:
      throw new Error(`Unknown provider type: ${value}`);
  }
}

/**
 * Googleプロバイダーを作成する（便利関数）
 */
export function createGoogleProvider(): Provider {
  return createProvider(ProviderType.GOOGLE);
}

/**
 * GitHubプロバイダーを作成する（便利関数）
 */
export function createGitHubProvider(): Provider {
  return createProvider(ProviderType.GITHUB);
}

/**
 * Emailプロバイダーを作成する（便利関数）
 */
export function createEmailProvider(): Provider {
  return createProvider(ProviderType.EMAIL);
}
