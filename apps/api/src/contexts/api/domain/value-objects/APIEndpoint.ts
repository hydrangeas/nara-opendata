import type { TierLevel } from '@nara-opendata/shared-kernel';
import { type UserTier } from '@nara-opendata/shared-kernel';
import { getUserTierLevel, getTierHierarchy } from '@nara-opendata/shared-kernel';
import type { APIPath } from './APIPath';
import { equalsAPIPath } from './APIPath';

/**
 * APIエンドポイントを表すバリューオブジェクト
 * パスと必要なティアレベルを保持
 */
export interface IAPIEndpointAttributes {
  path: APIPath;
  requiredTier: TierLevel;
}

export type APIEndpoint = IAPIEndpointAttributes & { readonly brand: unique symbol };

/**
 * APIエンドポイントを作成する
 */
export function createAPIEndpoint(attributes: {
  path: APIPath;
  requiredTier: TierLevel;
}): APIEndpoint {
  return {
    path: attributes.path,
    requiredTier: attributes.requiredTier,
  } as APIEndpoint;
}

/**
 * APIエンドポイントのパスを取得する
 */
export function getAPIEndpointPath(endpoint: APIEndpoint): APIPath {
  return endpoint.path;
}

/**
 * APIエンドポイントの必要ティアレベルを取得する
 */
export function getAPIEndpointRequiredTier(endpoint: APIEndpoint): TierLevel {
  return endpoint.requiredTier;
}

/**
 * ユーザーティアがエンドポイントにアクセス可能かを検証する
 */
export function validateAccess(endpoint: APIEndpoint, userTier: UserTier): boolean {
  const userLevel = getUserTierLevel(userTier);
  const requiredLevel = endpoint.requiredTier;

  // 共有カーネルの関数を使用してティア階層を比較
  return getTierHierarchy(userLevel) >= getTierHierarchy(requiredLevel);
}

/**
 * APIEndpointの等価性を判定する
 */
export function equalsAPIEndpoint(a: APIEndpoint, b: APIEndpoint): boolean {
  return equalsAPIPath(a.path, b.path) && a.requiredTier === b.requiredTier;
}
