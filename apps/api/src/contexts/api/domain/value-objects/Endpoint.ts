/**
 * エンドポイントを表すバリューオブジェクト
 * APIのパスを保持する
 */
export interface IEndpointAttributes {
  path: string;
}

export type Endpoint = IEndpointAttributes & { readonly brand: unique symbol };

/**
 * エンドポイントを作成する
 */
export function createEndpoint(path: string): Endpoint {
  // 空文字チェック
  if (!path || path.trim() === '') {
    throw new Error('Endpoint path cannot be empty');
  }

  // パスの正規化
  // 1. 先頭の連続するスラッシュを単一のスラッシュに置換
  // 2. スラッシュで始まらない場合は追加
  const trimmedPath = path.replace(/^\/+/, '/');
  const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;

  return { path: normalizedPath } as Endpoint;
}

/**
 * Endpointからパス文字列を取得する
 */
export function getEndpointPath(endpoint: Endpoint): string {
  return endpoint.path;
}

/**
 * Endpointの等価性を判定する
 */
export function equalsEndpoint(a: Endpoint, b: Endpoint): boolean {
  return a.path === b.path;
}
