import { describe, it, expect } from 'vitest';
import { createUserId } from '@nara-opendata/shared-kernel';
import {
  createAuthEvent,
  AuthEventType,
  createAuthResult,
  AuthResultValue,
  createProvider,
  ProviderType,
  createIPAddress,
  createUserAgent,
  createLogId,
} from '../value-objects';
import {
  createAuthLogEntry,
  reconstructAuthLogEntry,
  getAuthLogEntryId,
  getAuthLogEntryUserId,
  getAuthLogEntryEvent,
  getAuthLogEntryProvider,
  getAuthLogEntryIPAddress,
  getAuthLogEntryUserAgent,
  getAuthLogEntryTimestamp,
  getAuthLogEntryResult,
  equalsAuthLogEntry,
  authLogEntryToString,
} from './AuthLogEntry';

describe('AuthLogEntry', () => {
  const userId = createUserId('550e8400-e29b-41d4-a716-446655440000');
  const event = createAuthEvent(AuthEventType.LOGIN);
  const provider = createProvider(ProviderType.GOOGLE);
  const ipAddress = createIPAddress('192.168.1.1');
  const userAgent = createUserAgent('Mozilla/5.0 Chrome/96.0');

  describe('createAuthLogEntry', () => {
    it('新しい認証ログエントリを作成する', () => {
      const entry = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });

      expect(getAuthLogEntryId(entry)).toBeDefined();
      expect(getAuthLogEntryUserId(entry)).toBe(userId);
      expect(getAuthLogEntryEvent(entry)).toBe(event);
      expect(getAuthLogEntryProvider(entry)).toBe(provider);
      expect(getAuthLogEntryIPAddress(entry)).toBe(ipAddress);
      expect(getAuthLogEntryUserAgent(entry)).toBe(userAgent);
      expect(getAuthLogEntryResult(entry)).toEqual(createAuthResult(AuthResultValue.SUCCESS));
      expect(getAuthLogEntryTimestamp(entry)).toBeInstanceOf(Date);
    });

    it('タイムスタンプを指定できる', () => {
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const entry = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        result: createAuthResult(AuthResultValue.SUCCESS),
        timestamp,
      });

      expect(getAuthLogEntryTimestamp(entry)).toBe(timestamp);
    });

    it('タイムスタンプを省略すると現在時刻を使用する', () => {
      const before = new Date();
      const entry = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });
      const after = new Date();

      const timestamp = getAuthLogEntryTimestamp(entry);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('IPAddressとUserAgentを省略できる', () => {
      const entry = createAuthLogEntry({
        userId,
        event,
        provider,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });

      expect(getAuthLogEntryId(entry)).toBeDefined();
      expect(getAuthLogEntryUserId(entry)).toBe(userId);
      expect(getAuthLogEntryEvent(entry)).toBe(event);
      expect(getAuthLogEntryProvider(entry)).toBe(provider);
      expect(getAuthLogEntryIPAddress(entry)).toBeUndefined();
      expect(getAuthLogEntryUserAgent(entry)).toBeUndefined();
      expect(getAuthLogEntryResult(entry)).toEqual(createAuthResult(AuthResultValue.SUCCESS));
      expect(getAuthLogEntryTimestamp(entry)).toBeInstanceOf(Date);
    });

    it('IPAddressのみを指定できる', () => {
      const entry = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });

      expect(getAuthLogEntryIPAddress(entry)).toBe(ipAddress);
      expect(getAuthLogEntryUserAgent(entry)).toBeUndefined();
    });

    it('UserAgentのみを指定できる', () => {
      const entry = createAuthLogEntry({
        userId,
        event,
        provider,
        userAgent,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });

      expect(getAuthLogEntryIPAddress(entry)).toBeUndefined();
      expect(getAuthLogEntryUserAgent(entry)).toBe(userAgent);
    });
  });

  describe('reconstructAuthLogEntry', () => {
    it('すべてのフィールドを持つデータから再構築する', () => {
      const id = createLogId('123e4567-e89b-12d3-a456-426614174000');
      const timestamp = new Date('2024-01-01T12:00:00Z');

      const entry = reconstructAuthLogEntry({
        id,
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        timestamp,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });

      expect(getAuthLogEntryId(entry)).toBe(id);
      expect(getAuthLogEntryUserId(entry)).toBe(userId);
      expect(getAuthLogEntryEvent(entry)).toBe(event);
      expect(getAuthLogEntryProvider(entry)).toBe(provider);
      expect(getAuthLogEntryIPAddress(entry)).toBe(ipAddress);
      expect(getAuthLogEntryUserAgent(entry)).toBe(userAgent);
      expect(getAuthLogEntryTimestamp(entry)).toBe(timestamp);
      expect(getAuthLogEntryResult(entry)).toEqual(createAuthResult(AuthResultValue.SUCCESS));
    });

    it('IPAddressとUserAgentがないデータから再構築する', () => {
      const id = createLogId('123e4567-e89b-12d3-a456-426614174000');
      const timestamp = new Date('2024-01-01T12:00:00Z');

      const entry = reconstructAuthLogEntry({
        id,
        userId,
        event,
        provider,
        timestamp,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });

      expect(getAuthLogEntryId(entry)).toBe(id);
      expect(getAuthLogEntryUserId(entry)).toBe(userId);
      expect(getAuthLogEntryEvent(entry)).toBe(event);
      expect(getAuthLogEntryProvider(entry)).toBe(provider);
      expect(getAuthLogEntryIPAddress(entry)).toBeUndefined();
      expect(getAuthLogEntryUserAgent(entry)).toBeUndefined();
      expect(getAuthLogEntryTimestamp(entry)).toBe(timestamp);
      expect(getAuthLogEntryResult(entry)).toEqual(createAuthResult(AuthResultValue.SUCCESS));
    });
  });

  describe('equalsAuthLogEntry', () => {
    it('同じIDのエントリは等しい', () => {
      const id = createLogId('123e4567-e89b-12d3-a456-426614174000');
      const entry1 = reconstructAuthLogEntry({
        id,
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        timestamp: new Date('2024-01-01'),
        result: createAuthResult(AuthResultValue.SUCCESS),
      });
      const entry2 = reconstructAuthLogEntry({
        id,
        userId: createUserId('999e8400-e29b-41d4-a716-446655440000'),
        event: createAuthEvent(AuthEventType.LOGOUT),
        provider: createProvider(ProviderType.GITHUB),
        ipAddress: createIPAddress('10.0.0.1'),
        userAgent: createUserAgent('Firefox/95.0'),
        timestamp: new Date('2024-01-02'),
        result: createAuthResult(AuthResultValue.FAILURE),
      });

      expect(equalsAuthLogEntry(entry1, entry2)).toBe(true);
    });

    it('異なるIDのエントリは等しくない', () => {
      const entry1 = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });
      const entry2 = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        result: createAuthResult(AuthResultValue.SUCCESS),
      });

      expect(equalsAuthLogEntry(entry1, entry2)).toBe(false);
    });
  });

  describe('authLogEntryToString', () => {
    it('デバッグ用の文字列表現を返す', () => {
      const entry = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        result: createAuthResult(AuthResultValue.SUCCESS),
        timestamp: new Date('2024-01-01T12:00:00Z'),
      });

      const str = authLogEntryToString(entry);
      expect(str).toContain('AuthLogEntry');
      expect(str).toContain('550e8400-e29b-41d4-a716-446655440000');
      expect(str).toContain('LOGIN');
      expect(str).toContain('SUCCESS');
      expect(str).toContain('2024-01-01T12:00:00.000Z');
    });
  });

  describe('様々な認証結果のテスト', () => {
    it('失敗した認証をログに記録できる', () => {
      const entry = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        result: createAuthResult(AuthResultValue.FAILURE),
      });

      expect(getAuthLogEntryResult(entry)).toEqual(createAuthResult(AuthResultValue.FAILURE));
    });

    it('期限切れトークンをログに記録できる', () => {
      const entry = createAuthLogEntry({
        userId,
        event: createAuthEvent(AuthEventType.TOKEN_EXPIRED),
        provider,
        ipAddress,
        userAgent,
        result: createAuthResult(AuthResultValue.FAILURE), // TOKEN_EXPIREDも失敗として扱う
      });

      expect(getAuthLogEntryResult(entry)).toEqual(createAuthResult(AuthResultValue.FAILURE));
    });
  });
});
