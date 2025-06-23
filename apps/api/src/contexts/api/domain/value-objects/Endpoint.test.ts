import { describe, it, expect } from 'vitest';
import { createEndpoint, getEndpointPath, equalsEndpoint } from './Endpoint';

describe('Endpoint', () => {
  describe('createEndpoint', () => {
    it('有効なパスからエンドポイントを作成する', () => {
      const endpoint = createEndpoint('/api/v1/data');
      expect(getEndpointPath(endpoint)).toBe('/api/v1/data');
    });

    it('スラッシュなしのパスに先頭スラッシュを追加する', () => {
      const endpoint = createEndpoint('api/v1/data');
      expect(getEndpointPath(endpoint)).toBe('/api/v1/data');
    });

    it('ルートパスを作成できる', () => {
      const endpoint = createEndpoint('/');
      expect(getEndpointPath(endpoint)).toBe('/');
    });

    it('連続するスラッシュを単一のスラッシュに正規化する', () => {
      const endpoint1 = createEndpoint('//api/v1/data');
      expect(getEndpointPath(endpoint1)).toBe('/api/v1/data');

      const endpoint2 = createEndpoint('///api/v1/data');
      expect(getEndpointPath(endpoint2)).toBe('/api/v1/data');

      const endpoint3 = createEndpoint('////');
      expect(getEndpointPath(endpoint3)).toBe('/');
    });

    it('空文字を拒否する', () => {
      expect(() => createEndpoint('')).toThrow('Endpoint path cannot be empty');
      expect(() => createEndpoint('  ')).toThrow('Endpoint path cannot be empty');
    });
  });

  describe('equalsEndpoint', () => {
    it('同じパスのエンドポイントは等しい', () => {
      const endpoint1 = createEndpoint('/api/v1/data');
      const endpoint2 = createEndpoint('/api/v1/data');
      expect(equalsEndpoint(endpoint1, endpoint2)).toBe(true);
    });

    it('異なるパスのエンドポイントは等しくない', () => {
      const endpoint1 = createEndpoint('/api/v1/data');
      const endpoint2 = createEndpoint('/api/v2/data');
      expect(equalsEndpoint(endpoint1, endpoint2)).toBe(false);
    });

    it('正規化後に同じになるパスは等しい', () => {
      const endpoint1 = createEndpoint('/api/v1/data');
      const endpoint2 = createEndpoint('api/v1/data');
      expect(equalsEndpoint(endpoint1, endpoint2)).toBe(true);
    });
  });
});
