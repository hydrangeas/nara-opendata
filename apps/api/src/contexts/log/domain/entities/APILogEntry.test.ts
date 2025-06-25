import { describe, it, expect } from 'vitest';
import { createUserId } from '@nara-opendata/shared-kernel';
import {
  createRequestId,
  createStatusCode,
  createResponseTime,
  createIPAddress,
  createUserAgent,
  createLogId,
} from '../value-objects';
import {
  createAPILogEntry,
  reconstructAPILogEntry,
  getAPILogEntryId,
  getAPILogEntryUserId,
  getAPILogEntryRequestId,
  getAPILogEntryPath,
  getAPILogEntryStatusCode,
  getAPILogEntryResponseTime,
  getAPILogEntryIPAddress,
  getAPILogEntryUserAgent,
  getAPILogEntryTimestamp,
  equalsAPILogEntry,
  apiLogEntryToString,
} from './APILogEntry';

describe('APILogEntry', () => {
  const userId = createUserId('550e8400-e29b-41d4-a716-446655440000');
  const requestId = createRequestId('req_123456789');
  const path = '/secure/data/test.json';
  const statusCode = createStatusCode(200);
  const responseTime = createResponseTime(123);
  const ipAddress = createIPAddress('192.168.1.1');
  const userAgent = createUserAgent('Mozilla/5.0 Chrome/96.0');

  describe('createAPILogEntry', () => {
    it('新しいAPIログエントリを作成する', () => {
      const entry = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
      });

      expect(getAPILogEntryId(entry)).toBeDefined();
      expect(getAPILogEntryUserId(entry)).toBe(userId);
      expect(getAPILogEntryRequestId(entry)).toBe(requestId);
      expect(getAPILogEntryPath(entry)).toBe(path);
      expect(getAPILogEntryStatusCode(entry)).toBe(statusCode);
      expect(getAPILogEntryResponseTime(entry)).toBe(responseTime);
      expect(getAPILogEntryIPAddress(entry)).toBe(ipAddress);
      expect(getAPILogEntryUserAgent(entry)).toBe(userAgent);
      expect(getAPILogEntryTimestamp(entry)).toBeInstanceOf(Date);
    });

    it('タイムスタンプを指定できる', () => {
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const entry = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
        timestamp,
      });

      expect(getAPILogEntryTimestamp(entry)).toBe(timestamp);
    });

    it('タイムスタンプを省略すると現在時刻を使用する', () => {
      const before = new Date();
      const entry = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
      });
      const after = new Date();

      const timestamp = getAPILogEntryTimestamp(entry);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('空のパスを拒否する', () => {
      expect(() =>
        createAPILogEntry({
          userId,
          requestId,
          path: '',
          statusCode,
          responseTime,
          ipAddress,
          userAgent,
        }),
      ).toThrow('Path is required for APILogEntry');

      expect(() =>
        createAPILogEntry({
          userId,
          requestId,
          path: '   ',
          statusCode,
          responseTime,
          ipAddress,
          userAgent,
        }),
      ).toThrow('Path is required for APILogEntry');
    });
  });

  describe('reconstructAPILogEntry', () => {
    it('既存のデータから再構築する', () => {
      const id = createLogId('123e4567-e89b-12d3-a456-426614174000');
      const timestamp = new Date('2024-01-01T12:00:00Z');

      const entry = reconstructAPILogEntry({
        id,
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
        timestamp,
      });

      expect(getAPILogEntryId(entry)).toBe(id);
      expect(getAPILogEntryUserId(entry)).toBe(userId);
      expect(getAPILogEntryRequestId(entry)).toBe(requestId);
      expect(getAPILogEntryPath(entry)).toBe(path);
      expect(getAPILogEntryStatusCode(entry)).toBe(statusCode);
      expect(getAPILogEntryResponseTime(entry)).toBe(responseTime);
      expect(getAPILogEntryIPAddress(entry)).toBe(ipAddress);
      expect(getAPILogEntryUserAgent(entry)).toBe(userAgent);
      expect(getAPILogEntryTimestamp(entry)).toBe(timestamp);
    });

    it('空のパスを拒否する', () => {
      const id = createLogId('123e4567-e89b-12d3-a456-426614174000');
      const timestamp = new Date('2024-01-01T12:00:00Z');

      expect(() =>
        reconstructAPILogEntry({
          id,
          userId,
          requestId,
          path: '',
          statusCode,
          responseTime,
          ipAddress,
          userAgent,
          timestamp,
        }),
      ).toThrow('Path is required for APILogEntry');
    });
  });

  describe('equalsAPILogEntry', () => {
    it('同じIDのエントリは等しい', () => {
      const id = createLogId('123e4567-e89b-12d3-a456-426614174000');
      const entry1 = reconstructAPILogEntry({
        id,
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
        timestamp: new Date('2024-01-01'),
      });
      const entry2 = reconstructAPILogEntry({
        id,
        userId: createUserId('999e8400-e29b-41d4-a716-446655440000'),
        requestId: createRequestId('req_987654321'),
        path: '/other/path.json',
        statusCode: createStatusCode(404),
        responseTime: createResponseTime(999),
        ipAddress: createIPAddress('10.0.0.1'),
        userAgent: createUserAgent('Firefox/95.0'),
        timestamp: new Date('2024-01-02'),
      });

      expect(equalsAPILogEntry(entry1, entry2)).toBe(true);
    });

    it('異なるIDのエントリは等しくない', () => {
      const entry1 = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
      });
      const entry2 = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
      });

      expect(equalsAPILogEntry(entry1, entry2)).toBe(false);
    });
  });

  describe('apiLogEntryToString', () => {
    it('デバッグ用の文字列表現を返す', () => {
      const entry = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
        timestamp: new Date('2024-01-01T12:00:00Z'),
      });

      const str = apiLogEntryToString(entry);
      expect(str).toContain('APILogEntry');
      expect(str).toContain('550e8400-e29b-41d4-a716-446655440000');
      expect(str).toContain('/secure/data/test.json');
      expect(str).toContain('status: 200');
      expect(str).toContain('responseTime: 123ms');
      expect(str).toContain('2024-01-01T12:00:00.000Z');
    });
  });

  describe('様々なAPIアクセスのテスト', () => {
    it('エラーレスポンスをログに記録できる', () => {
      const errorStatusCode = createStatusCode(404);
      const errorEntry = createAPILogEntry({
        userId,
        requestId,
        path: '/secure/data/not-found.json',
        statusCode: errorStatusCode,
        responseTime: createResponseTime(5),
        ipAddress,
        userAgent,
      });

      expect(getAPILogEntryStatusCode(errorEntry)).toBe(errorStatusCode);
      expect(getAPILogEntryPath(errorEntry)).toBe('/secure/data/not-found.json');
    });

    it('遅いレスポンスをログに記録できる', () => {
      const slowResponseTime = createResponseTime(5000);
      const slowEntry = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode,
        responseTime: slowResponseTime,
        ipAddress,
        userAgent,
      });

      expect(getAPILogEntryResponseTime(slowEntry)).toBe(slowResponseTime);
    });

    it('レート制限エラーをログに記録できる', () => {
      const rateLimitStatusCode = createStatusCode(429);
      const rateLimitEntry = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode: rateLimitStatusCode,
        responseTime: createResponseTime(1),
        ipAddress,
        userAgent,
      });

      expect(getAPILogEntryStatusCode(rateLimitEntry)).toBe(rateLimitStatusCode);
    });

    it('IPv6アドレスをログに記録できる', () => {
      const ipv6Entry = createAPILogEntry({
        userId,
        requestId,
        path,
        statusCode,
        responseTime,
        ipAddress: createIPAddress('2001:db8::1'),
        userAgent,
      });

      expect(getAPILogEntryIPAddress(ipv6Entry).value).toBe('2001:db8::1');
    });
  });
});
