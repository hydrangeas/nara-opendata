/**
 * ユーザーIDを表すバリューオブジェクト
 * ブランド型を使用してstring型と区別する
 */
export type UserId = string & { readonly brand: unique symbol };

/**
 * ユーザーIDを作成する
 */
export function createUserId(value: string): UserId {
  if (!value || value.trim() === '') {
    throw new Error('UserId cannot be empty');
  }

  // UUID形式の検証（Supabase Authで使用される形式）
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error('UserId must be a valid UUID');
  }

  return value as UserId;
}

/**
 * UserIdの等価性を比較する
 */
export function equalsUserId(a: UserId, b: UserId): boolean {
  return a === b;
}
