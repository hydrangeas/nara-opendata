import type { UserId } from '@nara-opendata/shared-kernel';
import { equalsUserId } from '@nara-opendata/shared-kernel';
import type { RateLimit } from './RateLimit';
import { equalsRateLimit } from './RateLimit';

/**
 * 認証されたユーザーの属性
 */
export interface IAuthenticatedUserAttributes {
  userId: UserId;
  rateLimit: RateLimit;
}

/**
 * 認証されたユーザーを表すバリューオブジェクト
 * ブランド型を使用してIAuthenticatedUserAttributes型と区別する
 */
export type AuthenticatedUser = IAuthenticatedUserAttributes & { readonly brand: unique symbol };

/**
 * AuthenticatedUserを作成する
 */
export function createAuthenticatedUser(userId: UserId, rateLimit: RateLimit): AuthenticatedUser {
  // UserIdとRateLimitは既にバリデーション済みのbrand型なので、
  // ここでは追加のバリデーションは不要
  return { userId, rateLimit } as AuthenticatedUser;
}

/**
 * AuthenticatedUserからユーザーIDを取得する
 */
export function getUserId(user: AuthenticatedUser): UserId {
  return user.userId;
}

/**
 * AuthenticatedUserからレート制限を取得する
 */
export function getRateLimit(user: AuthenticatedUser): RateLimit {
  return user.rateLimit;
}

/**
 * AuthenticatedUserの等価性を判定する
 */
export function equalsAuthenticatedUser(a: AuthenticatedUser, b: AuthenticatedUser): boolean {
  return equalsUserId(a.userId, b.userId) && equalsRateLimit(a.rateLimit, b.rateLimit);
}
