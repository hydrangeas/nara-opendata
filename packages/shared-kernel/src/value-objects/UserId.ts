/**
 * ユーザーIDを表すバリューオブジェクト
 * ブランド型を使用してstring型と区別する
 */
export type UserId = string & { readonly brand: unique symbol };

/**
 * ユーザーIDを作成する
 */
export function createUserId(value: string): UserId {
  // 型チェック（実行時のバリデーション）
  if (typeof value !== 'string') {
    throw new Error('UserId must be a string');
  }

  if (!value || value.trim() === '') {
    throw new Error('UserId cannot be empty');
  }

  // UUID形式の検証（大文字小文字を区別しない）
  // /iフラグにより、[0-9a-f]は[0-9a-fA-F]と同じ意味になる
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error('UserId must be a valid UUID');
  }

  // 小文字に正規化して保存（一貫性のため）
  return value.toLowerCase() as UserId;
}

/**
 * UserIdの等価性を比較する
 */
export function equalsUserId(a: UserId, b: UserId): boolean {
  return a === b;
}
