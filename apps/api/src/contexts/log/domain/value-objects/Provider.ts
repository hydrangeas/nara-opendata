/**
 * プロバイダー属性
 */
export interface IProviderAttributes {
  name: string;
}

/**
 * プロバイダーバリューオブジェクト
 * 認証プロバイダー（Google、GitHub等）を表現
 */
export type Provider = IProviderAttributes & { readonly brand: unique symbol };

/**
 * サポートされているプロバイダーのリスト
 */
export const SUPPORTED_PROVIDERS = ['google', 'github', 'email'] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

/**
 * プロバイダーを作成する
 */
export function createProvider(name: string): Provider {
  if (!name || name.trim() === '') {
    throw new Error('Provider name cannot be empty');
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 30) {
    throw new Error('Provider name cannot exceed 30 characters');
  }

  return { name: trimmedName } as Provider;
}

/**
 * プロバイダー名を取得する
 */
export function getProviderName(provider: Provider): string {
  return provider.name;
}

/**
 * プロバイダーの等価性を判定する
 */
export function equalsProvider(a: Provider, b: Provider): boolean {
  return a.name === b.name;
}

/**
 * プロバイダーがサポートされているかチェックする
 */
export function isSupportedProvider(provider: Provider): boolean {
  return SUPPORTED_PROVIDERS.includes(provider.name.toLowerCase() as SupportedProvider);
}
