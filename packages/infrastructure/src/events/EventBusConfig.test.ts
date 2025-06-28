import { describe, it, expect } from 'vitest';
import { validateEventBusConfig } from './EventBusConfig';

describe('EventBusConfig', () => {
  describe('validateEventBusConfig', () => {
    it('正常な設定値を受け入れる', () => {
      expect(() =>
        validateEventBusConfig({
          maxDispatchCycles: 5,
          maxEventsPerCycle: 100,
          handlerTimeoutMs: 5000,
          debugMode: true,
        }),
      ).not.toThrow();
    });

    it('空の設定を受け入れる', () => {
      expect(() => validateEventBusConfig({})).not.toThrow();
    });

    describe('maxDispatchCycles', () => {
      it('1以上の値を受け入れる', () => {
        expect(() => validateEventBusConfig({ maxDispatchCycles: 1 })).not.toThrow();
        expect(() => validateEventBusConfig({ maxDispatchCycles: 50 })).not.toThrow();
      });

      it('0以下の値を拒否する', () => {
        expect(() => validateEventBusConfig({ maxDispatchCycles: 0 })).toThrow(
          'maxDispatchCycles must be at least 1',
        );
        expect(() => validateEventBusConfig({ maxDispatchCycles: -1 })).toThrow(
          'maxDispatchCycles must be at least 1',
        );
      });

      it('100を超える値を拒否する', () => {
        expect(() => validateEventBusConfig({ maxDispatchCycles: 101 })).toThrow(
          'maxDispatchCycles should not exceed 100 to prevent infinite loops',
        );
      });
    });

    describe('maxEventsPerCycle', () => {
      it('1以上の値を受け入れる', () => {
        expect(() => validateEventBusConfig({ maxEventsPerCycle: 1 })).not.toThrow();
        expect(() => validateEventBusConfig({ maxEventsPerCycle: 5000 })).not.toThrow();
      });

      it('0以下の値を拒否する', () => {
        expect(() => validateEventBusConfig({ maxEventsPerCycle: 0 })).toThrow(
          'maxEventsPerCycle must be at least 1',
        );
        expect(() => validateEventBusConfig({ maxEventsPerCycle: -10 })).toThrow(
          'maxEventsPerCycle must be at least 1',
        );
      });

      it('10000を超える値を拒否する', () => {
        expect(() => validateEventBusConfig({ maxEventsPerCycle: 10001 })).toThrow(
          'maxEventsPerCycle should not exceed 10000 to prevent memory issues',
        );
      });
    });

    describe('handlerTimeoutMs', () => {
      it('0以上の値を受け入れる', () => {
        expect(() => validateEventBusConfig({ handlerTimeoutMs: 0 })).not.toThrow();
        expect(() => validateEventBusConfig({ handlerTimeoutMs: 60000 })).not.toThrow();
      });

      it('負の値を拒否する', () => {
        expect(() => validateEventBusConfig({ handlerTimeoutMs: -1 })).toThrow(
          'handlerTimeoutMs must be non-negative',
        );
        expect(() => validateEventBusConfig({ handlerTimeoutMs: -1000 })).toThrow(
          'handlerTimeoutMs must be non-negative',
        );
      });

      it('5分（300000ms）を超える値を拒否する', () => {
        expect(() => validateEventBusConfig({ handlerTimeoutMs: 300001 })).toThrow(
          'handlerTimeoutMs should not exceed 5 minutes (300000ms)',
        );
      });
    });
  });
});
