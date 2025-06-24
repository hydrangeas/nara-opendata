import { describe, it, expect } from 'vitest';
import { createUserId } from '@nara-opendata/shared-kernel';
import { EventType, AuthResult } from '../enums';
import {
  createAuthEvent,
  createProvider,
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
  const event = createAuthEvent(EventType.LOGIN);
  const provider = createProvider('google');
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
        result: AuthResult.SUCCESS,
      });

      expect(getAuthLogEntryId(entry)).toBeDefined();
      expect(getAuthLogEntryUserId(entry)).toBe(userId);
      expect(getAuthLogEntryEvent(entry)).toBe(event);
      expect(getAuthLogEntryProvider(entry)).toBe(provider);
      expect(getAuthLogEntryIPAddress(entry)).toBe(ipAddress);
      expect(getAuthLogEntryUserAgent(entry)).toBe(userAgent);
      expect(getAuthLogEntryResult(entry)).toBe(AuthResult.SUCCESS);
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
        result: AuthResult.SUCCESS,
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
        result: AuthResult.SUCCESS,
      });
      const after = new Date();

      const timestamp = getAuthLogEntryTimestamp(entry);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('reconstructAuthLogEntry', () => {
    it('既存のデータから再構築する', () => {
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
        result: AuthResult.SUCCESS,
      });

      expect(getAuthLogEntryId(entry)).toBe(id);
      expect(getAuthLogEntryUserId(entry)).toBe(userId);
      expect(getAuthLogEntryEvent(entry)).toBe(event);
      expect(getAuthLogEntryProvider(entry)).toBe(provider);
      expect(getAuthLogEntryIPAddress(entry)).toBe(ipAddress);
      expect(getAuthLogEntryUserAgent(entry)).toBe(userAgent);
      expect(getAuthLogEntryTimestamp(entry)).toBe(timestamp);
      expect(getAuthLogEntryResult(entry)).toBe(AuthResult.SUCCESS);
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
        result: AuthResult.SUCCESS,
      });
      const entry2 = reconstructAuthLogEntry({
        id,
        userId: createUserId('999e8400-e29b-41d4-a716-446655440000'),
        event: createAuthEvent(EventType.LOGOUT),
        provider: createProvider('github'),
        ipAddress: createIPAddress('10.0.0.1'),
        userAgent: createUserAgent('Firefox/95.0'),
        timestamp: new Date('2024-01-02'),
        result: AuthResult.FAILURE,
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
        result: AuthResult.SUCCESS,
      });
      const entry2 = createAuthLogEntry({
        userId,
        event,
        provider,
        ipAddress,
        userAgent,
        result: AuthResult.SUCCESS,
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
        result: AuthResult.SUCCESS,
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
        result: AuthResult.FAILURE,
      });

      expect(getAuthLogEntryResult(entry)).toBe(AuthResult.FAILURE);
    });

    it('期限切れトークンをログに記録できる', () => {
      const entry = createAuthLogEntry({
        userId,
        event: createAuthEvent(EventType.TOKEN_EXPIRED),
        provider,
        ipAddress,
        userAgent,
        result: AuthResult.EXPIRED,
      });

      expect(getAuthLogEntryResult(entry)).toBe(AuthResult.EXPIRED);
    });
  });
});
