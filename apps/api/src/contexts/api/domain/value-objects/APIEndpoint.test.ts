import { describe, it, expect } from 'vitest';
import { TierLevel, createUserTier } from '@nara-opendata/shared-kernel';
import { createAPIPath } from './APIPath';
import {
  createAPIEndpoint,
  getAPIEndpointPath,
  getAPIEndpointRequiredTier,
  validateAccess,
  equalsAPIEndpoint,
} from './APIEndpoint';

describe('APIEndpoint', () => {
  describe('createAPIEndpoint', () => {
    it('APIエンドポイントを作成する', () => {
      const path = createAPIPath('/api/v1/data');
      const endpoint = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER1,
      });

      expect(getAPIEndpointPath(endpoint)).toBe(path);
      expect(getAPIEndpointRequiredTier(endpoint)).toBe(TierLevel.TIER1);
    });
  });

  describe('validateAccess', () => {
    const path = createAPIPath('/api/v1/data');

    it('同じティアレベルでアクセス可能', () => {
      const endpoint = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER2,
      });
      const userTier = createUserTier(TierLevel.TIER2);

      expect(validateAccess(endpoint, userTier)).toBe(true);
    });

    it('より高いティアレベルでアクセス可能', () => {
      const endpoint = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER1,
      });
      const userTier = createUserTier(TierLevel.TIER3);

      expect(validateAccess(endpoint, userTier)).toBe(true);
    });

    it('より低いティアレベルではアクセス不可', () => {
      const endpoint = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER3,
      });
      const userTier = createUserTier(TierLevel.TIER1);

      expect(validateAccess(endpoint, userTier)).toBe(false);
    });

    it('各ティアレベルの階層が正しく機能する', () => {
      const endpointTier1 = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER1,
      });
      const endpointTier2 = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER2,
      });
      const endpointTier3 = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER3,
      });

      const tier1User = createUserTier(TierLevel.TIER1);
      const tier2User = createUserTier(TierLevel.TIER2);
      const tier3User = createUserTier(TierLevel.TIER3);

      // TIER1ユーザー
      expect(validateAccess(endpointTier1, tier1User)).toBe(true);
      expect(validateAccess(endpointTier2, tier1User)).toBe(false);
      expect(validateAccess(endpointTier3, tier1User)).toBe(false);

      // TIER2ユーザー
      expect(validateAccess(endpointTier1, tier2User)).toBe(true);
      expect(validateAccess(endpointTier2, tier2User)).toBe(true);
      expect(validateAccess(endpointTier3, tier2User)).toBe(false);

      // TIER3ユーザー
      expect(validateAccess(endpointTier1, tier3User)).toBe(true);
      expect(validateAccess(endpointTier2, tier3User)).toBe(true);
      expect(validateAccess(endpointTier3, tier3User)).toBe(true);
    });
  });

  describe('equalsAPIEndpoint', () => {
    it('同じパスとティアのエンドポイントは等しい', () => {
      const path = createAPIPath('/api/v1/data');
      const endpoint1 = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER2,
      });
      const endpoint2 = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER2,
      });

      expect(equalsAPIEndpoint(endpoint1, endpoint2)).toBe(true);
    });

    it('パスが異なるエンドポイントは等しくない', () => {
      const path1 = createAPIPath('/api/v1/data');
      const path2 = createAPIPath('/api/v2/data');
      const endpoint1 = createAPIEndpoint({
        path: path1,
        requiredTier: TierLevel.TIER2,
      });
      const endpoint2 = createAPIEndpoint({
        path: path2,
        requiredTier: TierLevel.TIER2,
      });

      expect(equalsAPIEndpoint(endpoint1, endpoint2)).toBe(false);
    });

    it('ティアが異なるエンドポイントは等しくない', () => {
      const path = createAPIPath('/api/v1/data');
      const endpoint1 = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER1,
      });
      const endpoint2 = createAPIEndpoint({
        path,
        requiredTier: TierLevel.TIER2,
      });

      expect(equalsAPIEndpoint(endpoint1, endpoint2)).toBe(false);
    });
  });
});
