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
 * プロバイダー表示名マップ
 */
const PROVIDER_DISPLAY_NAMES: Record<ProviderType, string> = {
  [ProviderType.GOOGLE]: 'Google',
  [ProviderType.GITHUB]: 'GitHub',
  [ProviderType.EMAIL]: 'Email',
} satisfies Record<ProviderType, string>;

/**
 * プロバイダーの表示名を取得する
 */
export function getProviderDisplayName(provider: Provider): string {
  return PROVIDER_DISPLAY_NAMES[provider.type];
}

/**
 * 文字列からプロバイダータイプに変換する（外部連携用）
 *
 * この関数は外部からの入力を処理するため、
 * あらかじめすべてのケースを定義することは困難です。
 * そのため、enum値との直接比較で実装します。
 */
export function parseProviderType(value: string): ProviderType {
  const trimmedValue = value.trim();
  const normalizedValue = trimmedValue.toUpperCase();

  // ProviderTypeのすべての値をチェック
  const providerType = Object.values(ProviderType).find((type) => type === normalizedValue);

  if (!providerType) {
    throw new Error(`Unknown provider type: ${trimmedValue}`);
  }

  return providerType;
}
