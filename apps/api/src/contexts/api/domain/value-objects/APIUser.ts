import type { UserId, UserTier } from '@nara-opendata/shared-kernel';
import { equalsUserId, equalsUserTier } from '@nara-opendata/shared-kernel';

/**
 * APIコンテキストにおけるユーザーを表すバリューオブジェクト
 * APIアクセス制御に必要な情報を保持
 */
export interface IAPIUserAttributes {
  userId: UserId;
  tier: UserTier;
}

export type APIUser = IAPIUserAttributes & { readonly brand: unique symbol };

/**
 * APIUserを作成する
 */
export function createAPIUser(userId: UserId, tier: UserTier): APIUser {
  return {
    userId,
    tier,
  } as APIUser;
}

/**
 * APIUserからユーザーIDを取得する
 */
export function getAPIUserId(user: APIUser): UserId {
  return user.userId;
}

/**
 * APIUserからティアを取得する
 */
export function getAPIUserTier(user: APIUser): UserTier {
  return user.tier;
}

/**
 * APIUserの等価性を判定する
 */
export function equalsAPIUser(a: APIUser, b: APIUser): boolean {
  return equalsUserId(a.userId, b.userId) && equalsUserTier(a.tier, b.tier);
}
