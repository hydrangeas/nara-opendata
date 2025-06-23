/**
 * APIパスを表すバリューオブジェクト
 * パスパターンマッチング機能を提供
 */
export interface IAPIPathAttributes {
  value: string;
}

export type APIPath = IAPIPathAttributes & { readonly brand: unique symbol };

/**
 * APIパスを作成する
 */
export function createAPIPath(path: string): APIPath {
  // 空文字チェック
  if (!path || path.trim() === '') {
    throw new Error('API path cannot be empty');
  }

  // パストラバーサル攻撃対策
  if (path.includes('..') || path.includes('./') || path.includes('/.')) {
    throw new Error('Path traversal detected in API path');
  }

  // パスの検証（基本的な文字のみ許可）
  const validPathPattern = /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%{}]*$/;
  if (!validPathPattern.test(path)) {
    throw new Error(`Invalid API path format: ${path}`);
  }

  return { value: path } as APIPath;
}

/**
 * APIPathから文字列値を取得する
 */
export function getAPIPathValue(apiPath: APIPath): string {
  return apiPath.value;
}

/**
 * APIPathの等価性を判定する
 */
export function equalsAPIPath(a: APIPath, b: APIPath): boolean {
  return a.value === b.value;
}

/**
 * APIパスがパターンにマッチするかチェックする
 * @param apiPath チェック対象のAPIパス
 * @param pattern パターン文字列（ワイルドカード * を使用可能）
 * @returns マッチする場合true
 */
export function matchesPattern(apiPath: APIPath, pattern: string): boolean {
  // パターンを正規表現に変換
  // * を .* に変換し、他の特殊文字をエスケープ
  const regexPattern = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(apiPath.value);
}

/**
 * パスセグメントを取得する
 * 例: /api/v1/users -> ['api', 'v1', 'users']
 */
export function getPathSegments(apiPath: APIPath): string[] {
  return apiPath.value.split('/').filter((segment) => segment.length > 0);
}

/**
 * パスパラメータを抽出する
 * 例: /users/{id} のパターンに対して /users/123 -> { id: '123' }
 */
export function extractPathParams(apiPath: APIPath, pattern: string): Record<string, string> {
  const pathSegments = getPathSegments(apiPath);
  const patternSegments = pattern.split('/').filter((s) => s.length > 0);

  if (pathSegments.length !== patternSegments.length) {
    return {};
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];

    if (patternSegment && pathSegment) {
      // {param} 形式のパラメータを検出
      const paramMatch = patternSegment.match(/^{(.+)}$/);
      if (paramMatch && paramMatch[1]) {
        params[paramMatch[1]] = pathSegment;
      } else if (patternSegment !== pathSegment) {
        // パターンと一致しない場合は空のオブジェクトを返す
        return {};
      }
    }
  }

  return params;
}
